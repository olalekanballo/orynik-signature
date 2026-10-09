/* Orynik Signature — admin login + bookings dashboard (admin.html) */
(function () {
  "use strict";
  var SESSION_KEY = "orynik_admin_session";
  var loginView = document.getElementById("loginView");
  var dashView = document.getElementById("dashView");
  var loginForm = document.getElementById("loginForm");
  var loginError = document.getElementById("loginError");
  var tbody = document.getElementById("bookingRows");
  var emptyState = document.getElementById("emptyState");
  var tableWrap = document.getElementById("tableWrap");
  var searchInput = document.getElementById("search");
  var filter = "all";
  var failures = 0, lockedUntil = 0;

  async function sha256(text) {
    var data = new TextEncoder().encode(text);
    var buf = await crypto.subtle.digest("SHA-256", data);
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function showDashboard() {
    loginView.hidden = true;
    dashView.hidden = false;
    render();
  }
  function showLogin() {
    dashView.hidden = true;
    loginView.hidden = false;
  }

  if (sessionStorage.getItem(SESSION_KEY) === "1") showDashboard(); else showLogin();

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var wait = lockedUntil - Date.now();
    if (wait > 0) {
      loginError.textContent = "Too many attempts. Try again in " + Math.ceil(wait / 1000) + " seconds.";
      return;
    }
    if (!window.crypto || !crypto.subtle) {
      loginError.textContent = "This browser can't verify passwords on this page. Open the site over https or a local server.";
      return;
    }
    var entered = loginForm.elements.password.value;
    var hash = await sha256(entered);
    if (hash === window.ORYNIK.adminPasswordHash) {
      failures = 0;
      loginError.textContent = "";
      sessionStorage.setItem(SESSION_KEY, "1");
      loginForm.reset();
      showDashboard();
    } else {
      failures += 1;
      if (failures >= 5) { lockedUntil = Date.now() + 30000; failures = 0; }
      loginError.textContent = "That password is incorrect.";
      loginForm.elements.password.setAttribute("aria-invalid", "true");
      loginForm.elements.password.select();
    }
  });
  loginForm.elements.password.addEventListener("input", function (e) {
    e.target.removeAttribute("aria-invalid");
  });

  document.getElementById("logout").addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
    loginForm.elements.password.focus();
  });

  /* Dashboard */
  function fmtDate(v) {
    return new Date(v + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  function fmtTime(v) {
    var p = v.split(":"), h = Number(p[0]);
    return ((h % 12) || 12) + ":" + p[1] + (h >= 12 ? " PM" : " AM");
  }
  function fmtReceived(ts) {
    return new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  }
  function localDateISO(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }
  function el(tag, text, attrs) {
    var node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }
  function cell(label) {
    var td = document.createElement("td");
    td.setAttribute("data-label", label);
    return td;
  }

  function visibleBookings() {
    var q = searchInput.value.trim().toLowerCase();
    return BookingStore.all().filter(function (b) {
      if (filter !== "all" && b.status !== filter) return false;
      if (!q) return true;
      return [b.name, b.phone, b.email, b.service, b.address].join(" ").toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderStats() {
    var all = BookingStore.all();
    var today = localDateISO(new Date());
    document.getElementById("statTotal").textContent = all.length;
    document.getElementById("statPending").textContent = all.filter(function (b) { return b.status === "pending"; }).length;
    document.getElementById("statConfirmed").textContent = all.filter(function (b) { return b.status === "confirmed"; }).length;
    document.getElementById("statUpcoming").textContent = all.filter(function (b) { return b.date >= today && b.status !== "completed"; }).length;
  }

  function render() {
    renderStats();
    var list = visibleBookings();
    tbody.innerHTML = "";
    emptyState.hidden = list.length > 0;
    tableWrap.hidden = list.length === 0;

    list.forEach(function (b) {
      var tr = document.createElement("tr");

      var tdClient = cell("Client");
      tdClient.appendChild(el("strong", b.name));
      tdClient.appendChild(el("small", b.phone));
      if (b.email) tdClient.appendChild(el("small", b.email));
      tr.appendChild(tdClient);

      var tdService = cell("Service");
      tdService.appendChild(el("span", b.service));
      tdService.appendChild(el("small", b.people + (Number(b.people) === 1 ? " person" : " people")));
      tr.appendChild(tdService);

      var tdWhen = cell("Date and time");
      tdWhen.appendChild(el("span", fmtDate(b.date)));
      tdWhen.appendChild(el("small", fmtTime(b.time)));
      tr.appendChild(tdWhen);

      var tdWhere = cell("Location");
      tdWhere.appendChild(el("span", b.location));
      if (b.address) tdWhere.appendChild(el("small", b.address));
      if (b.notes) tdWhere.appendChild(el("small", "Note: " + b.notes));
      tr.appendChild(tdWhere);

      var tdStatus = cell("Status");
      var select = el("select", null, { "aria-label": "Status for " + b.name });
      ["pending", "confirmed", "completed", "cancelled"].forEach(function (s) {
        var opt = el("option", s.charAt(0).toUpperCase() + s.slice(1), { value: s });
        if (b.status === s) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", function () {
        BookingStore.update(b.id, { status: select.value });
        render();
      });
      tdStatus.appendChild(select);
      tr.appendChild(tdStatus);

      tr.appendChild(Object.assign(cell("Received"), { textContent: fmtReceived(b.createdAt) }));

      var tdAct = cell("Actions");
      var row = el("div", null, { "class": "row-actions" });
      var digits = b.phone.replace(/\D/g, "");
      var intl = digits.indexOf("234") === 0 ? digits : "234" + digits.replace(/^0/, "");
      var msg = "Hello " + b.name + ", this is Orynik Signature about your " + b.service + " booking on " + fmtDate(b.date) + ".";
      var wa = el("a", "Reply on WhatsApp", { "class": "link-btn", href: "https://wa.me/" + intl + "?text=" + encodeURIComponent(msg), target: "_blank", rel: "noopener" });
      var del = el("button", "Delete", { type: "button", "class": "link-btn link-btn--danger" });
      del.addEventListener("click", function () {
        if (window.confirm("Delete the booking from " + b.name + "? This cannot be undone.")) {
          BookingStore.remove(b.id);
          render();
        }
      });
      row.appendChild(wa); row.appendChild(del);
      tdAct.appendChild(row);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });
  }

  document.querySelectorAll(".filter-tabs button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      filter = btn.getAttribute("data-filter");
      document.querySelectorAll(".filter-tabs button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      render();
    });
  });
  searchInput.addEventListener("input", render);

  document.getElementById("exportCsv").addEventListener("click", function () {
    var rows = BookingStore.all();
    if (!rows.length) { window.alert("There are no bookings to export yet."); return; }
    var head = ["Received", "Name", "Phone", "Email", "Service", "Date", "Time", "Location", "Address", "People", "Status", "Notes"];
    function esc(v) {
      var value = String(v == null ? "" : v);
      if (/^[\s]*[=+\-@]/.test(value)) value = "'" + value;
      return '"' + value.replace(/"/g, '""') + '"';
    }
    var lines = [head.map(esc).join(",")].concat(rows.map(function (b) {
      return [new Date(b.createdAt).toISOString(), b.name, b.phone, b.email, b.service, b.date, b.time, b.location, b.address, b.people, b.status, b.notes].map(esc).join(",");
    }));
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orynik-bookings.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  });

  window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf("orynik_bookings") === 0 && !dashView.hidden) render(); });
})();

/* Orynik Signature — booking form (booknow.html) */
(function () {
  "use strict";
  var form = document.getElementById("bookingForm");
  if (!form) return;

  var panel = document.getElementById("confirmation");
  var addressField = document.getElementById("addressField");
  var dateInput = form.elements.date;

  /* Earliest bookable date is today */
  var now = new Date();
  var iso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  dateInput.min = iso;

  /* Preselect service from ?service= link on the services page */
  var wanted = new URLSearchParams(window.location.search).get("service");
  if (wanted) {
    Array.prototype.forEach.call(form.elements.service.options, function (opt) {
      if (opt.value === wanted) opt.selected = true;
    });
  }

  /* ?location=home preselects home service */
  if (new URLSearchParams(window.location.search).get("location") === "home") {
    form.elements.location.forEach(function (r) { r.checked = r.value === "Home service"; });
  }

  /* Show the address field only for home service */
  function syncLocation() {
    var home = form.elements.location.value === "Home service";
    addressField.hidden = !home;
    form.elements.address.required = home;
  }
  form.elements.location.forEach(function (r) { r.addEventListener("change", syncLocation); });
  syncLocation();

  /* Validation */
  var rules = {
    name: function (v) { return v.trim().length >= 2 ? "" : "Enter your full name."; },
    phone: function (v) {
      var digits = v.replace(/[\s()+-]/g, "");
      return /^\d{10,14}$/.test(digits) ? "" : "Enter a valid phone number, for example 08012345678.";
    },
    email: function (v) { return !v || /^\S+@\S+\.\S+$/.test(v) ? "" : "Enter a valid email address or leave this empty."; },
    service: function (v) { return v ? "" : "Choose a service."; },
    date: function (v) {
      if (!v) return "Pick the date of your event.";
      return v < iso ? "Choose today or a future date." : "";
    },
    time: function (v) { return v ? "" : "Pick the time you want to start."; },
    people: function (v) {
      var count = Number(v);
      return Number.isInteger(count) && count >= 1 && count <= 30 ? "" : "Enter a whole number from 1 to 30.";
    },
    address: function (v) {
      return form.elements.location.value === "Home service" && v.trim().length < 5
        ? "Enter the address where we should come." : "";
    }
  };

  function setError(name, message) {
    var input = form.elements[name];
    var out = document.getElementById(name + "Error");
    if (!input || !out) return;
    out.textContent = message;
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener("blur", function () { setError(name, rules[name](input.value)); });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid")) setError(name, rules[name](input.value));
    });
  });

  function formatDate(value) {
    var d = new Date(value + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function formatTime(value) {
    var parts = value.split(":");
    var h = Number(parts[0]);
    return ((h % 12) || 12) + ":" + parts[1] + (h >= 12 ? " PM" : " AM");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var message = rules[name](form.elements[name].value);
      setError(name, message);
      if (message && !firstInvalid) firstInvalid = form.elements[name];
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    var booking = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
      status: "pending",
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      service: form.elements.service.value,
      date: form.elements.date.value,
      time: form.elements.time.value,
      location: form.elements.location.value,
      address: form.elements.location.value === "Home service" ? form.elements.address.value.trim() : "",
      people: form.elements.people.value || "1",
      notes: form.elements.notes.value.trim()
    };

    var saved = BookingStore.add(booking);
    showConfirmation(booking, saved);
  });

  function showConfirmation(b, saved) {
    var lines = [
      "Hello Orynik Signature, I would like to book.",
      "",
      "Name: " + b.name,
      "Phone: " + b.phone,
      "Service: " + b.service,
      "Date: " + formatDate(b.date),
      "Time: " + formatTime(b.time),
      "Where: " + b.location + (b.address ? " (" + b.address + ")" : ""),
      "People: " + b.people
    ];
    if (b.notes) lines.push("Notes: " + b.notes);

    var rows = [
      ["Name", b.name], ["Phone", b.phone], ["Service", b.service],
      ["Date", formatDate(b.date)], ["Time", formatTime(b.time)],
      ["Where", b.location + (b.address ? ", " + b.address : "")], ["People", b.people]
    ];
    var dl = document.getElementById("summaryList");
    document.getElementById("confirmationMessage").textContent = saved
      ? "Your booking is saved. To get your slot confirmed, send the details to us on WhatsApp. The booking is not final until we reply."
      : "We couldn't save this booking on this device. Please send the details on WhatsApp so we can receive your request.";
    dl.innerHTML = "";
    rows.forEach(function (r) {
      var wrap = document.createElement("div");
      var dt = document.createElement("dt"); dt.textContent = r[0];
      var dd = document.createElement("dd"); dd.textContent = r[1];
      wrap.appendChild(dt); wrap.appendChild(dd); dl.appendChild(wrap);
    });

    document.getElementById("waConfirm").href = window.ORYNIK.waLink(lines.join("\n"));
    form.hidden = true;
    panel.hidden = false;
    panel.setAttribute("tabindex", "-1");
    panel.focus();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("bookAgain").addEventListener("click", function () {
    form.reset();
    syncLocation();
    panel.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
})();

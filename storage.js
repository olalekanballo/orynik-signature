/* Orynik Signature — booking storage.
   Bookings are kept in this browser's localStorage. To collect bookings from
   every client's device, replace the body of add()/all() with calls to a
   backend (Firebase, Supabase, Google Sheets, etc.). Nothing else must change. */
window.BookingStore = (function () {
  "use strict";
  var KEY = "orynik_bookings_v1";

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter(function (booking) {
        return booking && typeof booking === "object" && !Array.isArray(booking)
          && typeof booking.id === "string"
          && typeof booking.name === "string"
          && typeof booking.phone === "string"
          && typeof booking.service === "string"
          && typeof booking.date === "string"
          && typeof booking.time === "string"
          && typeof booking.location === "string";
      });
    } catch (err) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (err) { return false; }
  }

  return {
    all: function () {
      return read().sort(function (a, b) { return b.createdAt - a.createdAt; });
    },
    add: function (booking) {
      var list = read();
      list.push(booking);
      var saved = write(list);
      var endpoint = window.ORYNIK && window.ORYNIK.bookingEndpoint;
      if (endpoint) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(booking)
        }).catch(function () { /* WhatsApp message is the fallback */ });
      }
      return saved;
    },
    update: function (id, patch) {
      var list = read().map(function (b) { return b.id === id ? Object.assign({}, b, patch) : b; });
      return write(list);
    },
    remove: function (id) {
      return write(read().filter(function (b) { return b.id !== id; }));
    }
  };
})();

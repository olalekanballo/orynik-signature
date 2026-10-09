/* Orynik Signature — site settings.
   Change values here; every page reads from this one object. */
window.ORYNIK = {
  brand: "Orynik Signature",
  phoneDisplay: "0807 092 9263",
  phoneLocal: "08070929263",
  whatsappNumber: "2348070929263", // international format, no + or spaces
  email: "rahmanazeezat16@gmail.com",
  tiktokHandle: "orynik0",
  address: "Araromi Estate, Ababaale, Olunde, Ibadan",

  // SHA-256 hash of the admin password. The password itself is NOT stored here.
  adminPasswordHash: "5f53a1b85e84202ca78765491eea33bfc718b45b51ce7a64b30fda45decaddc6",

  // Optional: paste a Formspree (or similar) endpoint to also receive bookings by email.
  // Leave empty to use WhatsApp + this browser's storage only.
  bookingEndpoint: ""
};

window.ORYNIK.waLink = function (message) {
  var base = "https://wa.me/" + window.ORYNIK.whatsappNumber;
  return message ? base + "?text=" + encodeURIComponent(message) : base;
};

# Orynik Signature website

Open [index.html](index.html) in a browser. For the admin login to work, open the site through
a local server (VS Code "Live Server") or upload it to hosting (https). 

## Admin password
Page: [admin.html](admin.html) (the "Admin" button at the bottom of the home page).
Set the password by generating its SHA-256 hash and replacing `adminPasswordHash` in [config.js](config.js).
This is a front-end lock only; the hash can be inspected and it does not protect sensitive data. Use server-side authentication before storing real client information here.

## Important: how bookings reach you
Bookings are saved in the browser where they are made, so the admin page on your phone cannot see a
booking made on a client's phone. Every booking therefore ends with a "Confirm on WhatsApp" button that
sends the full details to 08070929263. To collect bookings from all devices in the admin page, connect a
backend (Firebase, Supabase, Google Sheets) by editing [storage.js](storage.js), or paste a Formspree URL into
`bookingEndpoint` in [config.js](config.js) to also receive each booking by email.

## Media files
The pages use the image and video files stored alongside the HTML files in the project root. Keep these files in place when deploying the site; no `assets/` folder is required.

## Website pages and scripts
- Pages: [index.html](index.html), [service.html](service.html), [about.html](about.html), [contact.html](contact.html), [faq.html](faq.html), [booknow.html](booknow.html), [admin.html](admin.html)
- Shared styling: [style.css](style.css)
- Shared scripts: [config.js](config.js), [main.js](main.js)
- Booking scripts: [storage.js](storage.js), [booking.js](booking.js)
- Admin script: [admin.js](admin.js)

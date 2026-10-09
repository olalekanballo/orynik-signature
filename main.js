/* Orynik Signature — shared behaviour for every page */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Sticky header: solid background once the page has scrolled */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primaryNav");
  function setNav(open) {
    if (!header || !toggle) return;
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { setNav(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 1001px)").addEventListener("change", function () { setNav(false); });
  }

  /* Image fallbacks: if a photo file hasn't been added yet, use the named fallback */
  function applyFallback(img) {
    var fb = img.getAttribute("data-fallback");
    if (!fb || img.getAttribute("data-fallback-used")) return;
    img.setAttribute("data-fallback-used", "1");
    img.src = fb;
  }
  document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) applyFallback(img);
    img.addEventListener("error", function () { applyFallback(img); });
  });

  /* Marquee: duplicate the set once so the loop is seamless */
  var track = document.querySelector("[data-marquee]");
  if (track && !reduceMotion) {
    Array.prototype.slice.call(track.children).forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("img").forEach(function (img) {
        img.alt = "";
        img.addEventListener("error", function () { applyFallback(img); });
      });
      track.appendChild(clone);
    });
  }

  /* Hero slideshow (services page) */
  var slides = document.querySelectorAll(".hero__slide");
  if (slides.length > 1 && !reduceMotion) {
    var current = 0;
    setInterval(function () {
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
    }, 5000);
  }

  /* Defer the large hero video until the browser is idle; keep its poster visible meanwhile. */
  var heroVideo = document.querySelector(".hero__media[data-autoplay]");
  var saveData = navigator.connection && navigator.connection.saveData;
  if (heroVideo && !reduceMotion && !saveData) {
    var heroSource = heroVideo.querySelector("source[data-src]");
    function startHeroVideo() {
      if (!heroSource || !heroSource.dataset.src) return;
      heroSource.src = heroSource.dataset.src;
      heroVideo.load();
      var playback = heroVideo.play();
      if (playback && playback.catch) playback.catch(function () {});
    }
    function scheduleHeroVideo() {
      if (window.requestIdleCallback) window.requestIdleCallback(startHeroVideo, { timeout: 3000 });
      else window.setTimeout(startHeroVideo, 1200);
    }
    if ("IntersectionObserver" in window) {
      var heroObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          heroObserver.disconnect();
          scheduleHeroVideo();
        }
      });
      heroObserver.observe(heroVideo);
    } else scheduleHeroVideo();
  }

  /* Only one gallery/reel video plays at a time */
  var videos = document.querySelectorAll("video[data-exclusive]");
  videos.forEach(function (v) {
    v.addEventListener("play", function () {
      videos.forEach(function (other) { if (other !== v) other.pause(); });
    });
  });

  /* Reveal page sections and their imagery together as they enter the viewport. */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll("main section:not(.marquee), main img:not(.hero__media), .site-footer img").forEach(function (element) {
      var isSection = element.tagName === "SECTION";
      if (!isSection && element.closest(".marquee")) return;
      element.classList.add(isSection ? "motion-section" : "motion-image");
      var bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) element.classList.add("is-visible");
      else revealObserver.observe(element);
    });
  }

  /* Contact page: send the message form to WhatsApp */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = contactForm.elements.name.value.trim();
      var message = contactForm.elements.message.value.trim();
      if (!name || !message) {
        contactForm.querySelector(".form__alert").hidden = false;
        return;
      }
      contactForm.querySelector(".form__alert").hidden = true;
      var text = "Hello Orynik Signature, my name is " + name + ".\n\n" + message;
      window.open(window.ORYNIK.waLink(text), "_blank", "noopener");
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

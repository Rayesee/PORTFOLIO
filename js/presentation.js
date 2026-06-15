(function () {

  "use strict";



  const sections = Array.from(document.querySelectorAll(".slide-section"));

  const navLinks = Array.from(document.querySelectorAll(".section-nav-list a"));

  const total = sections.length;



  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;



  /* Staggered reveal on scroll */

  const revealObserver = new IntersectionObserver(

    (entries) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add("is-visible");

        }

      });

    },

    { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }

  );



  sections.forEach((section) => revealObserver.observe(section));



  /* Active nav dot tracking */

  const navObserver = new IntersectionObserver(

    (entries) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          const id = entry.target.id;

          navLinks.forEach((link) => {

            link.classList.toggle("active", link.getAttribute("href") === "#" + id);

          });

        }

      });

    },

    { threshold: 0.4, rootMargin: "-18% 0px -38% 0px" }

  );



  sections.forEach((section) => navObserver.observe(section));



  /* Smooth scroll for nav clicks */

  navLinks.forEach((link) => {

    link.addEventListener("click", (e) => {

      const targetId = link.getAttribute("href");

      const target = document.querySelector(targetId);

      if (!target) return;



      e.preventDefault();

      target.scrollIntoView({

        behavior: prefersReducedMotion ? "auto" : "smooth",

        block: "start",

      });



      if (history.replaceState) {

        history.replaceState(null, "", targetId);

      }

    });

  });



  /* Keyboard navigation */

  document.addEventListener("keydown", (e) => {

    if (e.target.matches("input, textarea, select, [contenteditable=true]")) return;



    const activeIndex = sections.findIndex((s) => {

      const rect = s.getBoundingClientRect();

      return rect.top >= -rect.height * 0.3 && rect.top <= window.innerHeight * 0.4;

    });



    let nextIndex = -1;



    switch (e.key) {

      case "ArrowDown":

      case "PageDown":

        nextIndex = activeIndex < total - 1 ? activeIndex + 1 : activeIndex;

        break;

      case "ArrowUp":

      case "PageUp":

        nextIndex = activeIndex > 0 ? activeIndex - 1 : 0;

        break;

      case "Home":

        nextIndex = 0;

        break;

      case "End":

        nextIndex = total - 1;

        break;

      default:

        if (e.key >= "1" && e.key <= "9") {

          nextIndex = parseInt(e.key, 10) - 1;

        } else if (e.key === "0") {

          nextIndex = 9;

        } else {

          return;

        }

    }



    if (nextIndex < 0 || nextIndex >= total) return;



    e.preventDefault();

    sections[nextIndex].scrollIntoView({

      behavior: prefersReducedMotion ? "auto" : "smooth",

      block: "start",

    });

  });



  /* Show first slide immediately */

  if (sections[0]) {

    sections[0].classList.add("is-visible");

    if (navLinks[0]) navLinks[0].classList.add("active");

  }

})();


(function () {

  "use strict";



  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  const cursorStrength = isTouchDevice ? 0.35 : 1;

  let pointerX = window.innerWidth / 2;

  let pointerY = window.innerHeight / 2;

  let pointerActive = false;



  /* ─── Starfield canvas layers ─── */

  const starLayers = Array.from(document.querySelectorAll(".starfield__layer"));

  const starTwinkles = Array.from(document.querySelectorAll(".starfield__twinkle[data-depth]"));

  const starLayerConfigs = {

    far:  { count: 220, maxSize: 1.1, minOpacity: 0.12, maxOpacity: 0.38, twinkleRatio: 0 },

    mid:  { count: 110, maxSize: 1.7, minOpacity: 0.2,  maxOpacity: 0.58, twinkleRatio: 0.12 },

    near: { count: 42,  maxSize: 2.4, minOpacity: 0.35, maxOpacity: 0.82, twinkleRatio: 0.28 },

  };

  if (isMobile) {

    starLayerConfigs.mid.count = 75;

    starLayerConfigs.near.count = 28;

    starLayerConfigs.mid.twinkleRatio = 0;

    starLayerConfigs.near.twinkleRatio = 0;

  }

  const starDataByLayer = new WeakMap();

  let starTwinkleFrame = null;

  let starResizeTimer;



  function starRand(seed) {

    const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;

    return x - Math.floor(x);

  }



  function drawStarfieldLayer(layer) {

    const canvas = layer.querySelector(".starfield__canvas");

    if (!canvas) return;



    const layerClass = layer.classList.contains("starfield__layer--far")

      ? "far"

      : layer.classList.contains("starfield__layer--mid")

        ? "mid"

        : "near";

    const config = starLayerConfigs[layerClass];

    const mobileScale = isMobile ? 0.65 : 1;

    const count = Math.round(config.count * mobileScale);



    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rect = layer.getBoundingClientRect();

    const width = Math.max(rect.width, window.innerWidth * 1.16);

    const height = Math.max(rect.height, window.innerHeight * 1.16);



    canvas.width = Math.floor(width * dpr);

    canvas.height = Math.floor(height * dpr);

    canvas.style.width = width + "px";

    canvas.style.height = height + "px";



    const ctx = canvas.getContext("2d");

    if (!ctx) return;



    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);



    const stars = [];

    const seedBase = layerClass === "far" ? 11 : layerClass === "mid" ? 29 : 47;



    for (let i = 0; i < count; i++) {

      const seed = seedBase + i * 0.73;

      const x = starRand(seed) * width;

      const y = starRand(seed + 1) * height;

      const size = 0.4 + starRand(seed + 2) * config.maxSize;

      const opacity = config.minOpacity + starRand(seed + 3) * (config.maxOpacity - config.minOpacity);

      const twinkles = starRand(seed + 4) < config.twinkleRatio;



      stars.push({ x, y, size, opacity, twinkles, phase: starRand(seed + 5) * Math.PI * 2, speed: 0.6 + starRand(seed + 6) * 1.4 });



      ctx.beginPath();

      ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);

      ctx.fillStyle = "rgba(255, 255, 255, " + opacity.toFixed(3) + ")";

      ctx.fill();

    }



    starDataByLayer.set(layer, { stars, width, height, ctx, dpr, twinkleActive: config.twinkleRatio > 0 });

  }



  function initStarfield() {

    starLayers.forEach(drawStarfieldLayer);



    if (!prefersReducedMotion) {

      startStarTwinkleLoop();

    }

  }



  function startStarTwinkleLoop() {

    if (starTwinkleFrame) return;



    const start = performance.now();



    function tick(now) {

      if (document.hidden) {

        starTwinkleFrame = requestAnimationFrame(tick);

        return;

      }

      const t = (now - start) / 1000;



      starLayers.forEach((layer) => {

        const data = starDataByLayer.get(layer);

        if (!data || !data.twinkleActive) return;



        const { stars, width, height, ctx, dpr } = data;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, width, height);



        stars.forEach((star) => {

          let opacity = star.opacity;

          if (star.twinkles) {

            opacity *= 0.55 + 0.45 * Math.sin(t * star.speed + star.phase);

          }



          ctx.beginPath();

          ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);

          ctx.fillStyle = "rgba(255, 255, 255, " + opacity.toFixed(3) + ")";

          ctx.fill();

        });

      });



      starTwinkleFrame = requestAnimationFrame(tick);

    }



    starTwinkleFrame = requestAnimationFrame(tick);

  }



  function updateStarfieldParallax() {

    const scrollRatio = window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);



    const applyParallax = (el, depth, parallax) => {

      const scrollX = scrollRatio * parallax * 60;

      const scrollY = scrollRatio * parallax * -100;



      let cursorX = 0;

      let cursorY = 0;



      if (pointerActive && !prefersReducedMotion) {

        const rect = el.getBoundingClientRect();

        const cx = rect.left + rect.width / 2;

        const cy = rect.top + rect.height / 2;

        const dx = pointerX - cx;

        const dy = pointerY - cy;

        const dist = Math.sqrt(dx * dx + dy * dy);

        const radius = isMobile ? 200 : 360;



        if (dist < radius && dist > 0) {

          const force = (1 - dist / radius) * depth * 14 * cursorStrength;

          cursorX = (-dx / dist) * force;

          cursorY = (-dy / dist) * force;

        }

      }



      el.style.setProperty("--star-scroll-x", scrollX.toFixed(2) + "px");

      el.style.setProperty("--star-scroll-y", scrollY.toFixed(2) + "px");

      el.style.setProperty("--star-cursor-x", cursorX.toFixed(2) + "px");

      el.style.setProperty("--star-cursor-y", cursorY.toFixed(2) + "px");

    };



    starLayers.forEach((layer) => {

      const depth = parseFloat(layer.dataset.depth || "0.3");

      const parallax = parseFloat(layer.dataset.parallax || "0.1");

      applyParallax(layer, depth, parallax);

    });



    starTwinkles.forEach((twinkle) => {

      const depth = parseFloat(twinkle.dataset.depth || "0.4");

      applyParallax(twinkle, depth, depth * 0.35);

    });

  }



  function onStarfieldResize() {

    clearTimeout(starResizeTimer);

    starResizeTimer = setTimeout(() => {

      starLayers.forEach(drawStarfieldLayer);

    }, 180);

  }



  if (starLayers.length) {

    initStarfield();

    window.addEventListener("resize", onStarfieldResize, { passive: true });

  }



  /* ─── Scroll progress bar ─── */

  const progressBar = document.querySelector(".scroll-progress");

  const progressFill = document.querySelector(".scroll-progress__fill");

  const progressLabel = document.querySelector(".scroll-progress__label");



  let scrollTimeout;

  function updateScrollProgress() {

    const scrollTop = window.scrollY;

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;



    if (progressFill) progressFill.style.width = pct + "%";

    if (progressBar) progressBar.setAttribute("aria-valuenow", Math.round(pct));

    if (progressLabel) progressLabel.textContent = Math.round(pct) + "%";



    document.body.classList.add("is-scrolling");

    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {

      document.body.classList.remove("is-scrolling");

    }, 800);

  }



  /* ─── Background tint transitions per section theme ─── */

  const themeColors = {

    cover:       [240, 238, 236],

    profile:     [235, 236, 240],

    work:        [238, 237, 235],

    design:      [236, 238, 242],

    maintenance: [234, 236, 238],

    documents:   [238, 236, 234],

    metrics:     [242, 234, 234],

    matrix:      [236, 238, 240],

    zhihu:       [238, 236, 242],

    bilibili:    [234, 236, 242],

    news:        [240, 238, 236],

    workplace:   [236, 240, 238],

    skills:      [238, 238, 236],

    closing:     [240, 236, 236],

  };



  const sections = Array.from(document.querySelectorAll(".slide-section"));



  function lerp(a, b, t) {

    return a + (b - a) * t;

  }



  function updatePageTint() {

    const mid = window.innerHeight * 0.45;

    let activeIdx = 0;



    sections.forEach((section, i) => {

      const rect = section.getBoundingClientRect();

      if (rect.top <= mid && rect.bottom >= mid) activeIdx = i;

    });



    const current = sections[activeIdx];

    const theme = current ? current.dataset.theme : "cover";

    const color = themeColors[theme] || themeColors.cover;



    document.documentElement.style.setProperty("--page-tint", color.join(", "));



    const accentOpacity = theme === "metrics" ? 0.14 : 0.08;

    document.documentElement.style.setProperty("--page-accent-opacity", accentOpacity);

  }



  /* ─── Parallax on slide images ─── */

  const parallaxEls = Array.from(document.querySelectorAll(".slide-parallax"));



  function updateParallax() {

    if (prefersReducedMotion) return;



    const vh = window.innerHeight;



    parallaxEls.forEach((el) => {

      const section = el.closest(".slide-section");

      if (!section || !section.classList.contains("is-visible")) return;



      const rect = section.getBoundingClientRect();

      const center = rect.top + rect.height / 2;

      const offset = (center - vh / 2) / vh;

      const y = offset * -18;

      const scale = 1 + Math.abs(offset) * 0.008;



      el.style.transform = "translate3d(0, " + y.toFixed(2) + "px, 0) scale(" + scale.toFixed(4) + ")";

    });

  }



  /* ─── Ambient background parallax ─── */

  const ambientGradA = document.querySelector(".ambient__gradient--a");

  const ambientGradB = document.querySelector(".ambient__gradient--b");

  const ambientFlow = document.querySelector(".ambient__flow");



  function updateAmbientParallax() {

    if (prefersReducedMotion) return;



    const scrollRatio = window.scrollY / (document.documentElement.scrollHeight || 1);

    const yA = scrollRatio * 120;

    const yB = scrollRatio * -80;



    if (ambientGradA) ambientGradA.style.transform = "translateY(" + yA + "px)";

    if (ambientGradB) ambientGradB.style.transform = "translateY(" + yB + "px)";

    if (ambientFlow) ambientFlow.style.transform = "translateY(" + (scrollRatio * 60) + "px)";

  }



  /* ─── Subtle tilt on hover ─── */

  function initTilt() {

    if (prefersReducedMotion || window.matchMedia("(max-width: 720px)").matches) return;



    document.querySelectorAll("[data-tilt]").forEach((canvas) => {

      canvas.addEventListener("mousemove", (e) => {

        const rect = canvas.getBoundingClientRect();

        const x = (e.clientX - rect.left) / rect.width - 0.5;

        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const rotateX = y * -3;

        const rotateY = x * 3;



        canvas.style.transform =

          "perspective(900px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg)";

      });



      canvas.addEventListener("mouseleave", () => {

        canvas.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";

      });

    });

  }



  /* ─── Animated number counters (slide 7) ─── */

  function animateCounter(el, target, suffix, decimals) {

    const duration = prefersReducedMotion ? 0 : 1400;

    const start = performance.now();

    const from = 0;



    function tick(now) {

      const elapsed = now - start;

      const progress = duration === 0 ? 1 : Math.min(1, elapsed / duration);

      const eased = 1 - Math.pow(1 - progress, 3);

      const current = from + (target - from) * eased;



      el.textContent = (decimals > 0 ? current.toFixed(decimals) : Math.round(current)) + suffix;



      if (progress < 1) {

        requestAnimationFrame(tick);

      }

    }



    requestAnimationFrame(tick);

  }



  const counterObserver = new IntersectionObserver(

    (entries) => {

      entries.forEach((entry) => {

        if (!entry.isIntersecting) return;



        const section = entry.target;

        section.querySelectorAll(".metric-chip__value[data-count]").forEach((el) => {

          if (el.dataset.animated) return;

          el.dataset.animated = "true";



          const target = parseFloat(el.dataset.count, 10);

          const suffix = el.dataset.suffix || "";

          const decimals = parseInt(el.dataset.decimals || "0", 10);



          animateCounter(el, target, suffix, decimals);

        });



        counterObserver.unobserve(section);

      });

    },

    { threshold: 0.35 }

  );



  const metricsSection = document.querySelector("#slide-7");

  if (metricsSection) counterObserver.observe(metricsSection);



  /* ─── rAF scroll loop ─── */

  let ticking = false;



  function onScroll() {

    if (!ticking) {

      requestAnimationFrame(() => {

        updateScrollProgress();

        updatePageTint();

        updateParallax();

        updateAmbientParallax();

        updateStarfieldParallax();

        updateRedMotifMotion();

        updateFlowMouseShift();

        ticking = false;

      });

      ticking = true;

    }

  }



  window.addEventListener("scroll", onScroll, { passive: true });

  window.addEventListener("resize", onScroll, { passive: true });



  initTilt();

  updateScrollProgress();

  updatePageTint();

  updateParallax();

  updateAmbientParallax();



  /* ─── Floating red motifs: cursor proximity + scroll parallax ─── */

  const redMotifs = Array.from(document.querySelectorAll(".red-motif[data-depth]"));

  const ambientOrbs = Array.from(document.querySelectorAll(".ambient__orb"));

  const connectorDots = Array.from(document.querySelectorAll(".section-connector__dot"));

  const slideCanvases = Array.from(document.querySelectorAll(".slide-canvas"));



  function setPointer(clientX, clientY) {

    pointerX = clientX;

    pointerY = clientY;

    pointerActive = true;

  }



  function updateRedMotifMotion() {

    if (prefersReducedMotion) return;



    const scrollRatio = window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);



    redMotifs.forEach((motif) => {

      const depth = parseFloat(motif.dataset.depth || "0.5");

      const parallax = parseFloat(motif.dataset.parallax || "0.1");

      const rect = motif.getBoundingClientRect();

      const cx = rect.left + rect.width / 2;

      const cy = rect.top + rect.height / 2;



      let cursorX = 0;

      let cursorY = 0;



      if (pointerActive) {

        const dx = pointerX - cx;

        const dy = pointerY - cy;

        const dist = Math.sqrt(dx * dx + dy * dy);

        const radius = isTouchDevice ? 140 : 220;

        if (dist < radius && dist > 0) {

          const force = (1 - dist / radius) * depth * 28 * cursorStrength;

          cursorX = (-dx / dist) * force;

          cursorY = (-dy / dist) * force;

        }

      }



      const scrollX = scrollRatio * parallax * 80;

      const scrollY = scrollRatio * parallax * -120;



      motif.style.setProperty("--motif-cursor-x", cursorX.toFixed(2) + "px");

      motif.style.setProperty("--motif-cursor-y", cursorY.toFixed(2) + "px");

      motif.style.setProperty("--motif-scroll-x", scrollX.toFixed(2) + "px");

      motif.style.setProperty("--motif-scroll-y", scrollY.toFixed(2) + "px");

    });



    ambientOrbs.forEach((orb, i) => {

      if (!pointerActive) {

        orb.style.setProperty("--orb-cursor-x", "0px");

        orb.style.setProperty("--orb-cursor-y", "0px");

        return;

      }



      const rect = orb.getBoundingClientRect();

      const cx = rect.left + rect.width / 2;

      const cy = rect.top + rect.height / 2;

      const dx = pointerX - cx;

      const dy = pointerY - cy;

      const dist = Math.sqrt(dx * dx + dy * dy);

      const radius = 320;

      let ox = 0;

      let oy = 0;



      if (dist < radius && dist > 0) {

        const force = (1 - dist / radius) * (12 + i * 4) * cursorStrength;

        ox = (-dx / dist) * force;

        oy = (-dy / dist) * force;

      }



      orb.style.setProperty("--orb-cursor-x", ox.toFixed(2) + "px");

      orb.style.setProperty("--orb-cursor-y", oy.toFixed(2) + "px");

    });



    const flowScrollY = scrollRatio * 90;

    document.documentElement.style.setProperty("--flow-scroll-y", flowScrollY.toFixed(2));

  }



  function updateFlowMouseShift() {

    if (prefersReducedMotion) return;



    const nx = pointerX / Math.max(window.innerWidth, 1);

    document.documentElement.style.setProperty("--flow-mouse-x", nx.toFixed(4));

  }



  function spawnRedRipple(clientX, clientY) {

    if (prefersReducedMotion) return;



    const ripple = document.createElement("span");

    ripple.className = "red-ripple";

    ripple.style.left = clientX + "px";

    ripple.style.top = clientY + "px";

    document.body.appendChild(ripple);



    ripple.addEventListener("animationend", () => ripple.remove());

    setTimeout(() => ripple.remove(), 800);

  }



  function pulseMotif(motif, clientX, clientY) {

    motif.classList.add("is-pulsing");

    spawnRedRipple(clientX, clientY);

    setTimeout(() => motif.classList.remove("is-pulsing"), 600);

  }



  redMotifs.forEach((motif) => {

    motif.addEventListener("click", (e) => {

      pulseMotif(motif, e.clientX, e.clientY);

    });

  });



  connectorDots.forEach((dot) => {

    dot.addEventListener("click", (e) => {

      e.stopPropagation();

      spawnRedRipple(e.clientX, e.clientY);

      dot.style.animation = "none";

      void dot.offsetWidth;

      dot.style.animation = "";

    });

  });



  slideCanvases.forEach((canvas) => {

    canvas.addEventListener("mouseenter", () => canvas.classList.add("is-accent-active"));

    canvas.addEventListener("mouseleave", () => canvas.classList.remove("is-accent-active"));



    if (isTouchDevice) {

      canvas.addEventListener("touchstart", () => {

        canvas.classList.add("is-accent-active");

        setTimeout(() => canvas.classList.remove("is-accent-active"), 1200);

      }, { passive: true });

    }

  });



  let motionTicking = false;



  function scheduleMotionUpdate() {

    if (motionTicking) return;

    motionTicking = true;

    requestAnimationFrame(() => {

      updateRedMotifMotion();

      updateStarfieldParallax();

      updateFlowMouseShift();

      motionTicking = false;

    });

  }



  window.addEventListener(

    "mousemove",

    (e) => {

      setPointer(e.clientX, e.clientY);

      scheduleMotionUpdate();

    },

    { passive: true }

  );



  window.addEventListener(

    "touchmove",

    (e) => {

      if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);

      scheduleMotionUpdate();

    },

    { passive: true }

  );



  window.addEventListener(

    "touchstart",

    (e) => {

      if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);

      scheduleMotionUpdate();

    },

    { passive: true }

  );



  updateRedMotifMotion();

  updateStarfieldParallax();

  updateFlowMouseShift();

})();


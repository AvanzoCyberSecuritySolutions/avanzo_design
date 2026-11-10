/* ==========================================================================
   Avanzo Designs — interactions (v3)
   loader · page curtain · smooth scroll · reveals · word fill ·
   horizontal services · magnetic buttons · cursor · 3D logo gyroscope
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(pointer: coarse)").matches;
  var mouse = { x: -100, y: -100, nx: 0, ny: 0 };
  var scrollY = window.scrollY, scrollMax = 1, scrollVel = 0, lastScroll = scrollY;
  var vw = window.innerWidth, vh = window.innerHeight;
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------------- Ready / loader / curtain ---------------- */
  var curtain = document.querySelector(".curtain");
  var loader = document.querySelector(".loader");

  function ready() {
    root.classList.add("is-ready");
    if (curtain && root.classList.contains("nav-in")) {
      requestAnimationFrame(function () {
        root.classList.remove("nav-in");
        curtain.classList.add("is-out");
      });
    }
  }

  if (loader && root.classList.contains("is-first") && !reduceMotion) {
    var bar = loader.querySelector(".loader__bar span");
    var t0 = performance.now(), dur = 1500, done = false;
    var finish = function () {
      if (done) return; done = true;
      loader.classList.add("is-done"); ready();
    };
    setTimeout(finish, 3500); // safety net if rAF is throttled
    (function step(now) {
      var t = clamp((now - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - t, 3);
      bar.style.transform = "scaleX(" + e + ")";
      if (t < 1 && !done) requestAnimationFrame(step);
      else setTimeout(finish, 150);
    })(t0);
  } else {
    if (loader) loader.remove();
    ready();
  }

  // Leaving the page: slide the curtain up, then navigate
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || !curtain || reduceMotion) return;
    if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#" || /^(mailto|tel):/.test(href)) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    try { sessionStorage.setItem("avz-nav", "1"); } catch (err) {}
    curtain.classList.remove("is-out");
    curtain.classList.add("is-leaving");
    setTimeout(function () { location.href = a.href; }, 650);
  });
  // Back/forward cache: make sure the curtain is not left covering the page
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && curtain) { curtain.classList.remove("is-leaving"); curtain.classList.add("is-out"); }
  });

  /* ---------------- Smooth scroll ---------------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
  }

  /* ---------------- Header ---------------- */
  var header = document.querySelector(".site-header");
  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.querySelector(".mobile-menu");
  var menuOpen = false;
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      menuOpen = !menuOpen;
      menu.classList.toggle("is-open", menuOpen);
      menuBtn.setAttribute("aria-expanded", menuOpen);
      menu.setAttribute("aria-hidden", !menuOpen);
      if (lenis) { menuOpen ? lenis.stop() : lenis.start(); }
      body.style.overflow = menuOpen ? "hidden" : "";
    });
  }

  /* ---------------- Cursor ---------------- */
  var cursor = document.querySelector(".cursor");
  var cLabel = document.querySelector(".cursor-label");
  var cx = -100, cy = -100, lx = -100, ly = -100;
  window.addEventListener("pointermove", function (e) {
    if (!root.classList.contains("has-pointer")) { cx = lx = e.clientX; cy = ly = e.clientY; root.classList.add("has-pointer"); }
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.nx = (e.clientX / vw) * 2 - 1;
    mouse.ny = (e.clientY / vh) * 2 - 1;
  }, { passive: true });
  if (cursor && !isTouch) {
    document.querySelectorAll("a, button, summary, input, textarea").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("is-link"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("is-link"); });
    });
    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cLabel.textContent = el.dataset.cursor; cLabel.classList.add("is-on"); cursor.style.opacity = "0"; });
      el.addEventListener("mouseleave", function () { cLabel.classList.remove("is-on"); cursor.style.opacity = ""; });
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + dx * strength + "px," + dy * strength + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal, .lines").forEach(function (el) { io.observe(el); });

  /* ---------------- Words fill on scroll ---------------- */
  var wordBlocks = [];
  document.querySelectorAll("[data-words]").forEach(function (el) {
    var html = "";
    el.childNodes.forEach(function (node) {
      var isHl = node.nodeType === 1 && node.classList.contains("hl");
      (node.textContent || "").split(/\s+/).forEach(function (w) {
        if (w) html += '<span class="w' + (isHl ? " hl" : "") + '">' + w + "</span> ";
      });
    });
    el.innerHTML = html;
    wordBlocks.push({ el: el, words: el.querySelectorAll(".w"), last: -1 });
  });
  function updateWords() {
    wordBlocks.forEach(function (b) {
      var r = b.el.getBoundingClientRect();
      var p = reduceMotion ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
      var n = Math.round(p * b.words.length);
      if (n === b.last) return;
      for (var i = 0; i < b.words.length; i++) b.words[i].classList.toggle("on", i < n);
      b.last = n;
    });
  }

  /* ---------------- Horizontal services ---------------- */
  var hs = document.querySelector("[data-hscroll]");
  var hsTrack = hs && hs.querySelector(".hs__track");
  var hsBar = hs && hs.querySelector(".hs__progress span");
  var hsDist = 0, hsActive = false;
  function sizeHS() {
    if (!hs) return;
    hsActive = vw > 900 && !reduceMotion;
    hs.classList.toggle("hs--static", !hsActive);
    if (!hsActive) { hs.style.height = ""; hsTrack.style.transform = ""; return; }
    hsDist = Math.max(0, hsTrack.scrollWidth - vw);
    hs.style.height = (hsDist + vh) + "px";
  }
  function updateHS() {
    if (!hsActive) return;
    var top = hs.getBoundingClientRect().top;
    var p = hsDist ? clamp(-top / hsDist, 0, 1) : 0;
    hsTrack.style.transform = "translate3d(" + (-p * hsDist) + "px,0,0)";
    if (hsBar) hsBar.style.transform = "scaleX(" + p + ")";
  }

  /* ---------------- Scroll film (journey) ----------------
     Scroll position drives the 3D camera like scrubbing a video.
     jt goes 0 → 1 from the top of the page to the end of the journey. */
  var journey = reduceMotion ? null : document.querySelector("[data-journey]");
  var night = document.querySelector(".night");
  var heroEl = document.querySelector(".hero");
  var caps = journey ? Array.prototype.map.call(journey.querySelectorAll(".journey__cap"), function (el) {
    return { el: el, a: parseFloat(el.dataset.in), b: parseFloat(el.dataset.out) };
  }) : [];
  var jHud = journey && journey.querySelector(".journey__hud");
  var jPct = journey && journey.querySelector("[data-journey-pct]");
  var jBar = journey && journey.querySelector(".journey__bar i");
  var journeyEnd = 1, jt = -1, jDark = 0;
  function smooth(x, a, b) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function sizeJourney() {
    if (!journey) return;
    journeyEnd = Math.max(1, journey.offsetTop + journey.offsetHeight - vh);
  }
  function updateJourney() {
    if (!journey) return;
    jt = clamp(scrollY / journeyEnd, 0, 1);
    jDark = smooth(jt, 0.07, 0.2) * (1 - smooth(jt, 0.93, 1));
    if (night) night.style.opacity = jDark.toFixed(3);
    if (heroEl) heroEl.style.opacity = (1 - smooth(jt, 0, 0.13)).toFixed(3);
    caps.forEach(function (c) {
      var o = smooth(jt, c.a, c.a + 0.05) * (1 - smooth(jt, c.b - 0.05, c.b));
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = "translateY(" + ((1 - o) * 40).toFixed(1) + "px) scale(" + (0.94 + o * 0.06).toFixed(3) + ")";
      c.el.style.filter = o > 0.99 ? "none" : "blur(" + ((1 - o) * 10).toFixed(1) + "px)";
    });
    if (jHud) jHud.style.opacity = jDark.toFixed(3);
    var pct = clamp((jt - 0.12) / 0.83, 0, 1);
    if (jPct) jPct.textContent = Math.round(pct * 100) + "%";
    if (jBar) jBar.style.transform = "scaleX(" + pct.toFixed(3) + ")";
  }

  /* ---------------- Contact form → mail client ---------------- */
  var form = document.querySelector("[data-mail-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var subject = "Project enquiry from " + d.get("name");
      var text = d.get("message") + "\n\n— " + d.get("name") + " (" + d.get("email") + ")";
      var note = form.querySelector(".form-note");
      if (note) note.textContent = "Opening your mail app… If nothing happens, write to info@avanzosolutions.in";
      window.location.href = "mailto:info@avanzosolutions.in?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    });
  }

  /* ---------------- Local time (contact) ---------------- */
  var clocks = document.querySelectorAll("[data-clock]");
  function tickClock() {
    var s;
    try { s = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) + " IST"; }
    catch (e) { s = new Date().toLocaleTimeString(); }
    clocks.forEach(function (c) { c.textContent = s; });
  }
  if (clocks.length) { tickClock(); setInterval(tickClock, 15000); }

  /* ---------------- Resize ---------------- */
  function onResize() {
    vw = window.innerWidth; vh = window.innerHeight;
    sizeHS();
    sizeJourney();
    if (scene3d) scene3d.resize();
    if (showcase) showcase.resize();
  }
  window.addEventListener("resize", onResize);
  function sizeAll() { sizeHS(); sizeJourney(); }
  window.addEventListener("load", sizeAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeAll);

  /* ---------------- 3D ---------------- */
  var scene3d = initScene();
  var showcase = initShowcase();
  sizeAll();

  /* ---------------- Main loop ---------------- */
  var lastHeaderY = 0;
  function loop(time) {
    if (lenis) lenis.raf(time);
    scrollY = window.scrollY;
    scrollVel = scrollY - lastScroll; lastScroll = scrollY;
    scrollMax = Math.max(1, document.documentElement.scrollHeight - vh);

    if (header && !menuOpen) {
      header.classList.toggle("is-scrolled", scrollY > 30);
      if (Math.abs(scrollY - lastHeaderY) > 6) {
        header.classList.toggle("is-hidden", scrollY > lastHeaderY && scrollY > 500);
        lastHeaderY = scrollY;
      }
    }

    if (cursor) {
      cx += (mouse.x - cx) * 0.25; cy += (mouse.y - cy) * 0.25;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      lx += (mouse.x - lx) * 0.18; ly += (mouse.y - ly) * 0.18;
      if (cLabel) cLabel.style.left = lx + "px", cLabel.style.top = ly + "px";
    }

    updateWords();
    updateHS();
    updateJourney();
    if (scene3d) scene3d.render(time, jt, jDark);
    if (showcase) showcase.render(time);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ======================================================================
     3D showcase: the things the studio makes, floating in glossy 3D.
     A business card printed with the real logo, a phone showing a
     website, and a poster. Draws only while its section is on screen.
     ====================================================================== */
  function initShowcase() {
    var sec = document.querySelector("[data-showcase]");
    if (!sec || !window.THREE) return null;
    var canvas = sec.querySelector(".showcase__canvas");
    var THREE = window.THREE;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.6, 12.5);
    camera.lookAt(0, -0.15, 0);

    /* neutral photo-studio environment: white softboxes, dark flags, no colour cast */
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = new THREE.Scene();
    env.background = new THREE.Color(0xdcdae0);
    function panel(color, w, h, x, y, z) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    }
    panel(0xffffff, 12, 4, 0, 8, 2);      // big overhead softbox
    panel(0xffffff, 3, 9, -7, 1, 4);      // left strip
    panel(0xf4f1f6, 3, 9, 7, 0, 5);       // right strip
    panel(0x151318, 5, 10, 8, 0, -3);     // dark flag for edge contrast
    panel(0x151318, 14, 2, 0, -6, 0);     // dark floor bounce
    scene.environment = pmrem.fromScene(env, 0.04).texture;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d4dc, 0.55));
    var key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(-4, 9, 6);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(6, 3, -6); scene.add(rim);

    /* ---- textures drawn on canvas (all neutral, a touch of brand pink) ---- */
    var logo = new Image();
    logo.src = "images/Logo-01.png";
    var maxAniso = renderer.capabilities.getMaxAnisotropy();
    function canvasTex(w, h, draw) {
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      var tex = new THREE.CanvasTexture(c);
      tex.encoding = THREE.sRGBEncoding; tex.anisotropy = maxAniso;
      tex.redraw = function () { draw(c.getContext("2d"), w, h); tex.needsUpdate = true; };
      tex.redraw();
      return tex;
    }
    function grain(g, w, h, alpha) {
      var n = Math.round(w * h / 60);
      for (var i = 0; i < n; i++) {
        g.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0," + alpha + ")" : "rgba(255,255,255," + alpha + ")";
        g.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
      }
    }
    function rr(g, x, y, w, h, r) {
      g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    }
    function drawLogo(g, x, y, width) {
      if (!(logo.complete && logo.naturalWidth)) return 0;
      var hgt = width * logo.naturalHeight / logo.naturalWidth;
      g.drawImage(logo, x, y, width, hgt);
      return hgt;
    }
    var DISPLAY = function (s, wgt) { return (wgt || 500) + " " + s + "px Jost, 'Century Gothic', sans-serif"; };
    var BODY = function (s, wgt) { return (wgt || 400) + " " + s + "px 'Hanken Grotesk', Arial, sans-serif"; };

    var cardFront = canvasTex(1260, 720, function (g, w, h) {
      g.fillStyle = "#fbfaf8"; g.fillRect(0, 0, w, h);
      grain(g, w, h, 0.025);
      var lw = w * 0.5, lh = logo.naturalWidth ? lw * logo.naturalHeight / logo.naturalWidth : 0;
      drawLogo(g, (w - lw) / 2, h * 0.43 - lh / 2, lw);
      g.fillStyle = "#8a8795"; g.font = BODY(24); g.textAlign = "center";
      g.fillText("info@avanzosolutions.in", w / 2, h - 92);
      g.fillText("+91 73561 11128", w / 2, h - 58);
    });
    var cardBack = canvasTex(1260, 720, function (g, w, h) {
      g.fillStyle = "#1c1a21"; g.fillRect(0, 0, w, h);
      grain(g, w, h, 0.03);
      g.strokeStyle = "rgba(255,255,255,0.08)"; g.lineWidth = 3;
      for (var i = 0; i < 7; i++) { g.beginPath(); g.arc(w * 0.78, h * 0.5, 60 + i * 30, i * 1.2, i * 1.2 + 1.6 + (i % 3) * 0.5); g.stroke(); }
      g.fillStyle = "#e0529c"; g.beginPath(); g.arc(90, h - 96, 9, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,0.7)"; g.font = DISPLAY(30, 400); g.textAlign = "left";
      g.fillText("thrissur, kerala", 116, h - 86);
    });
    var screen = canvasTex(620, 1300, function (g, w, h) {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#0e0d12"; rr(g, w / 2 - 70, 26, 140, 38, 19); g.fill();           // camera island
      drawLogo(g, 40, 104, 170);
      g.strokeStyle = "#0e0d12"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(w - 84, 128); g.lineTo(w - 44, 128); g.moveTo(w - 84, 144); g.lineTo(w - 44, 144); g.stroke();
      g.fillStyle = "#0e0d12"; g.font = DISPLAY(84); g.textAlign = "left";
      ["we shape", "how your", "brand"].forEach(function (t, i) { g.fillText(t, 40, 330 + i * 86); });
      g.fillStyle = "#e0529c"; g.fillText("is seen.", 40, 330 + 3 * 86);
      g.fillStyle = "#6b6878"; g.font = BODY(25);
      g.fillText("Logos, branding, websites", 40, 720); g.fillText("and print from Thrissur.", 40, 754);
      g.fillStyle = "#0e0d12"; rr(g, 40, 800, 236, 66, 33); g.fill();
      g.fillStyle = "#fff"; g.font = BODY(24, 600); g.fillText("Get in touch", 74, 842);
      var gr = g.createLinearGradient(0, 930, 0, 1230);
      gr.addColorStop(0, "#efedf2"); gr.addColorStop(1, "#dedbe3");
      g.fillStyle = gr; rr(g, 40, 930, w - 80, 300, 26); g.fill();
      g.strokeStyle = "rgba(14,13,18,0.18)"; g.lineWidth = 3;
      for (var i = 0; i < 4; i++) { g.beginPath(); g.arc(w - 170, 1080, 40 + i * 22, i * 1.4, i * 1.4 + 2.2); g.stroke(); }
    });
    var poster = canvasTex(840, 1188, function (g, w, h) {
      g.fillStyle = "#f3f0ea"; g.fillRect(0, 0, w, h);
      grain(g, w, h, 0.03);
      g.strokeStyle = "rgba(14,13,18,0.85)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(60, 120); g.lineTo(w - 60, 120); g.stroke();
      g.fillStyle = "#0e0d12"; g.font = DISPLAY(24, 400); g.textAlign = "left";
      g.fillText("avanzo designs", 60, 96);
      g.textAlign = "right"; g.fillText("no. 04", w - 60, 96);
      g.strokeStyle = "rgba(14,13,18,0.14)"; g.lineWidth = 2;
      for (var i = 0; i < 6; i++) { g.beginPath(); g.arc(w * 0.62, h * 0.38, 70 + i * 34, i * 1.1, i * 1.1 + 2 + (i % 2)); g.stroke(); }
      g.fillStyle = "#e0529c"; g.beginPath(); g.arc(w * 0.62, h * 0.38, 16, 0, 7); g.fill();
      g.fillStyle = "#0e0d12"; g.textAlign = "left"; g.font = DISPLAY(190);
      g.fillText("say", 52, h - 330); g.fillText("hello.", 52, h - 160);
      g.beginPath(); g.moveTo(60, h - 104); g.lineTo(w - 60, h - 104); g.strokeStyle = "rgba(14,13,18,0.85)"; g.stroke();
      g.font = BODY(22); g.fillStyle = "#47444f";
      g.fillText("design studio · thrissur, kerala", 60, h - 64);
    });
    function redrawAll() { [cardFront, cardBack, screen, poster].forEach(function (t) { t.redraw(); }); }
    logo.onload = redrawAll;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawAll);

    /* ---- geometry helpers: rounded slabs with printed faces ---- */
    function roundedShape(w, h, r) {
      var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    function face(w, h, r, mat) {
      var geo = new THREE.ShapeGeometry(roundedShape(w, h, r), 10);
      var pos = geo.attributes.position, uv = geo.attributes.uv;
      for (var i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
      return new THREE.Mesh(geo, mat);
    }
    function slab(w, h, r, depth, bevel, mat) {
      var geo = new THREE.ExtrudeGeometry(roundedShape(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), {
        depth: depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 14
      });
      geo.translate(0, 0, -depth / 2);
      return new THREE.Mesh(geo, mat);
    }
    function printed(map, rough) { return new THREE.MeshPhysicalMaterial({ map: map, roughness: rough, clearcoat: 0.25, clearcoatRoughness: 0.5 }); }

    // business card: thick cotton stock, printed both sides
    var card = new THREE.Group();
    var cw = 3.15, ch = 1.8, cd = 0.04;
    card.add(slab(cw, ch, 0.09, cd, 0.006, new THREE.MeshPhysicalMaterial({ color: 0xf7f5f2, roughness: 0.75 })));
    var cf = face(cw - 0.004, ch - 0.004, 0.088, printed(cardFront, 0.6)); cf.position.z = cd / 2 + 0.0075; card.add(cf);
    var cb = face(cw - 0.004, ch - 0.004, 0.088, printed(cardBack, 0.5)); cb.rotation.y = Math.PI; cb.position.z = -(cd / 2 + 0.0075); card.add(cb);

    // phone: graphite body with bevelled edges and a glass screen
    var phone = new THREE.Group();
    var pw = 1.62, ph = 3.3, pd = 0.12;
    phone.add(slab(pw, ph, 0.24, pd, 0.035, new THREE.MeshPhysicalMaterial({ color: 0x2b2830, metalness: 0.85, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 })));
    var bezel = face(pw - 0.07, ph - 0.07, 0.2, new THREE.MeshPhysicalMaterial({ color: 0x0b0a0d, roughness: 0.1, clearcoat: 1 }));
    bezel.position.z = pd / 2 + 0.036; phone.add(bezel);
    var glass = face(pw - 0.16, ph - 0.16, 0.16, new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }));
    glass.position.z = pd / 2 + 0.038; phone.add(glass);

    // poster: thin board with an editorial print
    var posterG = new THREE.Group();
    var ow = 2.1, oh = 2.97;
    posterG.add(slab(ow, oh, 0.02, 0.025, 0, new THREE.MeshPhysicalMaterial({ color: 0xf1eee8, roughness: 0.8 })));
    var pf = face(ow, oh, 0.02, printed(poster, 0.7)); pf.position.z = 0.0135; posterG.add(pf);

    var chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.06, clearcoat: 1 });
    var ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf3f1f4, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 24, 140, Math.PI * 1.35), chrome);
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.34, 64, 64), chrome);
    var pebble = new THREE.Mesh(new THREE.SphereGeometry(0.24, 48, 48), ceramic);

    var group = new THREE.Group(); scene.add(group);

    // soft contact shadows (like a product photo): a blurred blob under each piece
    var FLOOR_Y = -2.85;
    var blobCanvas = document.createElement("canvas"); blobCanvas.width = blobCanvas.height = 256;
    var bg = blobCanvas.getContext("2d");
    var bgr = bg.createRadialGradient(128, 128, 0, 128, 128, 128);
    bgr.addColorStop(0, "rgba(20,16,26,0.55)"); bgr.addColorStop(0.45, "rgba(20,16,26,0.22)"); bgr.addColorStop(1, "rgba(20,16,26,0)");
    bg.fillStyle = bgr; bg.fillRect(0, 0, 256, 256);
    var blobTex = new THREE.CanvasTexture(blobCanvas);
    function makeBlob(sx, sz) {
      var b = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false }));
      b.rotation.x = -Math.PI / 2; b.scale.set(sx, sz, 1); b.position.y = FLOOR_Y;
      b.userData.base = [sx, sz];
      group.add(b);
      return b;
    }

    // rest pose (position, rotation) and fly-in direction for each piece
    var items = [
      { o: posterG, p: [-1.6, 0.55, -1.4], r: [0.0, 0.36, 0.025], d: [-1, 1, -1], f: 0.0, sh: [2.6, 1.1] },
      { o: phone, p: [1.4, 0.15, 0.15], r: [0.05, -0.36, -0.05], d: [1.5, 0.5, 0.5], f: 1.3, sh: [2.2, 1.0] },
      { o: card, p: [-0.5, -1.55, 1.05], r: [-0.62, 0.42, 0.1], d: [-1, -1.2, 1], f: 2.4, sh: [3.4, 1.5] },
      { o: ring, p: [0.35, 2.05, -0.8], r: [0.5, 0.3, 0.7], d: [0.5, 1.5, -0.5], f: 3.1, sh: [1.4, 0.7] },
      { o: sphere, p: [2.3, -1.75, 0.9], r: [0, 0, 0], d: [1.5, -1, 0.5], f: 4.2, sh: [0.9, 0.5] },
      { o: pebble, p: [-2.5, -1.35, 0.55], r: [0, 0, 0], d: [-1.5, 0, 0.5], f: 5.0, sh: [0.7, 0.4] }
    ];
    items.forEach(function (it) {
      group.add(it.o);
      it.blob = makeBlob(it.sh[0], it.sh[1]);
    });

    var active = false, w = 1, h = 1, rx = 0, ry = 0;
    var base = { x: 0, y: 0, s: 1 };
    function resize() {
      w = Math.max(1, sec.clientWidth); h = Math.max(1, sec.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      var halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      var halfW = halfH * camera.aspect;
      if (vw < 900) {
        var s = Math.min(0.78, (halfW * 0.92) / 3.1);
        base = { x: 0, y: -halfH + 3.0 * s, s: s };
      } else {
        var sd = Math.min(0.92, (halfW * 0.54) / 3.1, (halfH * 0.9) / 2.8);
        base = { x: halfW * 0.46, y: -0.1, s: sd };
      }
    }
    resize();
    new IntersectionObserver(function (en) { active = en[0].isIntersecting; }, { rootMargin: "100px" }).observe(sec);

    return {
      resize: resize,
      render: function (time) {
        if (!active) return;
        var t = time * 0.001, m = reduceMotion ? 0 : 1;
        var r = sec.getBoundingClientRect();
        var prog = clamp((vh - r.top) / (vh + r.height), 0, 1);
        var v = clamp((prog - 0.06) / 0.32, 0, 1);
        var gather = reduceMotion ? 1 : 1 - Math.pow(1 - v, 3);
        var spread = 1 - gather;

        ry += (mouse.nx * 0.22 - ry) * 0.04;
        rx += (mouse.ny * 0.12 - rx) * 0.04;
        group.position.set(base.x, base.y, 0);
        group.scale.setScalar(base.s);
        group.rotation.y = (-0.12 + prog * 0.24) * m + ry * m;
        group.rotation.x = rx * m;

        items.forEach(function (it) {
          var bob = Math.sin(t * 0.8 + it.f) * 0.06 * m;
          it.o.position.set(
            it.p[0] + it.d[0] * spread * 1.4,
            it.p[1] + it.d[1] * spread * 1.4 + bob,
            it.p[2] + it.d[2] * spread * 1.4
          );
          it.o.rotation.set(
            it.r[0] + Math.sin(t * 0.5 + it.f) * 0.03 * m + spread * 0.5,
            it.r[1] + Math.cos(t * 0.45 + it.f) * 0.045 * m + spread * 0.8,
            it.r[2] + spread * 0.3
          );
          // shadow follows the piece; higher up = larger, fainter
          var lift = clamp((it.o.position.y - FLOOR_Y) / 5, 0, 1);
          it.blob.position.x = it.o.position.x;
          it.blob.position.z = it.o.position.z;
          var k = 1 + lift * 0.5;
          it.blob.scale.set(it.blob.userData.base[0] * k, it.blob.userData.base[1] * k, 1);
          it.blob.material.opacity = (0.75 - lift * 0.5) * gather;
        });
        renderer.render(scene, camera);
      }
    };
  }

  /* ======================================================================
     3D: a chrome gyroscope made of the logo's circuit arcs, with pink and
     purple end nodes, around a mirror sphere. Light studio environment.
     ====================================================================== */
  function initScene() {
    var canvas = document.getElementById("scene");
    if (!canvas || !window.THREE) return null;
    var THREE = window.THREE;
    var mode = body.dataset.scene || "hero";
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
    renderer.setSize(vw, vh);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, vw / vh, 0.1, 100);
    camera.position.set(0, 0, 12);

    /* studio environment: soft white boxes, dark flags for contrast, brand-coloured bounce */
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = new THREE.Scene();
    env.background = new THREE.Color(0xdfe2ea);
    function panel(color, w, h, x, y, z) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    }
    panel(0xffffff, 10, 3, 0, 7, 0);      // top softbox
    panel(0xffffff, 3, 8, 7, 0, 3);       // right strip
    panel(0x111015, 4, 10, -7, 0, 1);     // left dark flag
    panel(0x111015, 12, 2, 0, -6, 2);     // floor dark
    panel(0xe0529c, 6, 5, 5, -3, -4);     // pink bounce
    panel(0x8e3f97, 6, 5, -5, 3, -5);     // purple bounce
    panel(0xf08cc0, 5, 3, 3, 4, -6);      // light pink bounce
    panel(0xffffff, 4, 2, -2, 1, 8);      // front fill
    scene.environment = pmrem.fromScene(env, 0.035).texture;

    var chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.25 });
    var pinkMat = new THREE.MeshPhysicalMaterial({ color: 0xe0529c, metalness: 0.15, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
    var purpleMat = new THREE.MeshPhysicalMaterial({ color: 0x8e3f97, metalness: 0.15, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
    // coloured metals for the arcs (anodised look)
    function metal(hex) { return new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.85, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.3 }); }
    var arcMats = [chrome, metal(0xff5fa8), chrome, metal(0x9a4fc4), metal(0xd86fb8), chrome, metal(0xc04fd0)];
    var nodeMats = [pinkMat, purpleMat, metal(0xf3a6cc), metal(0x9a4fc4)];
    var coreMat = new THREE.MeshPhysicalMaterial({ color: 0xffd3ea, metalness: 1, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4 });

    var world = new THREE.Group(); scene.add(world);
    var gyro = new THREE.Group(); world.add(gyro);

    /* mirror core */
    var core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 64, 64), coreMat);
    gyro.add(core);

    /* arcs (deterministic so every visit looks composed) */
    var arcs = [
      { r: 1.05, tube: 0.055, arc: 1.35, rot: [0.0, 0.0, 0.3], spin: 0.32, tilt: [0.25, 0.1] },
      { r: 1.32, tube: 0.05, arc: 1.15, rot: [0.0, 0.0, 2.1], spin: -0.22, tilt: [-0.15, 0.35] },
      { r: 1.6, tube: 0.048, arc: 1.5, rot: [0.0, 0.0, 4.0], spin: 0.18, tilt: [0.4, -0.2] },
      { r: 1.88, tube: 0.045, arc: 0.95, rot: [0.0, 0.0, 1.0], spin: -0.14, tilt: [-0.35, -0.3] },
      { r: 2.15, tube: 0.042, arc: 1.25, rot: [0.0, 0.0, 3.2], spin: 0.11, tilt: [0.1, 0.5] },
      { r: 2.42, tube: 0.04, arc: 0.8, rot: [0.0, 0.0, 5.3], spin: -0.09, tilt: [0.55, 0.15] },
      { r: 2.7, tube: 0.038, arc: 1.05, rot: [0.0, 0.0, 0.2], spin: 0.07, tilt: [-0.2, -0.55] }
    ];
    var holders = [];
    arcs.forEach(function (a, i) {
      var pivot = new THREE.Group();
      pivot.rotation.x = a.tilt[0]; pivot.rotation.y = a.tilt[1];
      var h = new THREE.Group();
      h.rotation.z = a.rot[2];
      var ang = a.arc * Math.PI * 0.5;
      h.add(new THREE.Mesh(new THREE.TorusGeometry(a.r, a.tube, 20, 160, ang), arcMats[i % arcMats.length]));
      var nodeGeo = new THREE.SphereGeometry(a.tube * 1.9, 24, 24);
      [0, ang].forEach(function (t, k) {
        var n = new THREE.Mesh(nodeGeo, nodeMats[(i + k) % nodeMats.length]);
        n.position.set(Math.cos(t) * a.r, Math.sin(t) * a.r, 0);
        h.add(n);
      });
      pivot.add(h);
      gyro.add(pivot);
      holders.push({ h: h, pivot: pivot, spin: a.spin, tilt: a.tilt });
    });

    /* soft contact shadow */
    var sc = document.createElement("canvas"); sc.width = sc.height = 128;
    var g = sc.getContext("2d");
    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(14,13,18,0.45)"); grad.addColorStop(1, "rgba(14,13,18,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -3.3;
    world.add(shadow);

    /* ---- journey extras (home page only): ring tunnel, light streaks, fog ---- */
    var hasJourney = !!journey && mode === "hero";
    var tunnel = null, streaks = null, TUNNEL_END = -64;
    if (hasJourney) {
      scene.fog = new THREE.Fog(0x14081f, 200, 400);
      tunnel = new THREE.Group();
      tunnel.visible = false;
      scene.add(tunnel);
      var ringCount = isTouch ? 26 : 40;
      var seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      for (var k = 0; k < ringCount; k++) {
        var r = 2.1 + rnd() * 1.4;
        var arcLen = Math.PI * (0.5 + rnd() * 1.2);
        var tube = 0.03 + rnd() * 0.025;
        var holder = new THREE.Group();
        holder.position.z = -3 - k * ((-TUNNEL_END - 6) / ringCount);
        holder.rotation.z = rnd() * Math.PI * 2;
        holder.add(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 120, arcLen), arcMats[k % arcMats.length]));
        var ng = new THREE.SphereGeometry(tube * 2, 14, 14);
        [0, arcLen].forEach(function (a, j) {
          var node = new THREE.Mesh(ng, nodeMats[(k + j) % nodeMats.length]);
          node.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
          holder.add(node);
        });
        holder.userData.spin = (rnd() * 0.5 + 0.15) * (k % 2 ? 1 : -1);
        tunnel.add(holder);
      }
      // light streaks: points scattered around the flight path
      var sCount = isTouch ? 700 : 1600;
      var sPos = new Float32Array(sCount * 3);
      for (var q = 0; q < sCount; q++) {
        var ang = rnd() * Math.PI * 2, rad = 1.2 + rnd() * 6;
        sPos[q * 3] = Math.cos(ang) * rad;
        sPos[q * 3 + 1] = Math.sin(ang) * rad;
        sPos[q * 3 + 2] = 4 - rnd() * 74;
      }
      var sGeo = new THREE.BufferGeometry();
      sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
      streaks = new THREE.Points(sGeo, new THREE.PointsMaterial({
        color: 0xffc6e4, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      scene.add(streaks);
    }

    var base = { x: 0, y: 0, s: 1 };
    function layout() {
      var narrow = vw < 900;
      if (mode === "hero") base = narrow ? { x: 0, y: 1.25, s: 0.6 } : { x: 2.7, y: 0.55, s: 1 };
      else base = narrow ? { x: 1.5, y: 2.6, s: 0.42 } : { x: 3.6, y: 1.3, s: 0.62 };
    }
    layout();

    var rx = 0, ry = 0, lastT = 0, spinBoost = 0;
    return {
      resize: function () {
        renderer.setSize(vw, vh);
        camera.aspect = vw / vh; camera.updateProjectionMatrix();
        layout();
      },
      render: function (time, jt, dark) {
        var t = time * 0.001;
        var dt = Math.min(0.05, (t - lastT) || 0.016); lastT = t;
        var m = reduceMotion ? 0 : 1;
        if (hasJourney && jt >= 0) { renderJourney(t, dt, jt, dark); return; }
        // fade out the object once the first viewport is scrolled past
        var p = clamp(scrollY / (vh * 1.1), 0, 1);

        ry += (mouse.nx * 0.45 - ry) * 0.05;
        rx += (mouse.ny * 0.3 - rx) * 0.05;
        world.rotation.y = ry * m;
        world.rotation.x = rx * m;

        spinBoost += (Math.abs(scrollVel) * 0.02 - spinBoost) * 0.1;
        gyro.position.x = base.x + p * (vw < 900 ? 0 : 0.8);
        gyro.position.y = base.y + Math.sin(t * 0.9) * 0.08 * m + p * 1.4;
        gyro.scale.setScalar(base.s * (1 - p * 0.15));
        gyro.rotation.y += dt * 0.15 * m;
        gyro.rotation.z = p * 0.8;

        holders.forEach(function (o, i) {
          o.h.rotation.z += o.spin * dt * m * (1 + spinBoost * 3);
          o.pivot.rotation.x = o.tilt[0] + Math.sin(t * 0.4 + i) * 0.12 * m + p * (i % 2 ? 0.9 : -0.9);
        });

        shadow.position.x = gyro.position.x;
        shadow.position.y = gyro.position.y - 3.0 * base.s - 0.6;
        shadow.scale.setScalar(base.s * (1 + Math.sin(t * 0.9) * -0.04));
        shadow.material.opacity = vw < 900 ? 0 : (1 - p) * 0.9;

        renderer.render(scene, camera);
      }
    };

    /* The scroll film: the camera dives into the gyroscope, the core melts
       away, and we fly through a tunnel of circuit rings into the night. */
    var lastJt = -1;
    function renderJourney(t, dt, jt, dark) {
      // past the end of the film nothing is visible: draw one last frame, then idle
      var done = jt >= 0.999 && lastJt >= 0.999;
      lastJt = jt;
      if (done) return;
      var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
      var s01 = function (x, a, b) { var v = clamp((x - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); };

      // camera path: approach (0 → .25), then fly the tunnel (.25 → .97)
      var z = jt < 0.25 ? 12 - 9 * ease(jt / 0.25) : 3 + (TUNNEL_END + 4 - 3) * clamp((jt - 0.25) / 0.72, 0, 1);
      var drift = s01(jt, 0.2, 0.3);
      ry += (mouse.nx * 0.45 - ry) * 0.05;
      rx += (mouse.ny * 0.3 - rx) * 0.05;
      camera.position.set(
        Math.sin(jt * 7) * 0.45 * drift + ry * 0.6,
        Math.cos(jt * 5) * 0.3 * drift - rx * 0.4,
        z
      );
      camera.rotation.set(0, 0, Math.sin(jt * 4.5) * 0.28 * drift);

      // gyroscope: slides to centre, rings fan open, core shrinks so we pass through
      var center = s01(jt, 0, 0.14);
      world.rotation.y = ry * (1 - drift);
      world.rotation.x = rx * (1 - drift);
      spinBoost += (Math.abs(scrollVel) * 0.02 - spinBoost) * 0.1;
      gyro.position.x = base.x * (1 - center);
      gyro.position.y = (base.y + Math.sin(t * 0.9) * 0.08) * (1 - center);
      gyro.scale.setScalar(base.s + (1 - base.s) * center);
      gyro.rotation.y += dt * (0.15 + center * 0.5);
      gyro.rotation.z = 0;
      core.scale.setScalar(Math.max(0.001, 1 - s01(jt, 0.12, 0.24)));
      var fan = s01(jt, 0.03, 0.22);
      holders.forEach(function (o, i) {
        o.h.rotation.z += o.spin * dt * (1 + spinBoost * 3 + fan * 3);
        o.pivot.rotation.x = o.tilt[0] + Math.sin(t * 0.4 + i) * 0.12 + fan * (i % 2 ? 0.7 : -0.7);
        o.pivot.rotation.y = o.tilt[1] + fan * (i % 3 - 1) * 0.5;
      });
      shadow.material.opacity = vw < 900 ? 0 : (1 - s01(jt, 0, 0.06)) * 0.9;

      // tunnel + streaks fade in with the night
      tunnel.visible = jt > 0.08;
      tunnel.children.forEach(function (h) { h.rotation.z += h.userData.spin * dt * (1 + spinBoost * 2); });
      streaks.material.opacity = dark * 0.9;
      streaks.rotation.z += dt * 0.05;
      scene.fog.near = 200 - 197 * dark;
      scene.fog.far = 400 - 372 * dark;

      renderer.render(scene, camera);
    }
  }
})();

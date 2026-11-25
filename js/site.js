/* Formwork — site behaviour. Vanilla JS, no libraries. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var still = function () { return reduce.matches || doc.classList.contains("paused"); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- menu ---------- */
  var btn = $(".menu-btn"), menu = $("#menu");
  if (btn && menu) {
    var setOpen = function (open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("open", open);
      if (open) { var f = $("a", menu); if (f) f.focus(); }
    };
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) { setOpen(false); btn.focus(); }
      if (e.key === "Tab" && menu.classList.contains("open")) {
        var items = [btn].concat($$("a", menu)), first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    document.addEventListener("click", function (e) {
      if (menu.classList.contains("open") && !menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- nav variants: past the hero, over dark sections ---------- */
  var nav = $(".nav");
  if (nav) {
    var hero = $(".hero, .ihero");
    var darks = $$(".s--dark, .band");
    var tick = function () {
      var probe = 45;
      nav.classList.toggle("past", hero ? hero.getBoundingClientRect().bottom < 140 : window.scrollY > 300);
      var dark = darks.some(function (d) { var r = d.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; });
      nav.classList.toggle("on-dark", dark);
    };
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    tick();
  }

  /* ---------- motion pause control ---------- */
  var pause = $("#pause-motion");
  if (pause) {
    if (sessionStorage.getItem("fw-paused") === "1") doc.classList.add("paused");
    var label = function () {
      var p = doc.classList.contains("paused");
      pause.setAttribute("aria-pressed", p ? "true" : "false");
      pause.querySelector("span").textContent = p ? "Play motion" : "Pause motion";
    };
    label();
    pause.addEventListener("click", function () {
      doc.classList.toggle("paused");
      sessionStorage.setItem("fw-paused", doc.classList.contains("paused") ? "1" : "0");
      label();
      document.dispatchEvent(new Event("fw:motion"));
    });
  }

  /* ---------- 2-tone ordered dither on canvas ---------- */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var hex = function (h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; };
  function dither(fig) {
    var img = $("img", fig);
    if (!img || !img.complete || !img.naturalWidth) return;
    var w = fig.clientWidth, h = fig.clientHeight;
    if (!w || !h) return;
    var cell = parseFloat(fig.getAttribute("data-cell") || "2");
    var cw = Math.max(1, Math.round(w / cell)), ch = Math.max(1, Math.round(h / cell));
    var cv = $("canvas", fig);
    if (!cv) { cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true"); fig.appendChild(cv); }
    cv.width = cw; cv.height = ch;
    var ctx = cv.getContext("2d", { willReadFrequently: true });
    var s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) * 0.4, dw, dh);
    var tones = (fig.getAttribute("data-tones") || "#15181c,#eef0f2").split(",");
    var a = hex(tones[0]), b = hex(tones[1]);
    var contrast = parseFloat(fig.getAttribute("data-contrast") || "1.7");
    var bright = parseFloat(fig.getAttribute("data-bright") || "12");
    var data;
    try { data = ctx.getImageData(0, 0, cw, ch); } catch (e) { return; }
    var p = data.data;
    for (var y = 0; y < ch; y++) {
      for (var x = 0; x < cw; x++) {
        var i = (y * cw + x) * 4;
        var l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
        l = (l - 128) * contrast + 128 + bright;
        var t = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) * 16;
        var c = l > t ? b : a;
        p[i] = c[0]; p[i + 1] = c[1]; p[i + 2] = c[2]; p[i + 3] = 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    fig.classList.add("ready");
  }
  var figs = $$(".dither");
  var drawWhenReady = function (fig) {
    var img = $("img", fig);
    if (!img) return;
    if (img.complete && img.naturalWidth) dither(fig);
    else img.addEventListener("load", function () { dither(fig); }, { once: true });
  };
  if ("IntersectionObserver" in window) {
    var dio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { drawWhenReady(e.target); dio.unobserve(e.target); } });
    }, { rootMargin: "400px 0px" });
    figs.forEach(function (f) { dio.observe(f); });
  } else figs.forEach(drawWhenReady);
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { figs.forEach(function (f) { if (f.classList.contains("ready")) dither(f); }); }, 200);
  });
  window.FW_dither = dither;

  /* ---------- drifting dot field (generated, tileable) ---------- */
  var TW = 1600;
  function makeTile(H, seed) {
    var c = document.createElement("canvas");
    c.width = TW; c.height = H;
    var x2 = c.getContext("2d");
    x2.fillStyle = "#c3cad1";
    var k = function (n) { return 2 * Math.PI * n / TW; };
    for (var x = 0; x < TW; x += 4) {
      var top = H * (0.42 + 0.12 * Math.sin(k(2) * x + seed) + 0.07 * Math.sin(k(5) * x + seed * 2.3) + 0.04 * Math.sin(k(11) * x + 1.7));
      for (var y = 0; y < H; y += 4) {
        var depth = (y - top) / (H * 0.35);
        if (depth < -0.15) continue;
        var ridge = 0.5 + 0.5 * Math.sin(k(7) * x + y * 0.045 + Math.sin(k(3) * x + seed) * 2.2);
        var band = 0.5 + 0.5 * Math.sin(y * 0.11 + Math.sin(k(4) * x) * 3);
        var d = Math.min(1, Math.max(0, depth + 0.15)) * (0.25 + 0.55 * ridge * band + 0.2 * ridge);
        var t = (BAYER[((y >> 2) & 3) * 4 + ((x >> 2) & 3)] + 0.5) / 16;
        if (d > t) x2.fillRect(x, y, 2, 2);
      }
    }
    return c;
  }
  var fields = $$(".field");
  fields.forEach(function (box, n) {
    var cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    box.insertBefore(cv, box.firstChild);
    var tile = null, H = 0, off = n * 400, visible = false, last = 0;
    var size = function () {
      var w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      cv.width = w; cv.height = h;
      if (h !== H) { H = h; tile = makeTile(H, 1 + n * 0.9); }
      draw();
    };
    var draw = function () {
      if (!tile) return;
      var ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, cv.width, cv.height);
      var x = -(off % TW);
      while (x < cv.width) { ctx.drawImage(tile, Math.round(x), 0); x += TW; }
    };
    var running = false;
    var loop = function (t) {
      if (!visible || still()) { running = false; return; }
      if (last) off += (t - last) * 0.03;
      draw();
      last = t;
      requestAnimationFrame(loop);
    };
    var start = function () {
      if (running || !visible || still()) return;
      running = true; last = 0; requestAnimationFrame(loop);
    };
    size();
    window.addEventListener("resize", size);
    document.addEventListener("fw:motion", start);
    if (reduce.addEventListener) reduce.addEventListener("change", start);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        start();
      }).observe(box);
    }
  });

  /* ---------- hero entrance: headline words, then the diagram assembles ---------- */
  var h1 = $(".hero .h1");
  if (h1 && !reduce.matches) {
    var txt = h1.textContent.trim();
    h1.setAttribute("aria-label", txt);
    h1.innerHTML = txt.split(/\s+/).map(function (w, i) { return '<span class="w" aria-hidden="true" style="--i:' + i + '">' + w + "</span>"; }).join(" ");
    h1.classList.add("play-h1");
  }
  var dia = $(".dia");
  if (dia) requestAnimationFrame(function () { dia.classList.add("play"); });

  /* ---------- integrations orbit: nodes turn into place once ---------- */
  var orbit = $(".orbit");
  if (orbit) {
    var nodes = $$(".node", orbit);
    var svgNS = "http://www.w3.org/2000/svg";
    var wires = document.createElementNS(svgNS, "svg");
    wires.setAttribute("class", "wires");
    wires.setAttribute("aria-hidden", "true");
    orbit.insertBefore(wires, orbit.firstChild);
    var lines = nodes.map(function () { var l = document.createElementNS(svgNS, "line"); l.setAttribute("class", "wire"); wires.appendChild(l); return l; });
    var pts = [];
    for (var q = 0; q < 46; q++) {
      var c = document.createElementNS(svgNS, "circle");
      c.setAttribute("class", "pt" + (q % 9 === 0 ? " a" : q % 4 === 0 ? " d" : ""));
      c.setAttribute("r", (1 + (q * 7 % 5) * 0.6).toFixed(1));
      wires.appendChild(c);
      pts.push({ el: c, a: (q * 137.5) % 360, r: 0.35 + ((q * 53) % 100) / 100 * 0.9 });
    }
    var angles = nodes.map(function (n) { return parseFloat(n.getAttribute("data-a")); });
    var turn = 0;
    var layout = function () {
      var W = orbit.clientWidth, H = orbit.clientHeight, cx = W / 2, cy = H / 2;
      var narrow = W < 600;
      var rx = narrow ? W * 0.33 : Math.min(W * 0.3, 430), ry = narrow ? H * 0.38 : H * 0.36;
      wires.setAttribute("viewBox", "0 0 " + W + " " + H);
      nodes.forEach(function (n, i) {
        var a = (angles[i] + turn) * Math.PI / 180;
        var x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
        n.style.setProperty("--x", x + "px");
        n.style.setProperty("--y", y + "px");
        lines[i].setAttribute("x1", cx); lines[i].setAttribute("y1", cy);
        lines[i].setAttribute("x2", x); lines[i].setAttribute("y2", y);
      });
      pts.forEach(function (p) {
        var a = (p.a + turn * 0.5) * Math.PI / 180;
        p.el.setAttribute("cx", (cx + rx * p.r * Math.cos(a)).toFixed(1));
        p.el.setAttribute("cy", (cy + ry * p.r * 1.1 * Math.sin(a)).toFixed(1));
      });
    };
    layout();
    window.addEventListener("resize", layout);
    if (!reduce.matches && "IntersectionObserver" in window) {
      turn = 90; layout();
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        var t0 = null, D = 2200;
        var step = function (t) {
          if (t0 === null) t0 = t + 250;
          var k = Math.min(1, Math.max(0, (t - t0) / D));
          var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          turn = 90 * (1 - e); layout();
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.3 });
      io.observe(orbit);
    }
  }

  /* ---------- sliders (cases, voices) ---------- */
  $$("[data-slider]").forEach(function (root) {
    var slides = $$("[data-slide]", root);
    var prev = $(".arw--prev", root), next = $(".arw--next", root);
    var i = 0, n = slides.length;
    var row = $$(".vo-row .dither", root);
    var show = function (k) {
      i = Math.max(0, Math.min(n - 1, k));
      slides.forEach(function (s, j) {
        var on = j === i;
        s.classList.toggle("on", on);
        s.setAttribute("aria-hidden", on ? "false" : "true");
        if ("inert" in s) s.inert = !on;
        if (on) $$(".dither", s).forEach(function (f) { drawWhenReady(f); });
      });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === n - 1;
      row.forEach(function (f, j) { f.classList.toggle("is-current", j === i); });
      var live = $("[data-live]", root);
      if (live) live.textContent = (i + 1) + " of " + n;
    };
    if (prev) prev.addEventListener("click", function () { show(i - 1); });
    if (next) next.addEventListener("click", function () { show(i + 1); });
    show(0);
  });

  /* ---------- FAQ accordion ---------- */
  $$(".qa button").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.closest(".qa").classList.toggle("open", open);
    });
  });

  /* ---------- work index: preview follows the hovered or focused row ---------- */
  var idx = $(".idx");
  if (idx) {
    var fig = $(".idx-fig", idx), img = $("img", fig);
    var fields2 = { one: $("[data-k=one]", idx), p: $("[data-k=p]", idx), b: $("[data-k=b]", idx), r: $("[data-k=r]", idx) };
    var rows = $$(".idx-row", idx);
    var pick = function (row) {
      if (row.classList.contains("on")) return;
      rows.forEach(function (r) {
        r.classList.toggle("on", r === row);
        if (r.tagName === "BUTTON") r.setAttribute("aria-pressed", r === row ? "true" : "false");
      });
      Object.keys(fields2).forEach(function (k) { if (fields2[k]) fields2[k].textContent = row.getAttribute("data-" + k); });
      fig.setAttribute("data-tones", row.getAttribute("data-tones") || "#15181c,#eef0f2");
      img.alt = row.getAttribute("data-alt");
      var src = row.getAttribute("data-img");
      if (img.getAttribute("src") !== src) {
        img.onload = function () { dither(fig); };
        img.src = src;
      } else dither(fig);
    };
    rows.forEach(function (r) {
      r.addEventListener("pointerenter", function () { pick(r); });
      r.addEventListener("focus", function () { pick(r); });
      r.addEventListener("click", function () { pick(r); });
    });
  }

  /* ---------- forms ---------- */
  var params = new URLSearchParams(location.search);
  /* footer mini form: carry name and email to the contact form without putting them in the URL */
  $$("form.mini").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      try { sessionStorage.setItem("fw-prefill", JSON.stringify({ name: f.elements.name.value, email: f.elements.email.value })); } catch (err) {}
      location.href = f.getAttribute("action");
    });
  });
  var form = $("#contact-form");
  if (form) {
    var pre = null;
    try { pre = JSON.parse(sessionStorage.getItem("fw-prefill") || "null"); sessionStorage.removeItem("fw-prefill"); } catch (err) {}
    ["name", "email"].forEach(function (k) {
      var v = (pre && pre[k]) || params.get(k);
      if (v && form.elements[k]) form.elements[k].value = v;
    });
    var plan = params.get("plan");
    var planText = { assess: "Plan: Assess. ", build: "Plan: Build. ", operate: "Plan: Operate. " };
    if (plan && planText[plan] && !form.elements.process.value) form.elements.process.value = planText[plan];
    if (params.has("name") || params.has("email")) history.replaceState(null, "", location.pathname + (plan ? "?plan=" + encodeURIComponent(plan) : ""));
    var msgs = {
      name: function (v) { return v ? "" : "Enter your name."; },
      email: function (v) { return !v ? "Enter your work email." : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Check the email address. It should look like name@company.com."); },
      company: function (v) { return v ? "" : "Enter your company name."; },
      team: function (v) { return v ? "" : "Choose a team."; },
      process: function (v) { return !v ? "Describe the process in a sentence or two." : (v.length < 20 ? "Add a little more detail. 20 characters or more." : ""); }
    };
    var check = function (name) {
      var el = form.elements[name], msg = msgs[name](el.value.trim());
      var wrap = el.closest(".fld"), err = $(".err", wrap);
      err.textContent = msg;
      wrap.classList.toggle("bad", !!msg);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };
    Object.keys(msgs).forEach(function (n) {
      form.elements[n].addEventListener("blur", function () { if (form.elements[n].value) check(n); });
    });
    var sum = $(".fsum", form), banner = $(".fbanner", form), send = $("button[type=submit]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      banner.hidden = true;
      var bad = Object.keys(msgs).filter(function (n) { return !check(n); });
      if (bad.length) {
        sum.textContent = "Fix " + bad.length + (bad.length === 1 ? " field" : " fields") + " to send your request.";
        form.elements[bad[0]].focus();
        return;
      }
      sum.textContent = "";
      send.disabled = true;
      $("span", send).textContent = "Sending…";
      setTimeout(function () {
        send.disabled = false;
        $("span", send).textContent = "Send request";
        if (params.get("demo") === "error") { banner.hidden = false; banner.focus(); return; }
        var done = $("#form-done");
        form.hidden = true;
        done.hidden = false;
        $("h2", done).focus();
      }, 900);
    });
  }
})();

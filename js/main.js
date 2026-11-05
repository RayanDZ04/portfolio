/* Rayan Benhabiles - portfolio interactions (vanilla JS, aucune dépendance) */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dict = window.I18N;

  /* ------------------------------------------------------------------ i18n */
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || localStorage.getItem("lang") ||
             ((navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en");
  if (!dict[lang]) lang = "fr";
  const t = (k) => (dict[lang][k] ?? dict.fr[k] ?? k);

  function applyLang(next, animate) {
    const run = () => {
      lang = next;
      document.documentElement.lang = lang;
      document.title = t("meta.title");
      $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
      $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
      $$("[data-i18n-label]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nLabel)));
      $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
      $(".lang").dataset.active = lang;
      $("#cvLink").href = t("cv");
      localStorage.setItem("lang", lang);
      typeTerminal();
      positionInk();
      renderSkillResult();
    };
    if (!animate || reduced) return run();
    document.body.classList.add("is-switching");
    setTimeout(() => { run(); document.body.classList.remove("is-switching"); }, 170);
  }
  $$(".lang button").forEach((b) => b.addEventListener("click", () => b.dataset.lang !== lang && applyLang(b.dataset.lang, true)));

  /* ------------------------------------------------------- terminal typing */
  let typingToken = 0;
  async function typeTerminal() {
    const out = $("#typed");
    const token = ++typingToken;
    const lines = t("terminal");
    out.innerHTML = "";
    if (reduced) {
      out.innerHTML = lines.map(([c, s]) => `<span class="${c}">${esc(s)}</span>`).join("\n");
      return;
    }
    for (const [cls, text] of lines) {
      const span = document.createElement("span");
      if (cls) span.className = cls;
      out.appendChild(span);
      const fast = !text.startsWith("$");
      for (const ch of text) {
        if (token !== typingToken) return;
        span.textContent += ch;
        await wait(fast ? 8 : 38 + Math.random() * 40);
      }
      out.appendChild(document.createTextNode("\n"));
      await wait(text.startsWith("$") ? 260 : 120);
    }
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

  /* ----------------------------------------------------- hero name split */
  let ci = 0;
  $$(".hero-name .split").forEach((el) => {
    el.innerHTML = [...el.textContent].map((ch) => `<span class="char" style="--i:${ci++}">${ch}</span>`).join("");
  });

  /* --------------------------------------------------------------- loader */
  document.body.classList.add("is-loading");
  const start = performance.now();
  // L'intro ne se joue qu'une fois par session ; elle n'attend pas les images.
  const seen = sessionStorage.getItem("introSeen");
  const minIntro = reduced || seen ? 0 : 1250;
  const ready = () => {
    if (document.body.classList.contains("is-ready")) return;
    setTimeout(() => {
      $(".loader").classList.add("is-done");
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-ready");
      sessionStorage.setItem("introSeen", "1");
    }, Math.max(0, minIntro - (performance.now() - start)));
  };
  (document.fonts?.ready || Promise.resolve()).then(ready);
  setTimeout(ready, 1800); // filet de sécurité si les polices tardent

  /* --------------------------------------------------------------- reveal */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .section-head h2, .about-card, .tl-item, .project").forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", `${Math.min(i, 6) * 70}ms`);
    io.observe(el);
  });

  /* ------------------------------------------------------------- counters */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, dur = reduced ? 0 : 1400, t0 = performance.now();
      const step = (now) => {
        const p = dur ? Math.min(1, (now - t0) / dur) : 1;
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* --------------------------------------- nav: scrolled, progress, spy */
  const nav = $(".nav"), bar = $(".progress"), tl = $(".timeline");
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("is-scrolled", y > 20);
      bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
      const r = tl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
      tl.style.setProperty("--tl", p.toFixed(3));
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = $$(".nav-links a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => {
        const on = a.getAttribute("href") === `#${e.target.id}`;
        a.classList.toggle("is-active", on);
        on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => spy.observe(s));

  /* ---------------------------------------------------------- mobile menu */
  const burger = $(".burger"), menu = $(".nav-links");
  const closeMenu = () => { menu.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); };
  burger.addEventListener("click", () => {
    const open = !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  links.forEach((a) => a.addEventListener("click", closeMenu));
  addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

  /* --------------------------------------------------------------- cursor */
  const cursor = $(".cursor");
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduced) {
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; cursor.classList.add("is-visible"); }, { passive: true });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
    document.addEventListener("mouseover", (e) => {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, [data-zoom], input, label"));
    });
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------------------------------------------------- project filters */
  const projects = $$(".project");
  $$(".filters .chip").forEach((chip) => chip.addEventListener("click", () => {
    $$(".filters .chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    const f = chip.dataset.filter;
    projects.forEach((p) => {
      const tags = p.dataset.tags.split(" ");
      const show = f === "all" || tags.includes(f) || (f === "python" && tags.includes("data"));
      p.classList.toggle("is-hidden", !show);
      if (show) { p.classList.add("is-in"); p.animate?.([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: reduced ? 0 : 420, easing: "cubic-bezier(.16,1,.3,1)" }); }
    });
  }));

  /* ------------------------------------------------- skills cross-links */
  const NAMES = { "p-tikiya": "Tikiya", "p-os": "Rust OS", "p-area": "AREA", "p-crest": "Crest", "p-game": "Rick 7533" };
  let activeSkill = null;
  $$(".skill-chips button").forEach((b) => {
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      const same = activeSkill === b;
      $$(".skill-chips button").forEach((x) => x.setAttribute("aria-pressed", "false"));
      activeSkill = same ? null : b;
      if (activeSkill) b.setAttribute("aria-pressed", "true");
      renderSkillResult();
    });
  });
  function renderSkillResult() {
    const box = $("#skillResult");
    if (!activeSkill) { box.innerHTML = ""; return; }
    const sk = activeSkill.dataset.skill;
    const hits = projects.filter((p) => p.dataset.tags.split(" ").includes(sk));
    const exp = $$(".tl-item[data-tags]").filter((li) => li.dataset.tags.split(" ").includes(sk));
    if (!hits.length && !exp.length) { box.textContent = t("skills.none"); return; }
    box.innerHTML = `<span>${t("skills.usedIn")}</span>` +
      hits.map((p, i) => `<a href="#${p.id}" style="animation-delay:${i * 50}ms">${NAMES[p.id]}</a>`).join("") +
      exp.map((li, i) => `<a href="#experience" style="animation-delay:${(hits.length + i) * 50}ms">${li.querySelector("h3").textContent.split(",")[0].trim()}</a>`).join("");
  }
  $("#skillResult").addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#p-']");
    if (!a) return;
    const target = $(a.getAttribute("href"));
    $$(".filters .chip")[0].click();
    setTimeout(() => target.animate?.([{ boxShadow: "0 0 0 0 rgba(115,119,181,.6)" }, { boxShadow: "0 0 0 14px rgba(115,119,181,0)" }], { duration: 900, delay: 500 }), 0);
  });

  /* ----------------------------------------------------------------- tabs */
  const tabs = $$(".tabs [role=tab]"), ink = $(".tab-ink");
  function positionInk() {
    const sel = tabs.find((x) => x.getAttribute("aria-selected") === "true");
    if (!sel) return;
    ink.style.width = `${sel.offsetWidth}px`;
    ink.style.transform = `translateX(${sel.offsetLeft}px)`;
  }
  function selectTab(tab, focus) {
    tabs.forEach((x) => {
      const on = x === tab;
      x.setAttribute("aria-selected", String(on));
      x.tabIndex = on ? 0 : -1;
      $(`#${x.getAttribute("aria-controls")}`).hidden = !on;
    });
    if (focus) tab.focus();
    positionInk();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  addEventListener("resize", positionInk);
  document.fonts?.ready.then(positionInk);

  /* ----------------------------------------- live Flutter app in phone */
  $("#launchApp").addEventListener("click", () => {
    const f = document.createElement("iframe");
    f.title = "Tikiya - Flutter web";
    f.src = "projects/tikiya-app/index.html";
    f.setAttribute("allow", "clipboard-write");
    $("#phoneScreen").replaceChildren(f);
  });

  /* ---------------------------------------- adaptive scheduler simulation */
  (() => {
    const cv = $("#schedCanvas"), ctx = cv.getContext("2d"), range = $("#load"), out = $("#loadOut"), mode = $("#schedMode");
    const W = cv.width, H = cv.height, ROWS = 6, LEFT = 74, COLS = 56, cw = (W - LEFT - 8) / COLS, rh = (H - 34) / ROWS;
    const COLORS = ["#a6aaf0", "#7377b5", "#6be3a0", "#ffc66b", "#ff8fa3", "#7fd3ff"];
    const tasks = [
      { n: "irq", p: 3 }, { n: "shell", p: 2 }, { n: "fs", p: 2 }, { n: "net", p: 1 }, { n: "log", p: 0 }, { n: "idle", p: 0 },
    ];
    let grid = [], cur = 0, left = 0, rr = 0;
    const load = () => +range.value;
    function pick() {
      const runnable = Math.max(1, Math.ceil((load() / 100) * ROWS));
      const set = tasks.slice(0, runnable).map((x, i) => ({ ...x, i }));
      if (load() < 55) { // round-robin, quantum fixe
        mode.textContent = "round-robin · q=3";
        rr = (rr + 1) % set.length; return { i: set[rr].i, q: 3 };
      }
      // adaptatif : quantum proportionnel à la priorité, tirage pondéré
      mode.textContent = "adaptive · q∝prio";
      const w = set.map((x) => x.p + 1), tot = w.reduce((a, b) => a + b, 0);
      let r = Math.random() * tot, k = 0;
      while ((r -= w[k]) > 0) k++;
      return { i: set[k].i, q: 1 + set[k].p * 2 };
    }
    function step() {
      if (left <= 0) { const s = pick(); cur = s.i; left = s.q; }
      left--;
      grid.push(cur);
      if (grid.length > COLS) grid.shift();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = "12px JetBrains Mono, monospace";
      const runnable = Math.max(1, Math.ceil((load() / 100) * ROWS));
      tasks.forEach((tk, r) => {
        const y = 6 + r * rh;
        ctx.fillStyle = r < runnable ? "#cfd2f6" : "#4a4d78";
        ctx.fillText(`${tk.n}`, 4, y + rh / 2 + 4);
        ctx.fillStyle = "#16182e"; ctx.fillRect(LEFT, y + 3, W - LEFT - 8, rh - 6);
      });
      grid.forEach((row, c) => {
        const x = LEFT + c * cw, y = 6 + row * rh;
        ctx.globalAlpha = 0.35 + 0.65 * (c / grid.length);
        ctx.fillStyle = COLORS[row];
        ctx.fillRect(x + 1, y + 5, cw - 2, rh - 10);
      });
      ctx.globalAlpha = 1;
      const used = grid.filter((r) => r !== 5).length / Math.max(1, grid.length);
      ctx.fillStyle = "#9da0c8"; ctx.fillText("cpu", 4, H - 10);
      ctx.fillStyle = "#16182e"; ctx.fillRect(LEFT, H - 20, W - LEFT - 8, 8);
      ctx.fillStyle = "#6be3a0"; ctx.fillRect(LEFT, H - 20, (W - LEFT - 8) * used, 8);
    }
    function syncRange() { out.textContent = `${load()}%`; range.style.setProperty("--fill", `${((load() - 5) / 95) * 100}%`); }
    range.addEventListener("input", syncRange);
    syncRange();
    for (let i = 0; i < COLS; i++) step();
    draw();
    if (reduced) return;
    let visible = false, last = 0;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(cv);
    const loop = (now) => {
      if (visible && now - last > 110) { step(); draw(); last = now; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  })();

  /* ------------------------------------------------------- Rick gallery */
  const rickMain = $("#rickMain"), rickVideo = $("#rickVideo"), rickToggle = $("#rickToggle");
  const thumbs = $$("#rickGallery .gallery-thumbs button");
  let userPaused = reduced;
  const setPlaying = (on) => {
    if (on) rickVideo.play().catch(() => {}); else rickVideo.pause();
    rickToggle.classList.toggle("is-paused", !on);
    rickToggle.setAttribute("aria-label", on ? "Pause" : "Play");
  };
  setPlaying(false);
  // lecture auto uniquement quand la vidéo est à l'écran
  new IntersectionObserver((e) => {
    if (rickVideo.hidden) return;
    setPlaying(e[0].isIntersecting && !userPaused);
  }, { threshold: 0.35 }).observe(rickVideo);
  rickToggle.addEventListener("click", () => { userPaused = !rickVideo.paused; setPlaying(!userPaused); });
  const fade = (el) => (reduced || !el.animate) ? null :
    el.animate([{ opacity: 0, transform: "scale(1.02)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
  thumbs.forEach((b) => b.addEventListener("click", () => {
    if (b.getAttribute("aria-pressed") === "true") return;
    thumbs.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const isVideo = b.hasAttribute("data-video");
    rickVideo.hidden = rickToggle.hidden = !isVideo;
    rickMain.hidden = isVideo;
    if (isVideo) { setPlaying(!userPaused); fade(rickVideo); return; }
    rickVideo.pause();
    rickMain.src = b.dataset.src; rickMain.alt = t(b.dataset.altKey);
    rickMain.decode().catch(() => {}).then(() => fade(rickMain));
  }));

  /* ------------------------------------------------------------ lightbox */
  const lb = $("#lightbox");
  $$("[data-zoom]").forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    const open = () => { const i = $("img", lb); i.src = img.currentSrc || img.src; i.alt = img.alt; lb.showModal(); };
    img.addEventListener("click", open);
    img.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
  });
  $$("dialog").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });

  /* ---------------------------------------------------------- copy email */
  const toast = $(".toast");
  let toastTimer;
  $("#copyEmail").addEventListener("click", async (e) => {
    const email = e.currentTarget.dataset.email;
    try { await navigator.clipboard.writeText(email); } catch { location.href = `mailto:${email}`; return; }
    toast.textContent = t("contact.copied");
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 3000);
  });

  applyLang(lang, false);
})();

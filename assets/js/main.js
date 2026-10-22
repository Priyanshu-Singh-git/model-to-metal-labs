/* M2M Labs (Model2Metal) — site behaviour, both themes */

// ---------------------------------------------------------------------------
// Settings — edit these two values before deploying.
// ---------------------------------------------------------------------------
const CONFIG = {
  // Where enquiries arrive. Used for the mailto fallback.
  contactEmail: "singhpriyaanshu308@gmail.com",
  // Free form endpoint (Formspree, e.g. "https://formspree.io/f/abcdwxyz").
  // Leave empty to fall back to opening the visitor's email app.
  formEndpoint: "",
};

const root = document.documentElement;
root.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------------------
// Headings set "&" in a serif italic, the way the light theme's type does
// ---------------------------------------------------------------------------
document.querySelectorAll(".duo span, h3, .sub-title").forEach((el) => {
  if (el.children.length === 0 && el.textContent.includes("&")) {
    el.innerHTML = el.innerHTML.replace(/&amp;/g, '<span class="amp">&amp;</span>');
  }
});

// ---------------------------------------------------------------------------
// Dark theme background: drifting stars at three depths, a warm glow that eases
// after the pointer, and stars that brighten and step aside near it.
// Runs only while the dark theme is on.
// ---------------------------------------------------------------------------
const sky = (() => {
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const GLOW = [201, 164, 106]; // brass accent
  let w = 0, h = 0, dpr = 1, stars = [], raf = 0, t = 0, on = false, ready = false;

  const target = { x: 0, y: 0, active: false };
  const glow = { x: 0, y: 0 };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(160, (w * h) / 9000));
    stars = Array.from({ length: count }, () => {
      const depth = Math.random() < .55 ? 1 : Math.random() < .7 ? 2 : 3; // 1 far … 3 near
      return {
        x: Math.random() * w, y: Math.random() * h,
        depth,
        r: depth * .45 + Math.random() * .5,
        vy: -(.04 + Math.random() * .06) * depth,
        vx: (Math.random() - .5) * .03 * depth,
        phase: Math.random() * Math.PI * 2,
        speed: .6 + Math.random() * 1.4,
        ox: 0, oy: 0,
      };
    });
    if (!target.active) { target.x = glow.x = w * .7; target.y = glow.y = h * .3; }
  };

  const draw = () => {
    t += 1 / 60;
    ctx.clearRect(0, 0, w, h);
    if (!finePointer && !target.active) {
      target.x = w * (.5 + .35 * Math.sin(t * .13));
      target.y = h * (.4 + .25 * Math.sin(t * .09 + 1));
    }
    glow.x += (target.x - glow.x) * .06;
    glow.y += (target.y - glow.y) * .06;

    const R = Math.min(Math.max(w, h) * .38, 520);
    const g = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, R);
    g.addColorStop(0, `rgba(${GLOW}, .34)`);
    g.addColorStop(.18, `rgba(${GLOW}, .18)`);
    g.addColorStop(.5, `rgba(${GLOW}, .07)`);
    g.addColorStop(1, `rgba(${GLOW}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const px = (glow.x / w - .5), py = (glow.y / h - .5);
    for (const s of stars) {
      s.x += s.vx; s.y += s.vy;
      if (s.y < -10) { s.y = h + 10; s.x = Math.random() * w; }
      if (s.x < -10) s.x = w + 10; else if (s.x > w + 10) s.x = -10;
      const sx = s.x - px * s.depth * 14;
      const sy = s.y - py * s.depth * 14;
      const dx = sx - glow.x, dy = sy - glow.y;
      const dist = Math.hypot(dx, dy) || 1;
      const near = Math.max(0, 1 - dist / 220);
      s.ox += ((dx / dist) * near * 18 * s.depth / 3 - s.ox) * .08;
      s.oy += ((dy / dist) * near * 18 * s.depth / 3 - s.oy) * .08;
      const twinkle = .55 + .45 * Math.sin(t * s.speed + s.phase);
      const a = Math.min(1, (.18 + s.depth * .14) * twinkle + near * .7);
      ctx.fillStyle = near > .05 ? `rgba(255, ${Math.round(255 - near * 30)}, ${Math.round(255 - near * 90)}, ${a})` : `rgba(255, 255, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(sx + s.ox, sy + s.oy, s.r + near * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const loop = () => { draw(); raf = requestAnimationFrame(loop); };

  const init = () => {
    ready = true;
    resize();
    window.addEventListener("resize", () => { resize(); if (on && reduceMotion) draw(); });
    window.addEventListener("pointermove", (e) => {
      target.x = e.clientX; target.y = e.clientY; target.active = true;
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      if (on && !document.hidden && !reduceMotion) loop();
    });
  };

  return {
    start() {
      if (!ready) init();
      if (on) return;
      on = true;
      if (reduceMotion) draw(); else loop();
    },
    stop() {
      on = false;
      cancelAnimationFrame(raf);
    },
  };
})();

// ---------------------------------------------------------------------------
// The name across the top: letters rise in, and the size is fitted so the
// line runs the full width of the page
// ---------------------------------------------------------------------------
const bigname = (() => {
  const name = document.getElementById("bigname");
  let i = 0;
  name.querySelectorAll(".word").forEach((word) => {
    word.setAttribute("aria-hidden", "true");
    word.innerHTML = [...word.textContent]
      .map((c) => `<span class="clip"><span class="ch" style="--i:${i++}">${c}</span></span>`)
      .join("");
  });

  const fit = () => {
    name.style.fontSize = "100px";
    const span = (clips) => clips[clips.length - 1].getBoundingClientRect().right - clips[0].getBoundingClientRect().left;
    const words = [...name.querySelectorAll(".word")];
    const stacked = getComputedStyle(words[0]).display === "block";
    const lineWidth = stacked
      ? Math.max(...words.map((w) => span([...w.querySelectorAll(".clip")])))
      : span([...name.querySelectorAll(".clip")]);
    const target = name.clientWidth;
    name.style.fontSize = `${Math.floor(100 * target / lineWidth * 0.995)}px`;
  };

  // Play the letters' rise again, one after another, like a wave
  const replay = () => {
    name.querySelectorAll(".ch").forEach((ch) => { ch.style.animation = "none"; });
    void name.offsetWidth;
    name.querySelectorAll(".ch").forEach((ch) => { ch.style.animation = ""; });
  };

  fit();
  document.fonts?.ready.then(fit);
  document.fonts?.addEventListener?.("loadingdone", fit); // a theme's face arriving late
  window.addEventListener("resize", fit);
  return { fit, replay };
})();

// ---------------------------------------------------------------------------
// Themes: light (cream and coral) and dark. The switch spreads the new theme
// out from the button as a soft wave while the main pieces glide into place.
// ---------------------------------------------------------------------------
(() => {
  const THEMES = {
    light: { color: "#F6F2EA", icon: "assets/favicon.svg", next: "dark" },
    dark: { color: "#151312", icon: "assets/favicon-dark.svg", next: "light" },
  };
  const themeColor = document.getElementById("themeColor");
  const favicon = document.getElementById("favicon");
  const toggles = [...document.querySelectorAll("[data-theme-toggle]")];

  // Both themes' display faces, so the switch never measures a fallback font
  const fontsLoaded = Promise.all([
    '700 100px "Oswald"', '400 16px "Outfit"', '700 100px "Funnel Sans"', '400 16px "Poppins"', '700 16px "Poppins"',
  ].map((f) => document.fonts?.load(f).catch(() => null))).catch(() => null);

  const reflect = (theme) => {
    const t = THEMES[theme];
    themeColor.setAttribute("content", t.color);
    favicon.setAttribute("href", t.icon);
    toggles.forEach((b) => {
      const label = `Switch to ${t.next} theme`;
      b.setAttribute("aria-label", label);
      if (b.hasAttribute("data-tip")) b.setAttribute("data-tip", t.next === "light" ? "Light theme" : "Dark theme");
    });
    if (theme === "dark") sky.start(); else sky.stop();
  };

  const apply = (theme) => {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("m2m-theme", theme); } catch (e) { /* private mode */ }
    reflect(theme);
    bigname.fit();
    bigname.replay();
  };

  // Never hold the switch for slow fonts: wait at most 0.6s, refit when they land
  const fontsOrTimeout = () => Promise.race([fontsLoaded, new Promise((r) => setTimeout(r, 600))]);
  let busy = false;

  const switchTheme = (button) => {
    if (busy) return; // let one switch finish before the next
    const next = THEMES[root.getAttribute("data-theme")]?.next || "dark";

    if (reduceMotion) { apply(next); return; }

    if (!document.startViewTransition) {
      root.classList.add("theme-fade");
      apply(next);
      setTimeout(() => root.classList.remove("theme-fade"), 750);
      return;
    }

    // The wave starts at the button and reaches the farthest corner
    const r = button.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 200;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-end", `${end}px`);

    busy = true;
    root.classList.add("theme-anim");
    const vt = document.startViewTransition(async () => {
      await fontsOrTimeout();
      apply(next);
    });
    vt.finished.catch(() => {}).finally(() => { root.classList.remove("theme-anim"); busy = false; });
  };

  toggles.forEach((b) => b.addEventListener("click", () => switchTheme(b)));
  reflect(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
})();

// ---------------------------------------------------------------------------
// Lens: a disc on the pointer that inverts whatever is under it
// ---------------------------------------------------------------------------
(() => {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const lens = document.getElementById("lens");
  let x = 0, y = 0, lx = 0, ly = 0, running = false;
  const step = () => {
    lx += (x - lx) * (reduceMotion ? 1 : .3);
    ly += (y - ly) * (reduceMotion ? 1 : .3);
    lens.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
    running = Math.abs(x - lx) > .1 || Math.abs(y - ly) > .1;
    if (running) requestAnimationFrame(step);
  };
  window.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    if (!lens.classList.contains("on")) { lx = x; ly = y; lens.classList.add("on"); }
    if (!running) { running = true; requestAnimationFrame(step); }
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => lens.classList.remove("on"));
  // Photos stay untouched: the lens hides while the pointer is over one
  document.addEventListener("pointerover", (e) => {
    lens.classList.toggle("off", !!e.target.closest("img, picture, .profile-photo, .project-thumb, .demo-thumb"));
  });
})();

// ---------------------------------------------------------------------------
// Dock (dark theme): highlight the section on screen
// ---------------------------------------------------------------------------
const dockLinks = [...document.querySelectorAll("#dock a")];
const dockTargets = dockLinks
  .map((a) => [a, a.getAttribute("href") === "#top" ? document.getElementById("home") : document.querySelector(a.getAttribute("href"))])
  .filter(([, el]) => el);
const dockObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    dockTargets.forEach(([a, el]) => a.classList.toggle("active", el === entry.target));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
dockTargets.forEach(([, el]) => dockObserver.observe(el));
const homeAtTop = () => {
  if (window.scrollY < 200) dockLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#top"));
};
window.addEventListener("scroll", homeAtTop, { passive: true });
homeAtTop();

// ---------------------------------------------------------------------------
// Reveal on scroll, staggered within each group
// ---------------------------------------------------------------------------
const revealEls = document.querySelectorAll(".reveal");
revealEls.forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.07}s`);
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
revealEls.forEach((el) => revealObserver.observe(el));

// A jump (nav link, fast fling) can skip past elements without them ever intersecting;
// reveal anything that is already above the bottom of the screen.
let revealQueued = false;
const revealPassed = () => {
  revealQueued = false;
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("in");
      revealObserver.unobserve(el);
    }
  });
};
window.addEventListener("scroll", () => {
  if (!revealQueued) { revealQueued = true; requestAnimationFrame(revealPassed); }
}, { passive: true });

// ---------------------------------------------------------------------------
// Process track: the line fills from Model to Metal as the section scrolls by
// ---------------------------------------------------------------------------
const track = document.getElementById("track");
const trackStops = [...track.querySelectorAll(".track-stops li")];
const vertical = window.matchMedia("(max-width: 600px)");
const setTrack = (p) => {
  track.style.setProperty("--p", p.toFixed(3));
  trackStops.forEach((li, i) => li.classList.toggle("on", p >= (vertical.matches ? i / trackStops.length : i / (trackStops.length - 1) * 0.75) + 0.02));
};
if (reduceMotion) {
  setTrack(1);
} else {
  let trackQueued = false;
  const updateTrack = () => {
    trackQueued = false;
    const r = track.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = vertical.matches ? (vh * 0.7 - r.top) / r.height : (vh * 0.85 - r.top) / (vh * 0.45);
    setTrack(Math.min(Math.max(p, 0), 1));
  };
  window.addEventListener("scroll", () => {
    if (!trackQueued) { trackQueued = true; requestAnimationFrame(updateTrack); }
  }, { passive: true });
  window.addEventListener("resize", updateTrack);
  updateTrack();
}

// ---------------------------------------------------------------------------
// Contact form: posts to formEndpoint if set, otherwise opens an email draft
// ---------------------------------------------------------------------------
const form = document.getElementById("contactForm");
const note = document.getElementById("formNote");

const setNote = (text, kind) => {
  note.textContent = text;
  note.className = "form-note field-wide" + (kind ? " " + kind : "");
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let valid = true;
  form.querySelectorAll("[required]").forEach((input) => {
    const ok = input.value.trim() !== "" && (input.type !== "email" || /^\S+@\S+\.\S+$/.test(input.value.trim()));
    input.closest(".field").classList.toggle("invalid", !ok);
    if (!ok) valid = false;
  });
  if (!valid) { setNote("Please fill in your name, a valid email, a project type and a short message.", "err"); return; }

  const data = Object.fromEntries(new FormData(form));

  if (!CONFIG.formEndpoint) {
    const subject = encodeURIComponent(`Project enquiry: ${data.type}`);
    const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
    window.location.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;
    setNote("Opening your email app with the message ready to send.", "ok");
    return;
  }

  const button = form.querySelector("button[type=submit], .submit");
  button.disabled = true;
  setNote("Sending…");
  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...data, _subject: `Project enquiry: ${data.type}` }),
    });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    setNote("Thanks. Your message is in, and you'll hear back within a day.", "ok");
  } catch {
    setNote(`Something went wrong. Please email ${CONFIG.contactEmail} directly.`, "err");
  } finally {
    button.disabled = false;
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

/* M2M Labs (Model to Metal) — site behaviour */

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

document.documentElement.classList.add("js");

// ---------------------------------------------------------------------------
// Background: drifting stars at three depths, a warm glow that eases after the
// pointer, and stars that brighten and step aside near it
// ---------------------------------------------------------------------------
(() => {
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const GLOW = [201, 164, 106]; // --accent (brass)
  let w = 0, h = 0, dpr = 1, stars = [], raf = 0, t = 0;

  // Where the pointer is (target) and where the glow is drawn (eased towards it)
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
        vy: -(.04 + Math.random() * .06) * depth, // slow upward drift, nearer is faster
        vx: (Math.random() - .5) * .03 * depth,
        phase: Math.random() * Math.PI * 2,
        speed: .6 + Math.random() * 1.4,
        ox: 0, oy: 0, // push away from the glow
      };
    });
    if (!target.active) { target.x = glow.x = w * .7; target.y = glow.y = h * .3; }
  };

  const draw = () => {
    t += 1 / 60;
    ctx.clearRect(0, 0, w, h);

    // On touch screens the glow wanders slowly until a finger moves it
    if (!finePointer && !target.active) {
      target.x = w * (.5 + .35 * Math.sin(t * .13));
      target.y = h * (.4 + .25 * Math.sin(t * .09 + 1));
    }
    glow.x += (target.x - glow.x) * .06;
    glow.y += (target.y - glow.y) * .06;

    // The glow: a soft warm light, wide and faint, with a brighter core
    const R = Math.min(Math.max(w, h) * .38, 520);
    const g = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, R);
    g.addColorStop(0, `rgba(${GLOW}, .34)`);
    g.addColorStop(.18, `rgba(${GLOW}, .18)`);
    g.addColorStop(.5, `rgba(${GLOW}, .07)`);
    g.addColorStop(1, `rgba(${GLOW}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Parallax: near stars shift further against the pointer than far ones
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

  resize();
  window.addEventListener("resize", () => { resize(); if (still) draw(); });

  if (still) { draw(); return; }

  window.addEventListener("pointermove", (e) => {
    target.x = e.clientX; target.y = e.clientY; target.active = true;
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) loop();
  });
  loop();
})();

// ---------------------------------------------------------------------------
// Dock: highlight the section on screen
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
// On phones the profile card sits above the hero, so the top of the page counts as Home.
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

// A jump (dock link, fast fling) can skip past elements without them ever intersecting;
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
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    // Horizontal: fill while the track moves through the middle of the screen.
    // Vertical: fill in step with how much of the list has passed the 70% line.
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

  const button = form.querySelector("button");
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

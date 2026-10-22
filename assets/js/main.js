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
// Headings set "&" in a serif italic, the way the Cocoon type does
// ---------------------------------------------------------------------------
document.querySelectorAll(".duo span, h3, .sub-title").forEach((el) => {
  if (el.children.length === 0 && el.textContent.includes("&")) {
    el.innerHTML = el.innerHTML.replace(/&amp;/g, '<span class="amp">&amp;</span>');
  }
});

// ---------------------------------------------------------------------------
// The name across the top: letters rise in, and the size is fitted so the
// longest line runs the full width of the page
// ---------------------------------------------------------------------------
(() => {
  const name = document.getElementById("bigname");
  name.setAttribute("aria-label", "Priyanshu Singh");
  let i = 0;
  name.querySelectorAll(".word").forEach((word) => {
    word.setAttribute("aria-hidden", "true");
    word.innerHTML = [...word.textContent]
      .map((c) => `<span class="clip"><span class="ch" style="--i:${i++}">${c}</span></span>`)
      .join("");
  });

  const fit = () => {
    name.style.fontSize = "100px";
    // Width of a line = from its first letter's left edge to its last letter's right edge
    const span = (clips) => clips[clips.length - 1].getBoundingClientRect().right - clips[0].getBoundingClientRect().left;
    const words = [...name.querySelectorAll(".word")];
    const stacked = getComputedStyle(words[0]).display === "block";
    const lineWidth = stacked
      ? Math.max(...words.map((w) => span([...w.querySelectorAll(".clip")])))
      : span([...name.querySelectorAll(".clip")]);
    const target = name.clientWidth;
    name.style.fontSize = `${Math.floor(100 * target / lineWidth * 0.995)}px`;
  };
  fit();
  document.fonts?.ready.then(fit);
  window.addEventListener("resize", fit);
})();

// ---------------------------------------------------------------------------
// Lens: a disc on the pointer that inverts whatever is under it
// ---------------------------------------------------------------------------
(() => {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const lens = document.getElementById("lens");
  const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let x = 0, y = 0, lx = 0, ly = 0, running = false;
  const step = () => {
    lx += (x - lx) * (instant ? 1 : .3);
    ly += (y - ly) * (instant ? 1 : .3);
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

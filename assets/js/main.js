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

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------------------
// Nav: background on scroll, mobile menu, active section
// ---------------------------------------------------------------------------
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const setMenu = (open) => {
  navLinks.classList.toggle("open", open);
  nav.classList.toggle("menu-open", open);
  document.body.style.overflow = open ? "hidden" : "";
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
navToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

const sectionLinks = [...navLinks.querySelectorAll('a[href^="#"]:not(.btn)')];
const sections = sectionLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => activeObserver.observe(s));

// ---------------------------------------------------------------------------
// Reveal on scroll, staggered within each group
// ---------------------------------------------------------------------------
const revealEls = document.querySelectorAll(".reveal");
revealEls.forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.08}s`);
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
// Pointer light: brightens the background grid and service cards under the cursor
// ---------------------------------------------------------------------------
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (finePointer && !reduceMotion) {
  const glow = document.querySelector(".grid-glow");
  let px = 0, py = 0, queued = false;
  window.addEventListener("pointermove", (e) => {
    px = e.clientX; py = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      glow.style.setProperty("--gx", `${px}px`);
      glow.style.setProperty("--gy", `${py}px`);
      queued = false;
    });
  }, { passive: true });
}

document.querySelectorAll(".service").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

// ---------------------------------------------------------------------------
// Email bar: copy the address, and step aside while the contact section is on screen
// ---------------------------------------------------------------------------
const mailBar = document.getElementById("mailBar");
const mailCopy = document.getElementById("mailCopy");
let copiedTimer;
mailCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(CONFIG.contactEmail);
    mailCopy.classList.add("copied");
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => mailCopy.classList.remove("copied"), 1600);
  } catch {
    window.location.href = `mailto:${CONFIG.contactEmail}`;
  }
});
new IntersectionObserver(([entry]) => {
  mailBar.classList.toggle("hidden", entry.isIntersecting);
}, { threshold: 0.15 }).observe(document.getElementById("contact"));

// ---------------------------------------------------------------------------
// Contact form: posts to formEndpoint if set, otherwise opens an email draft
// ---------------------------------------------------------------------------
const form = document.getElementById("contactForm");
const note = document.getElementById("formNote");

const setNote = (text, kind) => {
  note.textContent = text;
  note.className = "form-note" + (kind ? " " + kind : "");
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

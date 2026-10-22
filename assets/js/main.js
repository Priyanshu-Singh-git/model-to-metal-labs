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

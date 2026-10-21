/* ==========================================================================
   heymartin.xyz — script.js
   1) přepínač light/dark  2) klávesa "C" = kopie e-mailu
   3) ticker (hover = 0.5×)  4) zvuky (cuelume, volitelné)
   ========================================================================== */

const EMAIL = "justuix@proton.me"; // ← změň na svůj e-mail
const THEME_KEY = "theme";
const SOUND_KEY = "portfolio-sound";

const root = document.documentElement;

/* ---------- 4) Zvuky (cuelume) ----------
   Načítá se až po první interakci; když selže (offline, blokováno), web funguje dál bez zvuku. */
const SOUND = {
  enabledByDefault: true, // false = zvuky zapne až návštěvník
  volume: 0.6,
  theme: "press", // "default" | "mech" | "bubble" | "press"
  hoverDelay: 70, // ms – přejetí myší přes položku zůstane tiché
};

let cue = null; // { play, setEnabled, ... }
let cueLoading = null;

function soundEnabled() {
  try {
    const saved = localStorage.getItem(SOUND_KEY);
    if (saved !== null) return saved === "1";
  } catch {}
  return SOUND.enabledByDefault;
}

function loadCue() {
  if (cue || cueLoading) return cueLoading;
  cueLoading = import("https://esm.sh/cuelume@0.2.8")
    .then(async (mod) => {
      mod.setEnabled(soundEnabled());
      mod.setVolume(SOUND.volume);
      mod.setTheme(SOUND.theme);
      try {
        await mod.unlock();
      } catch {}
      cue = mod;
      return mod;
    })
    .catch(() => null);
  return cueLoading;
}

function play(name, options) {
  if (!soundEnabled() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (cue) {
    try {
      cue.play(name, options);
    } catch {}
  } else {
    loadCue()?.then((m) => m && m.play(name, options));
  }
}

// první gesto odemkne audio
window.addEventListener("pointerdown", () => loadCue(), { once: true });
window.addEventListener("keydown", () => loadCue(), { once: true });

// hover zvuk na itemech (jen myš, s krátkou prodlevou)
if (window.matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".item").forEach((el) => {
    let t;
    el.addEventListener("pointerenter", () => {
      t = setTimeout(() => play("open", { emphasis: "subtle" }), SOUND.hoverDelay);
    });
    el.addEventListener("pointerleave", () => clearTimeout(t));
  });
  document.querySelectorAll(".stack-item").forEach((el) => {
    let t;
    el.addEventListener("pointerenter", () => {
      t = setTimeout(() => play("select", { emphasis: "subtle", volume: 0.5 }), SOUND.hoverDelay);
    });
    el.addEventListener("pointerleave", () => clearTimeout(t));
  });
}
document.querySelectorAll(".item, .link").forEach((el) => el.addEventListener("click", () => play("navigate")));

/* ---------- 1) Theme switch ---------- */
const themeBtn = document.getElementById("theme-switch");
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0A0A0A" : "#FAFAFA");
}

applyTheme(root.getAttribute("data-theme") || "dark");

themeBtn.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {}
  play("toggle");
});

/* ---------- 2) Kopírování e-mailu ---------- */
const copyHint = document.getElementById("copy-hint");
const copyBtn = document.getElementById("copy-btn");
let copiedTimer;

function fallbackCopy() {
  const el = document.createElement("textarea");
  el.value = EMAIL;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  try {
    document.execCommand("copy");
  } catch {}
  document.body.removeChild(el);
}

function showCopied() {
  copyHint.classList.add("is-copied");
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => copyHint.classList.remove("is-copied"), 2000);
  play("success");
}

function copyEmail() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(EMAIL)
      .then(showCopied)
      .catch(() => {
        fallbackCopy();
        showCopied();
      });
  } else {
    fallbackCopy();
    showCopied();
  }
}

copyBtn.addEventListener("click", copyEmail);

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() !== "c") return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return; // nepřebíjet Ctrl/Cmd+C
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  copyEmail();
});

/* ---------- 3) Ticker – hover zpomalí na 0.5× ---------- */
const ticker = document.getElementById("ticker");
const track = ticker && ticker.querySelector(".ticker-track");

if (track) {
  const setRate = (rate) => {
    track.getAnimations().forEach((a) => a.updatePlaybackRate(rate));
  };
  ticker.addEventListener("pointerenter", () => setRate(0.5));
  ticker.addEventListener("pointerleave", () => setRate(1));
}

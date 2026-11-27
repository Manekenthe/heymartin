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
  // Vyvážení hlasitosti jednotlivých zvuků (0–1). V knihovně mají zvuky různou sílu,
  // např. "navigate" je ~4× hlasitější než hover "open" – tady se to srovná.
  // Chceš nahlas/ztlumit? Změň číslo. 1 = bez úprav.
  levels: {
    open: 1, // hover na položce
    select: 0.6, // hover na ikoně ve Stacku / Visited
    navigate: 0.25, // klik na odkaz
    success: 0.4, // zkopírování e-mailu
    toggle: 1, // přepnutí tématu
  },
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
  // nejdřív vlastní kopie (assets/vendor/cuelume.js); když chybí, záloha z CDN
  cueLoading = import("./assets/vendor/cuelume.js")
    .catch(() => import("https://esm.sh/cuelume@0.2.8"))
    .then((mod) => {
      mod.setEnabled(soundEnabled());
      mod.setVolume(SOUND.volume);
      mod.setTheme(SOUND.theme);
      cue = mod;
      return mod;
    })
    .catch(() => null);
  return cueLoading;
}

function play(name, options = {}) {
  if (!soundEnabled() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const volume = (options.volume ?? 1) * (SOUND.levels[name] ?? 1);
  const opts = { ...options, volume };
  if (cue) {
    try {
      cue.play(name, opts);
    } catch {}
  } else {
    loadCue()?.then((m) => m && m.play(name, opts));
  }
}

/* Safari (a iOS) povolí audio jen tehdy, když se AudioContext odemkne SYNCHRONNĚ
   uvnitř gesta uživatele (klik / klávesa / dotyk). Proto se knihovna načte hned po
   startu stránky a první gesto ji pouze odemkne – nic se při něm už nenačítá. */
let unlocked = false;
function tryUnlock() {
  if (unlocked || !cue) return;
  try {
    const r = cue.unlock();
    if (r && typeof r.then === "function") {
      r.then(() => {
        unlocked = true;
        removeUnlockListeners();
      }).catch(() => {});
    } else {
      unlocked = true;
      removeUnlockListeners();
    }
  } catch {}
}

const UNLOCK_EVENTS = ["pointerdown", "pointerup", "mousedown", "touchstart", "touchend", "click", "keydown"];
function removeUnlockListeners() {
  UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, tryUnlock, true));
}
UNLOCK_EVENTS.forEach((ev) => window.addEventListener(ev, tryUnlock, true));

// předběžné načtení knihovny, ať je při prvním gestu už připravená
(window.requestIdleCallback || ((fn) => setTimeout(fn, 200)))(() => loadCue());

/* Hover zvuky – jen při SKUTEČNÉM pohybu myši.
   Při scrollu nebo posunu layoutu pod stojícím kurzorem prohlížeč pošle "pointerenter"
   na prvek, který se ocitne pod kurzorem – bez téhle kontroly by pak zvuky hrály samy. */
if (window.matchMedia("(hover: hover)").matches) {
  let lastX = -1;
  let lastY = -1;
  let lastRealMove = -Infinity;
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      if (e.clientX !== lastX || e.clientY !== lastY) lastRealMove = performance.now();
      lastX = e.clientX;
      lastY = e.clientY;
    },
    { passive: true, capture: true }
  );

  const hoverSound = (selector, name, options) => {
    document.querySelectorAll(selector).forEach((el) => {
      let t;
      el.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || !e.isTrusted) return;
        const entered = performance.now();
        clearTimeout(t);
        t = setTimeout(() => {
          if (!cue) return; // knihovna ještě není načtená → žádný opožděný zvuk
          if (lastRealMove < entered - 40) return; // kurzor stál, pohnula se jen stránka
          if (!el.matches(":hover")) return;
          play(name, options);
        }, SOUND.hoverDelay);
      });
      el.addEventListener("pointerleave", () => clearTimeout(t));
    });
  };

  hoverSound(".item", "open", { emphasis: "subtle" });
  hoverSound(".stack-item", "select", { emphasis: "subtle" });
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

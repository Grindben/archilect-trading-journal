"use strict";
/* ============================================================
   PAGE TRANSITIONS — fades out before navigating to another page in the app,
   so a plain cross-document navigation doesn't feel like an instant, jarring
   cut. Works in every browser, unlike the View Transitions API opt-in in
   layout.css, which some browsers — and two file:// documents in particular —
   simply don't apply to.
   ============================================================ */
const PT_DURATION = 180; // ms — keep in sync with body's transition duration in css/layout.css
const ptReduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// "*=" rather than "$=" so it still matches hrefs dashboard.js appends a #step hash to,
// e.g. "trading-checklist.html#bias" for the "Continue checklist" link.
document.querySelectorAll('a[href*=".html"]').forEach(link=>{
  if(link.target === "_blank") return;
  link.addEventListener("click", e=>{
    if(e.defaultPrevented || e.button !== 0) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if(ptReduceMotion) return; // navigate immediately, no artificial delay
    const url = link.href;
    e.preventDefault();
    document.body.classList.add("page-out");
    setTimeout(()=>{ window.location.href = url; }, PT_DURATION);
  });
});

"use strict";
/* ============================================================
   PAGE TRANSITIONS — slides out before navigating to another page in the
   app, so a plain cross-document navigation doesn't feel like an instant,
   jarring cut. Works in every browser, unlike the View Transitions API
   opt-in in layout.css, which some browsers — and two file:// documents in
   particular — simply don't apply to.

   Direction follows the fixed page order below: moving to a later page
   slides left ("paging ahead"), moving to an earlier one slides right.
   The direction is stashed in sessionStorage for the next page's
   js/nav-direction-preboot.js to pick up before its own first paint.
   ============================================================ */
const PT_DURATION = 200; // ms — keep in sync with body's transition duration in css/layout.css
const PT_PAGE_ORDER = ["index.html", "trading-checklist.html", "trading-journal.html", "risk-sizing.html"];
const ptReduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ptPageName(href){
  try{ return new URL(href, location.href).pathname.split("/").pop() || "index.html"; }
  catch(e){ return ""; }
}
const ptCurrentIdx = PT_PAGE_ORDER.indexOf(ptPageName(location.href));

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

    const destIdx = PT_PAGE_ORDER.indexOf(ptPageName(url));
    let exitClass = "page-out";
    if(ptCurrentIdx !== -1 && destIdx !== -1 && destIdx !== ptCurrentIdx){
      const forward = destIdx > ptCurrentIdx;
      exitClass = forward ? "page-out-fwd" : "page-out-back";
      try{ sessionStorage.setItem("archilect_nav_dir", forward ? "fwd" : "back"); }catch(err){}
    }
    document.body.classList.add(exitClass);
    setTimeout(()=>{ window.location.href = url; }, PT_DURATION);
  });
});

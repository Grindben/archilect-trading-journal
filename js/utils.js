"use strict";
/* ============================================================
   HELPERS
   ============================================================ */
function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }
function fmtPct(v){ return (v*100).toFixed(2)+"%"; }
function clamp(v,min,max){ return Math.min(max,Math.max(min,v)); }
function median3(a,b,c){ return [a,b,c].sort((x,y)=>x-y)[1]; }

// Runs `action` (a synchronous DOM change, typically toggling classes that trigger a CSS
// collapse/expand transition), then keeps anchorEl pinned at the exact viewport position it
// was in beforehand for as long as the surrounding layout keeps shifting — so collapsing
// content above a button never yanks the page out from under the reader mid-animation.
function preserveScrollAround(anchorEl, action){
  const before = anchorEl.getBoundingClientRect().top;
  action();
  const duration = 500;
  const start = performance.now();
  function tick(now){
    const drift = anchorEl.getBoundingClientRect().top - before;
    if(Math.abs(drift) > 0.5) window.scrollBy(0, drift);
    if(now - start < duration) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
"use strict";
/* ============================================================
   HELPERS
   ============================================================ */
function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }
function fmtPct(v){ return (v*100).toFixed(2)+"%"; }
function clamp(v,min,max){ return Math.min(max,Math.max(min,v)); }
function median3(a,b,c){ return [a,b,c].sort((x,y)=>x-y)[1]; }
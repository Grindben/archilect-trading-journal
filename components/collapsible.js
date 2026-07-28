"use strict";
/* ============================================================
   COLLAPSIBLE SECTIONS
   Each target keeps its own markup and styling untouched; we slot it inside a
   wrapper that animates its height, so nothing about the layout has to change.
   ============================================================ */
const collapsibles = {};
["b-monday-row","b-lonHigh-row","b-lonLow-row","b-sweep-group","b-offliq-group","b-conviction-group","b-intermarket-group"].forEach(id=>{
  const target = document.getElementById(id);
  if(!target) return;
  const wrap = document.createElement("div");
  wrap.className = "collapsible";
  const inner = document.createElement("div");
  inner.className = "collapse-inner";
  target.parentNode.insertBefore(wrap, target);
  inner.appendChild(target);
  wrap.appendChild(inner);
  collapsibles[id] = wrap;
});
function setCollapsed(id, collapsed){
  const wrap = collapsibles[id];
  if(wrap) wrap.classList.toggle("collapsed", collapsed);
}

// Draw on liquidity level options
const dolType = document.getElementById("b-dolType");
const dolLevel = document.getElementById("b-dolLevel");
function refreshDolLevels(){
  const opts = DOL_OPTIONS[dolType.value] || [];
  dolLevel.innerHTML = opts.map(o=>`<option value="${o}">${o}</option>`).join("");
}
refreshDolLevels();
dolType.addEventListener("change", ()=>{ refreshDolLevels(); syncSelects(); recomputeAll(); });
dolLevel.addEventListener("change", ()=>recomputeAll());
document.getElementById("b-vol").addEventListener("change", ()=>recomputeAll());
document.getElementById("b-of").addEventListener("change", ()=>recomputeAll());
["s-4h","s-1h","s-15m","s-ssmt","s-closeVs","s-c2"].forEach(id=>{
  document.getElementById(id).addEventListener("change", ()=>recomputeAll());
});

// Reverse / Catch Up controls
const esLevelSel = document.getElementById("rc-esLevel");
const nqLevelSel = document.getElementById("rc-nqLevel");
const keyLevelOpts = KEY_LEVELS.map(v=>`<option value="${v}">${v}</option>`).join("");
esLevelSel.innerHTML = keyLevelOpts;
nqLevelSel.innerHTML = keyLevelOpts;
["s-setupType","rc-4h","rc-1h","rc-esLevel","rc-nqLevel"].forEach(id=>{
  document.getElementById(id).addEventListener("change", ()=>recomputeAll());
});
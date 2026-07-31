"use strict";
/* ============================================================
   SESSION PERSISTENCE — Market Conditions / Bias / Setup inputs
   This page is now the only place these inputs live (no more shared in-page
   view with the Dashboard), so without this they'd reset on every navigation
   and the Dashboard would have nothing to read for its session summary.
   ============================================================ */
const CHECKLIST_KEY = "archilect_checklist_v1";

const BIAS_SEG_IDS = ["b-monday","b-asiaHigh","b-asiaLow","b-lonHigh","b-lonLow",
  "b-seekDestroy","b-consolidation","b-bullExp","b-bearExp","b-rejPDH","b-rejPDL",
  "b-irConfirm","b-irDiverge"];
const BIAS_SELECT_IDS = ["b-vol","b-of","b-dolType","b-dolLevel"];
const SETUP_SELECT_IDS = ["s-setupType","s-4h","s-1h","s-15m","s-ssmt","s-closeVs","s-c2","rc-4h","rc-1h","rc-esLevel","rc-nqLevel"];
const SETUP_SEG_IDS = ["rc-ymSync","rc-directional"];

function collectChecklistInputs(){
  const mc = [];
  MC_SECTIONS.forEach(section=>section.items.forEach(item=>{ mc.push(segVal(item._seg)); }));
  const pools = [];
  TIME_POOLS.concat(PRICE_POOLS).forEach(pool=>{ pools.push([segVal(pool._highSeg), segVal(pool._lowSeg)]); });

  const bias = {};
  BIAS_SEG_IDS.forEach(id=>{ bias[id] = segVal(document.getElementById(id)); });
  BIAS_SELECT_IDS.forEach(id=>{ bias[id] = document.getElementById(id).value; });

  const setup = {};
  SETUP_SELECT_IDS.forEach(id=>{ setup[id] = document.getElementById(id).value; });
  SETUP_SEG_IDS.forEach(id=>{ setup[id] = segVal(document.getElementById(id)); });

  return {mc, pools, bias, setup};
}

// Called at the end of every recomputeAll() — the single choke point every input change
// flows through — so the Dashboard always reads the latest state without extra wiring.
function saveChecklistSession(){
  const c = window._lastCompute;
  const computed = c ? {
    mcFinal: c.mc.final, mcVerdict: c.mc.verdict, mcStop: c.mc.stopTriggered,
    biasDirection: c.bias.direction, biasConviction: c.bias.conviction, biasLabel: c.bias.convictionLabel,
    setupGrade: c.setup.grade, setupType: document.getElementById("s-setupType").value
  } : null;
  // Persisted too, not just kept in memory — otherwise a reload would re-lock Bias/Setup
  // (js/router.js applyStepGating) even after they'd already been validated once.
  const validated = {
    mc: typeof mcValidated !== "undefined" ? mcValidated : false,
    bias: typeof biasValidated !== "undefined" ? biasValidated : false
  };
  try{
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify({
      inputs: collectChecklistInputs(), computed, validated, savedAt: new Date().toISOString()
    }));
  }catch(e){}
}

// Setup Type's options (and DOL Level's) are rebuilt at runtime from Volatility / DOL Type,
// so those two go first, then one recompute to regenerate the lists, then everything else.
function restoreChecklistSession(){
  let saved;
  try{ saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY)); }catch(e){ saved = null; }
  // Conditions/Bias/Setup are a same-day log, same as the news panel (js/usd-news.js):
  // a session saved on a previous calendar day is stale, so start clean — inputs blank,
  // Validate criteria back up instead of Edit — rather than restoring yesterday's answers.
  if(saved && saved.savedAt && new Date(saved.savedAt).toDateString() !== new Date().toDateString()){
    try{ localStorage.removeItem(CHECKLIST_KEY); }catch(e){}
    saved = null;
  }
  if(!saved || !saved.inputs){
    recomputeAll();
    if(typeof applyStepGating === "function") applyStepGating();
    return;
  }
  const {mc, pools, bias, setup} = saved.inputs;

  if(bias && bias["b-vol"]) document.getElementById("b-vol").value = bias["b-vol"];
  if(bias && bias["b-dolType"]){
    document.getElementById("b-dolType").value = bias["b-dolType"];
    refreshDolLevels();
  }
  recomputeAll();

  let i = 0;
  MC_SECTIONS.forEach(section=>section.items.forEach(item=>{
    if(mc && mc[i]) setSegValue(item._seg, mc[i]);
    i++;
  }));
  let p = 0;
  TIME_POOLS.concat(PRICE_POOLS).forEach(pool=>{
    if(pools && pools[p]){ setSegValue(pool._highSeg, pools[p][0]); setSegValue(pool._lowSeg, pools[p][1]); }
    p++;
  });
  Object.keys(bias||{}).forEach(id=>{
    if(id==="b-vol" || id==="b-dolType") return;
    const el = document.getElementById(id);
    if(!el) return;
    if(el.classList.contains("seg")) setSegValue(el, bias[id]); else el.value = bias[id];
  });
  Object.keys(setup||{}).forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    if(el.classList.contains("seg")) setSegValue(el, setup[id]); else el.value = setup[id];
  });
  syncSelects();

  // Restore whichever panels were already validated — same UI updates their own
  // Validate button would have made, just replayed here instead of via a click.
  const validated = saved.validated || {};
  if(validated.mc && typeof mcValidated !== "undefined"){
    mcValidated = true;
    mcValidateBtn.style.display = "none";
    mcEditBtn.style.display = "";
    if(typeof applyNewsLockState === "function") applyNewsLockState();
  }
  if(validated.bias && typeof biasValidated !== "undefined"){
    biasValidated = true;
    biasValidateBtn.style.display = "none";
    biasEditBtn.style.display = "";
    if(typeof applyBiasLockState === "function") applyBiasLockState();
  }

  recomputeAll();
  if(typeof applyStepGating === "function") applyStepGating();
}

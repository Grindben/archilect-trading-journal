"use strict";
/* ============================================================
   BIAS PANEL — validate / edit, the same "vitrine" pattern as Market
   Conditions (js/market-conditions.js): once validated, every Yes/No
   toggle and dropdown in this panel becomes read-only — the unanswered
   side of each toggle disappears and every dropdown flattens into a
   plain label — until Edit brings the controls back exactly as they
   were left. Native `disabled` is used rather than a CSS-only lock so
   keyboard and pointer interaction are both actually blocked, not just
   visually implied.
   ============================================================ */
let biasValidated = false;
function applyBiasLockState(){
  document.querySelectorAll("#panel-bias .seg-btn").forEach(b=>{ b.disabled = biasValidated; });
  document.querySelectorAll("#panel-bias .cselect-trigger").forEach(t=>{ t.disabled = biasValidated; });
  applyBiasYesOnlyFilter();
}

// Once validated, criteria answered "No" clear out of view — only the "Yes"
// answers stay on screen. Liquidity pool rows carry two independent Yes/No
// reads (HIGH/LOW): each side hides on its own, and the row itself only
// disappears once both sides are gone.
function applyBiasYesOnlyFilter(){
  document.querySelectorAll("#panel-bias .field-row").forEach(row=>{
    if(row.classList.contains("pool-row")) return;
    const seg = row.querySelector(":scope > .seg[data-yesno]");
    if(!seg) return;
    row.classList.toggle("is-hidden", biasValidated && segVal(seg) !== "Yes");
  });

  document.querySelectorAll("#panel-bias .pool-row").forEach(row=>{
    let anyVisible = false;
    row.querySelectorAll(".pool-block").forEach(block=>{
      const seg = block.querySelector(".seg");
      const hide = biasValidated && segVal(seg) !== "Yes";
      block.classList.toggle("is-hidden", hide);
      if(!hide) anyVisible = true;
    });
    row.classList.toggle("is-hidden", biasValidated && !anyVisible);
  });
}

const biasValidateBar = document.getElementById("bias-validate-bar");
const biasValidateBtn = document.getElementById("bias-validate-btn");
const biasEditBtn = document.getElementById("bias-edit-btn");
biasValidateBtn.addEventListener("click", ()=>{
  preserveScrollAround(biasValidateBar, ()=>{
    biasValidated = true;
    biasValidateBtn.style.display = "none";
    biasEditBtn.style.display = "";
    applyBiasLockState();
    recomputeAll(); // also persists biasValidated via saveChecklistSession(), see js/checklist-state.js
    if(typeof applyStepGating === "function") applyStepGating();
  });
});
biasEditBtn.addEventListener("click", ()=>{
  preserveScrollAround(biasValidateBar, ()=>{
    biasValidated = false;
    biasEditBtn.style.display = "none";
    biasValidateBtn.style.display = "";
    applyBiasLockState();
    recomputeAll();
    if(typeof applyStepGating === "function") applyStepGating();
  });
});

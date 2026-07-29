"use strict";
/* ============================================================
   PANEL ROUTER — Trading Checklist's 5 internal steps
   Cross-page navigation (Dashboard / Trading Journal) is now plain <a href>
   links — this only switches between the 5 panels within this page.
   ============================================================ */
const steps = document.querySelectorAll(".step");
const panels = document.querySelectorAll(".panel");

// Each step must be validated (js/market-conditions.js, js/bias-lock.js) before the next
// one can be reached — checked here as the single choke point every navigation path goes
// through (stepper click, "Go to X" button, or a deep link like "#bias" from the Dashboard),
// and again in applyStepGating() below, which disables the controls themselves so a locked
// step doesn't even look clickable.
function goToPanel(name){
  const mcOk = typeof mcValidated === "undefined" || mcValidated;
  const biasOk = typeof biasValidated === "undefined" || biasValidated;
  if(name === "setup" && !biasOk) name = "bias";
  if(name === "bias" && !mcOk) name = "conditions";
  const target = document.getElementById("panel-"+name);
  if(!target) return;
  // Snap to the top with no scrolling motion — the panel's fade-in is the transition.
  try{ window.scrollTo({top:0, left:0, behavior:"instant"}); }
  catch(e){ window.scrollTo(0,0); }
  steps.forEach(s=>s.classList.toggle("active", s.dataset.tab===name));
  panels.forEach(p=>p.classList.remove("active"));
  target.classList.add("active");
  refreshJournalUI();
  if(name === "journal" && typeof applySuggestedStageTag === "function") applySuggestedStageTag();
  if(name === "tradereview" && typeof loadTradeIntoReview === "function") loadTradeIntoReview();
}

function applyStepGating(){
  const mcOk = typeof mcValidated === "undefined" || mcValidated;
  const biasOk = typeof biasValidated === "undefined" || biasValidated;
  const biasLocked = !mcOk;
  const setupLocked = !mcOk || !biasOk;
  const biasStep = document.querySelector('.step[data-tab="bias"]');
  const setupStep = document.querySelector('.step[data-tab="setup"]');
  if(biasStep) biasStep.disabled = biasLocked;
  if(setupStep) setupStep.disabled = setupLocked;
  document.querySelectorAll('[data-goto="bias"]').forEach(b=>{ b.disabled = biasLocked; });
  document.querySelectorAll('[data-goto="setup"]').forEach(b=>{ b.disabled = setupLocked; });
}
applyStepGating();

steps.forEach(step=>{
  step.addEventListener("click", ()=>goToPanel(step.dataset.tab));
});
// Bottom-of-panel navigation, so the checklist can be worked through in order.
document.querySelectorAll("[data-goto]").forEach(btn=>{
  btn.addEventListener("click", ()=>goToPanel(btn.dataset.goto));
});

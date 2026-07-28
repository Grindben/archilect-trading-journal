"use strict";
/* ============================================================
   PANEL ROUTER — Trading Checklist's 5 internal steps
   Cross-page navigation (Dashboard / Trading Journal) is now plain <a href>
   links — this only switches between the 5 panels within this page.
   ============================================================ */
const steps = document.querySelectorAll(".step");
const panels = document.querySelectorAll(".panel");

function goToPanel(name){
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

steps.forEach(step=>{
  step.addEventListener("click", ()=>goToPanel(step.dataset.tab));
});
// Bottom-of-panel navigation, so the checklist can be worked through in order.
document.querySelectorAll("[data-goto]").forEach(btn=>{
  btn.addEventListener("click", ()=>goToPanel(btn.dataset.goto));
});

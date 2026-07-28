"use strict";
/* ---------- trade review (checklist step 5) ---------- */

// A trade counts as reviewed once any of the fields this step collects has been filled in —
// the quick snapshot never asks for them, so a fresh trade always starts "pending".
function hasReview(t){
  return !!(t.bias || t.news || t.lead || t.q3 || t.checklist ||
    (t.target && t.target.length) || (t.mistake && t.mistake.length));
}

function refreshTradeReviewState(){
  const light = document.getElementById("light-tradereview");
  const state = document.getElementById("state-tradereview");
  if(!light || !state) return;
  const trades = loadTrades();
  if(!trades.length){
    light.className = "light neutral";
    state.textContent = "—";
    return;
  }
  const pending = trades.filter(t=>!hasReview(t)).length;
  if(pending){
    light.className = "light caution";
    state.textContent = pending + (pending===1 ? " pending" : " pending");
  } else {
    light.className = "light go";
    state.textContent = "All reviewed";
  }
}

// Always targets the trade most recently pushed to storage — that's the one "Save Today's
// Snapshot" just created, whether this panel was reached via the modal or the stepper tab.
function loadTradeIntoReview(){
  const trades = loadTrades();
  const context = document.getElementById("tr-context");
  const saveBtn = document.getElementById("tr-save");
  if(!trades.length){
    window._reviewTradeId = null;
    context.textContent = "No trades logged yet — save an entry in Journal first.";
    saveBtn.disabled = true;
    return;
  }
  const t = trades[trades.length-1];
  window._reviewTradeId = t.id;
  saveBtn.disabled = false;
  const dateLabel = (t.entryDT||"").slice(0,10) || "—";
  context.textContent = "Reviewing " + (t.asset||"—") + " · " + dateLabel + (t.result ? " · "+t.result : "");
  document.getElementById("tr-bias").value = t.bias || "";
  document.getElementById("tr-news").value = t.news || "";
  document.getElementById("tr-lead").value = t.lead || "";
  document.getElementById("tr-q3").value = t.q3 || "";
  document.getElementById("tr-checklist").value = t.checklist || "";
  setChips("tr-target", t.target || []);
  setChips("tr-mistake", t.mistake || []);
}

document.getElementById("tr-save").addEventListener("click", ()=>{
  const id = window._reviewTradeId;
  if(!id) return;
  const arr = loadTrades();
  const idx = arr.findIndex(x=>x.id===id);
  if(idx===-1) return;
  arr[idx] = Object.assign({}, arr[idx], {
    bias: document.getElementById("tr-bias").value,
    news: document.getElementById("tr-news").value,
    lead: document.getElementById("tr-lead").value,
    q3: document.getElementById("tr-q3").value,
    checklist: document.getElementById("tr-checklist").value.trim(),
    target: chipVals("tr-target"),
    mistake: chipVals("tr-mistake")
  });
  saveTrades(arr);
  refreshJournalUI();
  goToPanel("journal");
});

/* ---------- "want to review now?" prompt ---------- */
function offerTradeReview(){
  const modal = document.getElementById("review-modal");
  const yes = document.getElementById("review-modal-yes");
  const no = document.getElementById("review-modal-no");
  modal.hidden = false;
  function close(){
    modal.hidden = true;
    yes.removeEventListener("click", onYes);
    no.removeEventListener("click", onNo);
  }
  function onYes(){ close(); goToPanel("tradereview"); }
  function onNo(){ close(); }
  yes.addEventListener("click", onYes);
  no.addEventListener("click", onNo);
}

"use strict";
/* ---------- quick snapshot log (checklist's Journal step) ---------- */
function renderQuickList(){
  const list = document.getElementById("j-list");
  if(!list) return;
  const all = loadTrades().slice().sort((a,b)=>String(b.entryDT||"").localeCompare(String(a.entryDT||"")));
  list.innerHTML = "";
  if(!all.length){
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = 'No entries yet. Fill in the checklist, then click "Save Today\u2019s Snapshot".';
    list.appendChild(empty);
    return;
  }
  all.forEach(t=>{
    const card = document.createElement("div");
    card.className = "entry" + (t.id===window._editingTradeId ? " editing" : "");
    const dateLabel = (t.entryDT||"").slice(0,10) || "—";
    const head = document.createElement("div");
    head.className = "entry-head";
    head.innerHTML =
      `<div><div class="entry-date">${dateLabel}</div><div class="entry-asset">${t.asset||t.sessionLabel||""}</div></div>`;
    const actions = document.createElement("div");
    actions.className = "entry-actions";
    const edit = document.createElement("button");
    edit.className = "entry-edit"; edit.type = "button"; edit.setAttribute("aria-label", "Edit entry");
    edit.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.1 2.5l2.4 2.4L5.2 13.2H2.8v-2.4l8.3-8.3z"/></svg>';
    edit.addEventListener("click", ()=> startEditTrade(t.id));
    const del = document.createElement("button");
    del.className = "entry-del"; del.type = "button"; del.textContent = "✕";
    del.setAttribute("aria-label", "Delete entry");
    del.addEventListener("click", ()=>{
      confirmModal("Delete this entry?", ()=>{
        if(t.id===window._editingTradeId) exitEditMode();
        saveTrades(loadTrades().filter(x=>x.id!==t.id));
        refreshJournalUI();
      });
    });
    actions.appendChild(edit);
    actions.appendChild(del);
    head.appendChild(actions);
    card.appendChild(head);

    if(t.checklistConditions || t.checklistBias || t.checklistSetup || t.strategy || t.result){
      const tags = document.createElement("div");
      tags.className = "entry-tags";
      if(t.checklistConditions) tags.appendChild(pill(t.checklistConditions, mcTone(t.checklistConditions)));
      if(t.checklistBias) tags.appendChild(pill(stripStars(t.checklistBias), "grey"));
      if(t.checklistSetup) tags.appendChild(pill(t.checklistSetup, setupTone(t.checklistSetup)));
      if(t.strategy) tags.appendChild(pill(t.strategy, "grey"));
      if(t.result) tags.appendChild(pill(t.result, t.result==="TP"?"go":t.result==="SL"?"stop":t.result==="BE"?"grey":"caution"));
      card.appendChild(tags);
    }
    if(t.notes){
      const notes = document.createElement("div");
      notes.className = "entry-notes";
      notes.textContent = t.notes;
      card.appendChild(notes);
    }
    if(t.executionLink){
      const link = document.createElement("a");
      link.href = t.executionLink; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.textContent = "Open execution ↗";
      link.style.cssText = "display:inline-block; font-size:12px; color:var(--gold); margin-top:6px; text-decoration:underline;";
      card.appendChild(link);
    }
    list.appendChild(card);
  });
}
// Generic blurred-background yes/no prompt, reused for any destructive confirmation.
function confirmModal(message, onConfirm){
  const modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-modal-text").textContent = message;
  modal.hidden = false;
  const ok = document.getElementById("confirm-modal-ok");
  const cancel = document.getElementById("confirm-modal-cancel");
  function close(){
    modal.hidden = true;
    ok.removeEventListener("click", onOk);
    cancel.removeEventListener("click", onCancel);
  }
  function onOk(){ close(); onConfirm(); }
  function onCancel(){ close(); }
  ok.addEventListener("click", onOk);
  cancel.addEventListener("click", onCancel);
}
function pill(text, tone){
  const span = document.createElement("span");
  span.className = "verdict-pill " + (tone||"grey");
  span.style.fontSize = "11px";
  span.style.padding = "4px 10px";
  span.textContent = text;
  return span;
}
function mcTone(text){
  if(/STOP TRADING/.test(text)) return "stop";
  if(/No Trade/.test(text)) return "stop";
  if(/Half-Risk/.test(text)) return "caution";
  if(/Active Trade Window/.test(text)) return "go";
  return "grey";
}
// Older saved entries can still carry a star-rated conviction label from before that display
// was switched to plain text (e.g. Weak/Strong) — strip any stars so old cards match new ones.
function stripStars(text){
  return String(text||"").replace(/[★☆⭐✩✪✫✬✭✮✯✰⋆*]/g, "").replace(/\s+/g, " ").trim();
}
function setupTone(grade){
  if(grade==="A+" || grade==="A") return "go";
  if(grade==="B") return "caution";
  if(grade==="B-") return "stop";
  return "grey";
}

document.getElementById("j-date").valueAsDate = new Date();
document.getElementById("j-clear").addEventListener("click", clearAllTrades);

const J_FIELD_IDS = ["j-date","j-time","j-account","j-asset","j-contracts","j-timeframe",
  "j-entryPrice","j-stopPrice","j-tpPrice","j-commIn","j-exitDT","j-exitPrice","j-commOut","j-result"];

// Rough starting price so the price fields aren't left blank — overwrite freely once you know the real fill.
const ENTRY_PRICE_DEFAULTS = {ES:"7000", MES:"7000", NQ:"27000", MNQ:"27000"};
const J_PRICE_FIELD_IDS = ["j-entryPrice","j-stopPrice","j-tpPrice","j-exitPrice"];
document.getElementById("j-asset").addEventListener("change", e=>{
  const dflt = ENTRY_PRICE_DEFAULTS[e.target.value];
  if(dflt !== undefined) J_PRICE_FIELD_IDS.forEach(id=>{ document.getElementById(id).value = dflt; });
  updateQuickPreview();
});

// Suggests the Stages tag that matches the current Setup step, so the common case needs
// no extra clicks: the active SSMT on a 2 Stages setup, or Invalidation of Key Levels on
// a Reverse / Catch Up setup (which are built on that criterion by definition). Re-applied
// each time this panel is opened and right after saving — manual additions made while you're
// on the panel are left alone, but a fresh visit starts from this suggestion again.
function applySuggestedStageTag(){
  const setupType = document.getElementById("s-setupType").value;
  const ssmt = document.getElementById("s-ssmt").value;
  const hint = document.getElementById("j-stages-hint");
  // Invalidation of Key Levels is a Reverse / Catch Up concept — it has no place on a 2 Stages setup.
  const invalidationChip = document.querySelector('#j-stages .chip[data-val="Invalidation of Key Levels"]');
  if(invalidationChip) invalidationChip.classList.toggle("is-hidden", setupType==="2 Stages");
  if(setupType==="2 Stages" && ssmt && ssmt!=="None"){
    setChips("j-stages", [ssmt]);
    hint.textContent = "Pre-filled from the "+ssmt+" chosen in Setup — add more if the trade used others too.";
  } else if(setupType==="Reverse Setup" || setupType==="Catch Up Setup"){
    setChips("j-stages", ["Invalidation of Key Levels"]);
    hint.textContent = setupType+" is built on Invalidation of Key Levels, so it's pre-selected — add more if relevant.";
  } else {
    setChips("j-stages", []);
    hint.textContent = "";
  }
}

function readQuickForm(){
  const g = id => document.getElementById(id).value.trim();
  const date = g("j-date") || new Date().toISOString().slice(0,10);
  const time = g("j-time");
  const exitDT = g("j-exitDT");
  return {
    entryDT: date + "T" + (time || "00:00"),
    // No Starting Balance field here by design — assumed at 50,000 (same default as the full
    // trade form) purely so Risk % and Result % have something to divide by.
    startBalance: "50000",
    account: g("j-account"), asset: g("j-asset"), contracts: g("j-contracts"),
    timeframe: g("j-timeframe"), entryPrice: g("j-entryPrice"), stopPrice: g("j-stopPrice"),
    tpPrice: g("j-tpPrice"), commIn: g("j-commIn"),
    // A logged exit price marks the trade CLOSED so computeTrade can price it off actual entry/exit.
    status: g("j-exitPrice") ? "CLOSED" : "",
    exitDT: exitDT, exitPrice: g("j-exitPrice"), commOut: g("j-commOut"),
    result: g("j-result")
  };
}
// Fields the preview box's numbers are actually derived from — flagged when still empty
// so it's obvious why Max loss / Max profit / Risk / R multiple / Result / P&L read "—".
function quickMissingFields(form){
  const missing = [];
  if(!form.contracts) missing.push("Contracts");
  if(!form.entryPrice) missing.push("Entry Price");
  if(!form.stopPrice) missing.push("Stop Loss Price");
  if(!form.tpPrice) missing.push("Take Profit Price");
  if(!form.exitPrice && !form.result) missing.push("Exit Price or Result");
  return missing;
}
function updateQuickPreview(){
  const form = readQuickForm();
  const m = computeTrade(form);
  document.getElementById("j-preview").innerHTML =
    `<span>Max loss <b>${fmtMoney(m.maxLoss)}</b></span>
     <span>Max profit <b>${fmtMoney(m.maxProfit)}</b></span>
     <span>Risk <b>${fmtPc(m.riskPct)}</b></span>
     <span>R multiple <b>${fmtN(m.rMultiple)}</b></span>
     <span>Result <b>${fmtPc(m.pnlPct)}</b></span>
     <span>P&amp;L <b>${fmtMoney(m.pnl)}</b></span>`;
  const missing = quickMissingFields(form);
  const hint = document.getElementById("j-preview-hint");
  hint.textContent = missing.length ? "Missing " + missing.join(", ") + " — fill in to complete the numbers below." : "";
  hint.classList.toggle("show", missing.length > 0);
}
J_FIELD_IDS.forEach(id=>{
  const el = document.getElementById(id);
  el.addEventListener("input", updateQuickPreview);
  el.addEventListener("change", updateQuickPreview);
});
{
  const dflt = ENTRY_PRICE_DEFAULTS[document.getElementById("j-asset").value];
  if(dflt !== undefined) J_PRICE_FIELD_IDS.forEach(id=>{ document.getElementById(id).value = dflt; });
}
updateQuickPreview();
applySuggestedStageTag();

// Chips this form's Stages field mixes together (see the "trade" object build-out below) —
// needed to split a saved entry's combined list back into its two chipsets when editing it.
const J_STAGE_VALS = ["90' SSMT","Daily SSMT","Micro SSMT","Weekly SSMT","Invalidation of Key Levels"];
const J_CONFIRMATION_VALS = ["MSB","CSD"];

function resetQuickFormFields(){
  ["j-contracts","j-stopPrice","j-tpPrice","j-commIn",
   "j-exitDT","j-exitPrice","j-commOut","j-notes","j-execLink"].forEach(id=>{ document.getElementById(id).value = ""; });
  document.getElementById("j-result").selectedIndex = 0;
  document.getElementById("j-time").value = "";
  setChips("j-confirmation", []);
  setChips("j-entrytag", []);
  setChips("j-emotions", []);
  applySuggestedStageTag();
  const dflt = ENTRY_PRICE_DEFAULTS[document.getElementById("j-asset").value];
  if(dflt !== undefined) J_PRICE_FIELD_IDS.forEach(id=>{ document.getElementById(id).value = dflt; });
  updateQuickPreview();
}

// Loads a saved entry back into the quick-log form so its click on Save updates that record
// instead of creating a new one — the only edit path this checklist step offers.
function startEditTrade(id){
  const t = loadTrades().find(x=>x.id===id);
  if(!t) return;
  window._editingTradeId = id;
  const [date, time] = String(t.entryDT||"").split("T");
  document.getElementById("j-date").value = date || "";
  document.getElementById("j-time").value = (time||"").slice(0,5);
  document.getElementById("j-account").value = t.account || "";
  document.getElementById("j-asset").value = t.asset || "MES";
  document.getElementById("j-contracts").value = t.contracts || "";
  document.getElementById("j-timeframe").value = t.timeframe || "1min";
  document.getElementById("j-entryPrice").value = t.entryPrice || "";
  document.getElementById("j-stopPrice").value = t.stopPrice || "";
  document.getElementById("j-tpPrice").value = t.tpPrice || "";
  document.getElementById("j-commIn").value = t.commIn || "";
  document.getElementById("j-exitDT").value = t.exitDT || "";
  document.getElementById("j-exitPrice").value = t.exitPrice || "";
  document.getElementById("j-commOut").value = t.commOut || "";
  document.getElementById("j-result").value = t.result || "";
  document.getElementById("j-notes").value = t.notes || "";
  document.getElementById("j-execLink").value = t.executionLink || "";
  const stages = t.stages || [];
  setChips("j-stages", stages.filter(v=>J_STAGE_VALS.includes(v)));
  setChips("j-confirmation", stages.filter(v=>J_CONFIRMATION_VALS.includes(v)));
  setChips("j-entrytag", (t.entryModel||"").split(",").map(s=>s.trim()).filter(Boolean));
  setChips("j-emotions", t.emotions || []);
  document.getElementById("j-edit-banner").style.display = "block";
  document.getElementById("j-cancel-edit").style.display = "inline-block";
  document.getElementById("j-save").textContent = "Update Entry";
  updateQuickPreview();
  renderQuickList();
  document.querySelector(".journal-snapshot").scrollIntoView({behavior:"smooth", block:"start"});
}
function exitEditMode(){
  window._editingTradeId = null;
  document.getElementById("j-edit-banner").style.display = "none";
  document.getElementById("j-cancel-edit").style.display = "none";
  document.getElementById("j-save").textContent = "Save Today's Snapshot";
  resetQuickFormFields();
  renderQuickList();
}
document.getElementById("j-cancel-edit").addEventListener("click", exitEditMode);

document.getElementById("j-save").addEventListener("click", ()=>{
  const live = window._lastCompute;
  const form = readQuickForm();
  const notes = document.getElementById("j-notes").value.trim();
  const executionLink = document.getElementById("j-execLink").value.trim();
  // The Setup Type chosen in the Setup step is saved automatically — nothing to re-enter here.
  // Normalised to the same wording the full trade form's Strategy field uses ("Reverse", not "Reverse Setup").
  const setupType = document.getElementById("s-setupType").value;
  const strategy = setupType==="Reverse Setup" ? "Reverse"
                  : setupType==="Catch Up Setup" ? "Catch Up"
                  : setupType;
  // Stages + Confirmation share one list (matching the full form's single Stages field —
  // the original journal mixed SSMT/Invalidation with MSB/CSD the same way, e.g. "90' SSMT, MSB").
  const stages = chipVals("j-stages").concat(chipVals("j-confirmation"));
  const entryModel = chipVals("j-entrytag").join(", ");
  const emotions = chipVals("j-emotions");
  const editingId = window._editingTradeId;

  if(editingId){
    const arr = loadTrades();
    const idx = arr.findIndex(x=>x.id===editingId);
    if(idx>-1){
      // Preserves whatever this record already carries from Trade Review (bias, mistake,
      // checklist snapshot, ...) — this form only ever touches the fields it shows.
      arr[idx] = Object.assign({}, arr[idx],
        {strategy, stages, entryModel, executionLink, notes, emotions}, form);
      saveTrades(arr);
    }
    exitEditMode();
    refreshJournalUI();
    return;
  }

  const trade = Object.assign({
    id: Date.now()+"_"+Math.random().toString(36).slice(2,7),
    startBalance:"", direction:"", commIn:"", deposit:"", rr:"", riskPct:"", resultPct:"",
    bias:"", target:[], news:"", emotions:emotions, mistake:[], lead:"", q3:"", checklist:"",
    strategy: strategy, stages: stages, entryModel: entryModel, executionLink: executionLink, notes,
    checklistConditions: live ? (live.mc.final.toFixed(1)+" — "+live.mc.verdict) : "",
    checklistBias: live ? (live.bias.direction && live.bias.direction!=="n/a"
      ? (live.bias.conviction!==null ? live.bias.convictionLabel : live.bias.direction)
      : "—") : "",
    checklistSetup: live ? live.setup.grade : ""
  }, form);
  const arr = loadTrades();
  arr.push(trade);
  saveTrades(arr);
  resetQuickFormFields();
  refreshJournalUI();
  if(typeof offerTradeReview === "function") offerTradeReview();
});
"use strict";
/* ---------- form ---------- */
document.querySelectorAll(".chipset .chip").forEach(chip=>{
  chip.addEventListener("click", ()=>{ chip.classList.toggle("on"); updatePreview(); });
});
const FORM_IDS = ["f-entryDT","f-account","f-startBal","f-direction","f-contracts","f-asset",
  "f-strategy","f-timeframe","f-entryPrice","f-stopPrice","f-tpPrice","f-commIn","f-status",
  "f-exitDT","f-exitPrice","f-commOut","f-deposit","f-result","f-rr","f-riskPct","f-resultPct",
  "f-bias","f-entryModel","f-news","f-lead","f-q3","f-checklist","f-notes"];
function readForm(){
  const g = id => document.getElementById(id).value.trim();
  return {
    id: Date.now()+"_"+Math.random().toString(36).slice(2,7),
    entryDT:g("f-entryDT"), account:g("f-account"), startBalance:g("f-startBal"),
    direction:g("f-direction"), contracts:g("f-contracts"), asset:g("f-asset"),
    strategy:g("f-strategy"), timeframe:g("f-timeframe"), entryPrice:g("f-entryPrice"),
    stopPrice:g("f-stopPrice"), tpPrice:g("f-tpPrice"), commIn:g("f-commIn"),
    status:g("f-status"), exitDT:g("f-exitDT"), exitPrice:g("f-exitPrice"),
    commOut:g("f-commOut"), deposit:g("f-deposit"), result:g("f-result"), rr:g("f-rr"),
    riskPct:g("f-riskPct"), resultPct:g("f-resultPct"), bias:g("f-bias"),
    entryModel:g("f-entryModel"), news:g("f-news"), lead:g("f-lead"), q3:g("f-q3"),
    checklist:g("f-checklist"), notes:g("f-notes"),
    stages:chipVals("f-stages"), target:chipVals("f-target"),
    emotions:chipVals("f-emotions"), mistake:chipVals("f-mistake")
  };
}
function updatePreview(){
  const m = computeTrade(readForm());
  document.getElementById("j2-preview").innerHTML =
    "<span>Max loss <b>"+fmtMoney(m.maxLoss)+"</b></span>"+
    "<span>Max profit <b>"+fmtMoney(m.maxProfit)+"</b></span>"+
    "<span>Risk <b>"+fmtPc(m.riskPct)+"</b></span>"+
    "<span>Max R:R <b>"+fmtN(m.maxRR)+"</b></span>"+
    "<span>Points <b>"+fmtN(m.points)+"</b></span>"+
    "<span>P&amp;L <b>"+fmtMoney(m.pnl)+"</b></span>"+
    "<span>R multiple <b>"+fmtN(m.rMultiple)+"</b></span>";
}
FORM_IDS.forEach(id=>{
  const el = document.getElementById(id);
  el.addEventListener("input", updatePreview);
  el.addEventListener("change", updatePreview);
});
function resetForm(){
  FORM_IDS.forEach(id=>{
    const el = document.getElementById(id);
    if(el.tagName==="SELECT") el.selectedIndex = 0; else el.value = "";
  });
  ["f-stages","f-target","f-emotions","f-mistake"].forEach(id=>setChips(id,[]));
  document.getElementById("f-startBal").value = "50000";
  document.getElementById("f-contracts").value = "1";
  // Carry the checklist's bias across so it doesn't have to be retyped — read from its
  // persisted snapshot (js/checklist-state.js, key kept in sync by hand) since this page
  // never runs the checklist's own compute.
  let biasDir = null;
  try{
    const saved = JSON.parse(localStorage.getItem("archilect_checklist_v1"));
    biasDir = saved && saved.computed ? saved.computed.biasDirection : null;
  }catch(e){}
  if(biasDir==="Bullish" || biasDir==="Bearish"){
    document.getElementById("f-bias").value = biasDir;
  }
  updatePreview();
}
function toggleForm(open){
  const wrap = document.getElementById("j2-form-wrap");
  const isOpen = !wrap.classList.contains("collapsed");
  const next = (open===undefined) ? !isOpen : open;
  wrap.classList.toggle("collapsed", !next);
  if(next && !isOpen) resetForm();
}
document.getElementById("j2-toggleForm").addEventListener("click", ()=>toggleForm());
document.getElementById("j2-cancel").addEventListener("click", ()=>toggleForm(false));
document.getElementById("j2-save").addEventListener("click", ()=>{
  const t = readForm();
  if(!t.entryDT){ alert("An entry date and time is required."); return; }
  const arr = loadTrades(); arr.push(t); saveTrades(arr);
  toggleForm(false); refreshJournalUI();
});
["j2-fAccount","j2-fAsset","j2-fResult","j2-fStrategy"].forEach(id=>{
  document.getElementById(id).addEventListener("change", renderJournal2);
});

document.getElementById("j2-clear").addEventListener("click", clearAllTrades);
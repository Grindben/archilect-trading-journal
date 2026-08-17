"use strict";
/* ============================================================
   BUILD — Market Conditions checklist
   ============================================================ */
const mcSectionsWrap = document.getElementById("mc-sections");
let mcIndex = 0;
MC_SECTIONS.forEach((section, si)=>{
  mcIndex++;
  // Each section and each item is wrapped in the same collapsible/collapse-inner pair
  // components/collapsible.js uses for the Bias panel, so hiding either animates smoothly
  // instead of snapping — see applyMcItemVisibility() below.
  const sectionWrap = el("div","collapsible");
  const sectionInner = el("div","collapse-inner");
  section._wrap = sectionWrap;
  const group = el("div","section-group");
  group.appendChild(el("div","section-title", `<span class="idx">${String(mcIndex).padStart(2,"0")}</span>${section.name}`));
  const card = el("div","card");
  section.items.forEach((item, ii)=>{
    const itemWrap = el("div","collapsible");
    const itemInner = el("div","collapse-inner");
    const row = el("div", "item type-"+item.type);
    const textWrap = el("div","item-text-wrap");
    textWrap.appendChild(el("div","item-text", item.label));
    const tags = el("div","item-tags");
    const badgeClass = item.points>0 ? "pos" : (item.points<0 ? "neg" : "zero");
    tags.appendChild(el("span","pts-badge "+badgeClass, (item.points>0?"+":"")+item.points));
    if(item.type==="stop") tags.appendChild(el("span","stop-tag","STOP"));
    textWrap.appendChild(tags);
    if(item.alert){
      const alertEl = el("div","item-alert");
      alertEl.appendChild(el("span",null,"⚠ "+item.alert));
      textWrap.appendChild(alertEl);
      item._alertEl = alertEl;
    }
    row.appendChild(textWrap);
    const seg = el("div","seg");
    seg.innerHTML = `<button type="button" class="seg-btn active sel-no" data-val="No">No</button><button type="button" class="seg-btn" data-val="Yes">Yes</button>`;
    row.appendChild(seg);
    itemInner.appendChild(row);
    itemWrap.appendChild(itemInner);
    card.appendChild(itemWrap);
    item._seg = seg;
    item._row = row;
    item._wrap = itemWrap;
    wireSeg(seg);
  });
  group.appendChild(card);
  sectionInner.appendChild(group);
  sectionWrap.appendChild(sectionInner);
  mcSectionsWrap.appendChild(sectionWrap);
});

// Manual review mode: once validated, only the items answered Yes stay visible (and any
// section left with nothing Yes disappears entirely) — same mechanism the automatic Stop
// trigger already uses, just user-triggered instead of forced by a Stop answer. Validated
// Yes items also lose their Yes/No toggle so they can't be changed without going back to Edit.
let mcValidated = false;
function applyMcItemVisibility(stopTriggered){
  MC_SECTIONS.forEach(section=>{
    let sectionHasVisibleItem = false;
    section.items.forEach(item=>{
      const isYes = segVal(item._seg)==="Yes";
      const triggers = item.invert ? !isYes : isYes;
      const isTriggeringStop = item.type==="stop" && triggers;
      const show = stopTriggered ? isTriggeringStop : (mcValidated ? triggers : true);
      item._wrap.classList.toggle("collapsed", !show);
      // Locks any visible item once validated, including a Stop item that's triggering
      // the "STOP TRADING" state — going back to Edit is what un-locks it again.
      item._seg.classList.toggle("is-hidden", mcValidated && show);
      if(show) sectionHasVisibleItem = true;
    });
    if(section._wrap) section._wrap.classList.toggle("collapsed", !sectionHasVisibleItem);
  });
}

const mcValidateBar = document.getElementById("mc-validate-bar");
const mcValidateBtn = document.getElementById("mc-validate-btn");
const mcEditBtn = document.getElementById("mc-edit-btn");
mcValidateBtn.addEventListener("click", ()=>{
  preserveScrollAround(mcValidateBar, ()=>{
    mcValidated = true;
    mcValidateBtn.style.display = "none";
    mcEditBtn.style.display = "";
    recomputeAll(); // also persists mcValidated via saveChecklistSession(), see js/checklist-state.js
    if(typeof applyNewsLockState === "function") applyNewsLockState();
    if(typeof applyStepGating === "function") applyStepGating();
  });
});
mcEditBtn.addEventListener("click", ()=>{
  preserveScrollAround(mcValidateBar, ()=>{
    mcValidated = false;
    mcEditBtn.style.display = "none";
    mcValidateBtn.style.display = "";
    recomputeAll();
    if(typeof applyNewsLockState === "function") applyNewsLockState();
    if(typeof applyStepGating === "function") applyStepGating();
  });
});

function computeMarketConditions(){
  let raw = 10;
  let stopTriggered = false;
  const alerts = [];
  MC_SECTIONS.forEach(section=>{
    section.items.forEach(item=>{
      const yes = segVal(item._seg)==="Yes";
      const triggers = item.invert ? !yes : yes;
      if(item._alertEl) item._alertEl.classList.toggle("show", triggers && !!item.alert);
      if(triggers){
        raw += item.points;
        if(item.type==="stop") stopTriggered = true;
        if(item.alert) alerts.push(item.alert);
      }
    });
  });
  applyMcItemVisibility(stopTriggered);
  const final = clamp(raw,0,10);
  let verdict;
  if(stopTriggered) verdict = "STOP TRADING";
  else if(final < 2.5) verdict = "No Trade";
  else if(final < 7.5) verdict = "Optional Half-Risk";
  else verdict = "Active Trade Window";
  return {raw, final, stopTriggered, verdict, alerts};
}

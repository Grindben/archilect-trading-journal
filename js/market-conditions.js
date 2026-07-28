"use strict";
/* ============================================================
   BUILD — Market Conditions checklist
   ============================================================ */
const mcSectionsWrap = document.getElementById("mc-sections");
let mcIndex = 0;
MC_SECTIONS.forEach((section, si)=>{
  mcIndex++;
  const group = el("div","section-group");
  group.appendChild(el("div","section-title", `<span class="idx">${String(mcIndex).padStart(2,"0")}</span>${section.name}`));
  const card = el("div","card");
  section.items.forEach((item, ii)=>{
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
    card.appendChild(row);
    item._seg = seg;
    item._row = row;
    wireSeg(seg);
  });
  group.appendChild(card);
  mcSectionsWrap.appendChild(group);
});

function computeMarketConditions(){
  let raw = 10;
  let stopTriggered = false;
  const alerts = [];
  MC_SECTIONS.forEach(section=>{
    section.items.forEach(item=>{
      const yes = segVal(item._seg)==="Yes";
      if(item._alertEl) item._alertEl.classList.toggle("show", yes && !!item.alert);
      if(yes){
        raw += item.points;
        if(item.type==="stop") stopTriggered = true;
        if(item.alert) alerts.push(item.alert);
      }
    });
  });
  const final = clamp(raw,0,10);
  let verdict;
  if(stopTriggered) verdict = "STOP TRADING";
  else if(final < 2.5) verdict = "No Trade";
  else if(final < 7.5) verdict = "Optional Half-Risk";
  else verdict = "Active Trade Window";
  return {raw, final, stopTriggered, verdict, alerts};
}
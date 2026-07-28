"use strict";
function chipVals(id){ return Array.from(document.querySelectorAll("#"+id+" .chip.on")).map(c=>c.dataset.val); }
function setChips(id, vals){
  const set = new Set(vals||[]);
  document.querySelectorAll("#"+id+" .chip").forEach(c=>c.classList.toggle("on", set.has(c.dataset.val)));
}

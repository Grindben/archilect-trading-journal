"use strict";
function setSegValue(container, val){
  container.querySelectorAll(".seg-btn").forEach(b=>{
    const on = val === b.dataset.val;
    b.classList.toggle("active", on);
    b.classList.toggle("sel-no", on && b.dataset.val==="No");
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  container.dataset.value = val || "";
}

function wireSeg(container, defaultVal){
  container.querySelectorAll(".seg-btn").forEach(b=>{
    b.addEventListener("click", ()=>{
      // Clicking the already-selected choice clears it — back to unanswered.
      const next = container.dataset.value === b.dataset.val ? "" : b.dataset.val;
      setSegValue(container, next);
      recomputeAll();
    });
  });
  setSegValue(container, defaultVal === undefined ? "No" : defaultVal);
}
// Unanswered counts as "No" for scoring — matching an unchecked box in the workbook.
function segVal(container){ return container ? (container.dataset.value || "No") : "No"; }
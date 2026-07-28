"use strict";
/* ============================================================
   INIT — Trading Checklist page
   ============================================================ */
restoreChecklistSession();
refreshJournalUI();

// Lets the Dashboard's "Continue checklist" link jump straight to a given step,
// e.g. trading-checklist.html#bias — falls back to Conditions when there's no hash.
const startPanel = location.hash ? location.hash.slice(1) : "";
if(startPanel && document.getElementById("panel-"+startPanel)) goToPanel(startPanel);

// The opening state is painted instantly; animate only changes the reader makes.
requestAnimationFrame(()=>requestAnimationFrame(()=>{
  document.body.classList.remove("booting");
}));

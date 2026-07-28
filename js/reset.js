"use strict";
/* ============================================================
   RESET
   ============================================================ */
document.getElementById("resetAllBtn").addEventListener("click", ()=>{
  if(!confirm("Reset the entire checklist (Conditions, Bias, Setup)? The journal will not be affected.")) return;
  document.querySelectorAll(".seg").forEach(seg=>setSegValue(seg,"No"));
  document.getElementById("b-vol").value = "High";
  document.getElementById("b-of").value = "None";
  document.getElementById("b-dolType").value = "SD Level";
  refreshDolLevels();
  document.getElementById("s-4h").value = "Bullish";
  document.getElementById("s-1h").value = "Bullish";
  document.getElementById("s-15m").value = "Bullish";
  document.getElementById("s-ssmt").value = "None";
  document.getElementById("s-closeVs").value = "No Close Beyond";
  document.getElementById("s-c2").value = "No Rejection Candle";
  document.getElementById("s-setupType").value = "2 Stages";
  document.getElementById("rc-4h").value = "Bullish";
  document.getElementById("rc-1h").value = "Bullish";
  document.getElementById("rc-esLevel").value = KEY_LEVELS[0];
  document.getElementById("rc-nqLevel").value = KEY_LEVELS[0];
  syncSelects();
  recomputeAll();
});
"use strict";
/* ============================================================
   COMPUTE — Setup
   ============================================================ */
function computeSetup(biasResult){
  const biasDir = biasResult.direction; // Bullish/Bearish/Neutral/No Bias/n/a/Wait...
  const dir4h = document.getElementById("s-4h").value;
  const dir1h = document.getElementById("s-1h").value;
  const dir15 = document.getElementById("s-15m").value;

  const biasIsDirectional = (biasDir==="Bullish" || biasDir==="Bearish");
  const align4h = biasIsDirectional ? (dir4h===biasDir ? "Aligned":"Not Aligned") : "Not Aligned";
  const align1h = biasIsDirectional ? (dir1h===biasDir ? "Aligned":"Not Aligned") : "Not Aligned";
  const align15 = biasIsDirectional ? (dir15===biasDir ? "Aligned":"Not Aligned") : "Not Aligned";

  const ssmt = document.getElementById("s-ssmt").value;
  let mtfAlignment = "—";
  if(ssmt==="90' SSMT") mtfAlignment = align1h;
  else if(ssmt==="Daily SSMT") mtfAlignment = align4h;
  else if(ssmt==="Micro SSMT") mtfAlignment = align15;
  else if(ssmt!=="None") mtfAlignment = "Not Aligned";

  const closeVs = document.getElementById("s-closeVs").value;
  const c2 = document.getElementById("s-c2").value;
  const rejOuiNon = c2==="Rejection Candle" ? "Oui" : "Non";

  let signal="—", candleType="—", entry="—", grade="No Trade";

  if(ssmt==="None"){
    signal = "No Trade: wait for SSMT";
    candleType = "—";
    entry = "—";
    grade = "No Trade";
  } else {
    const key = mtfAlignment+"|"+closeVs+"|"+rejOuiNon;
    const ref = REFERENTIEL[key];
    grade = ref ? ref.grade : "";
    if((grade==="A" || grade==="A+") && c2==="Rejection Candle"){
      signal = "C2"; candleType = "Rejection Candle"; entry = "C3";
    } else if(ref){
      signal = ref.signal; candleType = ref.label; entry = ref.entry;
    }
  }

  const risk = RISK_TABLE[grade] || null;

  return {biasDir, align4h, align1h, align15, mtfAlignment, signal, candleType, entry, grade, risk};
}

// Rebuilds the Setup Type list to match the active volatility branch, clamps the current
// selection if it's no longer valid, and returns the (possibly corrected) value.
function refreshSetupTypeOptions(vol){
  const sel = document.getElementById("s-setupType");
  const desired = (vol==="High") ? ["2 Stages"] : ["2 Stages","Reverse Setup","Catch Up Setup"];
  const current = Array.from(sel.options).map(o=>o.value);
  if(current.length !== desired.length || current.some((v,i)=>v!==desired[i])){
    const keep = desired.indexOf(sel.value)>-1 ? sel.value : "2 Stages";
    sel.innerHTML = desired.map(v=>`<option value="${v}">${v}</option>`).join("");
    sel.value = keep;
    syncSelects();
  }
  return sel.value;
}

// Reverse and Catch Up share the same synchronization-based scoring: start at A+ and drop
// one tier per failed check (YM desync, then ES/NQ direction, then a mismatched key level).
function computeReverseCatchUp(biasResult, kind){
  const direction = kind==="Reverse Setup" ? "Against the Bias" : "Aligned with the Bias";
  const biasDir = biasResult.direction;
  const dir4h = document.getElementById("rc-4h").value;
  const dir1h = document.getElementById("rc-1h").value;
  const biasIsDirectional = (biasDir==="Bullish" || biasDir==="Bearish");
  const align4h = biasIsDirectional ? (dir4h===biasDir ? "Aligned":"Not Aligned") : "Not Aligned";
  const align1h = biasIsDirectional ? (dir1h===biasDir ? "Aligned":"Not Aligned") : "Not Aligned";

  const ymSync = segVal(document.getElementById("rc-ymSync")) === "Yes";
  const directional = segVal(document.getElementById("rc-directional")) === "Yes";
  const esLevel = document.getElementById("rc-esLevel").value;
  const nqLevel = document.getElementById("rc-nqLevel").value;
  const sameLevel = esLevel === nqLevel;

  let fails = 0;
  if(!ymSync) fails++;
  if(!directional) fails++;
  if(!sameLevel) fails++;

  const grade = RC_LADDER[Math.min(fails,3)];
  const risk = RISK_TABLE[grade] || null;

  return {direction, biasDir, dir4h, dir1h, align4h, align1h, ymSync, directional,
          esLevel, nqLevel, sameLevel, fails, grade, risk};
}
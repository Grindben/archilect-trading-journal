"use strict";
/* ============================================================
   COMPUTE — Bias
   ============================================================ */
function computeBias(){
  const vol = document.getElementById("b-vol").value;
  const mondayYes = segVal(byId("b-monday")) === "Yes";

  const activeBranch = vol==="High" ? "Session Sweep" : (mondayYes ? "Monday Auto-Bullish" : "OF + Liquidity");

  // Session sweep
  const asiaHigh = segVal(byId("b-asiaHigh"))==="Yes";
  const asiaLow  = segVal(byId("b-asiaLow"))==="Yes";
  const lonHigh  = segVal(byId("b-lonHigh"))==="Yes";
  const lonLow   = segVal(byId("b-lonLow"))==="Yes";
  let sweepVerdict = "n/a";
  if(vol==="High"){
    if(asiaHigh && asiaLow) sweepVerdict = "Wait Asia's Sweep";
    else if(asiaHigh) sweepVerdict = "Bearish";
    else if(asiaLow) sweepVerdict = "Bullish";
    else if(lonHigh && lonLow) sweepVerdict = "Wait London's Sweep";
    else if(lonHigh) sweepVerdict = "Bearish";
    else if(lonLow) sweepVerdict = "Bullish";
    else sweepVerdict = "No Bias";
  }

  // OF + Liquidity
  const ofVal = document.getElementById("b-of").value; // None/Bullish/Bearish/Neutral
  let bullPts = 0, bearPts = 0, neutPts = 0;
  if(ofVal==="Bullish") bullPts += 3;
  if(ofVal==="Bearish") bearPts += 3;
  if(ofVal==="Neutral") neutPts += 3;
  TIME_POOLS.concat(PRICE_POOLS).forEach(pool=>{
    if(segVal(pool._highSeg)==="Yes") bullPts += 1;
    if(segVal(pool._lowSeg)==="Yes") bearPts += 1;
  });
  let preConv = "n/a";
  if(vol!=="High"){
    const mx = Math.max(bullPts,bearPts,neutPts);
    if(mx===0) preConv = "No Bias";
    else if(bullPts>bearPts && bullPts>neutPts) preConv = "Bullish";
    else if(bearPts>bullPts && bearPts>neutPts) preConv = "Bearish";
    else preConv = "Neutral";
  }

  // Conviction modifiers
  const seekDestroy = segVal(byId("b-seekDestroy"))==="Yes";
  const consolidation = segVal(byId("b-consolidation"))==="Yes";
  const bullExp = segVal(byId("b-bullExp"))==="Yes";
  const bearExp = segVal(byId("b-bearExp"))==="Yes";
  const rejPDH = segVal(byId("b-rejPDH"))==="Yes";
  const rejPDL = segVal(byId("b-rejPDL"))==="Yes";
  const irConfirm = segVal(byId("b-irConfirm"))==="Yes";
  const irDiverge = segVal(byId("b-irDiverge"))==="Yes";

  function dynDelta(posIfBullish){
    // posIfBullish=true -> +1 if preConv Bullish, -1 if Bearish, else 0
    if(preConv==="Bullish") return posIfBullish ? 1 : -1;
    if(preConv==="Bearish") return posIfBullish ? -1 : 1;
    return 0;
  }
  let deltaSum = 0;
  if(seekDestroy) deltaSum += -1;
  if(consolidation) deltaSum += -1;
  if(bullExp) deltaSum += dynDelta(true);
  if(bearExp) deltaSum += dynDelta(false);
  if(rejPDH) deltaSum += dynDelta(false);
  if(rejPDL) deltaSum += dynDelta(true);
  if(irConfirm) deltaSum += 1;
  if(irDiverge) deltaSum += -1;

  // Bias direction (C66)
  let direction;
  if(vol!=="High" && mondayYes) direction = "Bullish";
  else if(vol==="High") direction = sweepVerdict;
  else direction = preConv;

  // Conviction (C58)
  let conviction = null; // number or null (dash)
  if(vol!=="High" && mondayYes){
    conviction = 3;
  } else if(direction==="Bullish" || direction==="Bearish"){
    if(vol==="High") conviction = 3;
    else conviction = median3(1,5,3+deltaSum);
  } else {
    conviction = null;
  }

  // 1-2 = Weak, 3 = plain direction (no modifier), 4-5 = Strong.
  const convictionLabel = conviction!==null
    ? (conviction<=2 ? "Weak " : conviction>=4 ? "Strong " : "") + direction
    : "—";

  // Draw on liquidity
  const dolT = document.getElementById("b-dolType").value;
  const dolL = document.getElementById("b-dolLevel").value;
  const dolResult = dolL ? (dolT+" — "+dolL) : "—";

  // Verdict
  let verdict;
  if(direction && direction.indexOf("Wait")===0){
    verdict = "WAIT FOR " + direction.slice(5).toUpperCase();
  } else if(direction==="No Bias"){
    verdict = "NO BIAS — NO TRADING";
  } else if(direction==="Neutral"){
    verdict = "NEUTRAL BIAS";
  } else if(direction==="n/a" || !direction){
    verdict = "—";
  } else {
    verdict = convictionLabel.toUpperCase()+" BIAS";
  }

  return {vol, mondayYes, activeBranch, sweepVerdict, asiaHigh, asiaLow, bullPts, bearPts, neutPts, preConv,
          direction, conviction, convictionLabel, dolResult, verdict};
}
function byId(id){ return document.getElementById(id); }
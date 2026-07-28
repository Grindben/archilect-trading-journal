"use strict";
/* ============================================================
   RENDER — Summaries & stepper lights
   ============================================================ */
function verdictClass(v){
  if(v==="STOP TRADING" || v==="No Trade") return "stop";
  if(v==="Optional Half-Risk") return "caution";
  if(v==="Active Trade Window") return "go";
  return "grey";
}
function lightClassFor(kind, value){
  if(kind==="mc"){
    if(value==="STOP TRADING"||value==="No Trade") return "stop";
    if(value==="Optional Half-Risk") return "caution";
    if(value==="Active Trade Window") return "go";
    return "neutral";
  }
  if(kind==="bias"){
    if(!value || value==="—") return "neutral";
    if(value.indexOf("BEARISH")===0 || value.indexOf("BULLISH")===0) return "go";
    if(value.indexOf("NO BIAS")===0) return "stop";
    if(value.indexOf("WAIT")===0) return "caution";
    if(value.indexOf("NEUTRAL")===0) return "caution";
    return "neutral";
  }
  if(kind==="setup"){
    if(value==="A+"||value==="A") return "go";
    if(value==="B") return "caution";
    if(value==="B-") return "stop";
    return "neutral";
  }
}

function recomputeAll(){
  // ---- Market Conditions ----
  const mc = computeMarketConditions();
  document.getElementById("mc-score").textContent = mc.final.toFixed(1);
  document.getElementById("mc-score-block").classList.toggle("collapsed-x", mc.stopTriggered);
  const mcPill = document.getElementById("mc-verdict-pill");
  mcPill.textContent = mc.verdict;
  mcPill.className = "verdict-pill " + verdictClass(mc.verdict);
  const alertsEl = document.getElementById("mc-alerts");
  if(mc.alerts.length){
    // Text is only rewritten while opening, so it doesn't blank out mid-collapse.
    document.getElementById("mc-alerts-text").textContent = mc.alerts.join("  |  ");
    alertsEl.classList.add("show");
  } else {
    alertsEl.classList.remove("show");
  }
  setLight("conditions", lightClassFor("mc", mc.verdict));
  // A Stop overrides the score entirely, so the number is suppressed here too.
  document.getElementById("state-conditions").textContent = mc.stopTriggered ? "\u00a0" : mc.final.toFixed(1)+"/10";

  // ---- Bias ----
  const bias = computeBias();
  document.getElementById("b-activeBranch").textContent = bias.activeBranch;
  const isHighVol = bias.vol==="High";
  setCollapsed("b-sweep-group", !isHighVol);
  // Asia resolves the sweep on its own, so London is only asked when both Asia levels are untouched.
  const asiaDecides = bias.asiaHigh || bias.asiaLow;
  setCollapsed("b-lonHigh-row", asiaDecides);
  setCollapsed("b-lonLow-row", asiaDecides);
  setCollapsed("b-offliq-group", isHighVol || bias.mondayYes);
  // On a High Volatility day the Monday rule never applies — the Session Sweep branch takes over.
  setCollapsed("b-monday-row", isHighVol);
  // On a High Volatility day conviction is fixed at plain Bullish/Bearish (no Weak/Strong modifier), so these modifiers have no effect.
  setCollapsed("b-conviction-group", isHighVol);
  setCollapsed("b-intermarket-group", isHighVol);
  document.getElementById("b-sweepVerdict").textContent = bias.sweepVerdict;
  document.getElementById("b-bullPts").textContent = bias.bullPts;
  document.getElementById("b-bearPts").textContent = bias.bearPts;
  document.getElementById("b-neutPts").textContent = bias.neutPts;
  document.getElementById("b-preConv").textContent = bias.preConv;
  document.getElementById("b-dolResult").textContent = bias.dolResult;
  document.getElementById("b-direction").textContent = bias.direction || "—";
  document.getElementById("b-convictionStars").textContent = bias.convictionLabel;
  document.getElementById("b-verdict").textContent = bias.verdict;
  document.getElementById("bias-branch").textContent = "Active branch: " + bias.activeBranch;
  // Direction leads, conviction follows — mirroring the Conditions panel (score, then verdict).
  document.getElementById("bias-stars").textContent =
    (bias.direction && bias.direction!=="n/a") ? bias.direction : "—";
  const biasPill = document.getElementById("bias-verdict-pill");
  if(bias.conviction !== null){
    // The direction is already the big text right next to this pill (bias-stars above),
    // so the pill only ever adds the conviction modifier — Weak / Strong — never repeats
    // the direction word. A plain (unmodified) conviction shows no pill at all.
    biasPill.style.display = bias.convictionModifier ? "" : "none";
    biasPill.textContent = bias.convictionModifier;
    biasPill.className = "verdict-pill " + (bias.convictionModifier==="Strong" ? "go" : "caution");
  } else {
    const cls = lightClassFor("bias", bias.verdict);
    biasPill.style.display = "";
    biasPill.textContent = bias.verdict;
    biasPill.className = "verdict-pill " + (cls==="neutral" ? "grey" : cls);
  }
  setLight("bias", lightClassFor("bias", bias.verdict));
  document.getElementById("state-bias").textContent = bias.direction && bias.direction!=="n/a" ? bias.direction : "—";

  // ---- Setup ----
  document.getElementById("s-biasFromSheet").textContent = bias.direction || "—";

  // Reverse / Catch Up are only meaningful once the bias comes from the OF+Liquidity or
  // Monday branch (Low/Medium volatility) — a High Volatility day only ever offers 2 Stages.
  const setupType = refreshSetupTypeOptions(bias.vol);
  document.getElementById("setup-2stages").classList.toggle("is-hidden", setupType !== "2 Stages");
  document.getElementById("setup-rc").classList.toggle("is-hidden", setupType === "2 Stages");

  let setup;
  if(setupType === "2 Stages"){
    setup = computeSetup(bias);
    document.getElementById("s-4hAlign").textContent = setup.align4h;
    document.getElementById("s-1hAlign").textContent = setup.align1h;
    document.getElementById("s-15mAlign").textContent = setup.align15;
    document.getElementById("s-mtfAlign").textContent = setup.mtfAlignment;
    document.getElementById("s-signal").textContent = setup.signal;
    document.getElementById("s-candleType").textContent = setup.candleType;
    document.getElementById("s-entry").textContent = setup.entry;
  } else {
    setup = computeReverseCatchUp(bias, setupType);
    document.getElementById("rc-direction").textContent = setup.direction;
    document.getElementById("rc-biasFromSheet").textContent = bias.direction || "—";
    document.getElementById("rc-4hAlign").textContent = setup.align4h;
    document.getElementById("rc-1hAlign").textContent = setup.align1h;
    document.getElementById("rc-sameLevel").textContent = setup.sameLevel ? "Yes" : "No";
    document.getElementById("rc-failCount").textContent = setup.fails + " / 3";
    document.getElementById("rc-setupTypeLabel").textContent = setupType;
    document.getElementById("rc-gradeVal").textContent = setup.grade;
    document.getElementById("rc-riskFunded").textContent = setup.risk ? fmtPct(setup.risk.funded) : "—";
    document.getElementById("rc-riskChallenge").textContent = setup.risk ? fmtPct(setup.risk.challenge) : "—";
  }

  document.getElementById("s-gradeVal").textContent = setup.grade;
  document.getElementById("s-riskFunded").textContent = setup.risk ? fmtPct(setup.risk.funded) : "—";
  document.getElementById("s-riskChallenge").textContent = setup.risk ? fmtPct(setup.risk.challenge) : "—";
  document.getElementById("s-grade").textContent = setup.grade==="No Trade" ? "—" : setup.grade;
  const sPill = document.getElementById("s-grade-pill");
  sPill.textContent = setup.grade;
  sPill.className = "verdict-pill " + (lightClassFor("setup",setup.grade)==="go"?"go":lightClassFor("setup",setup.grade)==="caution"?"caution":lightClassFor("setup",setup.grade)==="stop"?"stop":"grey");
  document.getElementById("s-risk").textContent = setup.risk ? `Risk Funded ${fmtPct(setup.risk.funded)} · Challenge ${fmtPct(setup.risk.challenge)}` : "Risk Funded — · Challenge —";
  setLight("setup", lightClassFor("setup", setup.grade));
  document.getElementById("state-setup").textContent = setup.grade;

  // journal snapshot preview
  // ---- Persistent status strip (always visible, mirrors Excel's frozen header cells) ----
  const ssMcValue = document.getElementById("ss-mc-value");
  const ssMcTag = document.getElementById("ss-mc-tag");
  // On a Stop, the score is irrelevant — the Stop overrides it regardless of the number.
  document.getElementById("ss-mc-score").textContent = mc.final.toFixed(1)+"/10";
  ssMcValue.classList.toggle("collapsed-x", mc.stopTriggered);
  ssMcTag.textContent = mc.verdict==="Active Trade Window" ? "ACTIVE" : mc.verdict==="Optional Half-Risk" ? "HALF-RISK" : mc.verdict==="No Trade" ? "NO TRADE" : "STOP TRADING";
  ssMcTag.className = "ss-tag " + verdictClass(mc.verdict);

  const ssBiasValue = document.getElementById("ss-bias-value");
  const ssBiasTag = document.getElementById("ss-bias-tag");
  if(bias.direction && bias.direction!=="n/a"){
    ssBiasValue.textContent = bias.direction;
    // The direction is already shown in the value next to it, so the tag only ever adds
    // the conviction modifier — Weak / Strong — never repeats the direction word itself.
    // A plain (unmodified) conviction shows nothing here at all.
    ssBiasTag.textContent = bias.convictionModifier || "";
    ssBiasTag.style.display = bias.convictionModifier ? "" : "none";
  } else {
    ssBiasValue.textContent = "—";
    ssBiasTag.textContent = "—";
    ssBiasTag.style.display = "";
  }
  if(bias.convictionModifier === "Strong"){
    ssBiasTag.className = "ss-tag go";
  } else if(bias.convictionModifier === "Weak"){
    ssBiasTag.className = "ss-tag caution";
  } else {
    const biasLightCls = lightClassFor("bias", bias.verdict);
    ssBiasTag.className = "ss-tag " + (biasLightCls==="neutral" ? "grey" : biasLightCls);
  }

  document.getElementById("ss-setup-value").textContent = setup.grade;
  const ssSetupTag = document.getElementById("ss-setup-tag");
  ssSetupTag.textContent = setup.risk ? "FUNDED "+fmtPct(setup.risk.funded) : "—";
  const setupLightCls = lightClassFor("setup", setup.grade);
  ssSetupTag.className = "ss-tag " + (setupLightCls==="neutral" ? "grey" : setupLightCls);

  // ---- Checklist's own quick-log snapshot cards ----
  const jsMc = document.getElementById("j-snap-mc");
  if(jsMc) jsMc.textContent = mc.stopTriggered ? "STOP TRADING" : mc.final.toFixed(1)+" — "+mc.verdict;
  const jsBias = document.getElementById("j-snap-bias");
  if(jsBias) jsBias.textContent = (bias.direction && bias.direction!=="n/a")
    ? (bias.conviction!==null ? bias.convictionLabel : bias.direction)
    : "—";
  const jsSetup = document.getElementById("j-snap-setup");
  if(jsSetup){
    // Shows which of the three Setup Types is active — chosen directly on Low/Medium
    // Volatility days, or forced to 2 Stages (the only option) on a High Volatility day.
    const activeSetupType = document.getElementById("s-setupType").value;
    jsSetup.textContent = activeSetupType + " — " + setup.grade;
  }

  window._lastCompute = {mc, bias, setup};
  // The Dashboard lives on a separate page now — it reads this instead of shared DOM.
  if(typeof saveChecklistSession === "function") saveChecklistSession();
}

function setLight(tab, cls){
  const light = document.getElementById("light-"+tab);
  light.className = "light "+cls;
  const rail = document.getElementById("rail-"+({conditions:null,bias:"bias",setup:"setup",journal:"journal"}[tab]||""));
}
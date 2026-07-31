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
// A plain Bearish/Bullish direction is spelled out as "Bearish Bias"/"Bullish Bias" and
// colour-coded (red/green) everywhere it's shown as the headline direction — other states
// (Neutral, No Bias, Wait for..., n/a) are left as-is, they're not what was asked for.
function formatBiasDirection(direction){
  if(direction==="Bearish") return {text:"Bearish Bias", cls:"stop"};
  if(direction==="Bullish") return {text:"Bullish Bias", cls:"go"};
  return {text:(direction && direction!=="n/a") ? direction : "—", cls:""};
}
// "BEARISH BIAS" -> "Bearish Bias" — the verdict is computed all-uppercase (bias.js), this
// is purely a display transform for the Result row.
function toTitleCase(str){
  return String(str).toLowerCase().replace(/\b\w/g, c=>c.toUpperCase());
}
// A+ gets its own deeper emerald so it still reads as a cut above plain A at a glance.
function gradeColorClass(grade){
  if(grade==="A+") return "aplus";
  if(grade==="A") return "go";
  if(grade==="B") return "caution";
  if(grade==="B-") return "stop";
  return "";
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
  const bDirectionEl = document.getElementById("b-direction");
  const bDirColorCls = bias.direction==="Bearish" ? "stop" : bias.direction==="Bullish" ? "go" : "";
  bDirectionEl.textContent = (bias.direction && bias.direction!=="n/a") ? bias.direction : "—";
  bDirectionEl.className = "v" + (bDirColorCls ? " "+bDirColorCls : "");
  // A plain (unmodified) conviction reads as just "Bearish"/"Bullish" — identical to the
  // Bias direction row right above it. "Neutral" makes clear it's the conviction *level*
  // that's neutral, not the direction itself.
  document.getElementById("b-convictionStars").textContent =
    (bias.conviction!==null && !bias.convictionModifier) ? "Neutral" : bias.convictionLabel;
  const bVerdictEl = document.getElementById("b-verdict");
  bVerdictEl.textContent = bias.verdict==="—" ? "—" : toTitleCase(bias.verdict);
  bVerdictEl.className = "v" + (bias.verdict.indexOf("BEARISH")>-1 ? " stop"
    : bias.verdict.indexOf("BULLISH")>-1 ? " go" : "");
  document.getElementById("bias-branch").textContent = "Active branch: " + bias.activeBranch;
  // Direction leads, conviction follows — mirroring the Conditions panel (score, then verdict).
  const biasStarsEl = document.getElementById("bias-stars");
  const biasStarsFmt = formatBiasDirection(bias.direction);
  biasStarsEl.textContent = biasStarsFmt.text;
  biasStarsEl.className = "score" + (biasStarsFmt.cls ? " "+biasStarsFmt.cls : "");
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
  // Once Bias is validated, the stepper dot commits to green regardless of verdict content —
  // it now reads as "this step is done", not "here's the current bias colour".
  setLight("bias", (typeof biasValidated !== "undefined" && biasValidated) ? "go" : lightClassFor("bias", bias.verdict));
  document.getElementById("state-bias").textContent = bias.direction && bias.direction!=="n/a" ? bias.direction : "—";

  // ---- Setup ----
  document.getElementById("s-biasFromSheet").textContent = bias.direction || "—";

  // Reverse / Catch Up are only meaningful once the bias comes from the OF+Liquidity or
  // Monday branch (Low/Medium volatility) — a High Volatility day only ever offers 2 Stages.
  const setupType = refreshSetupTypeOptions(bias.vol);
  // Bias & MTF Context (4H/1H/15m direction + alignment) stays visible for both "2 Stages"
  // and "None" — Reverse/Catch Up has its own equivalent card (setup-rc) instead.
  document.getElementById("setup-biasContext").classList.toggle("is-hidden", setupType === "Reverse Setup" || setupType === "Catch Up Setup");
  document.getElementById("setup-2stages").classList.toggle("is-hidden", setupType !== "2 Stages");
  document.getElementById("setup-rc").classList.toggle("is-hidden", setupType !== "Reverse Setup" && setupType !== "Catch Up Setup");

  // Alignment reads are independent of which Setup Type ends up active below, so refresh
  // them whenever the context card is visible (2 Stages or None) rather than only on 2 Stages.
  let setup;
  if(setupType === "2 Stages" || setupType === "None"){
    const stagesCtx = computeSetup(bias);
    document.getElementById("s-4hAlign").textContent = stagesCtx.align4h;
    document.getElementById("s-1hAlign").textContent = stagesCtx.align1h;
    document.getElementById("s-15mAlign").textContent = stagesCtx.align15;
    if(setupType === "2 Stages"){
      document.getElementById("s-mtfAlign").textContent = stagesCtx.mtfAlignment;
      document.getElementById("s-signal").textContent = stagesCtx.signal;
      document.getElementById("s-candleType").textContent = stagesCtx.candleType;
      document.getElementById("s-entry").textContent = stagesCtx.entry;
      setup = stagesCtx;
    } else {
      // No setup chosen for the day — Setup Scoring / Result / Guide stay hidden above,
      // this just carries an empty result through the shared grade/risk rendering below.
      setup = {grade:"No Setup", risk:null};
    }
  } else {
    setup = computeReverseCatchUp(bias, setupType);
    document.getElementById("rc-direction").textContent = setup.direction;
    document.getElementById("rc-biasFromSheet").textContent = bias.direction || "—";
    document.getElementById("rc-4hAlign").textContent = setup.align4h;
    document.getElementById("rc-1hAlign").textContent = setup.align1h;
    document.getElementById("rc-sameLevel").textContent = setup.sameLevel ? "Yes" : "No";
    document.getElementById("rc-failCount").textContent = setup.fails + " / 3";
    document.getElementById("rc-setupTypeLabel").textContent = setupType;
    const rcGradeCls = gradeColorClass(setup.grade);
    const rcGradeEl = document.getElementById("rc-gradeVal");
    rcGradeEl.textContent = setup.grade;
    rcGradeEl.className = "v" + (rcGradeCls ? " "+rcGradeCls : "");
    document.getElementById("rc-riskFunded").textContent = setup.risk ? fmtPct(setup.risk.funded) : "—";
    document.getElementById("rc-riskFunded").className = "v" + (setup.risk ? " gold" : "");
    document.getElementById("rc-riskChallenge").textContent = setup.risk ? fmtPct(setup.risk.challenge) : "—";
    document.getElementById("rc-riskChallenge").className = "v" + (setup.risk ? " gold" : "");
  }

  const sGradeCls = gradeColorClass(setup.grade);
  const sGradeValEl = document.getElementById("s-gradeVal");
  sGradeValEl.textContent = setup.grade;
  sGradeValEl.className = "v" + (sGradeCls ? " "+sGradeCls : "");
  document.getElementById("s-riskFunded").textContent = setup.risk ? fmtPct(setup.risk.funded) : "—";
  document.getElementById("s-riskFunded").className = "v" + (setup.risk ? " gold" : "");
  document.getElementById("s-riskChallenge").textContent = setup.risk ? fmtPct(setup.risk.challenge) : "—";
  document.getElementById("s-riskChallenge").className = "v" + (setup.risk ? " gold" : "");
  document.getElementById("s-grade").textContent = (setup.grade==="No Trade" || setup.grade==="No Setup") ? "—" : setup.grade;
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
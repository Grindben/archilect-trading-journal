"use strict";
/* ============================================================
   RISK SIZING — contracts = floor(risk budget $ / (stop points * $ per point))
   ============================================================ */
const RS_KEY = "archilect_risksizing_v1";
const RS_POINT_VALUE = { ES: 50, NQ: 20, MES: 5, MNQ: 2 };

function rsFmtMoney(v){
  if(v===null || v===undefined || isNaN(v)) return "—";
  return (v<0?"-":"") + "$" + Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}

function rsLoadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(RS_KEY));
    if(saved && typeof saved === "object") return saved;
  }catch(e){}
  return {};
}
function rsSaveState(){
  const state = {
    asset: document.getElementById("rs-asset").dataset.value,
    mode: document.getElementById("rs-mode").dataset.value,
    account: document.getElementById("rs-account").value,
    riskPct: document.getElementById("rs-riskPct").value,
    riskFixed: document.getElementById("rs-riskFixed").value,
    sl: document.getElementById("rs-sl").value
  };
  try{ localStorage.setItem(RS_KEY, JSON.stringify(state)); }catch(e){}
}

function rsSetAsset(val){
  const set = document.getElementById("rs-asset");
  set.dataset.value = val;
  set.querySelectorAll(".rs-asset-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.val === val);
  });
}

function rsSetMode(val){
  const set = document.getElementById("rs-mode");
  set.dataset.value = val;
  set.querySelectorAll(".seg-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.val === val);
  });
  document.getElementById("rs-pct-field").style.display = val === "pct" ? "" : "none";
  document.getElementById("rs-fixed-field").style.display = val === "fixed" ? "" : "none";
  document.querySelectorAll("#rs-risk-presets .chip").forEach(c=>c.classList.toggle("disabled", val !== "pct"));
}

function rsHighlightPreset(){
  const pct = parseFloat(document.getElementById("rs-riskPct").value);
  document.querySelectorAll("#rs-risk-presets .chip").forEach(c=>{
    c.classList.toggle("on", !isNaN(pct) && Math.abs(parseFloat(c.dataset.val) - pct) < 1e-9);
  });
  const sl = parseFloat(document.getElementById("rs-sl").value);
  document.querySelectorAll("#rs-sl-presets .chip").forEach(c=>{
    c.classList.toggle("on", !isNaN(sl) && Math.abs(parseFloat(c.dataset.val) - sl) < 1e-9);
  });
}

function rsCompute(){
  const asset = document.getElementById("rs-asset").dataset.value;
  const mode = document.getElementById("rs-mode").dataset.value;
  const account = parseFloat(document.getElementById("rs-account").value);
  const riskPct = parseFloat(document.getElementById("rs-riskPct").value);
  const riskFixed = parseFloat(document.getElementById("rs-riskFixed").value);
  const sl = parseFloat(document.getElementById("rs-sl").value);

  const riskDollars = mode === "pct"
    ? (account > 0 && !isNaN(riskPct) && riskPct >= 0 ? account * riskPct / 100 : NaN)
    : (!isNaN(riskFixed) && riskFixed >= 0 ? riskFixed : NaN);

  const pointValue = RS_POINT_VALUE[asset] || 0;
  const perContract = (!isNaN(sl) && sl > 0) ? sl * pointValue : NaN;

  const valueEl = document.getElementById("rs-contracts");
  const warnEl = document.getElementById("rs-warning");
  const bdEl = document.getElementById("rs-breakdown");

  if(isNaN(riskDollars) || riskDollars <= 0 || isNaN(perContract)){
    valueEl.textContent = "—";
    valueEl.classList.remove("zero");
    warnEl.textContent = "";
    warnEl.classList.remove("warn");
    bdEl.innerHTML = "";
    rsHighlightPreset();
    rsSaveState();
    return;
  }

  const contracts = Math.floor(riskDollars / perContract);
  const used = contracts * perContract;
  const leftover = riskDollars - used;
  const usedPct = account > 0 ? (used / account * 100) : null;

  valueEl.textContent = contracts;
  valueEl.classList.toggle("zero", contracts === 0);

  if(contracts === 0){
    const maxStop = Math.floor(riskDollars / pointValue);
    warnEl.classList.add("warn");
    warnEl.textContent = maxStop > 0
      ? "Risk budget too small for one contract at this stop. Max stop for 1 contract: " + maxStop + " pts."
      : "Risk budget too small for one contract of " + asset + " at any stop.";
  } else {
    warnEl.classList.remove("warn");
    warnEl.textContent = contracts + " contract" + (contracts > 1 ? "s" : "") + " of " + asset + " at a " + sl + " pt stop.";
  }

  bdEl.innerHTML = [
    ["Risk budget", rsFmtMoney(riskDollars)],
    ["Risk per contract", rsFmtMoney(perContract)],
    ["Risk used", rsFmtMoney(used) + (usedPct !== null ? " (" + usedPct.toFixed(2) + "% of account)" : "")],
    ["Unused risk", rsFmtMoney(leftover)]
  ].map(a => '<div class="rs-bd-row"><span>' + a[0] + '</span><b>' + a[1] + '</b></div>').join("");

  rsHighlightPreset();
  rsSaveState();
}

function rsInit(){
  const saved = rsLoadState();

  document.getElementById("rs-asset").querySelectorAll(".rs-asset-btn").forEach(b=>{
    b.addEventListener("click", ()=>{ rsSetAsset(b.dataset.val); rsCompute(); });
  });
  document.getElementById("rs-mode").querySelectorAll(".seg-btn").forEach(b=>{
    b.addEventListener("click", ()=>{ rsSetMode(b.dataset.val); rsCompute(); });
  });
  document.querySelectorAll("#rs-risk-presets .chip").forEach(c=>{
    c.addEventListener("click", ()=>{
      if(c.classList.contains("disabled")) return;
      document.getElementById("rs-riskPct").value = c.dataset.val;
      rsCompute();
    });
  });
  document.querySelectorAll("#rs-sl-presets .chip").forEach(c=>{
    c.addEventListener("click", ()=>{
      document.getElementById("rs-sl").value = c.dataset.val;
      rsCompute();
    });
  });
  ["rs-account","rs-riskPct","rs-riskFixed","rs-sl"].forEach(id=>{
    document.getElementById(id).addEventListener("input", rsCompute);
  });

  rsSetAsset(saved.asset || "MES");
  rsSetMode(saved.mode || "pct");
  document.getElementById("rs-account").value = saved.account !== undefined ? saved.account : 50000;
  document.getElementById("rs-riskPct").value = saved.riskPct !== undefined ? saved.riskPct : 0.5;
  document.getElementById("rs-riskFixed").value = saved.riskFixed !== undefined ? saved.riskFixed : 250;
  document.getElementById("rs-sl").value = saved.sl !== undefined ? saved.sl : 10;

  rsCompute();
}

rsInit();
requestAnimationFrame(()=>requestAnimationFrame(()=>{
  document.body.classList.remove("booting");
}));

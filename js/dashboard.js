"use strict";
/* ============================================================
   DASHBOARD — session summary, accounts, P&L, objective
   ============================================================ */
const CHECKLIST_KEY = "archilect_checklist_v1"; // must match js/checklist-state.js
const OBJECTIVE_KEY = "archilect_objective_v1";

/* ---------- checklist snapshot ---------- */
function loadChecklistSnapshot(){
  try{ return JSON.parse(localStorage.getItem(CHECKLIST_KEY)); }catch(e){ return null; }
}
function renderChecklistSnapshot(){
  const saved = loadChecklistSnapshot();
  const c = saved && saved.computed;
  const scoreEl = document.getElementById("dash-score");
  const biasEl = document.getElementById("dash-bias");
  const gradeEl = document.getElementById("dash-grade");
  const noteEl = document.getElementById("dash-checklist-note");
  const continueBtn = document.getElementById("dash-continue-btn");
  if(!c){
    scoreEl.innerHTML = '—';
    biasEl.textContent = "—";
    gradeEl.textContent = "—";
    noteEl.textContent = "No checklist run yet today.";
    continueBtn.textContent = "Start checklist";
    continueBtn.href = "trading-checklist.html";
    return;
  }
  scoreEl.innerHTML = c.mcStop ? "STOP" : c.mcFinal.toFixed(1)+'<span class="snap-of">/10</span>';
  biasEl.textContent = (c.biasDirection && c.biasDirection!=="n/a")
    ? (c.biasConviction!==null ? c.biasLabel : c.biasDirection) : "—";
  gradeEl.textContent = c.setupGrade && c.setupGrade!=="No Trade" ? c.setupGrade : "—";
  const d = new Date(saved.savedAt);
  noteEl.textContent = isNaN(d.getTime()) ? "" :
    "Last updated " + d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"}) + " " +
    d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  // Picks up wherever the three-stage filter left off, mirroring "each stage feeds the next".
  let nextStep = "conditions";
  if(c.mcStop) nextStep = "conditions";
  else if(!c.biasDirection || c.biasDirection==="n/a") nextStep = "bias";
  else if(!c.setupGrade || c.setupGrade==="No Trade") nextStep = "setup";
  else nextStep = "journal";
  continueBtn.textContent = "Continue checklist";
  continueBtn.href = "trading-checklist.html#" + nextStep;
}

/* ---------- accounts ---------- */
function renderAccounts(){
  const wrap = document.getElementById("dash-accounts");
  const trades = loadTrades();
  const accounts = Array.from(new Set(trades.map(t=>t.account).filter(Boolean)));
  if(!accounts.length){
    wrap.innerHTML = '<div class="empty-state">No trades logged yet — accounts appear here once you save one.</div>';
    return;
  }
  const grid = document.createElement("div");
  grid.className = "dash-accounts-grid";
  accounts.forEach(acc=>{
    const rows = withRunning(trades.filter(t=>t.account===acc));
    const closed = rows.filter(r=>r.pnl!==null);
    const net = closed.reduce((s,r)=>s+r.pnl,0);
    const lastBal = rows.length ? rows[rows.length-1].currentBalance : null;
    const card = document.createElement("div");
    card.className = "card dash-account-card";
    card.innerHTML =
      '<div class="calc-row"><span class="k">'+esc(acc)+'</span><span class="v">'+fmtMoney(lastBal)+'</span></div>'+
      '<div class="calc-row"><span class="k">Net P&amp;L</span><span class="v '+(net>0?"pos":net<0?"neg":"")+'">'+fmtMoney(net)+'</span></div>'+
      '<div class="calc-row"><span class="k">Trades</span><span class="v">'+rows.length+'</span></div>';
    grid.appendChild(card);
  });
  wrap.innerHTML = "";
  wrap.appendChild(grid);
}
function esc(v){ return String(v==null?"":v).replace(/[<>&]/g, ch=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[ch])); }

/* ---------- P&L ---------- */
function renderPnl(){
  const wrap = document.getElementById("dash-pnl-stats");
  const rows = withRunning(loadTrades());
  const closed = rows.filter(r=>r.pnl!==null);
  const net = closed.reduce((s,r)=>s+r.pnl,0);
  const today = new Date().toISOString().slice(0,10);
  const todays = closed.filter(r=>String(r.entryDT||"").slice(0,10)===today);
  const todayNet = todays.reduce((s,r)=>s+r.pnl,0);
  const nTP = rows.filter(r=>r.result==="TP").length;
  const nSL = rows.filter(r=>r.result==="SL").length;
  const nBE = rows.filter(r=>r.result==="BE").length;
  const denom = nTP+nSL+nBE;
  const winrate = denom ? nTP/denom : null;
  const lastBal = rows.length ? rows[rows.length-1].currentBalance : null;
  const cards = [
    ["Net P&L", fmtMoney(net), net>0?"pos":net<0?"neg":"", rows.length+" trades logged"],
    ["Today", fmtMoney(todayNet), todayNet>0?"pos":todayNet<0?"neg":"", todays.length+(todays.length===1?" trade":" trades")+" today"],
    ["Win rate", winrate===null?"—":(winrate*100).toFixed(1)+"%", "", nTP+" TP · "+nSL+" SL · "+nBE+" BE"],
    ["Balance", fmtMoney(lastBal), "", "Across all accounts"]
  ];
  wrap.innerHTML = cards.map(a=>
    '<div class="stat"><span class="stat-k">'+a[0]+'</span><div class="stat-v '+a[2]+'">'+a[1]+
    '</div><span class="stat-sub">'+a[3]+'</span></div>'
  ).join("");
  return {rows, closed, net};
}

/* ---------- objective ---------- */
function loadObjective(){
  try{ return JSON.parse(localStorage.getItem(OBJECTIVE_KEY)); }catch(e){ return null; }
}
function saveObjective(obj){
  try{ localStorage.setItem(OBJECTIVE_KEY, JSON.stringify(obj)); }catch(e){}
}
function periodStart(period){
  const now = new Date();
  let start;
  if(period==="monthly"){
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    const dayIdx = (now.getDay()+6)%7; // Monday = 0
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate()-dayIdx);
  }
  start.setHours(0,0,0,0);
  return start;
}
function renderObjective(closedTrades){
  const obj = loadObjective();
  const form = document.getElementById("obj-form");
  const progress = document.getElementById("obj-progress");
  const editBtn = document.getElementById("obj-edit-link");
  if(!obj || !obj.amount){
    form.style.display = "flex";
    progress.style.display = "none";
    editBtn.style.display = "none";
    return;
  }
  form.style.display = "none";
  progress.style.display = "block";
  editBtn.style.display = "inline";

  const start = periodStart(obj.period);
  const inPeriod = closedTrades.filter(r=>{
    const d = new Date(r.entryDT);
    return !isNaN(d.getTime()) && d >= start;
  });
  const net = inPeriod.reduce((s,r)=>s+r.pnl,0);
  const pct = obj.amount>0 ? Math.min(100, Math.max(0, (net/obj.amount)*100)) : 0;

  document.getElementById("obj-amounts").innerHTML =
    fmtMoney(Math.max(0,net)) + ' <span class="of">of ' + fmtMoney(obj.amount) + '</span>';
  document.getElementById("obj-pct").textContent = pct.toFixed(0)+"%";
  document.getElementById("obj-fill").style.width = pct+"%";
  const periodLabel = obj.period==="monthly" ? "this month" : "this week";
  const note = document.getElementById("obj-note");
  if(net < 0){
    note.textContent = "Down "+fmtMoney(net)+" "+periodLabel+" — the target resets automatically each "+(obj.period==="monthly"?"month":"week")+".";
    note.className = "obj-note neg";
  } else {
    note.textContent = fmtMoney(Math.max(0,obj.amount-net))+" left to reach the "+periodLabel+" objective.";
    note.className = "obj-note";
  }
}
document.getElementById("obj-save").addEventListener("click", ()=>{
  const amount = Number(document.getElementById("obj-amount").value);
  const period = document.getElementById("obj-period").value;
  if(!amount || amount<=0){ alert("Enter a target amount greater than 0."); return; }
  saveObjective({amount, period});
  const rows = withRunning(loadTrades()).filter(r=>r.pnl!==null);
  renderObjective(rows);
});
document.getElementById("obj-edit-link").addEventListener("click", ()=>{
  const obj = loadObjective();
  if(obj){
    document.getElementById("obj-amount").value = obj.amount;
    document.getElementById("obj-period").value = obj.period;
  }
  document.getElementById("obj-form").style.display = "flex";
  document.getElementById("obj-progress").style.display = "none";
  document.getElementById("obj-edit-link").style.display = "none";
});

/* ---------- init ---------- */
renderChecklistSnapshot();
renderAccounts();
const pnl = renderPnl();
renderObjective(pnl.closed);
const n = loadTrades().length;
document.getElementById("dash-trades").textContent = n ? n+(n===1?" trade":" trades") : "Empty";

requestAnimationFrame(()=>requestAnimationFrame(()=>{
  document.body.classList.remove("booting");
}));

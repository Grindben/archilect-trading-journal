"use strict";
/* ============================================================
   TRADING JOURNAL ENGINE
   Mirrors the workbook: CME point values from its reference block, and the same
   fallback the sheet uses — when prices are blank, the manual % figures drive P&L.
   ============================================================ */
const TKEY = "archilect_trades_v1";
const PT_VALUE = {ES:50, NQ:20, MES:5, MNQ:2};

function loadTrades(){
  try{ return JSON.parse(localStorage.getItem(TKEY)) || []; }catch(e){ return []; }
}
function saveTrades(arr){ try{ localStorage.setItem(TKEY, JSON.stringify(arr)); }catch(e){} }
// Shared by the Journal step's "Clear Journal" and the full Trading Journal page's
// "Clear journal" — each page wires its own button id to this same function.
function clearAllTrades(){
  if(!confirm("Permanently delete every trade in the journal?")) return;
  saveTrades([]); refreshJournalUI();
}
// Keeps whichever of these three pages is open in sync: the full Trading Journal page's
// stats/chart/table, the Checklist's quick-log list, and its Journal/Trade Review stepper
// taglines. Each piece is only rendered when this page actually has that element.
function refreshJournalUI(){
  if(document.getElementById("j2-stats")) renderJournal2();
  if(typeof renderQuickList === "function") renderQuickList();
  const n = loadTrades().length;
  const label = n ? n+(n===1?" trade":" trades") : "Empty";
  const sj = document.getElementById("state-journal");
  if(sj) sj.textContent = label;
  if(typeof refreshTradeReviewState === "function") refreshTradeReviewState();
}
function tnum(v){
  if(v===null || v===undefined || v==="") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function computeTrade(t){
  const pt = PT_VALUE[t.asset] || 0;
  const c = tnum(t.contracts) || 0;
  const entry = tnum(t.entryPrice), sl = tnum(t.stopPrice), tp = tnum(t.tpPrice);
  const exitP = tnum(t.exitPrice), start = tnum(t.startBalance) || 0;
  const cIn = tnum(t.commIn) || 0, cOut = tnum(t.commOut) || 0;

  // If Direction wasn't given (the quick-log widget doesn't ask for it), infer it from
  // whichever price is available: TP above entry or SL below entry both mean BUY.
  let direction = t.direction;
  if(!direction && entry!==null){
    if(tp!==null) direction = tp>entry ? "BUY" : tp<entry ? "SELL" : "";
    else if(sl!==null) direction = sl<entry ? "BUY" : sl>entry ? "SELL" : "";
  }

  const maxProfit = (entry!==null && tp!==null && c) ? Math.abs(tp-entry)*pt*c : null;
  const maxLoss   = (entry!==null && sl!==null && c) ? Math.abs(entry-sl)*pt*c : null;
  const riskPct   = (maxLoss!==null && start) ? maxLoss/start : tnum(t.riskPct);
  const maxRR     = (maxProfit!==null && maxLoss) ? maxProfit/maxLoss : null;
  const points    = (t.status==="CLOSED" && exitP!==null && entry!==null && direction)
                      ? (direction==="BUY" ? exitP-entry : entry-exitP) : null;

  let pnl = points!==null ? points*pt*c - cOut - cIn : null;
  if(pnl===null){
    const rp = tnum(t.resultPct);
    pnl = (rp!==null && start) ? rp*start : null;
  }
  // Last resort: a plain TP / SL / BE call, priced off the max profit/loss worked out above —
  // this is what lets the quick-log widget show a result without a logged exit price.
  if(pnl===null && (t.result==="TP" || t.result==="SL" || t.result==="BE")){
    if(t.result==="TP" && maxProfit!==null) pnl = maxProfit - cOut - cIn;
    else if(t.result==="SL" && maxLoss!==null) pnl = -maxLoss - cOut - cIn;
    else if(t.result==="BE") pnl = -cOut - cIn;
  }
  const pnlPct    = (pnl!==null && start) ? pnl/start : tnum(t.resultPct);
  let rMultiple = (pnl!==null && maxLoss) ? pnl/maxLoss : tnum(t.rr);
  if(rMultiple===null || isNaN(rMultiple)){
    if(t.result==="TP" && maxRR!==null) rMultiple = maxRR;
    else if(t.result==="SL") rMultiple = -1;
    else if(t.result==="BE") rMultiple = 0;
  }
  const winLoss   = pnl===null ? null : (pnl>0 ? "Win" : pnl<0 ? "Loss" : "Breakeven");
  return {pt, maxProfit, maxLoss, riskPct, maxRR, points, pnl, pnlPct, rMultiple, winLoss};
}
// Running totals depend on order, so they are derived over the date-sorted list.
function withRunning(trades){
  const sorted = trades.slice().sort((a,b)=>String(a.entryDT||"").localeCompare(String(b.entryDT||"")));
  const base = tnum(sorted.length ? sorted[0].startBalance : 0) || 0;
  let cum = 0, deposits = 0, peak = base;
  return sorted.map((t,i)=>{
    const m = computeTrade(t);
    cum += (m.pnl || 0);
    deposits += tnum(t.deposit) || 0;
    const balance = base + cum;
    peak = Math.max(peak, balance);
    return Object.assign({}, t, m, {
      idx:i+1, cumulative:cum, balance,
      drawdown: peak ? (balance-peak)/peak : 0,
      currentBalance: balance + deposits
    });
  });
}
function fmtMoney(v){
  if(v===null || v===undefined || isNaN(v)) return "—";
  return (v<0?"-":"") + "$" + Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function fmtPc(v){ return (v===null||v===undefined||isNaN(v)) ? "—" : (v*100).toFixed(2)+"%"; }
function fmtN(v,d){ return (v===null||v===undefined||isNaN(v)) ? "—" : Number(v).toFixed(d===undefined?2:d); }
function fmtDT(s){
  if(!s) return "—";
  const d = new Date(s);
  if(isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"}) + " " +
         d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
}

function renderStats(rows){
  const closed = rows.filter(r=>r.pnl!==null);
  const wins = closed.filter(r=>r.pnl>0), losses = closed.filter(r=>r.pnl<0);
  const grossWin = wins.reduce((s,r)=>s+r.pnl,0);
  const grossLoss = Math.abs(losses.reduce((s,r)=>s+r.pnl,0));
  const net = closed.reduce((s,r)=>s+r.pnl,0);
  const nTP = rows.filter(r=>r.result==="TP").length;
  const nSL = rows.filter(r=>r.result==="SL").length;
  const nBE = rows.filter(r=>r.result==="BE").length;
  const nMiss = rows.filter(r=>r.result==="Missed").length;
  const denom = nTP+nSL+nBE;
  const winrate = denom ? nTP/denom : null;
  const rr = rows.map(r=>r.rMultiple).filter(v=>v!==null && v!==undefined && !isNaN(v));
  const avgRR = rr.length ? rr.reduce((a,b)=>a+b,0)/rr.length : null;
  const maxDD = rows.length ? Math.min.apply(null, rows.map(r=>r.drawdown)) : null;
  const lastBal = rows.length ? rows[rows.length-1].currentBalance : null;
  const pf = grossLoss ? grossWin/grossLoss : null;
  const cards = [
    ["Net P&L", fmtMoney(net), net>0?"pos":net<0?"neg":"", rows.length+" trades logged"],
    ["Win rate", winrate===null?"—":(winrate*100).toFixed(1)+"%", "",
      nTP+" TP · "+nSL+" SL · "+nBE+" BE"+(nMiss?" · "+nMiss+" missed":"")],
    ["Average R", fmtN(avgRR), avgRR>0?"pos":avgRR<0?"neg":"", rr.length+" trades with an R value"],
    ["Profit factor", pf===null?"—":pf.toFixed(2), pf>1?"pos":(pf!==null&&pf<1)?"neg":"", "Gross win / gross loss"],
    ["Account balance", fmtMoney(lastBal), "", "Including deposits & withdrawals"],
    ["Max drawdown", maxDD===null?"—":(maxDD*100).toFixed(2)+"%", maxDD<0?"neg":"", "Peak to trough"],
    ["Gross win", fmtMoney(grossWin), "pos", wins.length+" winning trades"],
    ["Gross loss", fmtMoney(-grossLoss), grossLoss?"neg":"", losses.length+" losing trades"]
  ];
  document.getElementById("j2-stats").innerHTML = cards.map(function(a){
    return '<div class="stat"><span class="stat-k">'+a[0]+'</span><div class="stat-v '+a[2]+'">'+a[1]+
           '</div><span class="stat-sub">'+a[3]+'</span></div>';
  }).join("");
}

function renderChart(rows){
  const host = document.getElementById("j2-chart");
  const sub = document.getElementById("j2-chart-sub");
  const pts = rows.filter(r=>r.pnl!==null);
  if(pts.length < 2){
    host.innerHTML = '<div class="j2-chart-empty">At least two closed trades are needed to plot the curve.</div>';
    sub.textContent = "—";
    return;
  }
  const W=900, H=220, PL=8, PR=8, PT_=14, PB=14;
  const vals = [0].concat(pts.map(r=>r.cumulative));
  const min = Math.min.apply(null,vals), max = Math.max.apply(null,vals);
  const span = (max-min) || 1;
  const X = i => PL + (i*(W-PL-PR))/(vals.length-1);
  const Y = v => PT_ + (H-PT_-PB)*(1-(v-min)/span);
  const line = vals.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+","+Y(v).toFixed(1)).join(" ");
  const area = line+" L"+X(vals.length-1).toFixed(1)+","+Y(min).toFixed(1)+" L"+X(0).toFixed(1)+","+Y(min).toFixed(1)+" Z";
  const last = vals[vals.length-1];
  const stroke = last>=0 ? "var(--go)" : "var(--stop)";
  const zero = (min<=0 && max>=0) ? Y(0) : null;
  host.innerHTML =
    '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="Cumulative profit and loss">'+
      '<defs><linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0%" stop-color="'+stroke+'" stop-opacity="0.16"/>'+
        '<stop offset="100%" stop-color="'+stroke+'" stop-opacity="0"/></linearGradient></defs>'+
      (zero!==null ? '<line x1="0" y1="'+zero.toFixed(1)+'" x2="'+W+'" y2="'+zero.toFixed(1)+
        '" stroke="var(--line)" stroke-width="1" stroke-dasharray="4 4"/>' : '')+
      '<path d="'+area+'" fill="url(#eqfill)"/>'+
      '<path d="'+line+'" fill="none" stroke="'+stroke+'" stroke-width="2" stroke-linejoin="round" '+
        'stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  sub.textContent = pts.length+" closed trades · "+fmtMoney(last)+" cumulative · peak "+fmtMoney(max)+" · trough "+fmtMoney(min);
}

function fillFilter(id, values){
  const el = document.getElementById(id);
  const keep = el.value;
  const first = el.options[0].textContent;
  el.innerHTML = '<option value="">'+first+'</option>' +
    values.map(v=>'<option value="'+v+'">'+v+'</option>').join("");
  el.value = values.indexOf(keep)>-1 ? keep : "";
}
function applyFilters(rows){
  const a=document.getElementById("j2-fAccount").value, s=document.getElementById("j2-fAsset").value;
  const r=document.getElementById("j2-fResult").value, st=document.getElementById("j2-fStrategy").value;
  return rows.filter(t=>(!a||t.account===a)&&(!s||t.asset===s)&&(!r||t.result===r)&&(!st||t.strategy===st));
}

function renderTable(rows){
  const tbody = document.getElementById("j2-tbody");
  const empty = document.getElementById("j2-empty");
  tbody.innerHTML = "";
  if(!rows.length){ empty.style.display="block"; return; }
  empty.style.display = "none";
  const esc = v => String(v===null||v===undefined?"":v).replace(/[<>&]/g, ch=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[ch]));
  const list = v => Array.isArray(v) ? (v.join(", ")||"—") : (v||"—");

  rows.slice().reverse().forEach(t=>{
    const tr = document.createElement("tr");
    tr.className = "row-main";
    const cls = t.pnl>0 ? "pos" : t.pnl<0 ? "neg" : "";
    tr.innerHTML =
      "<td>"+t.idx+"</td><td>"+fmtDT(t.entryDT)+"</td><td>"+esc(t.asset||t.sessionLabel||"—")+"</td>"+
      "<td>"+esc(t.direction||"—")+"</td><td>"+esc(t.strategy||"—")+"</td>"+
      "<td>"+(t.result?'<span class="res-pill res-'+t.result+'">'+t.result+"</span>":"—")+"</td>"+
      '<td class="num">'+fmtN(t.rMultiple)+"</td>"+
      '<td class="num '+cls+'">'+fmtMoney(t.pnl)+"</td>"+
      '<td class="num '+cls+'">'+fmtPc(t.pnlPct)+"</td>"+
      '<td class="num">'+fmtMoney(t.cumulative)+"</td>"+
      '<td class="num">'+fmtMoney(t.currentBalance)+"</td>"+
      '<td><button class="row-del" type="button" aria-label="Delete trade">✕</button></td>';

    const det = document.createElement("tr");
    det.className = "row-detail";
    det.style.display = "none";
    const pairs = [["Account",t.account],["Timeframe",t.timeframe],["Contracts",t.contracts],
      ["Entry price",t.entryPrice],["Stop loss",t.stopPrice],["Take profit",t.tpPrice],
      ["Exit price",t.exitPrice],["Status",t.status],["Max loss",fmtMoney(t.maxLoss)],
      ["Max profit",fmtMoney(t.maxProfit)],["Risk %",fmtPc(t.riskPct)],["Max R:R",fmtN(t.maxRR)],
      ["Points",fmtN(t.points)],["Drawdown",fmtPc(t.drawdown)],["Bias",t.bias],
      ["Entry model",t.entryModel],["Stages",list(t.stages)],["Target",list(t.target)],
      ["News",t.news],["Emotions",list(t.emotions)],["Mistake",list(t.mistake)],
      ["One lead divergent",t.lead],["Q3",t.q3],["Checklist / 5",t.checklist]];
    // A quick snapshot logged from the checklist carries its own three-line context instead.
    if(t.checklistConditions || t.checklistBias || t.checklistSetup){
      pairs.push(["Session", t.sessionLabel]);
      pairs.push(["Conditions snapshot", t.checklistConditions]);
      pairs.push(["Bias snapshot", t.checklistBias]);
      pairs.push(["Setup snapshot", t.checklistSetup]);
    }
    det.innerHTML = '<td colspan="12"><div class="det-grid">'+
      pairs.map(p=>'<div class="det"><k>'+p[0]+"</k><v>"+
        ((p[1]===null||p[1]===undefined||p[1]==="")?"—":esc(p[1]))+"</v></div>").join("")+
      (t.executionLink?'<div class="det"><k>Execution link</k><v><a href="'+esc(t.executionLink)+
        '" target="_blank" rel="noopener noreferrer">Open execution ↗</a></v></div>':"")+
      (t.notes?'<div class="det det-notes">'+esc(t.notes)+"</div>":"")+"</div></td>";

    tr.addEventListener("click", e=>{
      if(e.target.classList.contains("row-del")){
        if(!confirm("Delete this trade?")) return;
        saveTrades(loadTrades().filter(x=>x.id!==t.id));
        refreshJournalUI();
        return;
      }
      det.style.display = det.style.display==="none" ? "table-row" : "none";
    });
    tbody.appendChild(tr);
    tbody.appendChild(det);
  });
}

function renderJournal2(){
  const all = withRunning(loadTrades());
  const uniq = k => Array.from(new Set(all.map(t=>t[k]).filter(Boolean))).sort();
  fillFilter("j2-fAccount", uniq("account"));
  fillFilter("j2-fAsset", uniq("asset"));
  fillFilter("j2-fResult", uniq("result"));
  fillFilter("j2-fStrategy", uniq("strategy"));
  const shown = applyFilters(all);
  renderStats(shown);
  renderChart(shown);
  renderTable(shown);
}
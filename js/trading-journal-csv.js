"use strict";
/* ---------- CSV ---------- */
// sessionLabel/checklistConditions/checklistBias/checklistSetup are only populated by
// quick snapshots logged from the checklist; they simply stay blank for full trade entries.
const CSV_COLS = ["entryDT","account","startBalance","direction","contracts","asset","strategy",
  "timeframe","entryPrice","stopPrice","tpPrice","commIn","status","exitDT","exitPrice","commOut",
  "deposit","result","rr","riskPct","resultPct","bias","entryModel","stages","target","news",
  "emotions","mistake","lead","q3","checklist","notes",
  "sessionLabel","checklistConditions","checklistBias","checklistSetup","executionLink"];

function exportTradesCSV(){
  const rows = withRunning(loadTrades());
  if(!rows.length){ alert("No trades to export."); return; }
  const head = CSV_COLS.concat(["maxProfit","maxLoss","riskPct","maxRR","points","pnl","pnlPct",
    "rMultiple","winLoss","cumulative","balance","drawdown","currentBalance"]);
  const esc = v => '"'+String(v===null||v===undefined?"":v).replace(/"/g,'""')+'"';
  const body = rows.map(t=>head.map(k=>{
    const v = t[k];
    return esc(Array.isArray(v) ? v.join("; ") : v);
  }).join(","));
  const csv = [head.map(esc).join(",")].concat(body).join("\r\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "archilect_trades_"+new Date().toISOString().slice(0,10)+".csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// This file is shared by both pages that can export trades — each only has one of these buttons.
const j2ExportBtn = document.getElementById("j2-export");
if(j2ExportBtn) j2ExportBtn.addEventListener("click", exportTradesCSV);
const jExportBtn = document.getElementById("j-export");
if(jExportBtn) jExportBtn.addEventListener("click", exportTradesCSV);

function parseCSV(text){
  const rows=[]; let row=[], cell="", q=false;
  for(let i=0;i<text.length;i++){
    const ch = text[i];
    if(q){
      if(ch === '"'){ if(text[i+1] === '"'){ cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if(ch === '"') q = true;
    else if(ch === ","){ row.push(cell); cell=""; }
    else if(ch === "\n"){ row.push(cell); rows.push(row); row=[]; cell=""; }
    else if(ch !== "\r") cell += ch;
  }
  if(cell !== "" || row.length){ row.push(cell); rows.push(row); }
  return rows.filter(r=>r.some(c=>c !== ""));
}
const j2ImportBtn = document.getElementById("j2-import");
const j2FileInput = document.getElementById("j2-file");
if(j2ImportBtn) j2ImportBtn.addEventListener("click", ()=>j2FileInput.click());
if(j2FileInput) j2FileInput.addEventListener("change", ev=>{
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const rows = parseCSV(String(reader.result).replace(/^\uFEFF/,""));
      if(rows.length < 2){ alert("That file has no rows to import."); return; }
      const head = rows[0].map(h=>h.trim());
      const multi = {stages:1,target:1,emotions:1,mistake:1};
      const added = rows.slice(1).map(r=>{
        const t = {id: Date.now()+"_"+Math.random().toString(36).slice(2,7)};
        head.forEach((h,i)=>{
          if(CSV_COLS.indexOf(h) === -1) return;
          const v = (r[i]===undefined?"":r[i]).trim();
          t[h] = multi[h] ? (v ? v.split(";").map(s=>s.trim()).filter(Boolean) : []) : v;
        });
        return t;
      }).filter(t=>t.entryDT);
      if(!added.length){ alert("No rows had an entryDT column, so nothing was imported."); return; }
      saveTrades(loadTrades().concat(added));
      refreshJournalUI();
      alert(added.length+" trade(s) imported.");
    }catch(err){ alert("That file could not be read as CSV."); }
    ev.target.value = "";
  };
  reader.readAsText(file);
});
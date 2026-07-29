"use strict";
/* ============================================================
   TODAY'S USD NEWS — a simple daily log (time + event) shown at the
   top of the Conditions panel, right under the score. Time is entered
   as 12-hour + AM/PM (not the native <input type="time">, whose picker
   follows OS/browser locale and isn't reliably AM/PM everywhere), but
   stored as 24-hour "HH:MM" so the list sorts correctly.
   ============================================================ */
const NEWS_KEY = "archilect_usd_news_v1";

// Re-schedules itself against the exact time of the next midnight rather than a fixed
// interval, so it's unaffected by drift and self-corrects if the machine was asleep.
function updateTodayDate(){
  document.getElementById("today-date").textContent = new Date().toLocaleDateString("en-GB",
    {weekday:"long", day:"numeric", month:"long", year:"numeric"});
}
function scheduleTodayDateUpdate(){
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 2);
  setTimeout(()=>{ updateTodayDate(); scheduleTodayDateUpdate(); }, nextMidnight - now);
}
updateTodayDate();
scheduleTodayDateUpdate();

function newsAmPm(){
  const active = document.querySelector("#news-ampm .ampm-btn.active");
  return active ? active.dataset.val : "AM";
}
document.getElementById("news-ampm").addEventListener("click", e=>{
  const btn = e.target.closest(".ampm-btn");
  if(!btn) return;
  document.querySelectorAll("#news-ampm .ampm-btn").forEach(b=>b.classList.toggle("active", b===btn));
});

function to24Hour(hour12, minute, ampm){
  let h = parseInt(hour12, 10) % 12;
  if(ampm === "PM") h += 12;
  return String(h).padStart(2,"0") + ":" + minute;
}
function to12HourLabel(hhmm){
  const parts = String(hhmm||"").split(":");
  let h = parseInt(parts[0], 10);
  if(isNaN(h)) return hhmm || "—";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if(h === 0) h = 12;
  return h + ":" + (parts[1]||"00") + " " + ampm;
}

// Shares js/market-conditions.js's validated state — once the market conditions criteria
// are validated, this panel becomes a read-only showcase too: no adding, no removing.
function isNewsLocked(){
  return typeof mcValidated !== "undefined" && mcValidated;
}
function applyNewsLockState(){
  const form = document.getElementById("news-form");
  if(form) form.style.display = isNewsLocked() ? "none" : "";
  renderNewsList();
}

function loadNews(){
  try{ return JSON.parse(localStorage.getItem(NEWS_KEY)) || []; }catch(e){ return []; }
}
function saveNews(list){
  try{ localStorage.setItem(NEWS_KEY, JSON.stringify(list)); }catch(e){}
}
// Entries that share the same time slot are shown as one row, several items under a
// single time label, instead of repeating the time for each one.
function groupNewsByTime(list){
  const groups = [];
  list.forEach(n=>{
    const last = groups[groups.length-1];
    if(last && last.time === n.time) last.items.push(n);
    else groups.push({time: n.time, items: [n]});
  });
  return groups;
}
function renderNewsList(){
  const locked = isNewsLocked();
  const list = loadNews().slice().sort((a,b)=>String(a.time||"").localeCompare(String(b.time||"")));
  const wrap = document.getElementById("news-list");
  const empty = document.getElementById("news-empty");
  wrap.innerHTML = "";
  empty.textContent = locked ? "No major news for the day." : "No news for today.";
  empty.classList.toggle("show", !list.length);
  groupNewsByTime(list).forEach(group=>{
    const groupEl = document.createElement("div");
    groupEl.className = "news-group";
    group.items.forEach((n, i)=>{
      const row = document.createElement("div");
      row.className = "news-row";
      const time = document.createElement("span");
      time.className = "news-row-time";
      // Only the first row in the group shows the time — the rest belong to that
      // same slot, so repeating it would just be noise.
      time.textContent = i===0 ? to12HourLabel(group.time) : "";
      const text = document.createElement("span");
      text.className = "news-row-text";
      text.textContent = n.text;
      row.appendChild(time); row.appendChild(text);
      if(!locked){
        const del = document.createElement("button");
        del.type = "button"; del.className = "news-row-del"; del.textContent = "✕";
        del.setAttribute("aria-label", "Remove");
        del.addEventListener("click", ()=>{
          saveNews(loadNews().filter(x=>x.id!==n.id));
          renderNewsList();
        });
        row.appendChild(del);
      }
      groupEl.appendChild(row);
    });
    wrap.appendChild(groupEl);
  });
}
function addNewsEntry(){
  if(isNewsLocked()) return;
  const hourEl = document.getElementById("news-hour");
  const minuteEl = document.getElementById("news-minute");
  const textEl = document.getElementById("news-text");
  const text = textEl.value.trim();
  if(!text){ textEl.focus(); return; }
  const arr = loadNews();
  arr.push({
    id: Date.now()+"_"+Math.random().toString(36).slice(2,7),
    time: to24Hour(hourEl.value, minuteEl.value, newsAmPm()),
    text
  });
  saveNews(arr);
  textEl.value = "";
  textEl.focus();
  renderNewsList();
}
document.getElementById("news-add").addEventListener("click", addNewsEntry);
document.getElementById("news-text").addEventListener("keydown", e=>{
  if(e.key==="Enter"){ e.preventDefault(); addNewsEntry(); }
});
renderNewsList();

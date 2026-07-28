"use strict";
/* ============================================================
   CUSTOM DROPDOWNS
   The native <select> remains the source of truth — every pick writes back to it and
   fires a real "change" event, so the scoring code is untouched. The menu is portalled
   to <body> because the cards and collapse wrappers clip overflow.
   ============================================================ */
const selectRenders = [];
let openDropdown = null;

function enhanceSelect(sel){
  const wrap = document.createElement("div");
  wrap.className = "cselect";
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "cselect-trigger";
  trigger.setAttribute("aria-haspopup","listbox");
  trigger.setAttribute("aria-expanded","false");
  trigger.innerHTML = '<span class="cselect-label"></span>'+
    '<svg class="cselect-chev" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>';
  wrap.appendChild(trigger);

  const menu = document.createElement("div");
  menu.className = "cselect-menu";
  menu.setAttribute("role","listbox");
  document.body.appendChild(menu);

  const label = trigger.querySelector(".cselect-label");

  function render(){
    const current = sel.options[sel.selectedIndex];
    label.textContent = current ? current.textContent : "";
    menu.innerHTML = "";
    Array.from(sel.options).forEach(opt=>{
      const item = document.createElement("button");
      item.type = "button";
      item.className = "cselect-option" + (opt.value===sel.value ? " selected" : "");
      item.setAttribute("role","option");
      item.setAttribute("aria-selected", opt.value===sel.value ? "true" : "false");
      item.innerHTML = '<span></span><span class="tick">✓</span>';
      item.firstChild.textContent = opt.textContent;
      item.addEventListener("click", ()=>{
        if(sel.value !== opt.value){
          sel.value = opt.value;
          sel.dispatchEvent(new Event("change",{bubbles:true}));
        }
        close();
        trigger.focus();
      });
      menu.appendChild(item);
    });
  }

  function position(){
    const r = trigger.getBoundingClientRect();
    menu.style.minWidth = r.width + "px";
    const h = menu.offsetHeight;
    const spaceBelow = window.innerHeight - r.bottom;
    const flip = spaceBelow < h + 14 && r.top > h + 14;
    menu.classList.toggle("flip-up", flip);
    menu.style.top = (flip ? r.top - h - 6 : r.bottom + 6) + "px";
    let left = r.left;
    const overflow = left + menu.offsetWidth - (window.innerWidth - 10);
    if(overflow > 0) left -= overflow;
    menu.style.left = Math.max(10, left) + "px";
  }

  function open(){
    if(openDropdown && openDropdown !== api) openDropdown.close();
    render();
    menu.classList.add("mounted");
    position();
    requestAnimationFrame(()=>menu.classList.add("visible"));
    wrap.classList.add("open");
    trigger.setAttribute("aria-expanded","true");
    openDropdown = api;
  }

  function close(){
    if(openDropdown === api) openDropdown = null;
    menu.classList.remove("visible");
    wrap.classList.remove("open");
    trigger.setAttribute("aria-expanded","false");
    setTimeout(()=>{ if(!menu.classList.contains("visible")) menu.classList.remove("mounted"); }, 200);
  }

  function isOpen(){ return wrap.classList.contains("open"); }

  function moveActive(dir){
    const items = Array.from(menu.querySelectorAll(".cselect-option"));
    if(!items.length) return;
    let i = items.findIndex(x=>x.classList.contains("active"));
    if(i === -1) i = items.findIndex(x=>x.classList.contains("selected"));
    i = (i + dir + items.length) % items.length;
    items.forEach(x=>x.classList.remove("active"));
    items[i].classList.add("active");
    items[i].scrollIntoView({block:"nearest"});
  }

  trigger.addEventListener("click", ()=>{ isOpen() ? close() : open(); });
  trigger.addEventListener("keydown", e=>{
    if(e.key==="ArrowDown" || e.key==="Enter" || e.key===" "){
      e.preventDefault();
      if(!isOpen()) open();
      moveActive(1);
    } else if(e.key==="Escape" && isOpen()){ close(); }
  });
  menu.addEventListener("keydown", e=>{
    if(e.key==="Escape"){ close(); trigger.focus(); }
  });
  document.addEventListener("keydown", e=>{
    if(!isOpen()) return;
    if(e.key==="ArrowDown"){ e.preventDefault(); moveActive(1); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); moveActive(-1); }
    else if(e.key==="Escape"){ close(); trigger.focus(); }
    else if(e.key==="Enter"){
      const act = menu.querySelector(".cselect-option.active");
      if(act){ e.preventDefault(); act.click(); }
    }
  });

  const api = {close, wrap, menu};
  sel.addEventListener("change", render);
  // Options are rebuilt at runtime (Draw on Liquidity levels), so mirror any change.
  new MutationObserver(()=>render()).observe(sel, {childList:true});
  render();
  selectRenders.push(render);
  return api;
}

document.querySelectorAll("select").forEach(enhanceSelect);

document.addEventListener("click", e=>{
  if(!openDropdown) return;
  if(openDropdown.wrap.contains(e.target) || openDropdown.menu.contains(e.target)) return;
  openDropdown.close();
});
window.addEventListener("resize", ()=>{ if(openDropdown) openDropdown.close(); });
window.addEventListener("scroll", ()=>{ if(openDropdown) openDropdown.close(); }, true);

function syncSelects(){ selectRenders.forEach(fn=>fn()); }
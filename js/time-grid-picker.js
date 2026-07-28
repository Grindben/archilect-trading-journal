"use strict";
/* ============================================================
   TIME GRID PICKER — styled like the site's other dropdowns (same
   .cselect-trigger look), but every option is laid out in one
   non-scrolling grid instead of a scrolling list. There's no
   press-and-drag gesture to get wrong here — opening and choosing are
   both a single plain click, which is why this replaces the two earlier,
   buggier attempts at a drag-aware Hour/Minute dropdown.
   ============================================================ */
let openTimeGrid = null;

function enhanceTimeGridPicker(sel){
  const wrap = document.createElement("div");
  wrap.className = "cselect time-grid-select";
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);
  sel.style.display = "none";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "cselect-trigger time-grid-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = '<span class="cselect-label"></span>'+
    '<svg class="cselect-chev" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>';
  wrap.appendChild(trigger);

  const panel = document.createElement("div");
  panel.className = "time-grid-panel";
  panel.setAttribute("role", "listbox");
  document.body.appendChild(panel);

  const label = trigger.querySelector(".cselect-label");
  let open = false;

  function render(){
    const current = sel.options[sel.selectedIndex];
    label.textContent = current ? current.textContent : "";
    panel.innerHTML = "";
    Array.from(sel.options).forEach(opt=>{
      const item = document.createElement("button");
      item.type = "button";
      item.className = "time-grid-option" + (opt.value===sel.value ? " selected" : "");
      item.textContent = opt.textContent;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", opt.value===sel.value ? "true" : "false");
      item.addEventListener("click", ()=>{
        if(sel.value !== opt.value){
          sel.value = opt.value;
          sel.dispatchEvent(new Event("change", {bubbles:true}));
        }
        render();
        closePanel();
        trigger.focus();
      });
      panel.appendChild(item);
    });
  }
  function position(){
    const r = trigger.getBoundingClientRect();
    const h = panel.offsetHeight;
    const spaceBelow = window.innerHeight - r.bottom;
    const flip = spaceBelow < h + 14 && r.top > h + 14;
    panel.classList.toggle("flip-up", flip);
    panel.style.top = (flip ? r.top - h - 6 : r.bottom + 6) + "px";
    let left = r.left;
    const overflow = left + panel.offsetWidth - (window.innerWidth - 10);
    if(overflow > 0) left -= overflow;
    panel.style.left = Math.max(10, left) + "px";
  }
  function openPanel(){
    if(openTimeGrid && openTimeGrid !== api) openTimeGrid.closePanel();
    render();
    panel.classList.add("mounted");
    position();
    requestAnimationFrame(()=>panel.classList.add("visible"));
    wrap.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    open = true;
    openTimeGrid = api;
  }
  function closePanel(){
    if(openTimeGrid === api) openTimeGrid = null;
    panel.classList.remove("visible");
    wrap.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
    setTimeout(()=>{ if(!panel.classList.contains("visible")) panel.classList.remove("mounted"); }, 200);
    open = false;
  }

  trigger.addEventListener("click", ()=>{ open ? closePanel() : openPanel(); });
  trigger.addEventListener("keydown", e=>{ if(e.key==="Escape" && open) closePanel(); });
  panel.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closePanel(); trigger.focus(); } });
  document.addEventListener("click", e=>{
    if(!open) return;
    if(wrap.contains(e.target) || panel.contains(e.target)) return;
    closePanel();
  });
  window.addEventListener("resize", ()=>{ if(open) closePanel(); });
  window.addEventListener("scroll", ()=>{ if(open) closePanel(); }, true);

  const api = {closePanel, wrap, panel};
  render();
  return api;
}

document.querySelectorAll("select[data-time-grid]").forEach(enhanceTimeGridPicker);

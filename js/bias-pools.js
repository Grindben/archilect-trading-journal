"use strict";
/* ============================================================
   BUILD — Bias liquidity pools
   ============================================================ */
function buildPoolCard(container, pools, prefix){
  pools.forEach((pool,i)=>{
    const row = el("div","field-row pool-row");
    row.style.flexWrap = "wrap";
    row.appendChild(el("div", null, `<span style="font-size:13.5px;">${pool.label}</span>`));
    const wrap = el("div", null);
    wrap.style.display = "flex"; wrap.style.gap = "16px"; wrap.style.flexWrap="wrap";

    const highBlock = el("div","pool-block"); highBlock.style.display="flex"; highBlock.style.alignItems="center"; highBlock.style.gap="8px";
    highBlock.appendChild(el("span",null,`<span style="font-size:11px;color:var(--go);font-family:var(--font-mono);">HIGH</span>`));
    const highSeg = el("div","seg"); highSeg.innerHTML = `<button type="button" class="seg-btn active sel-no" data-val="No">No</button><button type="button" class="seg-btn" data-val="Yes">Yes</button>`;
    highBlock.appendChild(highSeg);

    const lowBlock = el("div","pool-block"); lowBlock.style.display="flex"; lowBlock.style.alignItems="center"; lowBlock.style.gap="8px";
    lowBlock.appendChild(el("span",null,`<span style="font-size:11px;color:var(--stop);font-family:var(--font-mono);">LOW</span>`));
    const lowSeg = el("div","seg"); lowSeg.innerHTML = `<button type="button" class="seg-btn active sel-no" data-val="No">No</button><button type="button" class="seg-btn" data-val="Yes">Yes</button>`;
    lowBlock.appendChild(lowSeg);

    wrap.appendChild(highBlock); wrap.appendChild(lowBlock);
    row.appendChild(wrap);
    container.appendChild(row);
    wireSeg(highSeg); wireSeg(lowSeg);
    pool._highSeg = highSeg; pool._lowSeg = lowSeg;
  });
}
buildPoolCard(document.getElementById("b-timepools"), TIME_POOLS);
buildPoolCard(document.getElementById("b-pricepools"), PRICE_POOLS);

// wire the plain yes/no segmented fields on bias & other panels via data-yesno
document.querySelectorAll("[data-yesno]").forEach(c=>wireSeg(c));
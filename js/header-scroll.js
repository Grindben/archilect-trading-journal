"use strict";
/* ============================================================
   STEPPER SCROLL COLLAPSE
   Scrolling down tucks the step roadmap away under the sticky header, giving
   the panel content more room; scrolling back up brings it straight back.
   Reuses the .collapsible/.collapsed mechanics + setCollapsed() from
   components/collapsible.js, which must load first.

   Direction comes from the wheel event's own deltaY, not from window.scrollY.
   scrollY is the wrong signal here: collapsing/expanding changes the sticky
   header's own height, and the browser's scroll anchoring "corrects" for
   that by nudging scrollY a few pixels to keep content visually still — read
   naively, that correction looks like the user reversing direction, so it
   re-triggers the opposite toggle, which shifts the height again, forever
   (a continuous flicker, worst on trackpads where momentum keeps it going).
   deltaY reflects the hand on the wheel/trackpad directly and isn't affected
   by any of that. LOCK_MS still guards against a stray reversed tick right
   at the tail of a momentum scroll re-toggling immediately.

   Keyboard paging and scrollbar dragging don't fire wheel events, so a
   coarser scrollY-based fallback covers those.

   The near-top check always wins over a direction decision, but it still
   respects the lock: collapsing/expanding itself briefly nudges scrollY the
   same way described above, and right after a collapse near the top of the
   page that nudge can dip below REVEAL_NEAR_TOP on its own — reacting to
   that would instantly re-open what the user's own scroll just closed.
   ============================================================ */
(function(){
  const stepper = document.getElementById("stepperNav");
  const header = document.querySelector("header.app-header");
  if(!stepper || !header) return;

  const REVEAL_NEAR_TOP = 60;   // always show once back near the top of the page
  const FALLBACK_IGNORE_BELOW = 40; // scrollY fallback only — coarse on purpose
  const LOCK_MS = 220;          // >= the header-scoped .collapsible transition (css/layout.css)

  let collapsed = false;
  let locked = false;
  let lastY = window.scrollY;

  function apply(next){
    if(next === collapsed) return;
    collapsed = next;
    setCollapsed("stepperNav", collapsed);
    header.classList.toggle("stepper-collapsed", collapsed);
  }

  function lock(){
    locked = true;
    setTimeout(()=>{ locked = false; }, LOCK_MS);
  }

  function reveal(){
    apply(false);
  }

  window.addEventListener("wheel", (e)=>{
    const y = Math.max(0, window.scrollY);
    if(locked){ lastY = y; return; }
    if(y <= REVEAL_NEAR_TOP){ reveal(); lastY = y; return; }
    apply(e.deltaY > 0);
    lastY = y;
    lock();
  }, { passive: true });

  let ticking = false;
  window.addEventListener("scroll", ()=>{
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      ticking = false;
      const y = Math.max(0, window.scrollY);
      if(locked){ lastY = y; return; }
      if(y <= REVEAL_NEAR_TOP){ reveal(); lastY = y; return; }
      const delta = y - lastY;
      if(Math.abs(delta) > FALLBACK_IGNORE_BELOW){
        apply(delta > 0);
        lastY = y;
        lock();
      }
    });
  }, { passive: true });
})();

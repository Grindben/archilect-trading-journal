"use strict";
/* ============================================================
   NAV DIRECTION PREBOOT — must run in <head>, before first paint (same
   reasoning as theme-preboot.js): js/page-transitions.js stashes which way
   we're navigating (forward/backward through Dashboard → Checklist →
   Journal) right before leaving the previous page, and this reads it here
   so the entrance slide direction is already known when body first paints —
   applying it later, from a bottom script, would flash the wrong direction.
   ============================================================ */
(function(){
  try{
    var dir = sessionStorage.getItem("archilect_nav_dir");
    if(dir){
      document.documentElement.setAttribute("data-nav-dir", dir);
      sessionStorage.removeItem("archilect_nav_dir");
    }
  }catch(e){}
})();

"use strict";
/* ============================================================
   INIT — Trading Journal page
   ============================================================ */
resetForm();
refreshJournalUI();

requestAnimationFrame(()=>requestAnimationFrame(()=>{
  document.body.classList.remove("booting");
}));

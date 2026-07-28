"use strict";
/* ============================================================
   THEME TOGGLE
   The initial theme is resolved by a small script in <head> so the page never
   paints in the wrong one. Here we only handle switching and persistence.
   ============================================================ */
const THEME_KEY = "archilect_theme";
const themeBtn = document.getElementById("themeBtn");
themeBtn.addEventListener("click", ()=>{
  const root = document.documentElement;
  const goingDark = root.getAttribute("data-theme") !== "dark";
  if(goingDark) root.setAttribute("data-theme","dark");
  else root.removeAttribute("data-theme");
  themeBtn.setAttribute("aria-pressed", goingDark ? "true" : "false");
  try{ localStorage.setItem(THEME_KEY, goingDark ? "dark" : "light"); }catch(e){}
});
themeBtn.setAttribute("aria-pressed",
  document.documentElement.getAttribute("data-theme")==="dark" ? "true" : "false");

// Follow the OS only while the reader hasn't expressed a preference of their own.
const osTheme = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
if(osTheme){
  const onOsChange = e=>{
    let saved = null;
    try{ saved = localStorage.getItem(THEME_KEY); }catch(err){}
    if(saved) return;
    if(e.matches) document.documentElement.setAttribute("data-theme","dark");
    else document.documentElement.removeAttribute("data-theme");
  };
  if(osTheme.addEventListener) osTheme.addEventListener("change", onOsChange);
  else if(osTheme.addListener) osTheme.addListener(onOsChange);
}
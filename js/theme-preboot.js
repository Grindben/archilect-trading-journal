(function(){
  try{
    var saved = localStorage.getItem("archilect_theme");
    var dark = saved ? saved === "dark"
                     : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if(dark) document.documentElement.setAttribute("data-theme","dark");
  }catch(e){}
})();
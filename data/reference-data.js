"use strict";
/* ============================================================
   DATA — mirrors the Barème / Référentiel sheets exactly
   ============================================================ */
const MC_SECTIONS = [
  { name:"Time Based Conditions", items:[
    {label:"NFP / FOMC / CPI Day (and day before)", points:0, type:"stop", alert:"Stop Trading (except pre-CPI)"},
    {label:"3+ days with news during the week", points:-1, type:"penalty"},
    {label:"3+ news events in the day", points:-1, type:"penalty"},
    {label:"US public holiday", points:-1, type:"stop", alert:"Stop Trading NY"},
    {label:"EU public holiday", points:-1, type:"stop", alert:"Stop Trading London"},
    {label:"Global public holiday", points:-1, type:"stop", alert:"Stop Trading"},
    {label:"Monday with no bias", points:-1, type:"penalty"},
    {label:"Year end", points:-1, type:"penalty"},
    {label:"Month / quarter end", points:-1, type:"penalty"},
  ]},
  { name:"Day-Grading criteria", items:[
    {label:"Is the fuel for expansion still present?", points:-2.5, type:"penalty", invert:true, defaultYes:true},
    {label:"Is the key HTF liquidity draw obvious?", points:-2.5, type:"penalty", invert:true, defaultYes:true},
    {label:"Is the daily chart displacing clearly?", points:-2.5, type:"penalty", invert:true, defaultYes:true},
  ]},
  { name:"HTF Structure", items:[
    {label:"Price reached a Yearly / Monthly / Weekly / Daily H/L", points:-1, type:"penalty"},
    {label:"Overextension: ADR reached", points:0, type:"stop", alert:"Stop Trading for the day"},
    {label:"Overextension: AWR reached", points:-1, type:"penalty"},
    {label:"3 consecutive daily expansions", points:-1, type:"penalty"},
  ]},
  { name:"Market Profile", items:[
    {label:"Trapped Order Flow", points:-1, type:"penalty"},
    {label:"Mid-Range Exposure", points:-1, type:"penalty"},
    {label:"Opposing PDA", points:-1, type:"penalty"},
    {label:"Session expansion sequences (2 consecutive sessions)", points:-1, type:"alert", alert:"Skip Next Session"},
    {label:"Seek & Destroy Profiles", points:-1, type:"penalty"},
  ]},
  { name:"Inter-Market Correlation", items:[
    {label:"Decoupled market", points:-1, type:"penalty"},
  ]},
];

const TIME_POOLS = [
  {label:"Monthly", high:"Monthly High clean", low:"Monthly Low clean"},
  {label:"Weekly", high:"Weekly High clean", low:"Weekly Low clean"},
  {label:"Daily", high:"Daily High clean", low:"Daily Low clean"},
  {label:"Session", high:"Session High clean", low:"Session Low clean"},
  {label:"News Event", high:"News Event High clean", low:"News Event Low clean"},
];
const PRICE_POOLS = [
  {label:"External", high:"External High clean", low:"External Low clean"},
  {label:"Internal", high:"Internal High clean", low:"Internal Low clean"},
  {label:"Weak", high:"Weak High clean", low:"Weak Low clean"},
  {label:"Equal", high:"Equal Highs clean", low:"Equal Lows clean"},
  {label:"FVG / Gaps", high:"FVG / Gaps clean higher", low:"FVG / Gaps clean lower"},
];

const DOL_OPTIONS = {
  "SD Level": ["1.5 SD Level","2 SD Level","2.5 SD Level","3 SD Level","3.5 SD Level","4 SD Level","4.5 SD Level"],
  "Previous Day Liquidity": ["PDH","PDL"],
  "Gaps": ["NDOG","NWOG"],
};

// Référentiel de notation SPR — clé = MTFAlignment|CloseVsHL|RejectionOuiNon
const REFERENTIEL = {
  "Aligned|No Close Beyond|Oui":     {signal:"C2", label:"Rejection Candle SPR", entry:"C3", grade:"A+"},
  "Aligned|No Close Beyond|Non":     {signal:"C3", label:"Expansion Candle SPR", entry:"C4", grade:"A"},
  "Aligned|Close Beyond|Oui":        {signal:"C3", label:"Continuation Candle",  entry:"C4", grade:"A"},
  "Aligned|Close Beyond|Non":        {signal:"C3", label:"Expansion Candle SPR", entry:"C4", grade:"B"},
  "Not Aligned|No Close Beyond|Oui": {signal:"C3", label:"Continuation Candle",  entry:"C4", grade:"A"},
  "Not Aligned|No Close Beyond|Non": {signal:"C3", label:"Expansion Candle SPR", entry:"C4", grade:"B"},
  "Not Aligned|Close Beyond|Oui":    {signal:"C3", label:"Continuation Candle",  entry:"C4", grade:"B"},
  "Not Aligned|Close Beyond|Non":    {signal:"C3", label:"Expansion Candle SPR", entry:"C4", grade:"B-"},
};
const RISK_TABLE = {
  "A+": {funded:0.004, challenge:0.01},
  "A":  {funded:0.003, challenge:0.008},
  "B":  {funded:0,     challenge:0.004},
  "B-": {funded:0,     challenge:0},
};
// Grade ladder used by Reverse / Catch Up: one demotion per failed synchronization check.
const RC_LADDER = ["A+","A","B","B-"];
const KEY_LEVELS = ["Asia High/Low","London High/Low","90' High/Low","Micro's High/Low"];
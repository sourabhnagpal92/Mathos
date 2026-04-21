import { useState, useEffect, useCallback, useRef } from "react";

// ── Utilities ──
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── XP System ──
const XP_LEVELS = [
  { name: "NOVICE", xpNeeded: 0, color: "#ffffff" },
  { name: "APPRENTICE", xpNeeded: 200, color: "#00ff88" },
  { name: "SCHOLAR", xpNeeded: 600, color: "#00cfff" },
  { name: "EXPERT", xpNeeded: 1200, color: "#ffcc00" },
  { name: "MASTER", xpNeeded: 2500, color: "#ff6b35" },
  { name: "GRANDMASTER", xpNeeded: 5000, color: "#ff4466" },
];
function getXpLevel(xp) {
  let lvl = 0;
  for (let i = 0; i < XP_LEVELS.length; i++) { if (xp >= XP_LEVELS[i].xpNeeded) lvl = i; }
  return lvl;
}
function xpToNext(xp) {
  const lvl = getXpLevel(xp);
  if (lvl >= XP_LEVELS.length - 1) return 0;
  return XP_LEVELS[lvl + 1].xpNeeded - xp;
}
function xpPct(xp) {
  const lvl = getXpLevel(xp);
  if (lvl >= XP_LEVELS.length - 1) return 100;
  const base = XP_LEVELS[lvl].xpNeeded, next = XP_LEVELS[lvl + 1].xpNeeded;
  return Math.round(((xp - base) / (next - base)) * 100);
}

// ── Question Generators ──
function generateBasic(diff) {
  const ops = diff === "easy" ? ["+", "-"] : ["+", "-", "×", "÷"];
  const op = ops[rand(0, ops.length - 1)];
  let a, b, answer, question, steps, shortcut;
  if (diff === "easy") {
    if (op === "+") { a = rand(1,20); b = rand(1,20); answer = a+b; question=`${a} + ${b}`; steps=[`${a} + ${b} = ${answer}`]; }
    else { a = rand(5,30); b = rand(1,a); answer=a-b; question=`${a} − ${b}`; steps=[`${a} − ${b} = ${answer}`]; }
  } else if (diff === "medium") {
    if (op==="+") { a=rand(11,98);b=rand(13,97);answer=a+b;question=`${a} + ${b}`;steps=[`Add tens: ${Math.floor(a/10)*10}+${Math.floor(b/10)*10}=${Math.floor(a/10)*10+Math.floor(b/10)*10}`,`Add ones: ${a%10}+${b%10}=${a%10+b%10}`,`Total = ${answer}`];shortcut=`Round to nearest 10, adjust`; }
    else if (op==="-") { a=rand(23,99);b=rand(3,a-3);answer=a-b;question=`${a} − ${b}`;steps=[`${a} − ${b} = ${answer}`];shortcut=`Count up from ${b} to ${a}`; }
    else if (op==="×") { a=rand(2,13);b=rand(2,13);answer=a*b;question=`${a} × ${b}`;steps=[`${a} × ${b} = ${answer}`];shortcut=a>6?`${a} × ${b} = ${Math.floor(a/2)*2} × ${b} + ${a%2} × ${b}`:null; }
    else { a=rand(2,13);b=rand(2,13);answer=a;question=`${a*b} ÷ ${b}`;steps=[`Think: ${b} × ? = ${a*b}`,`Answer = ${a}`]; }
  } else {
    if (op==="+") { a=rand(103,997);b=rand(107,993);answer=a+b;question=`${a} + ${b}`;steps=[`Hundreds: ${Math.floor(a/100)+Math.floor(b/100)}00`,`Tens+ones: ${a%100}+${b%100}=${a%100+b%100}`,`= ${answer}`];shortcut=`Round ${a}→${Math.round(a/100)*100}, adjust by ${Math.round(a/100)*100-a}`; }
    else if (op==="-") { a=rand(205,999);b=rand(11,a-5);answer=a-b;question=`${a} − ${b}`;steps=[`${a} − ${b} = ${answer}`];shortcut=`Round ${b} to nearest 10, subtract, readjust`; }
    else if (op==="×") { a=rand(12,35);b=rand(11,32);answer=a*b;question=`${a} × ${b}`;steps=[`${a}×${Math.floor(b/10)*10}=${a*Math.floor(b/10)*10}`,`${a}×${b%10}=${a*(b%10)}`,`Sum=${answer}`];shortcut=`(${Math.ceil(a/10)*10}−${Math.ceil(a/10)*10-a})×${b}`; }
    else { a=rand(3,25);b=rand(3,25);answer=a;question=`${a*b} ÷ ${b}`;steps=[`${a*b}÷${b}=${answer}`,`Check: ${b}×${a}=${a*b}`]; }
  }
  return { question, answer, hint:`${question} = ?`, steps:steps||[`${question}=${answer}`], shortcut:shortcut||null, topic: op==="+"?"addition":op==="-"?"subtraction":op==="×"?"multiplication":"division" };
}

function generateAlgebra(diff) {
  if (diff==="easy") {
    const b=rand(1,15),x=rand(1,15),c=x+b;
    return { question:`x + ${b} = ${c}`, answer:x, hint:"Solve for x", steps:[`x + ${b} = ${c}`,`x = ${c} − ${b} = ${x}`], shortcut:null, topic:"algebra" };
  } else if (diff==="medium") {
    const type=rand(0,2);
    if (type===0) { const a=rand(2,9),b=rand(2,25),x=rand(2,18); return { question:`${a}x + ${b} = ${a*x+b}`, answer:x, hint:"Solve for x", steps:[`${a}x = ${a*x+b}-${b} = ${a*x}`,`x = ${a*x}÷${a} = ${x}`], shortcut:"Subtract constant, then divide", topic:"algebra" }; }
    else if (type===1) { const p=rand(5,95),total=rand(80,600),ans=Math.round(p*total/100); return { question:`${p}% of ${total}`, answer:ans, hint:"Calculate %", steps:[`${p}/100 × ${total} = ${ans}`], shortcut:`10% = ${total/10}, scale to ${p}%`, topic:"percentages" }; }
    else { const a=rand(2,9),b=rand(2,9),x=rand(1,10); return { question:`${a}x − ${b} = ${a*x-b}`, answer:x, hint:"Solve for x", steps:[`${a}x = ${a*x-b}+${b} = ${a*x}`,`x = ${x}`], shortcut:"Add constant first, then divide", topic:"algebra" }; }
  } else {
    const type=rand(0,2);
    if (type===0) { const a=rand(3,15),b=rand(3,25),c=rand(2,10),x=rand(2,20); return { question:`${a}x + ${b} − ${c}x = ${(a-c)*x+b}`, answer:x, hint:"Solve for x", steps:[`(${a}-${c})x + ${b} = ${(a-c)*x+b}`,`${a-c}x = ${(a-c)*x}`,`x = ${x}`], shortcut:"Collect x terms first", topic:"algebra" }; }
    else if (type===1) { const p=rand(5,95),total=rand(500,5000),ans=Math.round(p*total/100); return { question:`${p}% of ${total}`, answer:ans, hint:"Calculate %", steps:[`${p}/100 × ${total} = ${ans}`], shortcut:`1% = ${total/100}, then ×${p}`, topic:"percentages" }; }
    else { const a=rand(5,20),b=rand(3,15),x=rand(3,20); return { question:`${a}x − ${b} = ${a*x-b}`, answer:x, hint:"Solve for x", steps:[`${a}x = ${a*x}`,`x = ${x}`], shortcut:null, topic:"algebra" }; }
  }
}

function generateAdvanced(diff) {
  if (diff==="easy") {
    const t=rand(0,1);
    if (t===0) { const sq=[4,9,16,25,36,49,64,81,100],s=sq[rand(0,sq.length-1)],ans=Math.sqrt(s); return { question:`√${s}`, answer:ans, hint:"Square root", steps:[`√${s} = ${ans}`,`Check: ${ans}²=${s}`], shortcut:"Memorise perfect squares to 100", topic:"roots" }; }
    else { const a=rand(5,20),b=rand(5,20),c=rand(5,20),ans=Math.round((a+b+c)/3); return { question:`avg(${a},${b},${c})`, answer:ans, hint:"Average", steps:[`Sum=${a+b+c}`,`÷3 = ${ans}`], shortcut:null, topic:"averages" }; }
  } else if (diff==="medium") {
    const t=rand(0,4);
    if (t===0) { const base=rand(2,6),exp=rand(2,4),ans=Math.pow(base,exp); return { question:`${base}^${exp}`, answer:ans, hint:`${base} to the power ${exp}`, steps:Array.from({length:exp},(_,i)=>`${base}^${i+1}=${Math.pow(base,i+1)}`), shortcut:null, topic:"powers" }; }
    else if (t===1) { const sq=[4,9,16,25,36,49,64,81,100,121,144,169,196,225],s=sq[rand(0,sq.length-1)],ans=Math.sqrt(s); return { question:`√${s}`, answer:ans, hint:"Square root", steps:[`${ans}²=${s}`,`√${s}=${ans}`], shortcut:null, topic:"roots" }; }
    else if (t===2) { const a=rand(2,8),b=rand(2,8),x=rand(2,8),y=rand(2,8),ans=a*x+b*y; return { question:`${a}(${x})+${b}(${y})`, answer:ans, hint:"Evaluate", steps:[`${a}×${x}=${a*x}`,`${b}×${y}=${b*y}`,`=${ans}`], shortcut:null, topic:"expressions" }; }
    else if (t===3) { const a=rand(10,60),b=rand(10,60),c=rand(10,60),ans=Math.round((a+b+c)/3); return { question:`avg(${a},${b},${c})`, answer:ans, hint:"Average (round)", steps:[`${a}+${b}+${c}=${a+b+c}`,`÷3=${ans}`], shortcut:null, topic:"averages" }; }
    else { const a=rand(3,9),b=rand(3,9),x=rand(3,9),y=rand(3,9),ans=a*x+b*y; return { question:`${a}(${x}) + ${b}(${y})`, answer:ans, hint:"Evaluate", steps:[`${a}×${x}=${a*x}`,`${b}×${y}=${b*y}`,`=${ans}`], shortcut:null, topic:"expressions" }; }
  } else {
    const t=rand(0,3);
    if (t===0) { const base=rand(2,15),exp=rand(2,5),ans=Math.pow(base,exp); return { question:`${base}^${exp}`, answer:ans, hint:`${base} to the power ${exp}`, steps:Array.from({length:exp},(_,i)=>`${base}^${i+1}=${Math.pow(base,i+1)}`), shortcut:`Use (${base}^${Math.floor(exp/2)})² pattern`, topic:"powers" }; }
    else if (t===1) { const sq=[4,9,16,25,36,49,64,81,100,121,144,169,196,225,256,289,324,361,400,441,484,529],s=sq[rand(0,sq.length-1)],ans=Math.sqrt(s); return { question:`√${s}`, answer:ans, hint:"Square root", steps:[`${ans}²=${s}`,`√${s}=${ans}`], shortcut:"Use nearby perfect squares", topic:"roots" }; }
    else if (t===2) { const a=rand(4,15),b=rand(4,15),c=rand(4,15),x=rand(4,12),y=rand(4,12),ans=a*x+b*y-c; return { question:`${a}(${x})+${b}(${y})−${c}`, answer:ans, hint:"Evaluate", steps:[`${a}×${x}=${a*x}`,`${b}×${y}=${b*y}`,`${a*x}+${b*y}-${c}=${ans}`], shortcut:null, topic:"expressions" }; }
    else { const nums=Array.from({length:5},()=>rand(20,300)),sum=nums.reduce((s,n)=>s+n,0),ans=Math.round(sum/5); return { question:`avg(${nums.join(",")})`, answer:ans, hint:"Average 5 nums (round)", steps:[`Sum=${sum}`,`÷5=${ans}`], shortcut:"Estimate middle, check balance", topic:"averages" }; }
  }
}

function generateEstimation(diff) {
  // Generate random estimation pairs dynamically to avoid repetition
  let dividend, divisor, rounded, exact;
  if (diff==="easy") {
    dividend = rand(30,200); divisor = rand(3,15);
  } else if (diff==="medium") {
    dividend = rand(300,2000); divisor = rand(12,60);
  } else {
    dividend = rand(2000,20000); divisor = rand(80,500);
  }
  exact = dividend/divisor; rounded = Math.round(exact);
  const opts=[rounded,rounded+rand(2,8),rounded-rand(2,8),rounded+rand(10,20)].sort(()=>Math.random()-0.5);
  return { question:`≈ ${dividend} ÷ ${divisor}`, answer:rounded, hint:"Best estimate", steps:[`≈${Math.round(dividend/100)*100}÷${Math.round(divisor/10)*10}≈${rounded}`], shortcut:"Round to 1 sig fig each", topic:"estimation", isEstimation:true, estimationOpts:opts };
}

function generateWrongAnswers(correct) {
  const wrongs=new Set();
  const spread=Math.max(5,Math.floor(Math.abs(correct)*0.25));
  let att=0;
  while (wrongs.size<3&&att<300) { att++; const d=rand(-spread,spread); const w=correct+(d===0?rand(1,4):d); if (w!==correct&&w>=0) wrongs.add(w); }
  return [...wrongs,correct].sort(()=>Math.random()-0.5);
}

// ── Sudoku Generator ──
function generateSudoku(diff) {
  // Build solved grid
  const grid = Array.from({length:9},()=>Array(9).fill(0));
  function isValid(g,r,c,n) {
    for (let i=0;i<9;i++) { if (g[r][i]===n||g[i][c]===n) return false; }
    const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
    for (let i=0;i<3;i++) for (let j=0;j<3;j++) { if (g[br+i][bc+j]===n) return false; }
    return true;
  }
  function solve(g) {
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
      if (g[r][c]===0) {
        const nums=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);
        for (const n of nums) { if (isValid(g,r,c,n)) { g[r][c]=n; if (solve(g)) return true; g[r][c]=0; } }
        return false;
      }
    }
    return true;
  }
  solve(grid);
  // Remove cells based on difficulty
  const removals = diff==="easy"?30:diff==="medium"?42:52;
  const puzzle = grid.map(r=>[...r]);
  const cells = Array.from({length:81},(_,i)=>i).sort(()=>Math.random()-0.5);
  for (let i=0;i<removals;i++) { const idx=cells[i]; puzzle[Math.floor(idx/9)][idx%9]=0; }
  return { solved: grid.map(r=>[...r]), puzzle: puzzle.map(r=>[...r]) };
}


// ── Vocabulary Data v3 ──
// Source: vocabulary.com/lists/52473 + curated additions
// Total: 331 words  (Easy: 113 · Medium: 105 · Hard: 113)
const VOCAB_WORDS = [
{ word:"Consider", phonetic:"kun·sid·er", ipa:"/kənˈsɪdər/", meaning:"think carefully about something", sentence:"She paused to consider all her options before deciding.", diff:"easy", cats:["everyday","everyday"], synonyms:["reflect","ponder","contemplate","weigh"], antonyms:["ignore","dismiss","overlook","disregard"] },
  { word:"Evident", phonetic:"ev·ih·dunt", ipa:"/ˈevɪdənt/", meaning:"clearly seen or understood; obvious", sentence:"Her talent was evident from her very first performance.", diff:"easy", cats:["everyday","everyday"], synonyms:["obvious","apparent","clear","plain"], antonyms:["hidden","unclear","obscure","doubtful"] },
  { word:"Establish", phonetic:"ih·stab·lish", ipa:"/ɪˈstæblɪʃ/", meaning:"set up or found something permanently", sentence:"The company was established in 1987 by two entrepreneurs.", diff:"easy", cats:["business","everyday"], synonyms:["found","create","set up","institute"], antonyms:["abolish","destroy","dismantle","end"] },
  { word:"Conduct", phonetic:"kon·dukt", ipa:"/ˈkɒndʌkt/", meaning:"direct or manage; a person's behaviour", sentence:"The scientist conducted a series of careful experiments.", diff:"easy", cats:["academic","everyday"], synonyms:["manage","direct","carry out","run"], antonyms:["mismanage","neglect","abandon","ignore"] },
  { word:"Engage", phonetic:"en·gayj", ipa:"/ɪnˈɡeɪdʒ/", meaning:"occupy or attract someone's attention", sentence:"The teacher worked hard to engage every student in discussion.", diff:"easy", cats:["social","everyday"], synonyms:["involve","occupy","absorb","attract"], antonyms:["bore","disengage","repel","ignore"] },
  { word:"Obtain", phonetic:"ob·tayn", ipa:"/əbˈteɪn/", meaning:"get or acquire something", sentence:"She worked for months to obtain the necessary qualifications.", diff:"easy", cats:["academic","everyday"], synonyms:["acquire","get","gain","secure"], antonyms:["lose","forfeit","surrender","give up"] },
  { word:"Scarce", phonetic:"skairs", ipa:"/skeəs/", meaning:"not enough of something; in short supply", sentence:"Clean water is scarce in many parts of the world.", diff:"easy", cats:["everyday","everyday"], synonyms:["rare","insufficient","limited","sparse"], antonyms:["plentiful","abundant","ample","common"] },
  { word:"Apparent", phonetic:"ah·pair·unt", ipa:"/əˈpærənt/", meaning:"clearly visible or understood; seeming", sentence:"It was apparent that the plan was not going to work.", diff:"easy", cats:["academic","everyday"], synonyms:["obvious","clear","evident","plain"], antonyms:["hidden","unclear","uncertain","obscure"] },
  { word:"Compel", phonetic:"kom·pel", ipa:"/kəmˈpel/", meaning:"force or strongly urge someone to do something", sentence:"The evidence compelled the jury to return a guilty verdict.", diff:"easy", cats:["everyday","everyday"], synonyms:["force","drive","oblige","require"], antonyms:["deter","discourage","prevent","stop"] },
  { word:"Venture", phonetic:"ven·cher", ipa:"/ˈventʃə/", meaning:"undertake a risky or daring action", sentence:"She decided to venture into a completely new career.", diff:"easy", cats:["business","everyday"], synonyms:["risk","dare","attempt","undertake"], antonyms:["avoid","retreat","withdraw","stay"] },
  { word:"Temper", phonetic:"tem·per", ipa:"/ˈtempə/", meaning:"a person's usual mood or state of mind", sentence:"He had a cheerful temper that made him popular at work.", diff:"easy", cats:["character","everyday"], synonyms:["mood","disposition","nature","character"], antonyms:["composure","calmness","patience","serenity"] },
  { word:"Undertake", phonetic:"un·der·tayk", ipa:"/ˌʌndəˈteɪk/", meaning:"begin and commit to a project or task", sentence:"She undertook the challenge of learning three languages at once.", diff:"easy", cats:["academic","everyday"], synonyms:["begin","attempt","tackle","pursue"], antonyms:["abandon","avoid","neglect","quit"] },
  { word:"Majority", phonetic:"mah·jor·ih·tee", ipa:"/məˈdʒɒrɪti/", meaning:"more than half of a total number or group", sentence:"The majority of students passed the exam with high marks.", diff:"easy", cats:["academic","everyday"], synonyms:["most","bulk","greater part","mass"], antonyms:["minority","few","handful","fraction"] },
  { word:"Assert", phonetic:"ah·surt", ipa:"/əˈsɜːt/", meaning:"state something confidently and forcefully", sentence:"She asserted her right to be heard at the meeting.", diff:"easy", cats:["communication","everyday"], synonyms:["declare","state","claim","maintain"], antonyms:["deny","withdraw","retract","concede"] },
  { word:"Attitude", phonetic:"at·ih·tyood", ipa:"/ˈætɪtjuːd/", meaning:"a settled way of thinking or feeling", sentence:"His positive attitude helped him overcome many obstacles.", diff:"easy", cats:["character","everyday"], synonyms:["outlook","viewpoint","stance","disposition"], antonyms:["apathy","indifference","uncertainty","confusion"] },
  { word:"Justify", phonetic:"jus·tih·fy", ipa:"/ˈdʒʌstɪfaɪ/", meaning:"show or prove something to be right or reasonable", sentence:"She struggled to justify the high cost of the project.", diff:"easy", cats:["academic","everyday"], synonyms:["defend","explain","support","vindicate"], antonyms:["condemn","refute","undermine","oppose"] },
  { word:"Merit", phonetic:"mer·it", ipa:"/ˈmerɪt/", meaning:"the quality of being good; a praiseworthy quality", sentence:"The proposal had considerable merit and was accepted immediately.", diff:"easy", cats:["academic","everyday"], synonyms:["worth","value","virtue","quality"], antonyms:["fault","flaw","weakness","shortcoming"] },
  { word:"Notion", phonetic:"noh·shun", ipa:"/ˈnəʊʃən/", meaning:"a general idea or understanding of something", sentence:"She had only a vague notion of how the machine worked.", diff:"easy", cats:["academic","everyday"], synonyms:["idea","concept","belief","impression"], antonyms:["fact","certainty","knowledge","reality"] },
  { word:"Formal", phonetic:"for·mul", ipa:"/ˈfɔːməl/", meaning:"done according to set rules or conventions; official", sentence:"The graduation ceremony was a formal and dignified occasion.", diff:"easy", cats:["social","everyday"], synonyms:["official","structured","ceremonial","proper"], antonyms:["informal","casual","relaxed","unofficial"] },
  { word:"Persist", phonetic:"per·sist", ipa:"/pəˈsɪst/", meaning:"continue firmly despite difficulty or opposition", sentence:"She persisted with her studies even when times were tough.", diff:"easy", cats:["character","everyday"], synonyms:["continue","endure","carry on","persevere"], antonyms:["give up","quit","stop","abandon"] },
  { word:"Substantial", phonetic:"sub·stan·shul", ipa:"/səbˈstænʃəl/", meaning:"of considerable importance, size, or worth", sentence:"The company made a substantial profit in its first year.", diff:"easy", cats:["business","everyday"], synonyms:["significant","considerable","large","sizable"], antonyms:["small","minor","trivial","negligible"] },
  { word:"Inspire", phonetic:"in·spy·er", ipa:"/ɪnˈspaɪə/", meaning:"fill someone with enthusiasm or creativity", sentence:"The teacher inspired her students to pursue their dreams.", diff:"easy", cats:["character","everyday"], synonyms:["motivate","encourage","stimulate","uplift"], antonyms:["discourage","dampen","deter","deflate"] },
  { word:"Convince", phonetic:"kun·vins", ipa:"/kənˈvɪns/", meaning:"make someone believe something is true", sentence:"He managed to convince the committee to change their minds.", diff:"easy", cats:["communication","everyday"], synonyms:["persuade","satisfy","win over","assure"], antonyms:["dissuade","deter","doubt","distrust"] },
  { word:"Flourish", phonetic:"flur·ish", ipa:"/ˈflʌrɪʃ/", meaning:"grow or develop vigorously and successfully", sentence:"The small business flourished after the new manager took over.", diff:"easy", cats:["everyday","everyday"], synonyms:["thrive","prosper","bloom","succeed"], antonyms:["decline","wither","fail","struggle"] },
  { word:"Despair", phonetic:"deh·spair", ipa:"/dɪˈspeə/", meaning:"the complete loss or absence of hope", sentence:"She fell into despair when all her attempts failed.", diff:"easy", cats:["emotion","everyday"], synonyms:["hopelessness","anguish","misery","gloom"], antonyms:["hope","optimism","encouragement","joy"] },
  { word:"Contempt", phonetic:"kon·tempt", ipa:"/kənˈtempt/", meaning:"a feeling that someone is beneath consideration", sentence:"His contempt for the rules was obvious to everyone.", diff:"easy", cats:["emotion","everyday"], synonyms:["scorn","disdain","disrespect","derision"], antonyms:["respect","admiration","esteem","regard"] },
  { word:"Manifest", phonetic:"man·ih·fest", ipa:"/ˈmænɪfest/", meaning:"display or show clearly; make evident", sentence:"Her anxiety manifested itself in sleepless nights.", diff:"easy", cats:["academic","everyday"], synonyms:["show","reveal","demonstrate","display"], antonyms:["hide","conceal","suppress","mask"] },
  { word:"Modest", phonetic:"mod·ist", ipa:"/ˈmɒdɪst/", meaning:"not boasting; limited in size or degree", sentence:"Despite his success, he remained a modest and humble person.", diff:"easy", cats:["character","everyday"], synonyms:["humble","restrained","unpretentious","reserved"], antonyms:["arrogant","boastful","showy","excessive"] },
  { word:"Credible", phonetic:"kred·ih·bul", ipa:"/ˈkredɪbəl/", meaning:"able to be believed; convincing", sentence:"She was a credible witness whom the jury trusted completely.", diff:"easy", cats:["academic","everyday"], synonyms:["believable","trustworthy","convincing","reliable"], antonyms:["implausible","unreliable","dubious","questionable"] },
  { word:"Provoke", phonetic:"pro·vohk", ipa:"/prəˈvəʊk/", meaning:"stimulate or incite a reaction or feeling", sentence:"His rude comments provoked an angry response from the crowd.", diff:"easy", cats:["everyday","everyday"], synonyms:["incite","trigger","stir up","antagonise"], antonyms:["calm","soothe","pacify","appease"] },
  { word:"Elaborate", phonetic:"ih·lab·uh·rit", ipa:"/ɪˈlæbərɪt/", meaning:"involving many carefully arranged parts; detailed", sentence:"The chef prepared an elaborate five-course meal for the guests.", diff:"easy", cats:["academic","everyday"], synonyms:["detailed","complex","intricate","ornate"], antonyms:["simple","plain","basic","straightforward"] },
  { word:"Comprehensive", phonetic:"kom·preh·hen·siv", ipa:"/ˌkɒmprɪˈhensɪv/", meaning:"including or dealing with all or nearly all aspects", sentence:"The doctor ordered a comprehensive medical examination.", diff:"easy", cats:["academic","everyday"], synonyms:["thorough","complete","extensive","broad"], antonyms:["partial","limited","narrow","incomplete"] },
  { word:"Indicate", phonetic:"in·dih·kayt", ipa:"/ˈɪndɪkeɪt/", meaning:"point out or show something clearly", sentence:"The symptoms may indicate a more serious underlying condition.", diff:"easy", cats:["academic","everyday"], synonyms:["show","suggest","point to","signal"], antonyms:["hide","conceal","deny","suppress"] },
  { word:"Capable", phonetic:"kay·pah·bul", ipa:"/ˈkeɪpəbəl/", meaning:"having the ability to do something successfully", sentence:"She was clearly capable of handling the demanding role.", diff:"easy", cats:["character","everyday"], synonyms:["able","competent","skilled","qualified"], antonyms:["incapable","incompetent","unable","unfit"] },
  { word:"Diligent", phonetic:"dil·ih·junt", ipa:"/ˈdɪlɪdʒənt/", meaning:"showing care and effort in work", sentence:"The diligent student reviewed her notes every single evening.", diff:"easy", cats:["academic","everyday"], synonyms:["hardworking","industrious","thorough","conscientious"], antonyms:["lazy","careless","negligent","idle"] },
  { word:"Eager", phonetic:"ee·ger", ipa:"/ˈiːɡə/", meaning:"strongly wanting to do or have something", sentence:"The eager students arrived early, ready to start the lesson.", diff:"easy", cats:["character","everyday"], synonyms:["keen","enthusiastic","zealous","motivated"], antonyms:["reluctant","unwilling","apathetic","indifferent"] },
  { word:"Adequate", phonetic:"ad·ih·kwit", ipa:"/ˈædɪkwɪt/", meaning:"satisfactory or acceptable in quality or quantity", sentence:"The funding was barely adequate to cover basic expenses.", diff:"easy", cats:["everyday","everyday"], synonyms:["sufficient","enough","satisfactory","acceptable"], antonyms:["inadequate","insufficient","poor","lacking"] },
  { word:"Confident", phonetic:"kon·fih·dunt", ipa:"/ˈkɒnfɪdənt/", meaning:"feeling sure about one's own abilities", sentence:"She was confident that she had given her best performance.", diff:"easy", cats:["character","everyday"], synonyms:["assured","certain","self-assured","bold"], antonyms:["insecure","doubtful","timid","uncertain"] },
  { word:"Crucial", phonetic:"kroo·shul", ipa:"/ˈkruːʃəl/", meaning:"extremely important or decisive", sentence:"Good communication is crucial to the success of any team.", diff:"easy", cats:["everyday","everyday"], synonyms:["vital","essential","critical","key"], antonyms:["unimportant","trivial","minor","irrelevant"] },
  { word:"Distinct", phonetic:"dis·tinkt", ipa:"/dɪˈstɪŋkt/", meaning:"recognisably different; clearly separate", sentence:"Each of the three designs had a distinct and individual style.", diff:"easy", cats:["academic","everyday"], synonyms:["clear","separate","different","unique"], antonyms:["similar","vague","indistinct","identical"] },
  { word:"Efficient", phonetic:"ih·fish·unt", ipa:"/ɪˈfɪʃənt/", meaning:"achieving maximum results with minimum wasted effort", sentence:"The new system was far more efficient than the old one.", diff:"easy", cats:["business","everyday"], synonyms:["effective","productive","capable","organised"], antonyms:["inefficient","wasteful","slow","unproductive"] },
  { word:"Genuine", phonetic:"jen·yoo·in", ipa:"/ˈdʒenjuɪn/", meaning:"truly what something is said to be; authentic", sentence:"His concern for the environment was entirely genuine.", diff:"easy", cats:["character","everyday"], synonyms:["real","authentic","sincere","true"], antonyms:["fake","false","artificial","insincere"] },
  { word:"Hostile", phonetic:"hos·tyl", ipa:"/ˈhɒstaɪl/", meaning:"showing or feeling opposition or aggression", sentence:"The hostile crowd made the performers feel uncomfortable.", diff:"easy", cats:["everyday","everyday"], synonyms:["aggressive","unfriendly","antagonistic","threatening"], antonyms:["friendly","welcoming","supportive","warm"] },
  { word:"Impartial", phonetic:"im·par·shul", ipa:"/ɪmˈpɑːʃəl/", meaning:"treating all rivals equally; fair and unbiased", sentence:"A judge must remain impartial throughout the entire trial.", diff:"easy", cats:["character","everyday"], synonyms:["unbiased","fair","neutral","objective"], antonyms:["biased","partial","prejudiced","unfair"] },
  { word:"Logical", phonetic:"loj·ih·kul", ipa:"/ˈlɒdʒɪkəl/", meaning:"based on clear and sound reasoning", sentence:"The detective followed a logical sequence to solve the mystery.", diff:"easy", cats:["academic","everyday"], synonyms:["rational","reasonable","sensible","coherent"], antonyms:["illogical","irrational","absurd","unreasonable"] },
  { word:"Mature", phonetic:"mah·tyoor", ipa:"/məˈtjʊə/", meaning:"fully developed in body, mind, or judgement", sentence:"She showed a very mature attitude to disappointment.", diff:"easy", cats:["character","everyday"], synonyms:["grown","developed","adult","responsible"], antonyms:["immature","childish","naive","undeveloped"] },
  { word:"Precise", phonetic:"preh·sys", ipa:"/prɪˈsaɪs/", meaning:"marked by exactness and accuracy", sentence:"The instructions must be precise to leave no room for error.", diff:"easy", cats:["academic","everyday"], synonyms:["exact","accurate","specific","correct"], antonyms:["vague","approximate","imprecise","unclear"] },
  { word:"Reliable", phonetic:"reh·ly·ah·bul", ipa:"/rɪˈlaɪəbəl/", meaning:"consistently good in performance; dependable", sentence:"She was a reliable and trustworthy member of the team.", diff:"easy", cats:["character","everyday"], synonyms:["dependable","trustworthy","consistent","steadfast"], antonyms:["unreliable","inconsistent","undependable","erratic"] },
  { word:"Sincere", phonetic:"sin·seer", ipa:"/sɪnˈsɪə/", meaning:"free from pretence; genuinely felt", sentence:"He offered her a sincere apology for his behaviour.", diff:"easy", cats:["character","everyday"], synonyms:["genuine","honest","heartfelt","authentic"], antonyms:["insincere","false","dishonest","hypocritical"] },
  { word:"Tolerant", phonetic:"tol·er·unt", ipa:"/ˈtɒlərənt/", meaning:"allowing the existence of opinions different from one's own", sentence:"A good teacher must be patient and tolerant with all students.", diff:"easy", cats:["social","everyday"], synonyms:["open-minded","accepting","forbearing","patient"], antonyms:["intolerant","narrow-minded","bigoted","prejudiced"] },
  { word:"Urgent", phonetic:"ur·junt", ipa:"/ˈɜːdʒənt/", meaning:"requiring immediate action or attention", sentence:"The doctor said the patient's condition was urgent.", diff:"easy", cats:["everyday","everyday"], synonyms:["pressing","critical","immediate","vital"], antonyms:["unimportant","trivial","minor","low-priority"] },
  { word:"Vivid", phonetic:"viv·id", ipa:"/ˈvɪvɪd/", meaning:"producing powerful feelings; bright and striking", sentence:"She painted a vivid picture of life in the crowded city.", diff:"easy", cats:["literary","everyday"], synonyms:["bright","striking","colourful","lifelike"], antonyms:["dull","faded","pale","vague"] },
  { word:"Wary", phonetic:"wair·ee", ipa:"/ˈweəri/", meaning:"cautious about possible dangers or problems", sentence:"She was wary of trusting strangers after her experience.", diff:"easy", cats:["character","everyday"], synonyms:["cautious","careful","guarded","suspicious"], antonyms:["careless","reckless","naive","trusting"] },
  { word:"Zeal", phonetic:"zeel", ipa:"/ziːl/", meaning:"great energy or enthusiasm in pursuit of a cause", sentence:"She pursued her goal with remarkable zeal and determination.", diff:"easy", cats:["character","everyday"], synonyms:["enthusiasm","passion","fervour","dedication"], antonyms:["apathy","indifference","lethargy","disinterest"] },
  { word:"Loyal", phonetic:"loy·ul", ipa:"/ˈlɔɪəl/", meaning:"giving constant support to a person or institution", sentence:"A loyal friend stays by your side even in difficult times.", diff:"easy", cats:["social","everyday"], synonyms:["faithful","devoted","dedicated","steadfast"], antonyms:["disloyal","treacherous","unfaithful","unreliable"] },
  { word:"Bold", phonetic:"bohld", ipa:"/bəʊld/", meaning:"willing to take risks; confident and courageous", sentence:"She made a bold decision to leave her job and start her own business.", diff:"easy", cats:["character","everyday"], synonyms:["brave","daring","courageous","confident"], antonyms:["timid","cowardly","cautious","fearful"] },
  { word:"Calm", phonetic:"kahm", ipa:"/kɑːm/", meaning:"not showing or feeling nervousness or anger", sentence:"She remained calm despite the chaos all around her.", diff:"easy", cats:["emotion","everyday"], synonyms:["tranquil","composed","serene","peaceful"], antonyms:["agitated","anxious","nervous","troubled"] },
  { word:"Curious", phonetic:"kyoor·ee·us", ipa:"/ˈkjʊəriəs/", meaning:"eager to know or learn something new", sentence:"The curious child asked question after question about the world.", diff:"easy", cats:["character","everyday"], synonyms:["inquisitive","interested","questioning","enquiring"], antonyms:["disinterested","indifferent","incurious","bored"] },
  { word:"Decisive", phonetic:"deh·sy·siv", ipa:"/dɪˈsaɪsɪv/", meaning:"having the ability to make decisions quickly", sentence:"A good leader must be decisive and clear-headed under pressure.", diff:"easy", cats:["character","everyday"], synonyms:["determined","resolute","firm","conclusive"], antonyms:["indecisive","hesitant","uncertain","wavering"] },
  { word:"Diverse", phonetic:"dih·vurs", ipa:"/daɪˈvɜːs/", meaning:"showing a great deal of variety", sentence:"The city has a wonderfully diverse cultural heritage.", diff:"easy", cats:["academic","everyday"], synonyms:["varied","different","mixed","wide-ranging"], antonyms:["uniform","homogeneous","similar","identical"] },
  { word:"Endure", phonetic:"en·dyoor", ipa:"/ɪnˈdjʊə/", meaning:"suffer something difficult patiently; last over time", sentence:"She endured years of hardship before achieving her goals.", diff:"easy", cats:["character","everyday"], synonyms:["tolerate","withstand","bear","survive"], antonyms:["give up","surrender","collapse","fail"] },
  { word:"Flexible", phonetic:"flek·sih·bul", ipa:"/ˈfleksɪbəl/", meaning:"willing to change; easily adapted to new conditions", sentence:"She was flexible about her working hours when needed.", diff:"easy", cats:["character","everyday"], synonyms:["adaptable","versatile","open","accommodating"], antonyms:["rigid","inflexible","stubborn","fixed"] },
  { word:"Gracious", phonetic:"gray·shus", ipa:"/ˈɡreɪʃəs/", meaning:"courteous, kind, and pleasant in manner", sentence:"The gracious host made every guest feel completely at home.", diff:"easy", cats:["social","everyday"], synonyms:["kind","courteous","warm","polite"], antonyms:["rude","unkind","cold","harsh"] },
  { word:"Noble", phonetic:"noh·bul", ipa:"/ˈnəʊbəl/", meaning:"having fine personal qualities or high moral principles", sentence:"She was a noble and courageous defender of human rights.", diff:"easy", cats:["literary","everyday"], synonyms:["virtuous","honourable","dignified","upright"], antonyms:["base","dishonourable","ignoble","corrupt"] },
  { word:"Patient", phonetic:"pay·shunt", ipa:"/ˈpeɪʃənt/", meaning:"able to accept delay without becoming annoyed", sentence:"A good teacher must be patient with all types of learners.", diff:"easy", cats:["character","everyday"], synonyms:["tolerant","calm","persevering","stoic"], antonyms:["impatient","irritable","restless","frustrated"] },
  { word:"Rational", phonetic:"rash·un·ul", ipa:"/ˈræʃənəl/", meaning:"based on clear thinking and reason", sentence:"He made a rational and well-considered decision.", diff:"easy", cats:["academic","everyday"], synonyms:["logical","sensible","reasonable","sound"], antonyms:["irrational","illogical","emotional","unreasonable"] },
  { word:"Stable", phonetic:"stay·bul", ipa:"/ˈsteɪbəl/", meaning:"not likely to change; firmly established", sentence:"The patient's condition was finally stable after surgery.", diff:"easy", cats:["everyday","everyday"], synonyms:["steady","firm","secure","solid"], antonyms:["unstable","shaky","precarious","volatile"] },
  { word:"Thoughtful", phonetic:"thawt·ful", ipa:"/ˈθɔːtfʊl/", meaning:"showing careful consideration; considerate of others", sentence:"He always sent thoughtful cards on friends' birthdays.", diff:"easy", cats:["social","everyday"], synonyms:["considerate","reflective","caring","attentive"], antonyms:["thoughtless","careless","inconsiderate","selfish"] },
  { word:"Unique", phonetic:"yoo·neek", ipa:"/juːˈniːk/", meaning:"being the only one of its kind; unlike anything else", sentence:"Each fingerprint is completely unique to the individual.", diff:"easy", cats:["academic","everyday"], synonyms:["singular","one-of-a-kind","distinctive","unparalleled"], antonyms:["common","ordinary","typical","standard"] },
  { word:"Vast", phonetic:"vast", ipa:"/vɑːst/", meaning:"of very great extent or quantity; enormous", sentence:"The explorer crossed the vast desert on camel.", diff:"easy", cats:["everyday","everyday"], synonyms:["enormous","immense","huge","extensive"], antonyms:["tiny","small","limited","narrow"] },
  { word:"Wise", phonetic:"wyz", ipa:"/waɪz/", meaning:"having experience, knowledge, and good judgement", sentence:"She sought the advice of an older and wiser colleague.", diff:"easy", cats:["character","everyday"], synonyms:["sensible","shrewd","judicious","discerning"], antonyms:["foolish","naive","unwise","reckless"] },
  { word:"Adapt", phonetic:"ah·dapt", ipa:"/əˈdæpt/", meaning:"adjust or change to fit new conditions", sentence:"Animals must adapt quickly to changes in their environment.", diff:"easy", cats:["academic","everyday"], synonyms:["adjust","modify","change","accommodate"], antonyms:["resist","refuse","ignore","stay fixed"] },
  { word:"Benign", phonetic:"beh·nyn", ipa:"/bɪˈnaɪn/", meaning:"gentle and kindly; not harmful or threatening", sentence:"The growth turned out to be entirely benign.", diff:"easy", cats:["character","everyday"], synonyms:["harmless","gentle","kind","mild"], antonyms:["malignant","harmful","dangerous","malicious"] },
  { word:"Deliberate", phonetic:"deh·lib·er·it", ipa:"/dɪˈlɪbərɪt/", meaning:"done consciously and intentionally; careful", sentence:"His deliberate and thoughtful approach impressed the committee.", diff:"easy", cats:["character","everyday"], synonyms:["intentional","planned","careful","considered"], antonyms:["accidental","careless","hasty","unplanned"] },
  { word:"Effective", phonetic:"ih·fek·tiv", ipa:"/ɪˈfektɪv/", meaning:"producing the desired result; successful", sentence:"The new medicine was very effective at reducing pain.", diff:"easy", cats:["everyday","everyday"], synonyms:["successful","productive","powerful","efficient"], antonyms:["ineffective","useless","weak","unsuccessful"] },
  { word:"Fortunate", phonetic:"for·chuh·nit", ipa:"/ˈfɔːtʃənɪt/", meaning:"having unexpected good luck; lucky", sentence:"She was fortunate to have such a supportive family.", diff:"easy", cats:["everyday","everyday"], synonyms:["lucky","blessed","favoured","privileged"], antonyms:["unfortunate","unlucky","disadvantaged","hapless"] },
  { word:"Highlight", phonetic:"hy·lyt", ipa:"/ˈhaɪlaɪt/", meaning:"make something more noticeable; the best part", sentence:"The report highlighted the need for better training in schools.", diff:"easy", cats:["academic","everyday"], synonyms:["emphasise","stress","underline","feature"], antonyms:["downplay","minimise","ignore","overlook"] },
  { word:"Improve", phonetic:"im·proov", ipa:"/ɪmˈpruːv/", meaning:"make or become better in quality", sentence:"She worked hard to improve her performance in mathematics.", diff:"easy", cats:["everyday","everyday"], synonyms:["enhance","develop","advance","strengthen"], antonyms:["worsen","deteriorate","decline","damage"] },
  { word:"Keen", phonetic:"keen", ipa:"/kiːn/", meaning:"having a sharp, penetrating mind; eager", sentence:"Her keen observation revealed what everyone else had missed.", diff:"easy", cats:["character","everyday"], synonyms:["sharp","perceptive","astute","observant"], antonyms:["obtuse","dull","slow","unperceptive"] },
  { word:"Linger", phonetic:"ling·ger", ipa:"/ˈlɪŋɡə/", meaning:"stay somewhere longer than necessary", sentence:"The smell of fresh bread lingered in the kitchen all morning.", diff:"easy", cats:["everyday","everyday"], synonyms:["remain","stay","persist","endure"], antonyms:["vanish","leave","disappear","depart"] },
  { word:"Notable", phonetic:"noh·tah·bul", ipa:"/ˈnəʊtəbəl/", meaning:"worthy of attention or notice; remarkable", sentence:"She had a notable talent for bringing people together.", diff:"easy", cats:["academic","everyday"], synonyms:["remarkable","outstanding","distinguished","significant"], antonyms:["ordinary","unremarkable","insignificant","minor"] },
  { word:"Overcome", phonetic:"oh·ver·kum", ipa:"/ˌəʊvəˈkʌm/", meaning:"succeed in dealing with a problem or difficulty", sentence:"She overcame great hardship to achieve her ambitions.", diff:"easy", cats:["character","everyday"], synonyms:["conquer","defeat","beat","surmount"], antonyms:["succumb","yield","surrender","fail"] },
  { word:"Positive", phonetic:"poz·ih·tiv", ipa:"/ˈpɒzɪtɪv/", meaning:"constructive, optimistic, or confident in attitude", sentence:"She always tried to find a positive side to every situation.", diff:"easy", cats:["character","everyday"], synonyms:["optimistic","encouraging","affirmative","hopeful"], antonyms:["negative","pessimistic","doubtful","discouraging"] },
  { word:"Reinforce", phonetic:"ree·in·fors", ipa:"/ˌriːɪnˈfɔːs/", meaning:"strengthen or support something further", sentence:"The teacher reinforced the lesson with practical examples.", diff:"easy", cats:["academic","everyday"], synonyms:["strengthen","support","bolster","back up"], antonyms:["weaken","undermine","reduce","diminish"] },
  { word:"Spontaneous", phonetic:"spon·tay·nee·us", ipa:"/spɒnˈteɪniəs/", meaning:"performed without planning; natural and instinctive", sentence:"Her spontaneous laughter made everyone in the room smile.", diff:"easy", cats:["character","everyday"], synonyms:["natural","instinctive","impulsive","unplanned"], antonyms:["planned","deliberate","calculated","rehearsed"] },
  { word:"Trustworthy", phonetic:"trust·wur·thee", ipa:"/ˈtrʌstwɜːði/", meaning:"able to be relied on as honest or truthful", sentence:"He was a thoroughly trustworthy and dependable colleague.", diff:"easy", cats:["character","everyday"], synonyms:["reliable","honest","dependable","faithful"], antonyms:["untrustworthy","unreliable","dishonest","deceptive"] },
  { word:"Vulnerable", phonetic:"vul·ner·ah·bul", ipa:"/ˈvʌlnərəbəl/", meaning:"exposed to the possibility of being attacked or harmed", sentence:"Young children are particularly vulnerable to certain infections.", diff:"easy", cats:["academic","everyday"], synonyms:["defenceless","exposed","susceptible","fragile"], antonyms:["protected","strong","invulnerable","resilient"] },
  { word:"Weary", phonetic:"weer·ee", ipa:"/ˈwɪəri/", meaning:"feeling or showing extreme tiredness", sentence:"After the long hike, the weary travellers rested by the stream.", diff:"easy", cats:["emotion","everyday"], synonyms:["tired","exhausted","fatigued","worn out"], antonyms:["energetic","refreshed","lively","vigorous"] },
  { word:"Achieve", phonetic:"ah·cheev", ipa:"/əˈtʃiːv/", meaning:"successfully bring about a result through effort", sentence:"Hard work and persistence helped her achieve her dreams.", diff:"easy", cats:["academic","everyday"], synonyms:["accomplish","succeed","attain","realise"], antonyms:["fail","miss","lose","give up"] },
  { word:"Concise", phonetic:"kon·sys", ipa:"/kənˈsaɪs/", meaning:"giving information clearly using few words", sentence:"The report was concise yet covered all the important points.", diff:"easy", cats:["communication","everyday"], synonyms:["brief","succinct","compact","short"], antonyms:["verbose","wordy","lengthy","rambling"] },
  { word:"Demonstrate", phonetic:"dem·un·strayt", ipa:"/ˈdemənstreɪt/", meaning:"clearly show the existence or truth of something", sentence:"The teacher demonstrated the experiment step by step.", diff:"easy", cats:["academic","everyday"], synonyms:["show","prove","display","illustrate"], antonyms:["hide","conceal","disprove","deny"] },
  { word:"Encourage", phonetic:"en·kur·ij", ipa:"/ɪnˈkʌrɪdʒ/", meaning:"give support, confidence, or hope to someone", sentence:"Her parents always encouraged her to pursue her passion.", diff:"easy", cats:["social","everyday"], synonyms:["support","motivate","inspire","uplift"], antonyms:["discourage","deter","dampen","undermine"] },
  { word:"Fundamental", phonetic:"fun·duh·men·tul", ipa:"/ˌfʌndəˈmentəl/", meaning:"forming a necessary base or core; essential", sentence:"Respect for others is a fundamental principle of good manners.", diff:"easy", cats:["academic","everyday"], synonyms:["basic","essential","core","primary"], antonyms:["minor","secondary","unimportant","peripheral"] },
  { word:"Gradual", phonetic:"graj·oo·ul", ipa:"/ˈɡrædʒuəl/", meaning:"taking place slowly over a long period of time", sentence:"There was a gradual improvement in the patient's condition.", diff:"easy", cats:["everyday","everyday"], synonyms:["slow","steady","progressive","incremental"], antonyms:["sudden","rapid","abrupt","immediate"] },
  { word:"Honour", phonetic:"on·er", ipa:"/ˈɒnə/", meaning:"high respect; the quality of being honest and principled", sentence:"She served her country with great honour and dignity.", diff:"easy", cats:["character","everyday"], synonyms:["integrity","dignity","respect","pride"], antonyms:["dishonour","disgrace","shame","disrespect"] },
  { word:"Illustrate", phonetic:"il·uh·strayt", ipa:"/ˈɪləstreɪt/", meaning:"provide examples to make something clear", sentence:"She used diagrams to illustrate her argument clearly.", diff:"easy", cats:["academic","everyday"], synonyms:["show","demonstrate","explain","depict"], antonyms:["obscure","confuse","hide","complicate"] },
  { word:"Jeopardise", phonetic:"jep·er·dyz", ipa:"/ˈdʒepədaɪz/", meaning:"put someone or something into a situation of risk", sentence:"Reckless behaviour could jeopardise the entire project.", diff:"easy", cats:["everyday","everyday"], synonyms:["endanger","risk","threaten","undermine"], antonyms:["protect","safeguard","secure","preserve"] },
  { word:"Persevere", phonetic:"pur·suh·veer", ipa:"/ˌpɜːsɪˈvɪə/", meaning:"continue in a course of action despite difficulty", sentence:"She persevered with the project even when progress was slow.", diff:"easy", cats:["character","everyday"], synonyms:["persist","continue","endure","keep going"], antonyms:["give up","quit","abandon","surrender"] },
  { word:"Reluctant", phonetic:"reh·luk·tunt", ipa:"/rɪˈlʌktənt/", meaning:"unwilling and hesitant; disinclined", sentence:"He was reluctant to admit that he had made a mistake.", diff:"easy", cats:["character","everyday"], synonyms:["unwilling","hesitant","averse","loath"], antonyms:["willing","eager","keen","enthusiastic"] },
  { word:"Transform", phonetic:"trans·form", ipa:"/trænsˈfɔːm/", meaning:"make a thorough or dramatic change", sentence:"The renovation completely transformed the old building.", diff:"easy", cats:["everyday","everyday"], synonyms:["change","alter","convert","revamp"], antonyms:["preserve","maintain","keep","stabilise"] },
  { word:"Unite", phonetic:"yoo·nyt", ipa:"/juːˈnaɪt/", meaning:"come or bring together for a common purpose", sentence:"The crisis served to unite the community as never before.", diff:"easy", cats:["social","everyday"], synonyms:["join","combine","merge","integrate"], antonyms:["divide","separate","split","fragment"] },
  { word:"Valid", phonetic:"val·id", ipa:"/ˈvælɪd/", meaning:"having a sound basis in logic or fact", sentence:"She made a valid point that nobody could argue against.", diff:"easy", cats:["academic","everyday"], synonyms:["sound","reasonable","legitimate","justified"], antonyms:["invalid","false","unsound","unjustified"] },
  { word:"Worthy", phonetic:"wur·thee", ipa:"/ˈwɜːði/", meaning:"having sufficient worth to receive attention or respect", sentence:"The charity is a very worthy cause deserving of support.", diff:"easy", cats:["character","everyday"], synonyms:["deserving","meritorious","valuable","creditable"], antonyms:["unworthy","undeserving","inferior","inadequate"] },
  { word:"Yearn", phonetic:"yurn", ipa:"/jɜːn/", meaning:"have an intense feeling of longing for something", sentence:"She yearned for the peace and quiet of the countryside.", diff:"easy", cats:["emotion","everyday"], synonyms:["long for","crave","desire","pine"], antonyms:["satisfy","fulfil","content","indulge"] },
  { word:"Fair", phonetic:"fair", ipa:"/feə/", meaning:"treating people equally without favouritism", sentence:"The children agreed that the teacher was always fair.", diff:"easy", cats:["character","everyday"], synonyms:["just","impartial","equitable","unbiased"], antonyms:["unfair","biased","unjust","partial"] },
  { word:"Global", phonetic:"gloh·bul", ipa:"/ˈɡləʊbəl/", meaning:"relating to the whole world; worldwide", sentence:"Climate change is a global challenge that requires global action.", diff:"easy", cats:["academic","everyday"], synonyms:["worldwide","international","universal","planetary"], antonyms:["local","regional","national","limited"] },
  { word:"Necessary", phonetic:"nes·uh·ser·ee", ipa:"/ˈnesəsəri/", meaning:"required to be done or achieved; essential", sentence:"It was necessary to review the plan before proceeding.", diff:"easy", cats:["everyday","everyday"], synonyms:["essential","required","vital","needed"], antonyms:["unnecessary","optional","redundant","superfluous"] },
  { word:"Outcome", phonetic:"owt·kum", ipa:"/ˈaʊtkʌm/", meaning:"the way a thing turns out; a result or consequence", sentence:"The outcome of the meeting was a new agreement.", diff:"easy", cats:["business","everyday"], synonyms:["result","consequence","conclusion","effect"], antonyms:["cause","beginning","origin","input"] },
  { word:"Preserve", phonetic:"preh·zurv", ipa:"/prɪˈzɜːv/", meaning:"maintain something in its original or existing state", sentence:"The museum worked hard to preserve ancient artefacts.", diff:"easy", cats:["everyday","everyday"], synonyms:["protect","maintain","conserve","keep"], antonyms:["destroy","damage","neglect","abandon"] },
  { word:"Resourceful", phonetic:"reh·sors·ful", ipa:"/rɪˈzɔːsfʊl/", meaning:"able to find quick and clever ways to overcome difficulties", sentence:"He was resourceful enough to solve the problem with limited tools.", diff:"easy", cats:["character","everyday"], synonyms:["inventive","capable","clever","adaptable"], antonyms:["helpless","unable","inept","unimaginative"] },
  { word:"Strategy", phonetic:"strat·eh·jee", ipa:"/ˈstrætɪdʒi/", meaning:"a plan of action designed to achieve a long-term goal", sentence:"She developed a detailed strategy for growing the business.", diff:"easy", cats:["business","everyday"], synonyms:["plan","approach","method","scheme"], antonyms:["improvisation","chance","chaos","disorder"] },
  { word:"Uncertain", phonetic:"un·sur·tun", ipa:"/ʌnˈsɜːtən/", meaning:"not able to be relied on; not known or definite", sentence:"The future of the project remained deeply uncertain.", diff:"easy", cats:["everyday","everyday"], synonyms:["unsure","doubtful","unpredictable","unclear"], antonyms:["certain","definite","sure","confirmed"] },
  { word:"Volunteer", phonetic:"vol·un·teer", ipa:"/ˌvɒlənˈtɪə/", meaning:"freely offer to do something without being asked", sentence:"She volunteered to lead the project without being asked.", diff:"easy", cats:["social","everyday"], synonyms:["offer","give freely","contribute","donate"], antonyms:["refuse","withhold","avoid","abstain"] },
{ word:"Accord", phonetic:"ah·kord", ipa:"/əˈkɔːd/", meaning:"agreement or harmony between people", sentence:"The two countries finally reached an accord on trade.", diff:"medium", cats:["business","academic"], synonyms:["agreement","harmony","treaty","consensus"], antonyms:["disagreement","conflict","discord","dispute"] },
  { word:"Advocate", phonetic:"ad·voh·kayt", ipa:"/ˈædvəkeɪt/", meaning:"a person who publicly supports a cause", sentence:"She became a passionate advocate for children's rights.", diff:"medium", cats:["social","academic"], synonyms:["supporter","champion","defender","promoter"], antonyms:["opponent","critic","adversary","detractor"] },
  { word:"Ambiguous", phonetic:"am·big·yoo·us", ipa:"/æmˈbɪɡjuəs/", meaning:"open to more than one interpretation; unclear", sentence:"The message was deliberately ambiguous and hard to interpret.", diff:"medium", cats:["academic","academic"], synonyms:["unclear","vague","uncertain","equivocal"], antonyms:["clear","definite","unambiguous","explicit"] },
  { word:"Appease", phonetic:"ah·peez", ipa:"/əˈpiːz/", meaning:"make someone less angry by conceding to their demands", sentence:"The manager tried to appease the angry customers.", diff:"medium", cats:["social","academic"], synonyms:["placate","satisfy","pacify","mollify"], antonyms:["provoke","anger","irritate","agitate"] },
  { word:"Articulate", phonetic:"ar·tik·yoo·lat", ipa:"/ɑːˈtɪkjʊlɪt/", meaning:"able to express thoughts and feelings clearly", sentence:"She was highly articulate when explaining complex ideas.", diff:"medium", cats:["communication","academic"], synonyms:["eloquent","expressive","clear","fluent"], antonyms:["inarticulate","unclear","muddled","incoherent"] },
  { word:"Astute", phonetic:"ah·stoot", ipa:"/əˈstjuːt/", meaning:"having an ability to accurately assess situations; shrewd", sentence:"She was an astute businesswoman who rarely made mistakes.", diff:"medium", cats:["character","academic"], synonyms:["shrewd","sharp","perceptive","clever"], antonyms:["naive","gullible","dull","obtuse"] },
  { word:"Augment", phonetic:"awg·ment", ipa:"/ɔːɡˈment/", meaning:"make something greater by adding to it", sentence:"She took evening courses to augment her existing skills.", diff:"medium", cats:["academic","academic"], synonyms:["increase","add to","enhance","expand"], antonyms:["reduce","decrease","diminish","lessen"] },
  { word:"Austere", phonetic:"aw·steer", ipa:"/ɒˈstɪə/", meaning:"severe or strict in manner; having no decorative features", sentence:"The room was austere and functional with no decoration.", diff:"medium", cats:["character","academic"], synonyms:["severe","plain","harsh","spartan"], antonyms:["lavish","ornate","luxurious","indulgent"] },
  { word:"Candour", phonetic:"kan·der", ipa:"/ˈkændə/", meaning:"the quality of being open and honest; frankness", sentence:"She spoke with refreshing candour about her difficulties.", diff:"medium", cats:["character","academic"], synonyms:["honesty","frankness","openness","sincerity"], antonyms:["deception","dishonesty","duplicity","evasiveness"] },
  { word:"Circumspect", phonetic:"sur·kum·spekt", ipa:"/ˈsɜːkəmspekt/", meaning:"wary and unwilling to take risks; cautious", sentence:"She was circumspect, never acting without careful thought.", diff:"medium", cats:["character","academic"], synonyms:["cautious","careful","prudent","wary"], antonyms:["reckless","careless","impulsive","hasty"] },
  { word:"Coherent", phonetic:"koh·heer·unt", ipa:"/kəʊˈhɪərənt/", meaning:"logical and consistent; easy to understand", sentence:"She presented a coherent and well-argued case to the jury.", diff:"medium", cats:["academic","academic"], synonyms:["logical","consistent","clear","rational"], antonyms:["incoherent","confused","illogical","muddled"] },
  { word:"Comply", phonetic:"kom·ply", ipa:"/kəmˈplaɪ/", meaning:"act in accordance with a wish or command", sentence:"All employees must comply with the new safety guidelines.", diff:"medium", cats:["business","academic"], synonyms:["obey","conform","follow","adhere"], antonyms:["defy","refuse","resist","disobey"] },
  { word:"Concede", phonetic:"kon·seed", ipa:"/kənˈsiːd/", meaning:"admit that something is true after first denying it", sentence:"He finally conceded that she had made a fair point.", diff:"medium", cats:["communication","academic"], synonyms:["admit","acknowledge","grant","yield"], antonyms:["deny","dispute","contest","refuse"] },
  { word:"Condone", phonetic:"kon·dohn", ipa:"/kənˈdəʊn/", meaning:"accept or allow behaviour considered morally wrong", sentence:"The school would not condone any form of bullying.", diff:"medium", cats:["character","academic"], synonyms:["excuse","overlook","forgive","permit"], antonyms:["condemn","oppose","criticise","punish"] },
  { word:"Contend", phonetic:"kon·tend", ipa:"/kənˈtend/", meaning:"struggle to deal with something; maintain or argue", sentence:"She had to contend with many obstacles on her path to success.", diff:"medium", cats:["academic","academic"], synonyms:["struggle","compete","maintain","assert"], antonyms:["surrender","concede","agree","yield"] },
  { word:"Controversial", phonetic:"kon·troh·vur·shul", ipa:"/ˌkɒntrəˈvɜːʃəl/", meaning:"giving rise to public disagreement", sentence:"The politician's remarks were deeply controversial.", diff:"medium", cats:["academic","academic"], synonyms:["debatable","contentious","disputed","sensitive"], antonyms:["undisputed","accepted","agreed","uncontroversial"] },
  { word:"Convey", phonetic:"kon·vay", ipa:"/kənˈveɪ/", meaning:"transport or communicate something effectively", sentence:"His tone of voice conveyed more than his actual words.", diff:"medium", cats:["communication","academic"], synonyms:["communicate","express","transmit","impart"], antonyms:["conceal","hide","suppress","withhold"] },
  { word:"Curtail", phonetic:"kur·tayl", ipa:"/kɜːˈteɪl/", meaning:"reduce or impose a restriction on something", sentence:"The new law sought to curtail the freedom of the press.", diff:"medium", cats:["business","academic"], synonyms:["reduce","restrict","limit","cut back"], antonyms:["extend","expand","increase","enlarge"] },
  { word:"Cynical", phonetic:"sin·ih·kul", ipa:"/ˈsɪnɪkəl/", meaning:"believing people are motivated purely by self-interest", sentence:"He was cynical about politicians' promises.", diff:"medium", cats:["character","academic"], synonyms:["sceptical","distrustful","pessimistic","jaded"], antonyms:["optimistic","naive","trusting","idealistic"] },
  { word:"Daunting", phonetic:"dawn·ting", ipa:"/ˈdɔːntɪŋ/", meaning:"seeming difficult to deal with; intimidating", sentence:"The scale of the task ahead was truly daunting.", diff:"medium", cats:["everyday","academic"], synonyms:["intimidating","formidable","overwhelming","challenging"], antonyms:["encouraging","manageable","easy","simple"] },
  { word:"Deduce", phonetic:"deh·dyoos", ipa:"/dɪˈdjuːs/", meaning:"arrive at a conclusion by reasoning from evidence", sentence:"From the evidence, she was able to deduce what had happened.", diff:"medium", cats:["academic","academic"], synonyms:["conclude","infer","reason","work out"], antonyms:["guess","assume","misunderstand","overlook"] },
  { word:"Deficit", phonetic:"def·ih·sit", ipa:"/ˈdefɪsɪt/", meaning:"the amount by which something falls short", sentence:"The government announced plans to reduce the national deficit.", diff:"medium", cats:["business","academic"], synonyms:["shortfall","shortage","gap","arrears"], antonyms:["surplus","excess","profit","gain"] },
  { word:"Denote", phonetic:"deh·noht", ipa:"/dɪˈnəʊt/", meaning:"be a sign of; indicate or represent", sentence:"The red flag denotes danger and should not be ignored.", diff:"medium", cats:["academic","academic"], synonyms:["indicate","signify","represent","mean"], antonyms:["obscure","confuse","hide","misrepresent"] },
  { word:"Depict", phonetic:"deh·pikt", ipa:"/dɪˈpɪkt/", meaning:"show or represent something in a picture or story", sentence:"The film depicted life in the city during the war years.", diff:"medium", cats:["literary","academic"], synonyms:["portray","represent","show","illustrate"], antonyms:["hide","distort","misrepresent","conceal"] },
  { word:"Derive", phonetic:"deh·ryv", ipa:"/dɪˈraɪv/", meaning:"obtain something from a specified source", sentence:"She derived great satisfaction from helping others.", diff:"medium", cats:["academic","academic"], synonyms:["obtain","gain","draw","get"], antonyms:["lose","give up","forfeit","surrender"] },
  { word:"Diminish", phonetic:"dih·min·ish", ipa:"/dɪˈmɪnɪʃ/", meaning:"make or become less in degree or size", sentence:"His enthusiasm did not diminish even after years of setbacks.", diff:"medium", cats:["everyday","academic"], synonyms:["reduce","decrease","lessen","decline"], antonyms:["increase","grow","expand","strengthen"] },
  { word:"Discreet", phonetic:"dis·kreet", ipa:"/dɪˈskriːt/", meaning:"careful and prudent in speech or action", sentence:"She was discreet about her colleagues' private affairs.", diff:"medium", cats:["character","academic"], synonyms:["tactful","cautious","careful","prudent"], antonyms:["indiscreet","careless","reckless","outspoken"] },
  { word:"Dominant", phonetic:"dom·ih·nunt", ipa:"/ˈdɒmɪnənt/", meaning:"most important, powerful, or influential", sentence:"The company quickly became the dominant force in the market.", diff:"medium", cats:["business","academic"], synonyms:["chief","leading","principal","ruling"], antonyms:["minor","weak","subordinate","secondary"] },
  { word:"Dubious", phonetic:"dyoo·bee·us", ipa:"/ˈdjuːbiəs/", meaning:"hesitating or doubting; not to be relied upon", sentence:"She was dubious about the truth of his claims.", diff:"medium", cats:["character","academic"], synonyms:["doubtful","sceptical","uncertain","suspicious"], antonyms:["certain","trusting","confident","convinced"] },
  { word:"Dynamic", phonetic:"dy·nam·ik", ipa:"/daɪˈnæmɪk/", meaning:"characterised by constant change, activity, or progress", sentence:"The city had a dynamic and rapidly evolving cultural scene.", diff:"medium", cats:["everyday","academic"], synonyms:["energetic","vibrant","active","lively"], antonyms:["static","inert","passive","stagnant"] },
  { word:"Eminent", phonetic:"em·ih·nunt", ipa:"/ˈemɪnənt/", meaning:"famous and respected within a particular sphere", sentence:"She was an eminent scientist whose discoveries changed medicine.", diff:"medium", cats:["academic","academic"], synonyms:["distinguished","respected","notable","prominent"], antonyms:["unknown","obscure","undistinguished","anonymous"] },
  { word:"Empirical", phonetic:"em·pir·ih·kul", ipa:"/ɪmˈpɪrɪkəl/", meaning:"based on observation or experience rather than theory", sentence:"The researcher collected empirical evidence to support her theory.", diff:"medium", cats:["scientific","academic"], synonyms:["observational","experimental","factual","measured"], antonyms:["theoretical","speculative","abstract","hypothetical"] },
  { word:"Equitable", phonetic:"ek·wih·tah·bul", ipa:"/ˈekwɪtəbəl/", meaning:"fair and impartial; treating all parties equally", sentence:"The judge sought an equitable resolution for all parties.", diff:"medium", cats:["academic","academic"], synonyms:["fair","just","impartial","balanced"], antonyms:["unfair","biased","unjust","unequal"] },
  { word:"Eradicate", phonetic:"ih·rad·ih·kayt", ipa:"/ɪˈrædɪkeɪt/", meaning:"destroy completely; put an end to something", sentence:"The aim of the programme was to eradicate extreme poverty.", diff:"medium", cats:["academic","academic"], synonyms:["eliminate","destroy","abolish","wipe out"], antonyms:["create","spread","encourage","foster"] },
  { word:"Ethical", phonetic:"eth·ih·kul", ipa:"/ˈeθɪkəl/", meaning:"relating to moral principles; morally correct", sentence:"Every business should act in an ethical and responsible manner.", diff:"medium", cats:["character","academic"], synonyms:["moral","principled","honourable","upright"], antonyms:["unethical","immoral","corrupt","dishonest"] },
  { word:"Evolve", phonetic:"ih·volv", ipa:"/ɪˈvɒlv/", meaning:"develop gradually into a more complex form", sentence:"Language evolves over time as society changes.", diff:"medium", cats:["academic","academic"], synonyms:["develop","change","progress","adapt"], antonyms:["stagnate","regress","remain","freeze"] },
  { word:"Explicit", phonetic:"ek·splis·it", ipa:"/ɪkˈsplɪsɪt/", meaning:"stated clearly and in detail; leaving nothing implied", sentence:"The instructions were explicit and left no room for confusion.", diff:"medium", cats:["communication","academic"], synonyms:["clear","direct","specific","unambiguous"], antonyms:["vague","implicit","ambiguous","obscure"] },
  { word:"Feasible", phonetic:"fee·zih·bul", ipa:"/ˈfiːzɪbəl/", meaning:"possible and practical; able to be done", sentence:"She asked whether the proposed plan was actually feasible.", diff:"medium", cats:["business","academic"], synonyms:["possible","practical","workable","achievable"], antonyms:["impossible","impractical","unworkable","unfeasible"] },
  { word:"Fluctuate", phonetic:"fluk·choo·ayt", ipa:"/ˈflʌktʃueɪt/", meaning:"rise and fall irregularly in number or amount", sentence:"Share prices fluctuated wildly in response to the news.", diff:"medium", cats:["business","academic"], synonyms:["vary","change","oscillate","swing"], antonyms:["remain stable","level","steady","stabilise"] },
  { word:"Forthright", phonetic:"forth·ryt", ipa:"/ˈfɔːθraɪt/", meaning:"direct and outspoken; making no attempt to avoid issues", sentence:"She was forthright in expressing her concerns about the plan.", diff:"medium", cats:["character","academic"], synonyms:["direct","frank","outspoken","candid"], antonyms:["evasive","indirect","secretive","guarded"] },
  { word:"Hypothesis", phonetic:"hy·poth·eh·sis", ipa:"/haɪˈpɒθɪsɪs/", meaning:"a supposition made as a starting point for reasoning", sentence:"The scientist tested her hypothesis with a series of experiments.", diff:"medium", cats:["scientific","academic"], synonyms:["theory","premise","supposition","assumption"], antonyms:["fact","certainty","proof","evidence"] },
  { word:"Incentive", phonetic:"in·sen·tiv", ipa:"/ɪnˈsentɪv/", meaning:"a thing that motivates or encourages someone to act", sentence:"The company offered financial incentives for reaching targets.", diff:"medium", cats:["business","academic"], synonyms:["motivation","encouragement","inducement","reward"], antonyms:["deterrent","disincentive","discouragement","penalty"] },
  { word:"Infer", phonetic:"in·fur", ipa:"/ɪnˈfɜː/", meaning:"deduce or conclude from evidence and reasoning", sentence:"From the evidence, the detective inferred the crime was planned.", diff:"medium", cats:["academic","academic"], synonyms:["deduce","conclude","reason","gather"], antonyms:["state directly","tell","say","announce"] },
  { word:"Inherent", phonetic:"in·heer·unt", ipa:"/ɪnˈhɪərənt/", meaning:"existing as a natural or permanent part of something", sentence:"Creativity is an inherent part of the artistic process.", diff:"medium", cats:["academic","academic"], synonyms:["natural","built-in","intrinsic","fundamental"], antonyms:["external","acquired","added","extrinsic"] },
  { word:"Insight", phonetic:"in·syt", ipa:"/ˈɪnsaɪt/", meaning:"the capacity to gain accurate understanding of something", sentence:"Her research provided valuable insight into market behaviour.", diff:"medium", cats:["academic","academic"], synonyms:["understanding","perception","awareness","wisdom"], antonyms:["ignorance","misunderstanding","blindness","confusion"] },
  { word:"Integrity", phonetic:"in·teg·rih·tee", ipa:"/ɪnˈteɡrɪti/", meaning:"the quality of being honest and having strong moral principles", sentence:"She was known throughout her career for her absolute integrity.", diff:"medium", cats:["character","academic"], synonyms:["honesty","honour","principle","virtue"], antonyms:["dishonesty","corruption","deceit","hypocrisy"] },
  { word:"Intricate", phonetic:"in·trih·kit", ipa:"/ˈɪntrɪkɪt/", meaning:"very complicated or detailed in structure", sentence:"The embroidery was intricate, with hundreds of tiny stitches.", diff:"medium", cats:["academic","academic"], synonyms:["complex","detailed","elaborate","sophisticated"], antonyms:["simple","basic","straightforward","plain"] },
  { word:"Irony", phonetic:"y·roh·nee", ipa:"/ˈaɪərəni/", meaning:"the expression of meaning using language of opposite tendency", sentence:"There was great irony in the fact that the fire station burned down.", diff:"medium", cats:["literary","academic"], synonyms:["paradox","contradiction","sarcasm","incongruity"], antonyms:["sincerity","directness","straightforwardness","honesty"] },
  { word:"Lenient", phonetic:"lee·nee·unt", ipa:"/ˈliːniənt/", meaning:"more merciful or tolerant than expected", sentence:"The judge was lenient, giving only a small fine for the offence.", diff:"medium", cats:["character","academic"], synonyms:["tolerant","mild","merciful","forgiving"], antonyms:["strict","harsh","severe","rigid"] },
  { word:"Leverage", phonetic:"lev·er·ij", ipa:"/ˈliːvərɪdʒ/", meaning:"use something to maximum advantage", sentence:"She leveraged her experience to negotiate a better salary.", diff:"medium", cats:["business","academic"], synonyms:["influence","use","exploit","apply"], antonyms:["ignore","waste","underuse","lose"] },
  { word:"Mitigate", phonetic:"mit·ih·gayt", ipa:"/ˈmɪtɪɡeɪt/", meaning:"make something less severe, serious, or painful", sentence:"Steps were taken to mitigate the effects of the flooding.", diff:"medium", cats:["academic","academic"], synonyms:["reduce","lessen","alleviate","ease"], antonyms:["worsen","intensify","aggravate","increase"] },
  { word:"Negligent", phonetic:"neg·lih·junt", ipa:"/ˈneɡlɪdʒənt/", meaning:"failing to take proper care over something", sentence:"The company was found to be negligent in its safety procedures.", diff:"medium", cats:["business","academic"], synonyms:["careless","irresponsible","thoughtless","remiss"], antonyms:["careful","responsible","diligent","thorough"] },
  { word:"Offset", phonetic:"off·set", ipa:"/ˈɒfset/", meaning:"counteract something by having an equal and opposite effect", sentence:"The company tried to offset its carbon emissions by planting trees.", diff:"medium", cats:["business","academic"], synonyms:["counterbalance","compensate","neutralise","cancel"], antonyms:["worsen","increase","intensify","add to"] },
  { word:"Paramount", phonetic:"par·ah·mownt", ipa:"/ˈpærəmaʊnt/", meaning:"more important than anything else; supreme", sentence:"The safety of passengers is of paramount importance.", diff:"medium", cats:["academic","academic"], synonyms:["supreme","foremost","primary","chief"], antonyms:["minor","secondary","unimportant","trivial"] },
  { word:"Perceive", phonetic:"per·seev", ipa:"/pəˈsiːv/", meaning:"become aware of something through senses or mind", sentence:"She perceived immediately that something was wrong.", diff:"medium", cats:["academic","academic"], synonyms:["notice","observe","sense","recognise"], antonyms:["miss","overlook","ignore","fail to see"] },
  { word:"Pragmatic", phonetic:"prag·mat·ik", ipa:"/præɡˈmætɪk/", meaning:"dealing with things in a practical and realistic way", sentence:"She took a pragmatic approach to solving the problem.", diff:"medium", cats:["character","academic"], synonyms:["practical","realistic","sensible","down-to-earth"], antonyms:["idealistic","impractical","unrealistic","theoretical"] },
  { word:"Precedent", phonetic:"pres·ih·dunt", ipa:"/ˈpresɪdənt/", meaning:"an earlier event that serves as an example or guide", sentence:"The court's decision set an important legal precedent.", diff:"medium", cats:["academic","academic"], synonyms:["example","model","standard","guideline"], antonyms:["exception","deviation","departure","anomaly"] },
  { word:"Proponent", phonetic:"proh·poh·nunt", ipa:"/prəˈpəʊnənt/", meaning:"a person who advocates a theory or course of action", sentence:"She was one of the strongest proponents of electoral reform.", diff:"medium", cats:["academic","academic"], synonyms:["advocate","supporter","champion","backer"], antonyms:["opponent","critic","detractor","rival"] },
  { word:"Refute", phonetic:"reh·fyoot", ipa:"/rɪˈfjuːt/", meaning:"prove a statement or theory to be wrong", sentence:"She provided evidence to refute the claims made against her.", diff:"medium", cats:["academic","academic"], synonyms:["disprove","rebut","contradict","counter"], antonyms:["confirm","prove","validate","support"] },
  { word:"Relentless", phonetic:"reh·lent·lis", ipa:"/rɪˈlentləs/", meaning:"unceasingly intense; not giving up", sentence:"Her relentless pursuit of excellence set her apart from peers.", diff:"medium", cats:["character","academic"], synonyms:["persistent","tireless","unceasing","determined"], antonyms:["yielding","stopping","giving up","intermittent"] },
  { word:"Scrutiny", phonetic:"skroo·tih·nee", ipa:"/ˈskruːtɪni/", meaning:"critical observation or examination", sentence:"Every aspect of her life came under intense public scrutiny.", diff:"medium", cats:["academic","academic"], synonyms:["examination","inspection","analysis","investigation"], antonyms:["inattention","neglect","ignorance","oversight"] },
  { word:"Sceptical", phonetic:"skep·tih·kul", ipa:"/ˈskeptɪkəl/", meaning:"not easily convinced; having doubts or reservations", sentence:"She was deeply sceptical about the government's new proposals.", diff:"medium", cats:["character","academic"], synonyms:["doubtful","questioning","cynical","unconvinced"], antonyms:["trusting","credulous","convinced","accepting"] },
  { word:"Speculation", phonetic:"spek·yoo·lay·shun", ipa:"/ˌspekjʊˈleɪʃən/", meaning:"the forming of a theory without firm evidence", sentence:"There was widespread speculation about the company's future.", diff:"medium", cats:["business","academic"], synonyms:["conjecture","theory","guesswork","hypothesis"], antonyms:["fact","certainty","proof","evidence"] },
  { word:"Subtle", phonetic:"sut·ul", ipa:"/ˈsʌtəl/", meaning:"so delicate as to be difficult to detect; not obvious", sentence:"The difference between the two versions was extremely subtle.", diff:"medium", cats:["academic","academic"], synonyms:["delicate","understated","fine","nuanced"], antonyms:["obvious","clear","blatant","prominent"] },
  { word:"Suppress", phonetic:"suh·pres", ipa:"/səˈpres/", meaning:"forcibly put an end to something; prevent expression", sentence:"She struggled to suppress her laughter during the ceremony.", diff:"medium", cats:["everyday","academic"], synonyms:["stifle","repress","silence","control"], antonyms:["express","encourage","release","promote"] },
  { word:"Sustain", phonetic:"sus·tayn", ipa:"/səˈsteɪn/", meaning:"strengthen or support physically or mentally over time", sentence:"The charity worked to sustain families through the difficult winter.", diff:"medium", cats:["academic","academic"], synonyms:["support","maintain","uphold","continue"], antonyms:["abandon","weaken","undermine","discontinue"] },
  { word:"Tangible", phonetic:"tan·jih·bul", ipa:"/ˈtændʒɪbəl/", meaning:"perceptible by touch; clear and definite; real", sentence:"The project produced tangible improvements in people's lives.", diff:"medium", cats:["academic","academic"], synonyms:["real","concrete","physical","actual"], antonyms:["intangible","abstract","theoretical","vague"] },
  { word:"Tenacious", phonetic:"teh·nay·shus", ipa:"/tɪˈneɪʃəs/", meaning:"very determined; not giving up easily", sentence:"Her tenacious spirit carried her through the most difficult times.", diff:"medium", cats:["character","academic"], synonyms:["determined","persistent","stubborn","resolute"], antonyms:["yielding","feeble","irresolute","giving up"] },
  { word:"Transparent", phonetic:"trans·pair·unt", ipa:"/trænsˈpærənt/", meaning:"easy to see through; open and honest", sentence:"The organisation pledged to be fully transparent in its operations.", diff:"medium", cats:["business","academic"], synonyms:["open","honest","clear","visible"], antonyms:["opaque","secretive","deceptive","hidden"] },
  { word:"Undermine", phonetic:"un·der·myn", ipa:"/ˌʌndəˈmaɪn/", meaning:"lessen the effectiveness or power of something gradually", sentence:"His constant criticism served only to undermine team morale.", diff:"medium", cats:["everyday","academic"], synonyms:["weaken","damage","erode","destabilise"], antonyms:["support","strengthen","bolster","reinforce"] },
  { word:"Unprecedented", phonetic:"un·pres·ih·den·tid", ipa:"/ʌnˈpresɪdentɪd/", meaning:"never done or known before", sentence:"The flooding was unprecedented in the town's recorded history.", diff:"medium", cats:["academic","academic"], synonyms:["unheard-of","novel","exceptional","remarkable"], antonyms:["typical","common","ordinary","expected"] },
  { word:"Validate", phonetic:"val·ih·dayt", ipa:"/ˈvælɪdeɪt/", meaning:"check or prove the accuracy or truth of something", sentence:"The experiment validated the scientist's original hypothesis.", diff:"medium", cats:["academic","academic"], synonyms:["confirm","verify","prove","support"], antonyms:["invalidate","disprove","refute","undermine"] },
  { word:"Versatile", phonetic:"vur·suh·tyl", ipa:"/ˈvɜːsətaɪl/", meaning:"able to adapt to many different functions or activities", sentence:"She was a versatile performer, excelling in drama and comedy.", diff:"medium", cats:["character","academic"], synonyms:["adaptable","flexible","all-round","multifaceted"], antonyms:["limited","narrow","specialised","inflexible"] },
  { word:"Viable", phonetic:"vy·ah·bul", ipa:"/ˈvaɪəbəl/", meaning:"capable of working successfully; feasible", sentence:"The committee considered whether the plan was financially viable.", diff:"medium", cats:["business","academic"], synonyms:["feasible","workable","practical","sustainable"], antonyms:["unviable","impossible","impractical","unfeasible"] },
  { word:"Zealous", phonetic:"zel·us", ipa:"/ˈzeləs/", meaning:"having or showing great energy or enthusiasm", sentence:"The zealous campaigner knocked on hundreds of doors each day.", diff:"medium", cats:["character","academic"], synonyms:["enthusiastic","dedicated","passionate","fervent"], antonyms:["apathetic","indifferent","half-hearted","unenthusiastic"] },
  { word:"Ambivalent", phonetic:"am·biv·ah·lunt", ipa:"/æmˈbɪvələnt/", meaning:"having mixed feelings or contradictory ideas", sentence:"She felt deeply ambivalent about her decision to move abroad.", diff:"medium", cats:["character","academic"], synonyms:["uncertain","undecided","conflicted","torn"], antonyms:["certain","decisive","clear","committed"] },
  { word:"Catalyst", phonetic:"kat·ah·list", ipa:"/ˈkætəlɪst/", meaning:"a person or thing that triggers an important change", sentence:"Her arrival in the company was a catalyst for positive change.", diff:"medium", cats:["academic","academic"], synonyms:["trigger","spark","stimulus","impetus"], antonyms:["hindrance","obstacle","deterrent","block"] },
  { word:"Denounce", phonetic:"deh·nowns", ipa:"/dɪˈnaʊns/", meaning:"publicly declare something to be wrong or evil", sentence:"The politician was quick to denounce the corrupt practice.", diff:"medium", cats:["social","academic"], synonyms:["condemn","criticise","oppose","attack"], antonyms:["praise","commend","support","endorse"] },
  { word:"Discern", phonetic:"dis·urn", ipa:"/dɪˈsɜːn/", meaning:"perceive or recognise something clearly", sentence:"A good editor can discern even the most subtle writing errors.", diff:"medium", cats:["academic","academic"], synonyms:["perceive","recognise","detect","notice"], antonyms:["miss","overlook","confuse","fail to see"] },
  { word:"Emulate", phonetic:"em·yoo·layt", ipa:"/ˈemjʊleɪt/", meaning:"match or surpass a model by imitation", sentence:"She emulated the writing style of her favourite authors.", diff:"medium", cats:["character","academic"], synonyms:["imitate","copy","follow","model"], antonyms:["differ from","ignore","deviate","avoid"] },
  { word:"Facilitate", phonetic:"fah·sil·ih·tayt", ipa:"/fəˈsɪlɪteɪt/", meaning:"make an action or process easy or easier", sentence:"The new software was designed to facilitate team collaboration.", diff:"medium", cats:["business","academic"], synonyms:["ease","assist","enable","promote"], antonyms:["hinder","obstruct","hamper","impede"] },
  { word:"Implication", phonetic:"im·plih·kay·shun", ipa:"/ˌɪmplɪˈkeɪʃən/", meaning:"a conclusion that can be drawn from something", sentence:"The implications of the new law were not fully understood.", diff:"medium", cats:["academic","academic"], synonyms:["consequence","significance","suggestion","meaning"], antonyms:["explicit statement","clarity","directness","fact"] },
  { word:"Incisive", phonetic:"in·sy·siv", ipa:"/ɪnˈsaɪsɪv/", meaning:"intelligently analytical and clear-thinking", sentence:"Her incisive questions cut straight to the heart of the matter.", diff:"medium", cats:["character","academic"], synonyms:["sharp","penetrating","keen","perceptive"], antonyms:["vague","woolly","confused","shallow"] },
  { word:"Juxtapose", phonetic:"juk·stah·pohz", ipa:"/ˈdʒʌkstəpəʊz/", meaning:"place things side by side to highlight contrast", sentence:"The artist juxtaposed images of wealth and poverty in her work.", diff:"medium", cats:["literary","academic"], synonyms:["contrast","compare","place side by side","set together"], antonyms:["separate","isolate","merge","blend"] },
  { word:"Lucrative", phonetic:"loo·krah·tiv", ipa:"/ˈluːkrətɪv/", meaning:"producing a large amount of profit", sentence:"The deal turned out to be highly lucrative for both companies.", diff:"medium", cats:["business","academic"], synonyms:["profitable","rewarding","gainful","productive"], antonyms:["unprofitable","losing","costly","expensive"] },
  { word:"Mundane", phonetic:"mun·dayn", ipa:"/mʌnˈdeɪn/", meaning:"lacking interest or excitement; ordinary and routine", sentence:"Even the most mundane tasks can become satisfying if done well.", diff:"medium", cats:["everyday","academic"], synonyms:["ordinary","routine","dull","everyday"], antonyms:["extraordinary","exciting","unusual","remarkable"] },
  { word:"Negate", phonetic:"neh·gayt", ipa:"/nɪˈɡeɪt/", meaning:"make ineffective; nullify; deny the truth of", sentence:"One bad decision can negate years of careful planning.", diff:"medium", cats:["academic","academic"], synonyms:["cancel","nullify","reverse","undo"], antonyms:["affirm","confirm","validate","support"] },
  { word:"Obsolete", phonetic:"ob·soh·leet", ipa:"/ˌɒbsəˈliːt/", meaning:"no longer produced or used; out of date", sentence:"The technology quickly became obsolete with the rise of the internet.", diff:"medium", cats:["academic","academic"], synonyms:["outdated","old-fashioned","redundant","archaic"], antonyms:["current","modern","up-to-date","relevant"] },
  { word:"Peripheral", phonetic:"per·if·er·ul", ipa:"/pəˈrɪfərəl/", meaning:"relating to outer limits; of secondary importance", sentence:"The committee dismissed his concerns as peripheral to the main issue.", diff:"medium", cats:["academic","academic"], synonyms:["secondary","marginal","minor","fringe"], antonyms:["central","core","main","primary"] },
  { word:"Quandary", phonetic:"kwon·dree", ipa:"/ˈkwɒndri/", meaning:"a state of perplexity or uncertainty over what to do", sentence:"She found herself in a quandary, unable to choose between the offers.", diff:"medium", cats:["everyday","academic"], synonyms:["dilemma","predicament","difficulty","impasse"], antonyms:["certainty","clarity","resolution","decisiveness"] },
  { word:"Reciprocal", phonetic:"reh·sip·roh·kul", ipa:"/rɪˈsɪprəkəl/", meaning:"given or felt by each towards the other; mutual", sentence:"Their respect was entirely reciprocal.", diff:"medium", cats:["social","academic"], synonyms:["mutual","shared","returned","give-and-take"], antonyms:["one-sided","unilateral","selfish","unequal"] },
  { word:"Rhetoric", phonetic:"ret·oh·rik", ipa:"/ˈretərɪk/", meaning:"language designed to have a persuasive or impressive effect", sentence:"The politician's speech was full of inspiring rhetoric.", diff:"medium", cats:["communication","academic"], synonyms:["oratory","discourse","language","persuasion"], antonyms:["plain speech","honesty","bluntness","directness"] },
  { word:"Stringent", phonetic:"strin·junt", ipa:"/ˈstrɪndʒənt/", meaning:"strict, precise, and exacting; rigorous", sentence:"The new safety regulations were extremely stringent.", diff:"medium", cats:["business","academic"], synonyms:["strict","rigorous","demanding","exact"], antonyms:["lenient","lax","relaxed","flexible"] },
  { word:"Vacuous", phonetic:"vak·yoo·us", ipa:"/ˈvækjuəs/", meaning:"having or showing a lack of thought or intelligence", sentence:"Her vacuous comments added nothing useful to the discussion.", diff:"medium", cats:["character","academic"], synonyms:["empty","meaningless","inane","vapid"], antonyms:["thoughtful","intelligent","profound","meaningful"] },
  { word:"Discriminate", phonetic:"dis·krim·ih·nayt", ipa:"/dɪˈskrɪmɪneɪt/", meaning:"treat a person unjustly on the basis of their identity", sentence:"It is illegal to discriminate against employees on grounds of age.", diff:"medium", cats:["social","academic"], synonyms:["be biased","be prejudiced","mistreat","favour"], antonyms:["treat equally","be fair","include","embrace"] },
  { word:"Exacerbate", phonetic:"ig·zas·er·bayt", ipa:"/ɪɡˈzæsəbeɪt/", meaning:"make a problem or bad situation worse", sentence:"The lack of rain exacerbated the already serious drought.", diff:"medium", cats:["academic","academic"], synonyms:["worsen","aggravate","intensify","inflame"], antonyms:["improve","alleviate","ease","reduce"] },
  { word:"Gratuitous", phonetic:"grah·tyoo·ih·tus", ipa:"/ɡrəˈtjuːɪtəs/", meaning:"uncalled for; lacking good reason; unwarranted", sentence:"The film was criticised for its gratuitous violence.", diff:"medium", cats:["character","academic"], synonyms:["unnecessary","unwarranted","pointless","excessive"], antonyms:["justified","necessary","appropriate","warranted"] },
  { word:"Inadvertent", phonetic:"in·ad·vur·tunt", ipa:"/ˌɪnədˈvɜːtənt/", meaning:"not resulting from deliberate action; unintentional", sentence:"She made an inadvertent error when copying the figures.", diff:"medium", cats:["character","academic"], synonyms:["unintentional","accidental","unplanned","careless"], antonyms:["deliberate","intentional","planned","conscious"] },
  { word:"Jeopardise", phonetic:"jep·er·dyz", ipa:"/ˈdʒepədaɪz/", meaning:"put someone or something into a situation of risk", sentence:"Arriving late could seriously jeopardise your chances of success.", diff:"medium", cats:["everyday","academic"], synonyms:["endanger","threaten","risk","undermine"], antonyms:["protect","secure","safeguard","preserve"] },
  { word:"Proliferate", phonetic:"proh·lif·er·ayt", ipa:"/prəˈlɪfəreɪt/", meaning:"increase rapidly in number; multiply", sentence:"Social media platforms have proliferated in recent years.", diff:"medium", cats:["academic","academic"], synonyms:["multiply","increase","spread","expand"], antonyms:["decrease","diminish","dwindle","reduce"] },
  { word:"Rectify", phonetic:"rek·tih·fy", ipa:"/ˈrektɪfaɪ/", meaning:"put something right; correct an error or fault", sentence:"She worked quickly to rectify the mistakes in the report.", diff:"medium", cats:["everyday","academic"], synonyms:["correct","fix","remedy","amend"], antonyms:["worsen","damage","ignore","leave uncorrected"] },
  { word:"Substantiate", phonetic:"sub·stan·shee·ayt", ipa:"/səbˈstænʃieɪt/", meaning:"provide evidence to support or prove the truth of", sentence:"He was unable to substantiate his extraordinary claims.", diff:"medium", cats:["academic","academic"], synonyms:["prove","confirm","support","back up"], antonyms:["disprove","refute","contradict","undermine"] },
  { word:"Transient", phonetic:"tran·zee·unt", ipa:"/ˈtrænziənt/", meaning:"lasting only for a short time; temporary", sentence:"The pain was only transient and faded within a few hours.", diff:"medium", cats:["academic","academic"], synonyms:["temporary","fleeting","brief","short-lived"], antonyms:["permanent","lasting","enduring","stable"] },
  { word:"Verbose", phonetic:"vur·bohs", ipa:"/vɜːˈbəʊs/", meaning:"using or expressed in more words than are needed", sentence:"His verbose writing style made the report difficult to read.", diff:"medium", cats:["communication","academic"], synonyms:["wordy","long-winded","rambling","garrulous"], antonyms:["concise","succinct","brief","pithy"] },
  { word:"Wield", phonetic:"weeld", ipa:"/wiːld/", meaning:"hold and use a weapon or tool; have and use power", sentence:"She wielded considerable influence in the organisation.", diff:"medium", cats:["academic","academic"], synonyms:["exercise","use","employ","apply"], antonyms:["surrender","lose","give up","relinquish"] },
{ word:"Abstruse", phonetic:"ab·stroos", ipa:"/æbˈstruːs/", meaning:"difficult to understand; obscure and esoteric", sentence:"The philosopher's abstruse arguments confused all but the most expert scholars.", diff:"hard", cats:["academic","literary"], synonyms:["arcane","esoteric","obscure","cryptic"], antonyms:["clear","simple","accessible","obvious"] },
  { word:"Acerbic", phonetic:"ah·sur·bik", ipa:"/əˈsɜːbɪk/", meaning:"sharp and forthright; harsh or cutting in tone", sentence:"Her acerbic wit could reduce even the most confident person to silence.", diff:"hard", cats:["character","literary"], synonyms:["sharp","biting","caustic","cutting"], antonyms:["gentle","kind","mild","pleasant"] },
  { word:"Acquiesce", phonetic:"ak·wee·es", ipa:"/ˌækwiˈes/", meaning:"accept something reluctantly but without protest", sentence:"He eventually acquiesced to the demands, though not without complaint.", diff:"hard", cats:["character","literary"], synonyms:["comply","agree","submit","yield"], antonyms:["resist","protest","object","refuse"] },
  { word:"Alacrity", phonetic:"ah·lak·rih·tee", ipa:"/əˈlækrɪti/", meaning:"brisk and cheerful readiness to act", sentence:"She accepted the challenge with great alacrity and enthusiasm.", diff:"hard", cats:["character","literary"], synonyms:["eagerness","willingness","keenness","promptness"], antonyms:["reluctance","hesitation","slowness","unwillingness"] },
  { word:"Ameliorate", phonetic:"ah·meel·ee·oh·rayt", ipa:"/əˈmiːliəreɪt/", meaning:"make something bad or unsatisfactory better", sentence:"New policies were designed to ameliorate the effects of poverty.", diff:"hard", cats:["academic","literary"], synonyms:["improve","better","enhance","relieve"], antonyms:["worsen","deteriorate","damage","aggravate"] },
  { word:"Anachronism", phonetic:"ah·nak·roh·niz·um", ipa:"/əˈnækrənɪzəm/", meaning:"a thing belonging to a period other than the present", sentence:"The use of a quill pen today would be a complete anachronism.", diff:"hard", cats:["literary","literary"], synonyms:["archaism","relic","throwback","out-of-date thing"], antonyms:["contemporary","modern","current","relevant"] },
  { word:"Anathema", phonetic:"ah·nath·eh·mah", ipa:"/əˈnæθəmə/", meaning:"something or someone greatly detested or loathed", sentence:"Dishonesty was anathema to her deeply principled nature.", diff:"hard", cats:["literary","literary"], synonyms:["abomination","aversion","bane","curse"], antonyms:["blessing","delight","treasure","joy"] },
  { word:"Antipathy", phonetic:"an·tip·ah·thee", ipa:"/ænˈtɪpəθi/", meaning:"a deep-seated feeling of dislike; strong aversion", sentence:"She felt a strong antipathy towards those who abused their power.", diff:"hard", cats:["emotion","literary"], synonyms:["hostility","aversion","dislike","animosity"], antonyms:["affinity","liking","fondness","sympathy"] },
  { word:"Apocryphal", phonetic:"ah·pok·rih·ful", ipa:"/əˈpɒkrɪfəl/", meaning:"of doubtful authenticity, although widely circulated", sentence:"The story of his extraordinary bravery turned out to be largely apocryphal.", diff:"hard", cats:["literary","literary"], synonyms:["dubious","questionable","mythical","unverified"], antonyms:["authentic","verified","genuine","factual"] },
  { word:"Arcane", phonetic:"ar·kayn", ipa:"/ɑːˈkeɪn/", meaning:"understood by few; mysterious or secret", sentence:"He had a deep interest in the arcane rituals of ancient civilisations.", diff:"hard", cats:["literary","literary"], synonyms:["mysterious","obscure","esoteric","secret"], antonyms:["common","well-known","familiar","accessible"] },
  { word:"Arduous", phonetic:"ar·dyoo·us", ipa:"/ˈɑːdjuəs/", meaning:"involving strenuous effort; very difficult and tiring", sentence:"The arduous climb took twelve hours and tested every team member.", diff:"hard", cats:["character","literary"], synonyms:["difficult","strenuous","exhausting","gruelling"], antonyms:["easy","effortless","simple","straightforward"] },
  { word:"Assuage", phonetic:"ah·swayj", ipa:"/əˈsweɪdʒ/", meaning:"make an unpleasant feeling less intense; soothe", sentence:"Words of comfort did little to assuage her grief after the loss.", diff:"hard", cats:["literary","literary"], synonyms:["ease","relieve","soothe","calm"], antonyms:["worsen","aggravate","intensify","inflame"] },
  { word:"Audacious", phonetic:"aw·day·shus", ipa:"/ɔːˈdeɪʃəs/", meaning:"showing a willingness to take surprisingly bold risks", sentence:"Her audacious proposal shocked the board but was ultimately approved.", diff:"hard", cats:["character","literary"], synonyms:["bold","daring","fearless","intrepid"], antonyms:["timid","cowardly","cautious","fearful"] },
  { word:"Avarice", phonetic:"av·ah·ris", ipa:"/ˈævərɪs/", meaning:"extreme greed for wealth or material gain", sentence:"His avarice knew no bounds; he never seemed to have enough.", diff:"hard", cats:["literary","literary"], synonyms:["greed","cupidity","acquisitiveness","covetousness"], antonyms:["generosity","altruism","contentment","selflessness"] },
  { word:"Bellicose", phonetic:"bel·ih·kohs", ipa:"/ˈbelɪkəʊs/", meaning:"demonstrating aggression and willingness to fight", sentence:"His bellicose language alarmed neighbouring countries and allies.", diff:"hard", cats:["character","literary"], synonyms:["aggressive","warlike","combative","pugnacious"], antonyms:["peaceful","conciliatory","pacifist","gentle"] },
  { word:"Byzantine", phonetic:"biz·un·teen", ipa:"/ˈbɪzəntiːn/", meaning:"excessively complicated and detailed; devious", sentence:"The Byzantine rules of the organisation baffled new members entirely.", diff:"hard", cats:["academic","literary"], synonyms:["complex","complicated","convoluted","intricate"], antonyms:["simple","clear","straightforward","transparent"] },
  { word:"Capricious", phonetic:"kah·prish·us", ipa:"/kəˈprɪʃəs/", meaning:"given to sudden and unpredictable changes of mood", sentence:"The capricious director changed his mind hourly, leaving the team confused.", diff:"hard", cats:["character","literary"], synonyms:["unpredictable","fickle","mercurial","erratic"], antonyms:["consistent","reliable","steady","stable"] },
  { word:"Chicanery", phonetic:"shih·kay·ner·ee", ipa:"/ʃɪˈkeɪnəri/", meaning:"the use of deception or subterfuge to achieve a goal", sentence:"The lawyer was accused of using chicanery to mislead the court.", diff:"hard", cats:["character","literary"], synonyms:["trickery","deception","dishonesty","guile"], antonyms:["honesty","integrity","openness","transparency"] },
  { word:"Cogent", phonetic:"koh·junt", ipa:"/ˈkəʊdʒənt/", meaning:"clear, logical, and convincing in argument", sentence:"She made a cogent argument that persuaded the entire committee.", diff:"hard", cats:["communication","literary"], synonyms:["compelling","convincing","persuasive","logical"], antonyms:["weak","unconvincing","flawed","muddled"] },
  { word:"Complacent", phonetic:"kom·play·sunt", ipa:"/kəmˈpleɪsənt/", meaning:"showing smug or uncritical self-satisfaction", sentence:"The team became complacent after winning three matches in a row.", diff:"hard", cats:["character","literary"], synonyms:["smug","self-satisfied","unconcerned","overconfident"], antonyms:["vigilant","concerned","motivated","worried"] },
  { word:"Convoluted", phonetic:"kon·voh·loo·tid", ipa:"/ˈkɒnvəluːtɪd/", meaning:"extremely complex and difficult to follow", sentence:"The instructions were so convoluted that nobody could understand them.", diff:"hard", cats:["academic","literary"], synonyms:["complex","tangled","intricate","complicated"], antonyms:["simple","clear","straightforward","logical"] },
  { word:"Cosmopolitan", phonetic:"koz·moh·pol·ih·tun", ipa:"/ˌkɒzməˈpɒlɪtən/", meaning:"familiar with and at ease in many different cultures", sentence:"London is one of the most cosmopolitan cities in the world.", diff:"hard", cats:["social","literary"], synonyms:["worldly","international","sophisticated","cultured"], antonyms:["parochial","provincial","narrow-minded","local"] },
  { word:"Culpable", phonetic:"kul·pah·bul", ipa:"/ˈkʌlpəbəl/", meaning:"deserving blame or censure for a fault or wrong", sentence:"The court found the company culpable for the accident.", diff:"hard", cats:["academic","literary"], synonyms:["guilty","blameworthy","at fault","responsible"], antonyms:["innocent","blameless","absolved","exonerated"] },
  { word:"Dearth", phonetic:"durth", ipa:"/dɜːθ/", meaning:"a scarcity or lack of something", sentence:"There was a dearth of qualified engineers in the country.", diff:"hard", cats:["academic","literary"], synonyms:["shortage","scarcity","lack","insufficiency"], antonyms:["abundance","surplus","plenty","excess"] },
  { word:"Demagogue", phonetic:"dem·ah·gog", ipa:"/ˈdeməɡɒɡ/", meaning:"a political leader who uses popular prejudice to gain power", sentence:"The demagogue exploited fears to gain the support of the crowd.", diff:"hard", cats:["academic","literary"], synonyms:["agitator","rabble-rouser","populist","manipulator"], antonyms:["statesman","leader","diplomat","peacemaker"] },
  { word:"Denouement", phonetic:"day·noo·mahn", ipa:"/deɪˈnuːmɑ̃/", meaning:"the final resolution of a narrative or drama", sentence:"The unexpected denouement shocked audiences around the world.", diff:"hard", cats:["literary","literary"], synonyms:["resolution","conclusion","climax","finale"], antonyms:["beginning","introduction","prelude","opening"] },
  { word:"Didactic", phonetic:"dy·dak·tik", ipa:"/dɪˈdæktɪk/", meaning:"intended to teach, particularly in a preachy manner", sentence:"The novel was entertaining but slightly too didactic for some readers.", diff:"hard", cats:["literary","literary"], synonyms:["instructive","educational","preachy","moralising"], antonyms:["entertaining","engaging","subtle","light"] },
  { word:"Dilettante", phonetic:"dil·eh·tahn·tee", ipa:"/ˌdɪlɪˈtæntɪ/", meaning:"a person with a superficial interest in an art or field", sentence:"He was dismissed as a dilettante who never committed to any discipline.", diff:"hard", cats:["character","literary"], synonyms:["amateur","dabbler","trifler","novice"], antonyms:["expert","professional","specialist","master"] },
  { word:"Ebullience", phonetic:"ih·bul·ee·ence", ipa:"/ɪˈbʌliəns/", meaning:"the quality of being cheerful and full of energy", sentence:"Her ebullience was infectious; the whole room cheered up when she arrived.", diff:"hard", cats:["emotion","literary"], synonyms:["exuberance","vivacity","enthusiasm","liveliness"], antonyms:["gloom","depression","lethargy","dullness"] },
  { word:"Efficacious", phonetic:"ef·ih·kay·shus", ipa:"/ˌefɪˈkeɪʃəs/", meaning:"successful in producing a desired or intended result", sentence:"The new treatment proved highly efficacious in clinical trials.", diff:"hard", cats:["scientific","literary"], synonyms:["effective","successful","productive","powerful"], antonyms:["ineffective","useless","futile","unsuccessful"] },
  { word:"Egregious", phonetic:"ih·gree·jus", ipa:"/ɪˈɡriːdʒəs/", meaning:"outstandingly bad; shockingly wrong", sentence:"The judge called it one of the most egregious abuses of power he had seen.", diff:"hard", cats:["character","literary"], synonyms:["shocking","outrageous","appalling","glaring"], antonyms:["minor","slight","inconsequential","acceptable"] },
  { word:"Enervate", phonetic:"en·er·vayt", ipa:"/ˈenəveɪt/", meaning:"make someone feel drained of energy or vitality", sentence:"The oppressive heat enervated the workers, slowing everything down.", diff:"hard", cats:["character","literary"], synonyms:["weaken","exhaust","tire","debilitate"], antonyms:["energise","invigorate","strengthen","vitalize"] },
  { word:"Ephemeral", phonetic:"eh·fem·er·ul", ipa:"/ɪˈfemərəl/", meaning:"lasting for a very short time only", sentence:"Fame is often ephemeral, lasting only until the next sensation appears.", diff:"hard", cats:["literary","literary"], synonyms:["fleeting","transient","brief","momentary"], antonyms:["permanent","lasting","enduring","eternal"] },
  { word:"Equivocate", phonetic:"eh·kwiv·oh·kayt", ipa:"/ɪˈkwɪvəkeɪt/", meaning:"use ambiguous language to avoid committing to an answer", sentence:"The politician equivocated for so long that nobody knew her actual view.", diff:"hard", cats:["communication","literary"], synonyms:["prevaricate","hedge","evade","waffle"], antonyms:["be direct","clarify","state clearly","be honest"] },
  { word:"Esoteric", phonetic:"es·oh·ter·ik", ipa:"/ˌesəˈterɪk/", meaning:"intended for or understood by only a small group", sentence:"His poetry was too esoteric for the general public to appreciate.", diff:"hard", cats:["literary","literary"], synonyms:["obscure","arcane","abstruse","specialised"], antonyms:["accessible","common","familiar","popular"] },
  { word:"Exculpate", phonetic:"eks·kul·payt", ipa:"/ˈekskʌlpeɪt/", meaning:"show or declare someone to be not guilty of wrongdoing", sentence:"New evidence emerged that completely exculpated the accused.", diff:"hard", cats:["academic","literary"], synonyms:["absolve","acquit","clear","vindicate"], antonyms:["condemn","incriminate","blame","convict"] },
  { word:"Fatuous", phonetic:"fach·oo·us", ipa:"/ˈfætʃuəs/", meaning:"silly and pointless; devoid of intelligence", sentence:"Her fatuous remarks added nothing useful to the important debate.", diff:"hard", cats:["character","literary"], synonyms:["silly","stupid","inane","vacuous"], antonyms:["sensible","intelligent","profound","meaningful"] },
  { word:"Fulminate", phonetic:"ful·mih·nayt", ipa:"/ˈfʊlmɪneɪt/", meaning:"express vehement protest or condemnation", sentence:"She fulminated against the corrupt practices she had uncovered.", diff:"hard", cats:["communication","literary"], synonyms:["protest","rage","rail","denounce"], antonyms:["praise","commend","approve","support"] },
  { word:"Garrulous", phonetic:"gar·uh·lus", ipa:"/ˈɡærʊləs/", meaning:"excessively talkative, especially on trivial matters", sentence:"The garrulous taxi driver talked non-stop for the entire journey.", diff:"hard", cats:["character","literary"], synonyms:["talkative","loquacious","verbose","chatty"], antonyms:["taciturn","reticent","quiet","silent"] },
  { word:"Grandiloquent", phonetic:"gran·dil·oh·kwunt", ipa:"/ɡrænˈdɪləkwənt/", meaning:"pompous or extravagant in language or style", sentence:"His grandiloquent speech was full of impressive words but little substance.", diff:"hard", cats:["literary","literary"], synonyms:["pompous","bombastic","rhetorical","verbose"], antonyms:["plain","simple","modest","understated"] },
  { word:"Hegemony", phonetic:"heh·jem·oh·nee", ipa:"/hɪˈɡeməni/", meaning:"leadership or dominance, especially of one country over others", sentence:"The country sought to maintain its hegemony in the region.", diff:"hard", cats:["academic","literary"], synonyms:["dominance","supremacy","leadership","authority"], antonyms:["subservience","submission","dependence","weakness"] },
  { word:"Hubris", phonetic:"hyoo·bris", ipa:"/ˈhjuːbrɪs/", meaning:"excessive pride or self-confidence leading to a downfall", sentence:"His hubris prevented him from seeing the serious flaws in his plan.", diff:"hard", cats:["literary","literary"], synonyms:["arrogance","pride","conceit","overconfidence"], antonyms:["humility","modesty","diffidence","meekness"] },
  { word:"Hyperbole", phonetic:"hy·pur·boh·lee", ipa:"/haɪˈpɜːbəli/", meaning:"exaggerated statements not meant to be taken literally", sentence:"The phrase 'I have told you a million times' is a classic hyperbole.", diff:"hard", cats:["literary","literary"], synonyms:["exaggeration","overstatement","amplification","embellishment"], antonyms:["understatement","litotes","fact","accuracy"] },
  { word:"Iconoclast", phonetic:"y·kon·oh·klast", ipa:"/aɪˈkɒnəklæst/", meaning:"a person who attacks cherished beliefs or institutions", sentence:"The scientist was an iconoclast who challenged decades of accepted thinking.", diff:"hard", cats:["character","literary"], synonyms:["rebel","dissident","radical","maverick"], antonyms:["conformist","traditionalist","conservative","follower"] },
  { word:"Immutable", phonetic:"ih·myoo·tah·bul", ipa:"/ɪˈmjuːtəbəl/", meaning:"unchanging over time or unable to be changed", sentence:"She believed in immutable moral truths that applied to all people.", diff:"hard", cats:["academic","literary"], synonyms:["unchangeable","fixed","permanent","constant"], antonyms:["changeable","variable","mutable","flexible"] },
  { word:"Imperious", phonetic:"im·peer·ee·us", ipa:"/ɪmˈpɪəriəs/", meaning:"assuming power without justification; domineering", sentence:"The imperious executive dismissed every opinion that was not his own.", diff:"hard", cats:["literary","literary"], synonyms:["domineering","overbearing","arrogant","autocratic"], antonyms:["humble","meek","deferential","modest"] },
  { word:"Impetuous", phonetic:"im·pech·oo·us", ipa:"/ɪmˈpetʃuəs/", meaning:"acting quickly without thought or care; rash", sentence:"Her impetuous decision to resign shocked everyone in the department.", diff:"hard", cats:["character","literary"], synonyms:["rash","hasty","impulsive","reckless"], antonyms:["cautious","careful","deliberate","thoughtful"] },
  { word:"Inauspicious", phonetic:"in·aw·spish·us", ipa:"/ˌɪnɔːˈspɪʃəs/", meaning:"not conducive to success; showing signs of failure", sentence:"The project got off to an inauspicious start with several technical problems.", diff:"hard", cats:["academic","literary"], synonyms:["unfavourable","unpromising","unlucky","unfortunate"], antonyms:["auspicious","promising","favourable","propitious"] },
  { word:"Inchoate", phonetic:"in·koh·it", ipa:"/ɪnˈkəʊɪt/", meaning:"just begun and not yet fully formed or developed", sentence:"The business plan was still inchoate, with many details not yet worked out.", diff:"hard", cats:["literary","literary"], synonyms:["undeveloped","incomplete","embryonic","rudimentary"], antonyms:["developed","complete","mature","formed"] },
  { word:"Indolent", phonetic:"in·doh·lunt", ipa:"/ˈɪndələnt/", meaning:"wanting to avoid activity or exertion; lazy", sentence:"His indolent approach to his studies threatened his academic career.", diff:"hard", cats:["character","literary"], synonyms:["lazy","idle","listless","lethargic"], antonyms:["industrious","diligent","active","hardworking"] },
  { word:"Inexorable", phonetic:"in·eks·oh·rah·bul", ipa:"/ɪnˈeksərəbəl/", meaning:"impossible to stop or prevent; relentless", sentence:"The inexorable rise of technology transformed every industry.", diff:"hard", cats:["literary","literary"], synonyms:["unstoppable","relentless","inevitable","inescapable"], antonyms:["stoppable","avoidable","reversible","preventable"] },
  { word:"Inimical", phonetic:"in·im·ih·kul", ipa:"/ɪˈnɪmɪkəl/", meaning:"tending to obstruct or harm; hostile", sentence:"The harsh desert conditions were inimical to agriculture.", diff:"hard", cats:["academic","literary"], synonyms:["hostile","harmful","adverse","unfriendly"], antonyms:["favourable","beneficial","helpful","supportive"] },
  { word:"Insidious", phonetic:"in·sid·ee·us", ipa:"/ɪnˈsɪdiəs/", meaning:"proceeding gradually but with harmful effects", sentence:"The disease progressed in an insidious manner, causing damage over years.", diff:"hard", cats:["character","literary"], synonyms:["stealthy","subtle","treacherous","crafty"], antonyms:["open","transparent","obvious","harmless"] },
  { word:"Intransigent", phonetic:"in·tran·sih·junt", ipa:"/ɪnˈtrænsɪdʒənt/", meaning:"refusing to change one's views; uncompromising", sentence:"His intransigent attitude made negotiation almost impossible.", diff:"hard", cats:["character","literary"], synonyms:["stubborn","inflexible","unyielding","obstinate"], antonyms:["flexible","compromising","open","accommodating"] },
  { word:"Jejune", phonetic:"jeh·joon", ipa:"/dʒɪˈdʒuːn/", meaning:"naive, simplistic, and superficial; lacking nourishment", sentence:"Critics dismissed his jejune analysis of a deeply complex issue.", diff:"hard", cats:["literary","literary"], synonyms:["naive","simplistic","puerile","uninteresting"], antonyms:["sophisticated","mature","nuanced","profound"] },
  { word:"Laconic", phonetic:"lah·kon·ik", ipa:"/ləˈkɒnɪk/", meaning:"using very few words; brief and concise", sentence:"His laconic reply — just 'no' — ended the entire discussion.", diff:"hard", cats:["communication","literary"], synonyms:["terse","concise","succinct","pithy"], antonyms:["verbose","garrulous","wordy","long-winded"] },
  { word:"Lassitude", phonetic:"las·ih·tyood", ipa:"/ˈlæsɪtjuːd/", meaning:"physical or mental weariness; lack of energy", sentence:"The extreme heat produced a general lassitude in the entire team.", diff:"hard", cats:["emotion","literary"], synonyms:["lethargy","weariness","fatigue","languor"], antonyms:["energy","vigour","vitality","enthusiasm"] },
  { word:"Latent", phonetic:"lay·tunt", ipa:"/ˈleɪtənt/", meaning:"existing but not yet developed or apparent; hidden", sentence:"She had a latent talent for music that nobody had yet discovered.", diff:"hard", cats:["academic","literary"], synonyms:["hidden","dormant","potential","undeveloped"], antonyms:["obvious","active","developed","apparent"] },
  { word:"Loquacious", phonetic:"loh·kway·shus", ipa:"/ləʊˈkweɪʃəs/", meaning:"tending to talk a great deal; very talkative", sentence:"She was loquacious by nature, rarely comfortable with silence.", diff:"hard", cats:["character","literary"], synonyms:["talkative","garrulous","chatty","verbose"], antonyms:["taciturn","reticent","quiet","reserved"] },
  { word:"Lugubrious", phonetic:"luh·goo·bree·us", ipa:"/luːˈɡuːbriəs/", meaning:"looking or sounding sad and dismal", sentence:"He delivered the news in a lugubrious tone that made everyone feel worse.", diff:"hard", cats:["literary","literary"], synonyms:["mournful","gloomy","melancholy","dismal"], antonyms:["cheerful","upbeat","jovial","happy"] },
  { word:"Machiavellian", phonetic:"mak·ee·ah·vel·ee·un", ipa:"/ˌmækiəˈveliən/", meaning:"cunning, scheming, and unscrupulous in pursuing goals", sentence:"His Machiavellian tactics secured power for him at any cost.", diff:"hard", cats:["character","literary"], synonyms:["scheming","devious","manipulative","calculating"], antonyms:["honest","principled","ethical","trustworthy"] },
  { word:"Magnanimous", phonetic:"mag·nan·ih·mus", ipa:"/mæɡˈnænɪməs/", meaning:"generous or forgiving, especially towards a rival", sentence:"She was magnanimous in victory, graciously congratulating her opponent.", diff:"hard", cats:["character","literary"], synonyms:["generous","forgiving","noble","big-hearted"], antonyms:["petty","vindictive","mean-spirited","unforgiving"] },
  { word:"Mendacious", phonetic:"men·day·shus", ipa:"/menˈdeɪʃəs/", meaning:"not telling the truth; lying", sentence:"The mendacious politician denied claims that were clearly true.", diff:"hard", cats:["character","literary"], synonyms:["dishonest","lying","untruthful","deceitful"], antonyms:["honest","truthful","sincere","candid"] },
  { word:"Mercurial", phonetic:"mur·kyoor·ee·ul", ipa:"/mɜːˈkjʊəriəl/", meaning:"subject to sudden or unpredictable changes of mood", sentence:"His mercurial temperament made him exciting but difficult to work with.", diff:"hard", cats:["literary","literary"], synonyms:["unpredictable","volatile","capricious","fickle"], antonyms:["stable","steady","consistent","reliable"] },
  { word:"Nadir", phonetic:"nay·deer", ipa:"/ˈneɪdɪə/", meaning:"the lowest point in the fortunes of a person", sentence:"The nadir of his career came when he was publicly dismissed.", diff:"hard", cats:["literary","literary"], synonyms:["low point","bottom","trough","rock bottom"], antonyms:["zenith","pinnacle","peak","apex"] },
  { word:"Nefarious", phonetic:"neh·fair·ee·us", ipa:"/nɪˈfeəriəs/", meaning:"wicked or criminal in nature", sentence:"The nefarious scheme was designed to defraud thousands of investors.", diff:"hard", cats:["literary","literary"], synonyms:["wicked","villainous","sinister","criminal"], antonyms:["virtuous","righteous","honourable","moral"] },
  { word:"Obdurate", phonetic:"ob·dyoo·rit", ipa:"/ˈɒbdjʊrɪt/", meaning:"stubbornly refusing to change one's opinion", sentence:"She was obdurate and would not hear any argument to the contrary.", diff:"hard", cats:["character","literary"], synonyms:["stubborn","inflexible","unyielding","rigid"], antonyms:["flexible","open-minded","yielding","accommodating"] },
  { word:"Obfuscate", phonetic:"ob·fus·kayt", ipa:"/ˈɒbfʌskeɪt/", meaning:"make obscure, unclear, or difficult to understand", sentence:"The politician used complex language to obfuscate the real issues.", diff:"hard", cats:["communication","literary"], synonyms:["confuse","muddy","obscure","complicate"], antonyms:["clarify","explain","simplify","illuminate"] },
  { word:"Obsequious", phonetic:"ob·see·kwee·us", ipa:"/əbˈsiːkwiəs/", meaning:"obedient or attentive to an excessive, servile degree", sentence:"The obsequious aide agreed with everything his boss said.", diff:"hard", cats:["literary","literary"], synonyms:["servile","sycophantic","fawning","subservient"], antonyms:["assertive","independent","forthright","bold"] },
  { word:"Onerous", phonetic:"on·er·us", ipa:"/ˈɒnərəs/", meaning:"involving a great deal of effort, trouble, or difficulty", sentence:"The new regulations placed an onerous burden on small businesses.", diff:"hard", cats:["academic","literary"], synonyms:["burdensome","demanding","heavy","taxing"], antonyms:["easy","light","effortless","simple"] },
  { word:"Oscillate", phonetic:"os·ih·layt", ipa:"/ˈɒsɪleɪt/", meaning:"move or swing back and forth; fluctuate between states", sentence:"He oscillated between optimism and despair throughout the crisis.", diff:"hard", cats:["academic","literary"], synonyms:["fluctuate","swing","alternate","waver"], antonyms:["stay fixed","remain stable","be constant","settle"] },
  { word:"Ostensible", phonetic:"os·ten·sih·bul", ipa:"/ɒˈstensɪbəl/", meaning:"appearing to be true but not necessarily so", sentence:"Her ostensible reason for leaving was health, but few believed it.", diff:"hard", cats:["academic","literary"], synonyms:["apparent","supposed","seeming","professed"], antonyms:["real","genuine","actual","true"] },
  { word:"Panacea", phonetic:"pan·ah·see·ah", ipa:"/ˌpænəˈsiːə/", meaning:"a solution or remedy for all difficulties or diseases", sentence:"There is no panacea for the complex problems facing modern society.", diff:"hard", cats:["academic","literary"], synonyms:["cure-all","solution","remedy","universal answer"], antonyms:["problem","complication","difficulty","obstacle"] },
  { word:"Parochial", phonetic:"pah·roh·kee·ul", ipa:"/pəˈrəʊkiəl/", meaning:"having a limited or narrow outlook; small-minded", sentence:"His parochial attitude prevented him from appreciating wider perspectives.", diff:"hard", cats:["character","literary"], synonyms:["narrow-minded","provincial","limited","insular"], antonyms:["cosmopolitan","broad-minded","worldly","open"] },
  { word:"Pedantic", phonetic:"peh·dan·tik", ipa:"/pɪˈdæntɪk/", meaning:"excessively concerned with minor details or rules", sentence:"His pedantic obsession with grammar irritated his collaborators.", diff:"hard", cats:["character","literary"], synonyms:["nitpicking","fussy","overprecise","fastidious"], antonyms:["relaxed","flexible","casual","easy-going"] },
  { word:"Perfidious", phonetic:"pur·fid·ee·us", ipa:"/pəˈfɪdiəs/", meaning:"deceitful and untrustworthy; treacherous", sentence:"The perfidious ally switched sides when it was most advantageous.", diff:"hard", cats:["literary","literary"], synonyms:["treacherous","disloyal","traitorous","faithless"], antonyms:["loyal","faithful","trustworthy","honourable"] },
  { word:"Perspicacious", phonetic:"pur·spih·kay·shus", ipa:"/ˌpɜːspɪˈkeɪʃəs/", meaning:"having a ready insight into things; perceptive", sentence:"A perspicacious observer would have noticed the subtle inconsistency.", diff:"hard", cats:["character","literary"], synonyms:["perceptive","shrewd","astute","discerning"], antonyms:["obtuse","dull","unperceptive","dense"] },
  { word:"Petulant", phonetic:"pech·oo·lunt", ipa:"/ˈpetʃʊlənt/", meaning:"childishly sulky or bad-tempered", sentence:"The petulant footballer refused to leave the pitch when substituted.", diff:"hard", cats:["character","literary"], synonyms:["sulky","irritable","peevish","querulous"], antonyms:["good-natured","patient","cheerful","content"] },
  { word:"Polemic", phonetic:"poh·lem·ik", ipa:"/pəˈlemɪk/", meaning:"a strong verbal or written attack against an opinion", sentence:"Her essay was a brilliant polemic against consumer waste.", diff:"hard", cats:["communication","literary"], synonyms:["attack","criticism","tirade","diatribe"], antonyms:["defence","praise","support","commendation"] },
  { word:"Prescient", phonetic:"presh·ee·unt", ipa:"/ˈpresiənt/", meaning:"having knowledge of events before they take place", sentence:"Her prescient warnings about the economic crisis went unheeded.", diff:"hard", cats:["character","literary"], synonyms:["prophetic","visionary","farsighted","clairvoyant"], antonyms:["short-sighted","unprepared","unaware","oblivious"] },
  { word:"Prevaricate", phonetic:"preh·var·ih·kayt", ipa:"/prɪˈværɪkeɪt/", meaning:"speak or act evasively to avoid the truth", sentence:"When asked directly, the minister continued to prevaricate.", diff:"hard", cats:["communication","literary"], synonyms:["evade","hedge","equivocate","be evasive"], antonyms:["be direct","tell the truth","state clearly","be honest"] },
  { word:"Prodigious", phonetic:"proh·dij·us", ipa:"/prəˈdɪdʒəs/", meaning:"remarkably great in extent, size, or degree", sentence:"She worked with prodigious energy, seemingly tireless.", diff:"hard", cats:["character","literary"], synonyms:["enormous","remarkable","extraordinary","immense"], antonyms:["small","ordinary","modest","insignificant"] },
  { word:"Propitious", phonetic:"proh·pish·us", ipa:"/prəˈpɪʃəs/", meaning:"giving or indicating a good chance of success", sentence:"The conditions were propitious for launching the new product.", diff:"hard", cats:["academic","literary"], synonyms:["favourable","promising","auspicious","fortunate"], antonyms:["unfavourable","unpromising","inauspicious","unfortunate"] },
  { word:"Pugnacious", phonetic:"pug·nay·shus", ipa:"/pʌɡˈneɪʃəs/", meaning:"eager or quick to argue or fight; aggressive", sentence:"His pugnacious personality made collaboration extremely difficult.", diff:"hard", cats:["character","literary"], synonyms:["aggressive","combative","belligerent","quarrelsome"], antonyms:["peaceful","gentle","calm","non-confrontational"] },
  { word:"Querulous", phonetic:"kwer·uh·lus", ipa:"/ˈkwerʊləs/", meaning:"complaining in a petulant or whining manner", sentence:"The querulous patient complained about every aspect of his treatment.", diff:"hard", cats:["character","literary"], synonyms:["complaining","whining","petulant","peevish"], antonyms:["content","satisfied","cheerful","easygoing"] },
  { word:"Quixotic", phonetic:"kwik·sot·ik", ipa:"/kwɪkˈsɒtɪk/", meaning:"exceedingly idealistic and unrealistic; impractical", sentence:"His quixotic plan to eliminate poverty overnight baffled everyone.", diff:"hard", cats:["literary","literary"], synonyms:["idealistic","impractical","unrealistic","fanciful"], antonyms:["pragmatic","realistic","practical","sensible"] },
  { word:"Rancorous", phonetic:"rank·er·us", ipa:"/ˈræŋkərəs/", meaning:"having or showing deep bitterness or ill will", sentence:"The divorce proceedings were rancorous, lasting several painful years.", diff:"hard", cats:["character","literary"], synonyms:["bitter","hostile","resentful","acrimonious"], antonyms:["cordial","friendly","amicable","warm"] },
  { word:"Recalcitrant", phonetic:"reh·kal·sih·trunt", ipa:"/rɪˈkælsɪtrənt/", meaning:"having an obstinately uncooperative attitude", sentence:"The recalcitrant student refused to follow any of the school's rules.", diff:"hard", cats:["character","literary"], synonyms:["uncooperative","defiant","rebellious","stubborn"], antonyms:["compliant","cooperative","obedient","amenable"] },
  { word:"Recondite", phonetic:"rek·un·dyt", ipa:"/ˈrekəndaɪt/", meaning:"not known by many people; abstruse or obscure", sentence:"The paper explored recondite aspects of medieval legal history.", diff:"hard", cats:["academic","literary"], synonyms:["obscure","abstruse","esoteric","arcane"], antonyms:["common","well-known","familiar","mainstream"] },
  { word:"Sagacious", phonetic:"sah·gay·shus", ipa:"/səˈɡeɪʃəs/", meaning:"having or showing keen mental discernment; wise", sentence:"The sagacious investor saw the opportunity that others had missed.", diff:"hard", cats:["character","literary"], synonyms:["wise","perceptive","astute","shrewd"], antonyms:["foolish","naive","gullible","obtuse"] },
  { word:"Salient", phonetic:"say·lee·unt", ipa:"/ˈseɪliənt/", meaning:"most noticeable or important; prominent", sentence:"She outlined the most salient points of her argument first.", diff:"hard", cats:["academic","literary"], synonyms:["prominent","notable","key","important"], antonyms:["minor","trivial","peripheral","insignificant"] },
  { word:"Sanguine", phonetic:"sang·gwin", ipa:"/ˈsæŋɡwɪn/", meaning:"optimistic or positive, especially in a difficult situation", sentence:"Despite the setbacks, she remained sanguine about the company's prospects.", diff:"hard", cats:["literary","literary"], synonyms:["optimistic","hopeful","positive","confident"], antonyms:["pessimistic","gloomy","despairing","hopeless"] },
  { word:"Sardonic", phonetic:"sar·don·ik", ipa:"/sɑːˈdɒnɪk/", meaning:"grimly mocking or cynical in manner or tone", sentence:"He replied with a sardonic smile and a dismissive wave of his hand.", diff:"hard", cats:["literary","literary"], synonyms:["mocking","cynical","ironic","sarcastic"], antonyms:["sincere","warm","kind","earnest"] },
  { word:"Sedulous", phonetic:"sed·yoo·lus", ipa:"/ˈsedjʊləs/", meaning:"showing dedication and diligence; persevering carefully", sentence:"Her sedulous preparation for the exam resulted in an outstanding grade.", diff:"hard", cats:["character","literary"], synonyms:["diligent","dedicated","assiduous","industrious"], antonyms:["lazy","careless","negligent","half-hearted"] },
  { word:"Soporific", phonetic:"sop·oh·rif·ik", ipa:"/ˌsɒpəˈrɪfɪk/", meaning:"tending to induce drowsiness or sleep", sentence:"The minister's soporific speech sent several members to sleep.", diff:"hard", cats:["literary","literary"], synonyms:["sleep-inducing","tedious","boring","monotonous"], antonyms:["stimulating","engaging","exciting","interesting"] },
  { word:"Spurious", phonetic:"spyoor·ee·us", ipa:"/ˈspjʊəriəs/", meaning:"not being what it purports to be; false or fake", sentence:"The archaeologist exposed the artefact as entirely spurious.", diff:"hard", cats:["academic","literary"], synonyms:["false","fake","counterfeit","fraudulent"], antonyms:["genuine","authentic","real","legitimate"] },
  { word:"Stoic", phonetic:"stoh·ik", ipa:"/ˈstəʊɪk/", meaning:"enduring pain or hardship without showing feelings", sentence:"She bore the loss with great stoic dignity and composure.", diff:"hard", cats:["philosophy","literary"], synonyms:["impassive","enduring","self-controlled","phlegmatic"], antonyms:["emotional","sensitive","expressive","reactive"] },
  { word:"Subversive", phonetic:"sub·vur·siv", ipa:"/səbˈvɜːsɪv/", meaning:"seeking to undermine an established system or institution", sentence:"The book was considered subversive and was banned by the government.", diff:"hard", cats:["academic","literary"], synonyms:["disruptive","revolutionary","seditious","radical"], antonyms:["conformist","conservative","orthodox","traditional"] },
  { word:"Supercilious", phonetic:"soo·per·sil·ee·us", ipa:"/ˌsuːpəˈsɪliəs/", meaning:"behaving as if one is superior to others; disdainful", sentence:"His supercilious attitude alienated everyone he worked with.", diff:"hard", cats:["character","literary"], synonyms:["arrogant","condescending","haughty","disdainful"], antonyms:["humble","modest","respectful","unpretentious"] },
  { word:"Sycophant", phonetic:"sik·oh·fant", ipa:"/ˈsɪkəfænt/", meaning:"a person who flatters important people to gain advantage", sentence:"The director was surrounded by sycophants who never challenged him.", diff:"hard", cats:["social","literary"], synonyms:["flatterer","yes-man","toady","fawner"], antonyms:["critic","detractor","challenger","adversary"] },
  { word:"Taciturn", phonetic:"tas·ih·turn", ipa:"/ˈtæsɪtɜːn/", meaning:"reserved or uncommunicative in speech; saying little", sentence:"Her taciturn nature was often mistaken for rudeness by strangers.", diff:"hard", cats:["character","literary"], synonyms:["reserved","quiet","reticent","uncommunicative"], antonyms:["talkative","garrulous","verbose","outgoing"] },
  { word:"Tendentious", phonetic:"ten·den·shus", ipa:"/tenˈdenʃəs/", meaning:"promoting a particular cause or point of view; biased", sentence:"The report was criticised as tendentious and one-sided.", diff:"hard", cats:["communication","literary"], synonyms:["biased","partisan","one-sided","slanted"], antonyms:["balanced","impartial","objective","neutral"] },
  { word:"Tortuous", phonetic:"tor·choo·us", ipa:"/ˈtɔːtʃuəs/", meaning:"full of twists and turns; excessively complicated", sentence:"The tortuous legal process lasted for many years before a verdict.", diff:"hard", cats:["literary","literary"], synonyms:["winding","circuitous","complex","convoluted"], antonyms:["direct","straight","simple","clear"] },
  { word:"Truculent", phonetic:"truk·yoo·lunt", ipa:"/ˈtrʌkjʊlənt/", meaning:"eager or quick to argue; aggressively defiant", sentence:"The truculent defendant interrupted the judge repeatedly.", diff:"hard", cats:["literary","literary"], synonyms:["combative","aggressive","belligerent","defiant"], antonyms:["peaceful","docile","cooperative","gentle"] },
  { word:"Ubiquitous", phonetic:"yoo·bik·wih·tus", ipa:"/juːˈbɪkwɪtəs/", meaning:"present or found everywhere simultaneously", sentence:"Smartphones have become ubiquitous throughout the modern world.", diff:"hard", cats:["academic","literary"], synonyms:["omnipresent","pervasive","universal","widespread"], antonyms:["rare","scarce","unusual","absent"] },
  { word:"Vacillate", phonetic:"vas·ih·layt", ipa:"/ˈvæsɪleɪt/", meaning:"waver between different opinions or actions; be indecisive", sentence:"She vacillated for weeks before finally making her decision.", diff:"hard", cats:["character","literary"], synonyms:["waver","hesitate","be indecisive","fluctuate"], antonyms:["decide","commit","be resolute","determine"] },
  { word:"Venal", phonetic:"vee·nul", ipa:"/ˈviːnəl/", meaning:"showing willingness to act dishonestly for money", sentence:"The venal official accepted bribes from every company seeking contracts.", diff:"hard", cats:["character","literary"], synonyms:["corrupt","bribable","mercenary","dishonest"], antonyms:["honest","principled","incorruptible","ethical"] },
  { word:"Verisimilitude", phonetic:"ver·ih·sih·mil·ih·tyood", ipa:"/ˌverɪsɪˈmɪlɪtjuːd/", meaning:"the appearance of being true or real", sentence:"The novel's verisimilitude made readers forget it was entirely fictional.", diff:"hard", cats:["literary","literary"], synonyms:["realism","authenticity","credibility","plausibility"], antonyms:["implausibility","unreality","fantasy","improbability"] },
  { word:"Vexatious", phonetic:"vek·say·shus", ipa:"/vekˈseɪʃəs/", meaning:"causing or tending to cause annoyance or worry", sentence:"The delays were vexatious and costly for the company.", diff:"hard", cats:["character","literary"], synonyms:["annoying","frustrating","irritating","troublesome"], antonyms:["pleasant","agreeable","satisfying","welcome"] },
  { word:"Vituperate", phonetic:"vy·tyoo·per·ayt", ipa:"/vɪˈtjuːpəreɪt/", meaning:"blame or censure severely; berate harshly", sentence:"The critic vituperated the novel with unusual vehemence.", diff:"hard", cats:["literary","literary"], synonyms:["berate","abuse","condemn","criticise harshly"], antonyms:["praise","commend","extol","compliment"] },
  { word:"Weltanschauung", phonetic:"velt·ahn·show·oong", ipa:"/ˈveltanʃaʊʊŋ/", meaning:"a particular philosophy or view of the world", sentence:"Her travels fundamentally altered her Weltanschauung.", diff:"hard", cats:["philosophy","literary"], synonyms:["worldview","philosophy","outlook","perspective"], antonyms:["ignorance","narrow view","bias","parochialism"] },
  { word:"Zeitgeist", phonetic:"tsyt·gyst", ipa:"/ˈzaɪtɡaɪst/", meaning:"the defining spirit or mood of a particular period in history", sentence:"The film perfectly captured the zeitgeist of the turbulent 1960s.", diff:"hard", cats:["literary","literary"], synonyms:["spirit of the age","ethos","climate","atmosphere"], antonyms:["anachronism","irrelevance","timelessness","outdatedness"] },
  { word:"Zealotry", phonetic:"zel·uh·tree", ipa:"/ˈzelətri/", meaning:"fanatical and uncompromising pursuit of ideals", sentence:"His zealotry alienated potential allies who might otherwise have supported him.", diff:"hard", cats:["character","literary"], synonyms:["fanaticism","extremism","fervour","militancy"], antonyms:["moderation","tolerance","reason","balance"] },

{ word:"Abandon", phonetic:"ah·ban·dun", ipa:"/əˈbændən/", meaning:"give up completely; leave behind", sentence:"She had to abandon the project when funding ran out.", diff:"easy", cats:["everyday","everyday"], synonyms:["desert","forsake","quit","relinquish"], antonyms:["keep","maintain","continue","pursue"] },
  { word:"Absurd", phonetic:"ab·surd", ipa:"/əbˈsɜːd/", meaning:"wildly unreasonable or illogical", sentence:"It seemed absurd to spend so much money on something so trivial.", diff:"easy", cats:["everyday","everyday"], synonyms:["ridiculous","preposterous","ludicrous","nonsensical"], antonyms:["reasonable","sensible","logical","rational"] },
  { word:"Accessible", phonetic:"ak·ses·ih·bul", ipa:"/əkˈsesɪbəl/", meaning:"able to be reached or easily obtained", sentence:"The new library was designed to be accessible to everyone.", diff:"easy", cats:["everyday","everyday"], synonyms:["reachable","available","approachable","open"], antonyms:["inaccessible","unavailable","remote","closed"] },
  { word:"Accurate", phonetic:"ak·yuh·rit", ipa:"/ˈækjərɪt/", meaning:"correct in all details; free from error", sentence:"The scientist made an accurate measurement of the temperature.", diff:"easy", cats:["academic","everyday"], synonyms:["correct","precise","exact","truthful"], antonyms:["inaccurate","wrong","imprecise","faulty"] },
  { word:"Acknowledge", phonetic:"ak·nol·ij", ipa:"/əkˈnɒlɪdʒ/", meaning:"accept or admit the existence or truth of something", sentence:"She acknowledged that she had made a mistake.", diff:"easy", cats:["everyday","everyday"], synonyms:["admit","recognise","accept","confess"], antonyms:["deny","reject","ignore","refuse"] },
  { word:"Acquire", phonetic:"ah·kwyr", ipa:"/əˈkwaɪə/", meaning:"buy or obtain something for oneself", sentence:"He worked hard to acquire the skills needed for the job.", diff:"easy", cats:["business","everyday"], synonyms:["obtain","gain","get","secure"], antonyms:["lose","give up","forfeit","relinquish"] },
  { word:"Admire", phonetic:"ad·myr", ipa:"/ədˈmaɪə/", meaning:"regard with respect, pleasure, or warm approval", sentence:"She admired the painter\'s ability to capture light so beautifully.", diff:"easy", cats:["social","everyday"], synonyms:["respect","appreciate","esteem","value"], antonyms:["despise","disrespect","dislike","scorn"] },
  { word:"Agile", phonetic:"aj·ul", ipa:"/ˈædʒaɪl/", meaning:"able to move quickly and easily; mentally alert", sentence:"An agile mind can switch between tasks with ease.", diff:"easy", cats:["character","everyday"], synonyms:["nimble","quick","dexterous","flexible"], antonyms:["clumsy","slow","stiff","sluggish"] },
  { word:"Alert", phonetic:"ah·lurt", ipa:"/əˈlɜːt/", meaning:"watchful and quick to notice any unusual things", sentence:"The guard remained alert throughout the long night shift.", diff:"easy", cats:["character","everyday"], synonyms:["attentive","watchful","vigilant","aware"], antonyms:["unaware","inattentive","careless","drowsy"] },
  { word:"Ambition", phonetic:"am·bish·un", ipa:"/æmˈbɪʃən/", meaning:"a strong desire to do or achieve something", sentence:"Her ambition drove her to work harder than anyone else.", diff:"easy", cats:["character","everyday"], synonyms:["aspiration","drive","goal","determination"], antonyms:["apathy","laziness","indifference","complacency"] },
  { word:"Ample", phonetic:"am·pul", ipa:"/ˈæmpəl/", meaning:"enough or more than enough; plentiful", sentence:"There was ample time to finish the task before the deadline.", diff:"easy", cats:["everyday","everyday"], synonyms:["plentiful","sufficient","abundant","generous"], antonyms:["scarce","insufficient","limited","inadequate"] },
  { word:"Analogy", phonetic:"ah·nal·oh·jee", ipa:"/əˈnæləɡi/", meaning:"a comparison between two things to explain one of them", sentence:"She used an analogy to explain how the heart works like a pump.", diff:"easy", cats:["academic","everyday"], synonyms:["comparison","parallel","similarity","likeness"], antonyms:["difference","contrast","dissimilarity","distinction"] },
  { word:"Anticipate", phonetic:"an·tis·ih·payt", ipa:"/ænˈtɪsɪpeɪt/", meaning:"expect or predict something in advance", sentence:"The manager anticipated problems and prepared solutions in advance.", diff:"easy", cats:["everyday","everyday"], synonyms:["expect","foresee","predict","prepare for"], antonyms:["ignore","overlook","be surprised","disregard"] },
  { word:"Anxious", phonetic:"ank·shus", ipa:"/ˈæŋkʃəs/", meaning:"worried and nervous about a possible problem", sentence:"She was anxious about the results of her medical tests.", diff:"easy", cats:["emotion","everyday"], synonyms:["worried","nervous","concerned","uneasy"], antonyms:["calm","relaxed","confident","unconcerned"] },
  { word:"Appreciate", phonetic:"ah·pree·shee·ayt", ipa:"/əˈpriːʃieɪt/", meaning:"recognise and enjoy the good qualities of something", sentence:"He genuinely appreciated all the effort she had put in.", diff:"easy", cats:["character","everyday"], synonyms:["value","cherish","treasure","acknowledge"], antonyms:["undervalue","dismiss","ignore","depreciate"] },
  { word:"Articulate", phonetic:"ar·tik·yoo·lit", ipa:"/ɑːˈtɪkjʊlɪt/", meaning:"able to speak or express clearly and confidently", sentence:"She was an articulate speaker who captivated every audience.", diff:"easy", cats:["communication","everyday"], synonyms:["eloquent","fluent","clear","expressive"], antonyms:["inarticulate","mumbling","unclear","tongue-tied"] },
  { word:"Aspire", phonetic:"ah·spy·er", ipa:"/əˈspaɪə/", meaning:"have a strong ambition to achieve something", sentence:"He aspired to become the first in his family to attend university.", diff:"easy", cats:["character","everyday"], synonyms:["aim","hope","seek","strive"], antonyms:["despair","give up","lack ambition","resign"] },
  { word:"Assure", phonetic:"ah·shoor", ipa:"/əˈʃʊə/", meaning:"tell someone something positively to remove doubt", sentence:"She assured him that everything would be taken care of.", diff:"easy", cats:["communication","everyday"], synonyms:["promise","guarantee","confirm","reassure"], antonyms:["doubt","deny","uncertain","mislead"] },
  { word:"Attain", phonetic:"ah·tayn", ipa:"/əˈteɪn/", meaning:"succeed in achieving something after effort", sentence:"After years of study, she finally attained her doctorate.", diff:"easy", cats:["academic","everyday"], synonyms:["achieve","reach","gain","accomplish"], antonyms:["fail","miss","lose","fall short"] },
  { word:"Authentic", phonetic:"aw·then·tik", ipa:"/ɔːˈθentɪk/", meaning:"genuine and real; not copied or false", sentence:"The painting was confirmed to be an authentic work by the master.", diff:"easy", cats:["character","everyday"], synonyms:["genuine","real","true","legitimate"], antonyms:["fake","counterfeit","false","imitation"] },
  { word:"Aware", phonetic:"ah·wair", ipa:"/əˈweə/", meaning:"having knowledge or perception of a situation or fact", sentence:"She was fully aware of the risks involved in the decision.", diff:"easy", cats:["everyday","everyday"], synonyms:["conscious","informed","knowledgeable","mindful"], antonyms:["unaware","ignorant","oblivious","unconscious"] },
  { word:"Balance", phonetic:"bal·uns", ipa:"/ˈbæləns/", meaning:"a situation in which different things are equal", sentence:"She tried to maintain a healthy balance between work and rest.", diff:"easy", cats:["everyday","everyday"], synonyms:["equilibrium","stability","harmony","proportion"], antonyms:["imbalance","instability","inequality","excess"] },
  { word:"Benefit", phonetic:"ben·ih·fit", ipa:"/ˈbenɪfɪt/", meaning:"an advantage or profit gained from something", sentence:"Regular exercise has enormous health benefits.", diff:"easy", cats:["everyday","everyday"], synonyms:["advantage","gain","profit","reward"], antonyms:["disadvantage","harm","loss","drawback"] },
  { word:"Careful", phonetic:"kair·ful", ipa:"/ˈkeəfʊl/", meaning:"making sure of avoiding potential danger or mistakes", sentence:"Be careful when handling these fragile instruments.", diff:"easy", cats:["character","everyday"], synonyms:["cautious","meticulous","thorough","attentive"], antonyms:["careless","reckless","hasty","negligent"] },
  { word:"Champion", phonetic:"cham·pee·un", ipa:"/ˈtʃæmpiən/", meaning:"a person who strongly supports or defends a cause", sentence:"She was a passionate champion of equal rights for all.", diff:"easy", cats:["social","everyday"], synonyms:["advocate","defender","supporter","promoter"], antonyms:["opponent","critic","detractor","adversary"] },
  { word:"Characterise", phonetic:"kar·ik·ter·yz", ipa:"/ˈkærɪktəraɪz/", meaning:"describe the distinctive nature or features of something", sentence:"She characterised the problem as a failure of communication.", diff:"easy", cats:["communication","everyday"], synonyms:["describe","define","portray","depict"], antonyms:["mischaracterise","distort","misrepresent","confuse"] },
  { word:"Clarify", phonetic:"klar·ih·fy", ipa:"/ˈklærɪfaɪ/", meaning:"make a statement or situation less confused", sentence:"She asked the teacher to clarify what the assignment required.", diff:"easy", cats:["communication","everyday"], synonyms:["explain","illuminate","simplify","specify"], antonyms:["obscure","confuse","muddle","complicate"] },
  { word:"Collaborate", phonetic:"koh·lab·oh·rayt", ipa:"/kəˈlæbəreɪt/", meaning:"work jointly on an activity or project", sentence:"The two scientists agreed to collaborate on the research project.", diff:"easy", cats:["business","everyday"], synonyms:["cooperate","work together","team up","partner"], antonyms:["compete","work alone","oppose","resist"] },
  { word:"Commemorate", phonetic:"koh·mem·oh·rayt", ipa:"/kəˈmemərreɪt/", meaning:"recall and show respect for someone or something", sentence:"The ceremony commemorated those who lost their lives in the conflict.", diff:"easy", cats:["social","everyday"], synonyms:["honour","celebrate","mark","remember"], antonyms:["forget","ignore","disregard","dishonour"] },
  { word:"Communicate", phonetic:"koh·myoo·nih·kayt", ipa:"/kəˈmjuːnɪkeɪt/", meaning:"share or exchange information or ideas with others", sentence:"It is essential to communicate clearly in any team environment.", diff:"easy", cats:["communication","everyday"], synonyms:["convey","express","share","transmit"], antonyms:["hide","conceal","withhold","keep secret"] },
  { word:"Complex", phonetic:"kom·pleks", ipa:"/ˈkɒmpleks/", meaning:"consisting of many interconnected parts; not simple", sentence:"The issue was far more complex than anyone had anticipated.", diff:"easy", cats:["academic","everyday"], synonyms:["complicated","intricate","involved","elaborate"], antonyms:["simple","straightforward","basic","easy"] },
  { word:"Composed", phonetic:"kom·pozd", ipa:"/kəmˈpəʊzd/", meaning:"having one's feelings under control; calm", sentence:"She remained composed throughout the difficult interview process.", diff:"easy", cats:["character","everyday"], synonyms:["calm","collected","serene","tranquil"], antonyms:["agitated","flustered","nervous","anxious"] },
  { word:"Consistent", phonetic:"kon·sis·tunt", ipa:"/kənˈsɪstənt/", meaning:"acting or done in the same way over time", sentence:"Her consistent effort was rewarded with excellent exam results.", diff:"easy", cats:["character","everyday"], synonyms:["steady","uniform","reliable","stable"], antonyms:["inconsistent","erratic","variable","unreliable"] },
  { word:"Constructive", phonetic:"kon·struk·tiv", ipa:"/kənˈstrʌktɪv/", meaning:"serving a useful purpose; helpful", sentence:"Please give constructive feedback rather than mere criticism.", diff:"easy", cats:["character","everyday"], synonyms:["helpful","positive","useful","productive"], antonyms:["destructive","unhelpful","negative","harmful"] },
  { word:"Contribute", phonetic:"kon·trib·yoot", ipa:"/kənˈtrɪbjuːt/", meaning:"give something in order to help achieve something", sentence:"Every team member was expected to contribute their best ideas.", diff:"easy", cats:["social","everyday"], synonyms:["give","provide","offer","donate"], antonyms:["withhold","take","subtract","deprive"] },
  { word:"Controversial", phonetic:"kon·troh·vur·shul", ipa:"/ˌkɒntrəˈvɜːʃəl/", meaning:"giving rise or likely to give rise to dispute", sentence:"The new policy proved deeply controversial across all regions.", diff:"easy", cats:["academic","everyday"], synonyms:["debatable","disputed","contentious","sensitive"], antonyms:["uncontroversial","agreed","accepted","undisputed"] },
  { word:"Cooperative", phonetic:"koh·op·er·ah·tiv", ipa:"/kəʊˈɒpərətɪv/", meaning:"involving mutual assistance in working toward a common goal", sentence:"The cooperative approach between departments improved efficiency greatly.", diff:"easy", cats:["social","everyday"], synonyms:["collaborative","helpful","supporting","united"], antonyms:["competitive","uncooperative","obstructive","hostile"] },
  { word:"Courage", phonetic:"kur·ij", ipa:"/ˈkʌrɪdʒ/", meaning:"the ability to do something that frightens one", sentence:"It took great courage to speak out against the injustice.", diff:"easy", cats:["character","everyday"], synonyms:["bravery","valour","nerve","boldness"], antonyms:["cowardice","timidity","fear","weakness"] },
  { word:"Creative", phonetic:"kree·ay·tiv", ipa:"/kriˈeɪtɪv/", meaning:"relating to or involving imagination and original ideas", sentence:"The team came up with a creative solution to the difficult problem.", diff:"easy", cats:["character","everyday"], synonyms:["imaginative","inventive","original","innovative"], antonyms:["unimaginative","conventional","predictable","uncreative"] },
  { word:"Critical", phonetic:"krit·ih·kul", ipa:"/ˈkrɪtɪkəl/", meaning:"expressing disapproval; of decisive importance", sentence:"His critical review of the project helped improve the final result.", diff:"easy", cats:["academic","everyday"], synonyms:["analytical","evaluative","crucial","important"], antonyms:["uncritical","approving","unimportant","minor"] },
  { word:"Curiosity", phonetic:"kyoor·ee·os·ih·tee", ipa:"/ˌkjʊəriˈɒsɪti/", meaning:"a strong desire to know or learn something", sentence:"Her curiosity led her to investigate the strange noise.", diff:"easy", cats:["character","everyday"], synonyms:["inquisitiveness","interest","enquiry","eagerness"], antonyms:["indifference","apathy","disinterest","boredom"] },
  { word:"Daring", phonetic:"dair·ing", ipa:"/ˈdeərɪŋ/", meaning:"adventurous courage; willing to take bold risks", sentence:"His daring plan to cross the desert alone astonished everyone.", diff:"easy", cats:["character","everyday"], synonyms:["bold","brave","adventurous","fearless"], antonyms:["timid","cowardly","cautious","unadventurous"] },
  { word:"Deceive", phonetic:"deh·seev", ipa:"/dɪˈsiːv/", meaning:"cause someone to believe something that is not true", sentence:"He tried to deceive his employer by falsifying the reports.", diff:"easy", cats:["character","everyday"], synonyms:["trick","mislead","fool","delude"], antonyms:["enlighten","tell truth","honest","straightforward"] },
  { word:"Dedicated", phonetic:"ded·ih·kay·tid", ipa:"/ˈdedɪkeɪtɪd/", meaning:"devoted to a task or purpose with great commitment", sentence:"She was a dedicated professional who gave everything to her work.", diff:"easy", cats:["character","everyday"], synonyms:["committed","devoted","loyal","hardworking"], antonyms:["uncommitted","indifferent","half-hearted","lazy"] },
  { word:"Defiant", phonetic:"deh·fy·unt", ipa:"/dɪˈfaɪənt/", meaning:"showing open resistance or bold disobedience", sentence:"The defiant protester refused to move when ordered.", diff:"easy", cats:["character","everyday"], synonyms:["rebellious","resistant","bold","unruly"], antonyms:["compliant","obedient","submissive","cooperative"] },
  { word:"Dependable", phonetic:"deh·pen·dah·bul", ipa:"/dɪˈpendəbəl/", meaning:"able to be relied on; trustworthy and consistent", sentence:"She was the most dependable member of the entire team.", diff:"easy", cats:["character","everyday"], synonyms:["reliable","trustworthy","consistent","steadfast"], antonyms:["unreliable","inconsistent","undependable","unpredictable"] },
  { word:"Determination", phonetic:"deh·tur·mih·nay·shun", ipa:"/dɪˌtɜːmɪˈneɪʃən/", meaning:"firmness of purpose; resoluteness", sentence:"Her determination to succeed never wavered despite all the setbacks.", diff:"easy", cats:["character","everyday"], synonyms:["resolve","persistence","willpower","grit"], antonyms:["indecision","weakness","hesitancy","wavering"] },
  { word:"Devote", phonetic:"deh·voht", ipa:"/dɪˈvəʊt/", meaning:"give all of one's time or resources to a person or activity", sentence:"He devoted his entire career to improving public health.", diff:"easy", cats:["character","everyday"], synonyms:["dedicate","commit","consecrate","give"], antonyms:["neglect","abandon","withhold","waste"] },
  { word:"Discipline", phonetic:"dis·ih·plin", ipa:"/ˈdɪsɪplɪn/", meaning:"the practice of training to obey rules; controlled behaviour", sentence:"Success requires both talent and strict personal discipline.", diff:"easy", cats:["character","everyday"], synonyms:["self-control","order","training","rigour"], antonyms:["indiscipline","chaos","disorder","laziness"] },
  { word:"Disruptive", phonetic:"dis·rup·tiv", ipa:"/dɪsˈrʌptɪv/", meaning:"causing or tending to cause disruption", sentence:"His disruptive behaviour made it difficult for others to concentrate.", diff:"easy", cats:["character","everyday"], synonyms:["troublesome","upsetting","disturbing","unsettling"], antonyms:["helpful","orderly","calm","cooperative"] },
  { word:"Dominant", phonetic:"dom·ih·nunt", ipa:"/ˈdɒmɪnənt/", meaning:"most important, powerful, or influential", sentence:"The dominant theme of the novel is the search for identity.", diff:"easy", cats:["academic","everyday"], synonyms:["chief","leading","primary","ruling"], antonyms:["minor","weak","secondary","subordinate"] },
  { word:"Dramatic", phonetic:"drah·mat·ik", ipa:"/drəˈmætɪk/", meaning:"exciting or impressive; relating to drama", sentence:"There was a dramatic improvement in results after the new policy.", diff:"easy", cats:["everyday","everyday"], synonyms:["striking","exciting","impressive","vivid"], antonyms:["dull","ordinary","unimpressive","subtle"] },
  { word:"Earnest", phonetic:"ur·nist", ipa:"/ˈɜːnɪst/", meaning:"resulting from or showing sincere and intense conviction", sentence:"She made an earnest effort to repair the damaged friendship.", diff:"easy", cats:["character","everyday"], synonyms:["sincere","serious","heartfelt","genuine"], antonyms:["insincere","flippant","frivolous","half-hearted"] },
  { word:"Enhance", phonetic:"en·hans", ipa:"/ɪnˈhɑːns/", meaning:"intensify, increase, or further improve the quality of", sentence:"The new lighting enhanced the beauty of the painting enormously.", diff:"easy", cats:["everyday","everyday"], synonyms:["improve","boost","strengthen","enrich"], antonyms:["diminish","worsen","reduce","weaken"] },
  { word:"Enlighten", phonetic:"en·ly·ten", ipa:"/ɪnˈlaɪtən/", meaning:"give greater knowledge and understanding to someone", sentence:"The documentary helped to enlighten viewers about climate change.", diff:"easy", cats:["academic","everyday"], synonyms:["inform","educate","illuminate","teach"], antonyms:["mislead","confuse","deceive","keep ignorant"] },
  { word:"Essential", phonetic:"eh·sen·shul", ipa:"/ɪˈsenʃəl/", meaning:"absolutely necessary; extremely important", sentence:"Water is essential for all forms of life on Earth.", diff:"easy", cats:["everyday","everyday"], synonyms:["vital","necessary","crucial","indispensable"], antonyms:["unnecessary","optional","redundant","dispensable"] },
  { word:"Evaluate", phonetic:"ih·val·yoo·ayt", ipa:"/ɪˈvæljueɪt/", meaning:"form an idea of the amount or quality of something", sentence:"The committee was asked to evaluate each proposal carefully.", diff:"easy", cats:["academic","everyday"], synonyms:["assess","judge","appraise","measure"], antonyms:["ignore","overlook","accept without question","dismiss"] },
  { word:"Evident", phonetic:"ev·ih·dunt", ipa:"/ˈevɪdənt/", meaning:"plain or obvious; clearly true or apparent", sentence:"It was evident from the results that the experiment had worked.", diff:"easy", cats:["academic","everyday"], synonyms:["obvious","clear","apparent","plain"], antonyms:["hidden","obscure","uncertain","doubtful"] },
  { word:"Examine", phonetic:"ig·zam·in", ipa:"/ɪɡˈzæmɪn/", meaning:"inspect or scrutinise something carefully", sentence:"The doctor examined the patient carefully before giving a diagnosis.", diff:"easy", cats:["academic","everyday"], synonyms:["inspect","investigate","study","analyse"], antonyms:["ignore","overlook","skim","disregard"] },
  { word:"Exemplary", phonetic:"eg·zem·plah·ree", ipa:"/ɪɡˈzemplɑːri/", meaning:"serving as a desirable model; representing the best", sentence:"Her exemplary conduct earned her a promotion.", diff:"easy", cats:["character","everyday"], synonyms:["outstanding","excellent","admirable","ideal"], antonyms:["poor","bad","unworthy","mediocre"] },
  { word:"Exhaustive", phonetic:"eg·zaw·stiv", ipa:"/ɪɡˈzɔːstɪv/", meaning:"including all possibilities; thorough and complete", sentence:"The report provided an exhaustive analysis of all the data.", diff:"easy", cats:["academic","everyday"], synonyms:["thorough","comprehensive","complete","full"], antonyms:["incomplete","partial","superficial","brief"] },
  { word:"Explicit", phonetic:"ek·splis·it", ipa:"/ɪkˈsplɪsɪt/", meaning:"stated clearly and in detail; leaving no room for confusion", sentence:"Please make your instructions as explicit as possible.", diff:"easy", cats:["communication","everyday"], synonyms:["clear","direct","specific","detailed"], antonyms:["vague","implicit","ambiguous","unclear"] },
  { word:"Exploit", phonetic:"ek·sployt", ipa:"/ˈeksplɔɪt/", meaning:"make full use of and gain benefit from a resource", sentence:"She learned to exploit every opportunity that came her way.", diff:"easy", cats:["business","everyday"], synonyms:["utilise","use","capitalise","maximise"], antonyms:["waste","ignore","miss","neglect"] },
  { word:"Expose", phonetic:"ek·spohz", ipa:"/ɪkˈspəʊz/", meaning:"make something visible or known; uncover", sentence:"The journalist worked to expose corruption in the government.", diff:"easy", cats:["everyday","everyday"], synonyms:["reveal","uncover","disclose","unmask"], antonyms:["cover","hide","protect","conceal"] },
  { word:"Express", phonetic:"ek·spres", ipa:"/ɪkˈspres/", meaning:"convey a thought or feeling in words or actions", sentence:"She struggled to express how grateful she felt for their help.", diff:"easy", cats:["communication","everyday"], synonyms:["communicate","convey","voice","articulate"], antonyms:["suppress","conceal","hide","withhold"] },
  { word:"Extend", phonetic:"ek·stend", ipa:"/ɪkˈstend/", meaning:"make larger; cause to last longer", sentence:"The company decided to extend the deadline by two weeks.", diff:"easy", cats:["everyday","everyday"], synonyms:["expand","lengthen","increase","prolong"], antonyms:["reduce","shorten","limit","curtail"] },
  { word:"Favour", phonetic:"fay·ver", ipa:"/ˈfeɪvə/", meaning:"approval or support for something; a kind act", sentence:"She spoke in favour of the proposed changes to the policy.", diff:"easy", cats:["social","everyday"], synonyms:["support","approval","backing","goodwill"], antonyms:["opposition","disfavour","disapproval","dislike"] },
  { word:"Focused", phonetic:"foh·kust", ipa:"/ˈfəʊkəst/", meaning:"directing attention or effort at something specific", sentence:"She was deeply focused on completing the project before the deadline.", diff:"easy", cats:["character","everyday"], synonyms:["concentrated","attentive","directed","determined"], antonyms:["distracted","unfocused","scattered","inattentive"] },
  { word:"Foster", phonetic:"fos·ter", ipa:"/ˈfɒstə/", meaning:"encourage or promote the development of something", sentence:"Good leaders foster creativity and open communication.", diff:"easy", cats:["character","everyday"], synonyms:["promote","encourage","nurture","cultivate"], antonyms:["hinder","suppress","discourage","neglect"] },
  { word:"Fulfil", phonetic:"ful·fil", ipa:"/fʊlˈfɪl/", meaning:"carry out a task, duty, or role satisfactorily", sentence:"She worked hard to fulfil all her responsibilities at work.", diff:"easy", cats:["character","everyday"], synonyms:["complete","achieve","accomplish","meet"], antonyms:["fail","neglect","abandon","fall short"] },
  { word:"Graceful", phonetic:"grays·ful", ipa:"/ˈɡreɪsfəl/", meaning:"having or showing grace or elegance", sentence:"She was a graceful dancer who moved with effortless beauty.", diff:"easy", cats:["character","everyday"], synonyms:["elegant","poised","fluid","refined"], antonyms:["clumsy","graceless","awkward","ungainly"] },
  { word:"Grateful", phonetic:"grayt·ful", ipa:"/ˈɡreɪtfʊl/", meaning:"feeling or showing appreciation for something received", sentence:"She was deeply grateful for the support of her colleagues.", diff:"easy", cats:["character","everyday"], synonyms:["thankful","appreciative","obliged","indebted"], antonyms:["ungrateful","unappreciative","indifferent","thankless"] },
  { word:"Guidance", phonetic:"gy·dens", ipa:"/ˈɡaɪdəns/", meaning:"advice or information aimed at resolving a problem", sentence:"She turned to her mentor for guidance on the difficult decision.", diff:"easy", cats:["everyday","everyday"], synonyms:["advice","direction","support","counsel"], antonyms:["misdirection","confusion","ignorance","misleading"] },
  { word:"Hardship", phonetic:"hard·ship", ipa:"/ˈhɑːdʃɪp/", meaning:"severe suffering or privation; difficult conditions", sentence:"They endured great hardship during the long cold winter.", diff:"easy", cats:["everyday","everyday"], synonyms:["difficulty","suffering","adversity","struggle"], antonyms:["comfort","ease","luxury","privilege"] },
  { word:"Harmony", phonetic:"har·moh·nee", ipa:"/ˈhɑːməni/", meaning:"agreement or concord; a pleasing combination", sentence:"The two departments worked in harmony to achieve a shared goal.", diff:"easy", cats:["social","everyday"], synonyms:["agreement","accord","unity","concord"], antonyms:["discord","conflict","disagreement","hostility"] },
  { word:"Heritage", phonetic:"her·ih·tij", ipa:"/ˈherɪtɪdʒ/", meaning:"valued things inherited from past generations", sentence:"The city has a rich architectural heritage that draws many tourists.", diff:"easy", cats:["social","everyday"], synonyms:["tradition","legacy","culture","history"], antonyms:["modern creation","innovation","new development","invention"] },
  { word:"Honest", phonetic:"on·ist", ipa:"/ˈɒnɪst/", meaning:"free of deceit; truthful and sincere", sentence:"She gave an honest assessment even though it was hard to hear.", diff:"easy", cats:["character","everyday"], synonyms:["truthful","sincere","frank","genuine"], antonyms:["dishonest","deceptive","lying","insincere"] },
  { word:"Honour", phonetic:"on·er", ipa:"/ˈɒnə/", meaning:"fulfil an obligation; show high regard and respect for", sentence:"She was determined to honour her commitment to the community.", diff:"easy", cats:["character","everyday"], synonyms:["respect","fulfil","uphold","observe"], antonyms:["dishonour","break","violate","disrespect"] },
  { word:"Imaginative", phonetic:"ih·maj·ih·nah·tiv", ipa:"/ɪˈmædʒɪnətɪv/", meaning:"having or showing creativity or inventiveness", sentence:"The imaginative design won first prize at the competition.", diff:"easy", cats:["character","everyday"], synonyms:["creative","inventive","original","inspired"], antonyms:["unimaginative","conventional","predictable","mundane"] },
  { word:"Imply", phonetic:"im·ply", ipa:"/ɪmˈplaɪ/", meaning:"suggest indirectly without saying explicitly", sentence:"Her silence seemed to imply that she disagreed with the plan.", diff:"easy", cats:["communication","everyday"], synonyms:["suggest","hint","indicate","insinuate"], antonyms:["state directly","say explicitly","declare","announce"] },
  { word:"Incline", phonetic:"in·klyn", ipa:"/ɪnˈklaɪn/", meaning:"feel willing or favourably disposed toward something", sentence:"She was inclined to agree with the proposal after hearing the evidence.", diff:"easy", cats:["character","everyday"], synonyms:["tend","lean","be disposed","feel drawn"], antonyms:["oppose","resist","be against","disagree"] },
  { word:"Increase", phonetic:"in·krees", ipa:"/ɪnˈkriːs/", meaning:"become or make greater in size, amount, or degree", sentence:"The company managed to increase its revenue by thirty percent.", diff:"easy", cats:["business","everyday"], synonyms:["grow","expand","raise","boost"], antonyms:["decrease","reduce","lower","diminish"] },
  { word:"Independent", phonetic:"in·deh·pen·dunt", ipa:"/ˌɪndɪˈpendənt/", meaning:"free from outside control; not relying on others", sentence:"She was fiercely independent and preferred to solve problems alone.", diff:"easy", cats:["character","everyday"], synonyms:["self-reliant","autonomous","free","self-sufficient"], antonyms:["dependent","reliant","subordinate","controlled"] },
  { word:"Influence", phonetic:"in·floo·ens", ipa:"/ˈɪnfluəns/", meaning:"the capacity to have an effect on something", sentence:"Her parents had a strong influence on her choice of career.", diff:"easy", cats:["social","everyday"], synonyms:["impact","effect","power","authority"], antonyms:["weakness","impotence","ineffectiveness","irrelevance"] },
  { word:"Inform", phonetic:"in·form", ipa:"/ɪnˈfɔːm/", meaning:"give facts or information to someone", sentence:"She informed the team of the changes at the morning meeting.", diff:"easy", cats:["communication","everyday"], synonyms:["tell","notify","advise","educate"], antonyms:["mislead","deceive","hide","withhold"] },
  { word:"Initiative", phonetic:"ih·nish·ee·ah·tiv", ipa:"/ɪˈnɪʃɪətɪv/", meaning:"the ability to assess and act without being told to", sentence:"She showed great initiative by solving the problem before it worsened.", diff:"easy", cats:["character","everyday"], synonyms:["enterprise","drive","resourcefulness","ambition"], antonyms:["passivity","laziness","indolence","inaction"] },
  { word:"Innovative", phonetic:"in·oh·vah·tiv", ipa:"/ˈɪnəveɪtɪv/", meaning:"featuring new methods; advanced and original", sentence:"The company became successful through its innovative approach.", diff:"easy", cats:["business","everyday"], synonyms:["creative","original","pioneering","groundbreaking"], antonyms:["conventional","traditional","outdated","unoriginal"] },
  { word:"Integrity", phonetic:"in·teg·rih·tee", ipa:"/ɪnˈteɡrɪti/", meaning:"the quality of being honest and having strong moral principles", sentence:"She was widely respected for her unshakeable integrity.", diff:"easy", cats:["character","everyday"], synonyms:["honesty","honour","virtue","principle"], antonyms:["dishonesty","corruption","deception","hypocrisy"] },
  { word:"Interact", phonetic:"in·ter·akt", ipa:"/ˌɪntərˈækt/", meaning:"communicate or act together with other people", sentence:"Children need to interact with others to develop social skills.", diff:"easy", cats:["social","everyday"], synonyms:["communicate","engage","cooperate","connect"], antonyms:["isolate","withdraw","avoid","disconnect"] },
  { word:"Interpret", phonetic:"in·tur·prit", ipa:"/ɪnˈtɜːprɪt/", meaning:"explain or understand the meaning of something", sentence:"It was difficult to interpret exactly what she meant by that remark.", diff:"easy", cats:["academic","everyday"], synonyms:["explain","understand","construe","read"], antonyms:["misinterpret","misunderstand","confuse","misread"] },
  { word:"Investigate", phonetic:"in·ves·tih·gayt", ipa:"/ɪnˈvestɪɡeɪt/", meaning:"carry out a systematic inquiry into something", sentence:"Police were asked to investigate the suspicious circumstances.", diff:"easy", cats:["academic","everyday"], synonyms:["examine","enquire","study","probe"], antonyms:["ignore","overlook","disregard","neglect"] },
  { word:"Involve", phonetic:"in·volv", ipa:"/ɪnˈvɒlv/", meaning:"include or affect someone or something; require something", sentence:"The plan involved contributions from every member of the team.", diff:"easy", cats:["everyday","everyday"], synonyms:["include","require","concern","engage"], antonyms:["exclude","omit","remove","leave out"] },
  { word:"Justice", phonetic:"jus·tis", ipa:"/ˈdʒʌstɪs/", meaning:"just behaviour or treatment; fairness and rightness", sentence:"She campaigned all her life for justice and equality.", diff:"easy", cats:["social","everyday"], synonyms:["fairness","equity","righteousness","impartiality"], antonyms:["injustice","unfairness","bias","partiality"] },
  { word:"Leadership", phonetic:"lee·der·ship", ipa:"/ˈliːdəʃɪp/", meaning:"the action of leading a group of people", sentence:"Her leadership inspired the entire team to perform at their best.", diff:"easy", cats:["business","everyday"], synonyms:["guidance","direction","management","command"], antonyms:["followership","subordination","passivity","weakness"] },
  { word:"Legacy", phonetic:"leg·ah·see", ipa:"/ˈleɡəsi/", meaning:"something handed down from a predecessor", sentence:"Her greatest legacy was the school she helped to build.", diff:"easy", cats:["social","everyday"], synonyms:["inheritance","heritage","bequest","contribution"], antonyms:["fresh start","new beginning","innovation","future"] },
  { word:"Lenient", phonetic:"lee·nee·unt", ipa:"/ˈliːniənt/", meaning:"more merciful or tolerant than expected", sentence:"The teacher was lenient with students who had genuine reasons.", diff:"easy", cats:["character","everyday"], synonyms:["tolerant","mild","merciful","gentle"], antonyms:["strict","harsh","severe","rigid"] },
  { word:"Motivate", phonetic:"moh·tih·vayt", ipa:"/ˈməʊtɪveɪt/", meaning:"provide someone with a reason for doing something", sentence:"A good coach knows how to motivate players to give their best.", diff:"easy", cats:["character","everyday"], synonyms:["inspire","encourage","drive","stimulate"], antonyms:["demotivate","discourage","deter","dishearten"] },
  { word:"Navigate", phonetic:"nav·ih·gayt", ipa:"/ˈnævɪɡeɪt/", meaning:"plan and direct a course through a difficult situation", sentence:"She had to navigate some very tricky interpersonal dynamics.", diff:"easy", cats:["everyday","everyday"], synonyms:["steer","guide","direct","manage"], antonyms:["drift","wander","lose way","blunder"] },
  { word:"Observe", phonetic:"ob·zurv", ipa:"/əbˈzɜːv/", meaning:"notice or perceive and pay attention to something", sentence:"He observed that the children were unusually quiet that day.", diff:"easy", cats:["academic","everyday"], synonyms:["notice","watch","perceive","witness"], antonyms:["ignore","overlook","miss","disregard"] },
  { word:"Optimistic", phonetic:"op·tih·mis·tik", ipa:"/ˌɒptɪˈmɪstɪk/", meaning:"hopeful and confident about the future", sentence:"She remained optimistic even in the face of great difficulty.", diff:"easy", cats:["character","everyday"], synonyms:["hopeful","positive","cheerful","confident"], antonyms:["pessimistic","gloomy","despairing","hopeless"] },
  { word:"Passionate", phonetic:"pash·un·it", ipa:"/ˈpæʃənɪt/", meaning:"having or showing strong feelings or beliefs", sentence:"She was passionate about protecting the natural environment.", diff:"easy", cats:["character","everyday"], synonyms:["enthusiastic","fervent","intense","zealous"], antonyms:["indifferent","apathetic","half-hearted","detached"] },
  { word:"Perspective", phonetic:"pur·spek·tiv", ipa:"/pəˈspektɪv/", meaning:"a particular way of considering something", sentence:"Travelling abroad gave her a completely new perspective on life.", diff:"easy", cats:["academic","everyday"], synonyms:["viewpoint","outlook","standpoint","angle"], antonyms:["narrow view","bias","tunnel vision","blindness"] },
  { word:"Potential", phonetic:"poh·ten·shul", ipa:"/pəˈtenʃəl/", meaning:"having or showing the capacity to develop in the future", sentence:"She had enormous potential that her teachers were keen to develop.", diff:"easy", cats:["academic","everyday"], synonyms:["promise","capability","ability","talent"], antonyms:["limitation","incapacity","inability","weakness"] },
  { word:"Practical", phonetic:"prak·tih·kul", ipa:"/ˈpræktɪkəl/", meaning:"concerned with actual use rather than theory; sensible", sentence:"She offered practical advice that could be implemented immediately.", diff:"easy", cats:["everyday","everyday"], synonyms:["realistic","functional","sensible","useful"], antonyms:["impractical","theoretical","idealistic","useless"] },
  { word:"Precise", phonetic:"preh·sys", ipa:"/prɪˈsaɪs/", meaning:"marked by exactness and accuracy of expression", sentence:"He gave a precise description of the events that had taken place.", diff:"easy", cats:["academic","everyday"], synonyms:["exact","accurate","specific","correct"], antonyms:["vague","imprecise","approximate","inaccurate"] },
  { word:"Proactive", phonetic:"proh·ak·tiv", ipa:"/ˌprəʊˈæktɪv/", meaning:"creating or controlling a situation rather than responding", sentence:"A proactive approach to problems saves a great deal of time.", diff:"easy", cats:["business","everyday"], synonyms:["forward-thinking","anticipatory","preventive","enterprising"], antonyms:["reactive","passive","responsive","inactive"] },
  { word:"Productive", phonetic:"pro·duk·tiv", ipa:"/prəˈdʌktɪv/", meaning:"achieving a significant amount; beneficial", sentence:"The meeting was highly productive and resulted in clear decisions.", diff:"easy", cats:["business","everyday"], synonyms:["effective","fruitful","efficient","valuable"], antonyms:["unproductive","ineffective","wasteful","fruitless"] },
  { word:"Progress", phonetic:"proh·gres", ipa:"/ˈprəʊɡres/", meaning:"forward or onward movement toward a destination or goal", sentence:"She tracked her progress carefully throughout the year.", diff:"easy", cats:["everyday","everyday"], synonyms:["advancement","development","growth","improvement"], antonyms:["regression","decline","stagnation","deterioration"] },
  { word:"Promote", phonetic:"proh·moht", ipa:"/prəˈməʊt/", meaning:"support or actively encourage something", sentence:"The charity promoted awareness of mental health issues.", diff:"easy", cats:["business","everyday"], synonyms:["support","advance","advocate","encourage"], antonyms:["demote","discourage","oppose","hinder"] },
  { word:"Protect", phonetic:"proh·tekt", ipa:"/prəˈtekt/", meaning:"keep safe from harm or injury", sentence:"Parents have a duty to protect their children from danger.", diff:"easy", cats:["everyday","everyday"], synonyms:["safeguard","shield","defend","preserve"], antonyms:["endanger","expose","harm","abandon"] },
  { word:"Purposeful", phonetic:"pur·pus·ful", ipa:"/ˈpɜːpəsfʊl/", meaning:"having or showing determination or resolve", sentence:"She moved through the crowd in a purposeful and determined way.", diff:"easy", cats:["character","everyday"], synonyms:["determined","intentional","decisive","resolute"], antonyms:["aimless","purposeless","directionless","uncertain"] },
  { word:"Recognise", phonetic:"rek·og·nyz", ipa:"/ˈrekəɡnaɪz/", meaning:"identify from having encountered before; acknowledge", sentence:"She recognised the problem immediately and took steps to fix it.", diff:"easy", cats:["everyday","everyday"], synonyms:["identify","acknowledge","notice","realise"], antonyms:["ignore","overlook","deny","fail to notice"] },
  { word:"Reflect", phonetic:"reh·flekt", ipa:"/rɪˈflekt/", meaning:"think deeply and carefully about something", sentence:"After the meeting, he took time to reflect on what had been said.", diff:"easy", cats:["character","everyday"], synonyms:["think","contemplate","ponder","consider"], antonyms:["react impulsively","ignore","disregard","act hastily"] },
  { word:"Remarkable", phonetic:"reh·mar·kah·bul", ipa:"/rɪˈmɑːkəbəl/", meaning:"worthy of attention; extraordinary", sentence:"Her progress in just one year was truly remarkable.", diff:"easy", cats:["everyday","everyday"], synonyms:["extraordinary","outstanding","impressive","notable"], antonyms:["ordinary","unremarkable","typical","common"] },
  { word:"Resilience", phonetic:"reh·zil·ee·ens", ipa:"/rɪˈzɪliəns/", meaning:"the capacity to recover quickly from difficulties", sentence:"Building resilience in children helps them cope with adversity.", diff:"easy", cats:["character","everyday"], synonyms:["toughness","adaptability","strength","flexibility"], antonyms:["fragility","vulnerability","weakness","delicacy"] },
  { word:"Respect", phonetic:"reh·spekt", ipa:"/rɪˈspekt/", meaning:"a feeling of deep admiration for someone", sentence:"She earned the respect of all her colleagues through hard work.", diff:"easy", cats:["social","everyday"], synonyms:["admiration","esteem","regard","deference"], antonyms:["disrespect","contempt","scorn","disdain"] },
  { word:"Responsible", phonetic:"reh·spon·sih·bul", ipa:"/rɪˈspɒnsɪbəl/", meaning:"having an obligation to do something; trustworthy", sentence:"Each team member was responsible for their own section of the report.", diff:"easy", cats:["character","everyday"], synonyms:["accountable","reliable","dependable","trustworthy"], antonyms:["irresponsible","unreliable","reckless","unaccountable"] },
  { word:"Sacrifice", phonetic:"sak·rih·fys", ipa:"/ˈsækrɪfaɪs/", meaning:"give up something valued for the sake of something else", sentence:"She made great sacrifices to ensure her children\'s education.", diff:"easy", cats:["character","everyday"], synonyms:["give up","surrender","forfeit","relinquish"], antonyms:["gain","receive","profit","benefit"] },
  { word:"Sensitive", phonetic:"sen·sih·tiv", ipa:"/ˈsensɪtɪv/", meaning:"quick to detect or respond to slight changes", sentence:"She was sensitive to the needs of those around her.", diff:"easy", cats:["character","everyday"], synonyms:["perceptive","empathetic","aware","thoughtful"], antonyms:["insensitive","oblivious","unaware","indifferent"] },
  { word:"Significance", phonetic:"sig·nif·ih·kuns", ipa:"/sɪɡˈnɪfɪkəns/", meaning:"the quality of being important or meaningful", sentence:"She failed to understand the full significance of the discovery.", diff:"easy", cats:["academic","everyday"], synonyms:["importance","meaning","weight","relevance"], antonyms:["insignificance","triviality","irrelevance","unimportance"] },
  { word:"Steadfast", phonetic:"sted·fast", ipa:"/ˈstedfɑːst/", meaning:"resolutely firm and unwavering", sentence:"He remained steadfast in his belief that justice would prevail.", diff:"easy", cats:["character","everyday"], synonyms:["resolute","firm","committed","dedicated"], antonyms:["wavering","irresolute","fickle","uncommitted"] },
  { word:"Stimulate", phonetic:"stim·yoo·layt", ipa:"/ˈstɪmjʊleɪt/", meaning:"encourage interest or activity in something", sentence:"Coffee was used to stimulate alertness during the long night shift.", diff:"easy", cats:["everyday","everyday"], synonyms:["encourage","inspire","activate","arouse"], antonyms:["discourage","suppress","dull","inhibit"] },
  { word:"Strive", phonetic:"stryv", ipa:"/straɪv/", meaning:"make great efforts to achieve something", sentence:"She strove to become the best version of herself every single day.", diff:"easy", cats:["character","everyday"], synonyms:["aim","try","endeavour","attempt"], antonyms:["give up","surrender","accept","be passive"] },
  { word:"Succeed", phonetic:"suk·seed", ipa:"/səkˈsiːd/", meaning:"achieve the desired aim or result", sentence:"She worked tirelessly and eventually succeeded in her goal.", diff:"easy", cats:["everyday","everyday"], synonyms:["achieve","accomplish","triumph","prosper"], antonyms:["fail","lose","fall short","give up"] },
  { word:"Sufficient", phonetic:"suf·fish·unt", ipa:"/səˈfɪʃənt/", meaning:"enough; adequate for the purpose", sentence:"There was sufficient evidence to support the conclusion.", diff:"easy", cats:["everyday","everyday"], synonyms:["enough","adequate","ample","satisfactory"], antonyms:["insufficient","inadequate","lacking","scarce"] },
  { word:"Suitable", phonetic:"soo·tah·bul", ipa:"/ˈsuːtəbəl/", meaning:"right or appropriate for a particular person or purpose", sentence:"She chose a suitable gift that she knew he would enjoy.", diff:"easy", cats:["everyday","everyday"], synonyms:["appropriate","fitting","proper","right"], antonyms:["unsuitable","inappropriate","wrong","improper"] },
  { word:"Systematic", phonetic:"sis·teh·mat·ik", ipa:"/ˌsɪstəˈmætɪk/", meaning:"done or acting according to a fixed plan; methodical", sentence:"She took a systematic approach to organising her work.", diff:"easy", cats:["academic","everyday"], synonyms:["methodical","organised","structured","logical"], antonyms:["random","chaotic","disorganised","unsystematic"] },
  { word:"Thorough", phonetic:"thur·oh", ipa:"/ˈθʌrə/", meaning:"complete with regard to every detail; not superficial", sentence:"The investigation was thorough and left no stone unturned.", diff:"easy", cats:["character","everyday"], synonyms:["complete","meticulous","exhaustive","detailed"], antonyms:["superficial","incomplete","careless","hasty"] },
  { word:"Transparent", phonetic:"trans·pair·unt", ipa:"/trænsˈpærənt/", meaning:"open and honest; easy to understand", sentence:"She appreciated his transparent and direct communication style.", diff:"easy", cats:["character","everyday"], synonyms:["open","honest","clear","direct"], antonyms:["opaque","secretive","deceptive","hidden"] },
  { word:"Triumph", phonetic:"try·umf", ipa:"/ˈtraɪʌmf/", meaning:"achieve a great victory or success", sentence:"After years of struggle, she finally achieved a great triumph.", diff:"easy", cats:["character","everyday"], synonyms:["victory","success","achievement","win"], antonyms:["defeat","failure","loss","setback"] },
  { word:"Unify", phonetic:"yoo·nih·fy", ipa:"/ˈjuːnɪfaɪ/", meaning:"make or become united, uniform, or whole", sentence:"The shared goal helped to unify the previously divided team.", diff:"easy", cats:["social","everyday"], synonyms:["unite","join","combine","integrate"], antonyms:["divide","separate","split","fragment"] },
  { word:"Urgent", phonetic:"ur·junt", ipa:"/ˈɜːdʒənt/", meaning:"requiring immediate action or attention; pressing", sentence:"The urgent message required a response within the hour.", diff:"easy", cats:["everyday","everyday"], synonyms:["pressing","critical","immediate","essential"], antonyms:["unimportant","trivial","low-priority","minor"] },
  { word:"Visible", phonetic:"viz·ih·bul", ipa:"/ˈvɪzɪbəl/", meaning:"able to be seen; in view", sentence:"The damage was clearly visible from the other side of the street.", diff:"easy", cats:["everyday","everyday"], synonyms:["observable","apparent","clear","noticeable"], antonyms:["invisible","hidden","concealed","unseen"] },
  { word:"Welcoming", phonetic:"wel·kum·ing", ipa:"/ˈwelkəmɪŋ/", meaning:"behaving in a friendly way toward visitors or newcomers", sentence:"The community was warm and welcoming to new arrivals.", diff:"easy", cats:["social","everyday"], synonyms:["friendly","hospitable","warm","open"], antonyms:["unwelcoming","hostile","cold","unfriendly"] },
  { word:"Diligence", phonetic:"dil·ih·jens", ipa:"/ˈdɪlɪdʒəns/", meaning:"steady earnest effort; persistent application to a task", sentence:"Her diligence and persistence earned her the highest grade.", diff:"easy", cats:["character","everyday"], synonyms:["hard work","effort","perseverance","dedication"], antonyms:["laziness","negligence","carelessness","indolence"] },
{ word:"Aberrant", phonetic:"ab·er·unt", ipa:"/ˈæbərənt/", meaning:"departing from an accepted standard; abnormal", sentence:"The scientist noted aberrant results that didn\'t fit the pattern.", diff:"medium", cats:["scientific","academic"], synonyms:["abnormal","deviant","atypical","irregular"], antonyms:["normal","typical","standard","expected"] },
  { word:"Abrogate", phonetic:"ab·roh·gayt", ipa:"/ˈæbrəɡeɪt/", meaning:"repeal or do away with a law, right, or formal agreement", sentence:"The new government sought to abrogate the treaty.", diff:"medium", cats:["academic","academic"], synonyms:["repeal","revoke","abolish","annul"], antonyms:["uphold","enforce","maintain","preserve"] },
  { word:"Abstain", phonetic:"ab·stayn", ipa:"/əbˈsteɪn/", meaning:"restrain oneself from doing or enjoying something", sentence:"Three members chose to abstain rather than vote against the motion.", diff:"medium", cats:["character","academic"], synonyms:["refrain","hold back","desist","forgo"], antonyms:["indulge","participate","partake","engage"] },
  { word:"Accentuate", phonetic:"ak·sen·choo·ayt", ipa:"/əkˈsentʃueɪt/", meaning:"make more noticeable or prominent; emphasise", sentence:"The lighting was designed to accentuate the best features of the room.", diff:"medium", cats:["communication","academic"], synonyms:["emphasise","highlight","stress","underscore"], antonyms:["downplay","minimise","mask","obscure"] },
  { word:"Accommodate", phonetic:"ah·kom·oh·dayt", ipa:"/əˈkɒmədeɪt/", meaning:"fit in with the wishes or needs of someone", sentence:"The hotel worked hard to accommodate every request from guests.", diff:"medium", cats:["social","academic"], synonyms:["adapt","adjust","oblige","assist"], antonyms:["refuse","ignore","inconvenience","disregard"] },
  { word:"Accumulate", phonetic:"ah·kyoo·myoo·layt", ipa:"/əˈkjuːmjʊleɪt/", meaning:"gather together or acquire an increasing number of things", sentence:"She accumulated a vast collection of rare books over many decades.", diff:"medium", cats:["everyday","academic"], synonyms:["gather","collect","amass","build up"], antonyms:["disperse","distribute","scatter","spend"] },
  { word:"Adamant", phonetic:"ad·ah·munt", ipa:"/ˈædəmənt/", meaning:"refusing to be persuaded or to change one's mind", sentence:"She was adamant that the decision was the right one.", diff:"medium", cats:["character","academic"], synonyms:["firm","resolute","unyielding","determined"], antonyms:["flexible","yielding","open-minded","accommodating"] },
  { word:"Adherent", phonetic:"ad·heer·unt", ipa:"/ədˈhɪərənt/", meaning:"someone who supports a particular party, person, or idea", sentence:"He was a lifelong adherent of the philosophical school.", diff:"medium", cats:["academic","academic"], synonyms:["follower","supporter","devotee","advocate"], antonyms:["opponent","critic","detractor","adversary"] },
  { word:"Admonish", phonetic:"ad·mon·ish", ipa:"/ədˈmɒnɪʃ/", meaning:"warn or reprimand someone firmly but gently", sentence:"The teacher admonished the students for their careless mistakes.", diff:"medium", cats:["communication","academic"], synonyms:["reprimand","warn","caution","rebuke"], antonyms:["praise","commend","encourage","approve"] },
  { word:"Adversarial", phonetic:"ad·ver·sair·ee·ul", ipa:"/ˌædvəˈseəriəl/", meaning:"relating to or characterised by conflict or opposition", sentence:"The adversarial tone of the debate prevented any real progress.", diff:"medium", cats:["academic","academic"], synonyms:["hostile","confrontational","antagonistic","combative"], antonyms:["cooperative","collaborative","friendly","supportive"] },
  { word:"Afflict", phonetic:"ah·flikt", ipa:"/əˈflɪkt/", meaning:"cause pain or suffering to; trouble greatly", sentence:"The disease afflicted thousands of people in the region.", diff:"medium", cats:["everyday","academic"], synonyms:["trouble","torment","burden","distress"], antonyms:["relieve","comfort","ease","help"] },
  { word:"Aggregate", phonetic:"ag·reh·git", ipa:"/ˈæɡrɪɡɪt/", meaning:"a whole formed by combining several separate elements", sentence:"The aggregate score determined which team advanced to the final.", diff:"medium", cats:["academic","academic"], synonyms:["total","combined","collective","cumulative"], antonyms:["individual","separate","single","partial"] },
  { word:"Agitate", phonetic:"aj·ih·tayt", ipa:"/ˈædʒɪteɪt/", meaning:"make someone troubled or nervous; campaign vigorously", sentence:"The protesters agitated for changes to the unjust law.", diff:"medium", cats:["social","academic"], synonyms:["disturb","unsettle","campaign","advocate"], antonyms:["calm","soothe","placate","settle"] },
  { word:"Allocate", phonetic:"al·oh·kayt", ipa:"/ˈæləkeɪt/", meaning:"distribute resources or duties for a specific purpose", sentence:"The government allocated additional funds to the health service.", diff:"medium", cats:["business","academic"], synonyms:["assign","distribute","apportion","designate"], antonyms:["withhold","gather","centralise","hoard"] },
  { word:"Ambiguous", phonetic:"am·big·yoo·us", ipa:"/æmˈbɪɡjuəs/", meaning:"having more than one possible interpretation", sentence:"Her ambiguous answer left everyone wondering what she really meant.", diff:"medium", cats:["communication","academic"], synonyms:["vague","unclear","equivocal","uncertain"], antonyms:["clear","definite","unambiguous","explicit"] },
  { word:"Anachronistic", phonetic:"ah·nak·roh·nis·tik", ipa:"/əˌnækrəˈnɪstɪk/", meaning:"belonging to a period other than that being portrayed", sentence:"The film\'s costumes were anachronistic and historically inaccurate.", diff:"medium", cats:["academic","academic"], synonyms:["outdated","out-of-place","archaic","old-fashioned"], antonyms:["contemporary","modern","current","accurate"] },
  { word:"Antagonise", phonetic:"an·tag·oh·nyz", ipa:"/ænˈtæɡənaɪz/", meaning:"cause someone to become hostile toward you", sentence:"His dismissive attitude served only to antagonise his colleagues.", diff:"medium", cats:["social","academic"], synonyms:["provoke","irritate","alienate","offend"], antonyms:["appease","placate","win over","conciliate"] },
  { word:"Antithesis", phonetic:"an·tith·eh·sis", ipa:"/ænˈtɪθɪsɪs/", meaning:"a person or thing that is the direct opposite of another", sentence:"Her calm demeanour was the antithesis of her brother\'s volatility.", diff:"medium", cats:["literary","academic"], synonyms:["opposite","contrast","reverse","contradiction"], antonyms:["similarity","likeness","parallel","counterpart"] },
  { word:"Arbitrary", phonetic:"ar·bih·trer·ee", ipa:"/ˈɑːbɪtrəri/", meaning:"based on random choice or personal whim, not reason", sentence:"The decision seemed entirely arbitrary and without justification.", diff:"medium", cats:["academic","academic"], synonyms:["random","subjective","capricious","inconsistent"], antonyms:["reasoned","logical","principled","consistent"] },
  { word:"Archaic", phonetic:"ar·kay·ik", ipa:"/ɑːˈkeɪɪk/", meaning:"very old or old-fashioned; no longer in common use", sentence:"The law was considered archaic and long overdue for reform.", diff:"medium", cats:["academic","academic"], synonyms:["outdated","antiquated","old","obsolete"], antonyms:["modern","current","contemporary","up-to-date"] },
  { word:"Assert", phonetic:"ah·surt", ipa:"/əˈsɜːt/", meaning:"cause others to recognise one's authority or rights", sentence:"She had to learn to assert herself in a competitive environment.", diff:"medium", cats:["communication","academic"], synonyms:["declare","maintain","insist","proclaim"], antonyms:["deny","retract","withdraw","concede"] },
  { word:"Atrophy", phonetic:"at·roh·fee", ipa:"/ˈætrəfi/", meaning:"waste away or decrease through underuse", sentence:"Without regular practice, musical skills can quickly atrophy.", diff:"medium", cats:["scientific","academic"], synonyms:["waste","wither","weaken","deteriorate"], antonyms:["strengthen","grow","develop","flourish"] },
  { word:"Attribute", phonetic:"at·rib·yoot", ipa:"/ˈætrɪbjuːt/", meaning:"regard something as caused by someone or something", sentence:"She attributed her success to the support of her early teachers.", diff:"medium", cats:["academic","academic"], synonyms:["ascribe","credit","assign","put down to"], antonyms:["deny","dissociate","detach","separate"] },
  { word:"Authoritative", phonetic:"aw·thor·ih·tay·tiv", ipa:"/ɔːˈθɒrɪtətɪv/", meaning:"reliable because based on competence or authority", sentence:"The report was the most authoritative study of the problem.", diff:"medium", cats:["academic","academic"], synonyms:["reliable","official","definitive","commanding"], antonyms:["unreliable","unofficial","dubious","unauthoritative"] },
  { word:"Autonomy", phonetic:"aw·ton·oh·mee", ipa:"/ɔːˈtɒnəmi/", meaning:"the right or condition of self-government; independence", sentence:"She valued her professional autonomy and disliked micromanagement.", diff:"medium", cats:["academic","academic"], synonyms:["independence","self-governance","freedom","self-determination"], antonyms:["dependence","subordination","control","subservience"] },
  { word:"Biased", phonetic:"by·ust", ipa:"/ˈbaɪəst/", meaning:"unfairly prejudiced in favour of or against someone", sentence:"The report was criticised for being biased in favour of one side.", diff:"medium", cats:["character","academic"], synonyms:["prejudiced","partial","one-sided","slanted"], antonyms:["unbiased","impartial","fair","objective"] },
  { word:"Bureaucracy", phonetic:"byoo·rok·rah·see", ipa:"/bjʊˈrɒkrəsi/", meaning:"a system of government with complex procedures", sentence:"The bureaucracy made it incredibly difficult to get anything done.", diff:"medium", cats:["business","academic"], synonyms:["administration","red tape","system","procedures"], antonyms:["efficiency","simplicity","directness","streamlining"] },
  { word:"Candour", phonetic:"kan·der", ipa:"/ˈkændə/", meaning:"the quality of being open and honest in expression", sentence:"She spoke with great candour about the challenges she faced.", diff:"medium", cats:["character","academic"], synonyms:["honesty","openness","frankness","sincerity"], antonyms:["deception","evasiveness","dishonesty","guile"] },
  { word:"Catalyst", phonetic:"kat·ah·list", ipa:"/ˈkætəlɪst/", meaning:"a person or thing that precipitates an event or change", sentence:"The new director acted as a catalyst for much-needed change.", diff:"medium", cats:["academic","academic"], synonyms:["trigger","spark","stimulus","impetus"], antonyms:["hindrance","obstacle","impediment","deterrent"] },
  { word:"Censure", phonetic:"sen·sher", ipa:"/ˈsenʃə/", meaning:"express severe disapproval of; formal criticism", sentence:"The committee voted to censure the member for misconduct.", diff:"medium", cats:["academic","academic"], synonyms:["condemn","criticise","rebuke","reprimand"], antonyms:["praise","commend","approve","endorse"] },
  { word:"Chronic", phonetic:"kron·ik", ipa:"/ˈkrɒnɪk/", meaning:"persisting for a long time; constantly recurring", sentence:"The country had suffered from chronic economic instability.", diff:"medium", cats:["academic","academic"], synonyms:["persistent","long-standing","ongoing","habitual"], antonyms:["temporary","acute","brief","occasional"] },
  { word:"Clandestine", phonetic:"klan·des·tin", ipa:"/klænˈdestɪn/", meaning:"kept secret or done secretively", sentence:"The clandestine meeting took place late at night in a basement.", diff:"medium", cats:["literary","academic"], synonyms:["secret","covert","hidden","undercover"], antonyms:["open","public","transparent","official"] },
  { word:"Coerce", phonetic:"koh·urs", ipa:"/kəʊˈɜːs/", meaning:"persuade someone to do something by force or threats", sentence:"He claimed he had been coerced into signing the document.", diff:"medium", cats:["social","academic"], synonyms:["force","compel","intimidate","pressurise"], antonyms:["persuade","convince","ask","encourage"] },
  { word:"Cognitive", phonetic:"kog·nih·tiv", ipa:"/ˈkɒɡnɪtɪv/", meaning:"relating to mental processes of knowing and understanding", sentence:"Regular exercise has been shown to improve cognitive function.", diff:"medium", cats:["scientific","academic"], synonyms:["mental","intellectual","psychological","cerebral"], antonyms:["physical","emotional","bodily","sensory"] },
  { word:"Collaborate", phonetic:"koh·lab·oh·rayt", ipa:"/kəˈlæbəreɪt/", meaning:"work jointly on a project or activity", sentence:"The two researchers decided to collaborate on the groundbreaking study.", diff:"medium", cats:["business","academic"], synonyms:["cooperate","work together","partner","team up"], antonyms:["compete","work alone","oppose","resist"] },
  { word:"Communal", phonetic:"kom·yoo·nul", ipa:"/kəˈmjuːnəl/", meaning:"shared by or for the use of all members of a community", sentence:"The decision was made in a communal meeting open to all residents.", diff:"medium", cats:["social","academic"], synonyms:["shared","collective","joint","public"], antonyms:["private","individual","personal","exclusive"] },
  { word:"Competent", phonetic:"kom·pih·tunt", ipa:"/ˈkɒmpɪtənt/", meaning:"having the necessary ability or skills to do something", sentence:"She was highly competent and handled every task with confidence.", diff:"medium", cats:["character","academic"], synonyms:["capable","skilled","qualified","proficient"], antonyms:["incompetent","unskilled","unqualified","unable"] },
  { word:"Comply", phonetic:"kom·ply", ipa:"/kəmˈplaɪ/", meaning:"act in accordance with a rule, request, or command", sentence:"All participants were asked to comply with the safety guidelines.", diff:"medium", cats:["business","academic"], synonyms:["obey","conform","follow","adhere"], antonyms:["refuse","defy","resist","disobey"] },
  { word:"Concede", phonetic:"kon·seed", ipa:"/kənˈsiːd/", meaning:"admit that something is true after initial resistance", sentence:"She finally conceded that the plan had several flaws.", diff:"medium", cats:["communication","academic"], synonyms:["admit","acknowledge","grant","yield"], antonyms:["deny","dispute","contest","resist"] },
  { word:"Confidential", phonetic:"kon·fih·den·shul", ipa:"/ˌkɒnfɪˈdenʃəl/", meaning:"intended to be kept secret; private and sensitive", sentence:"The report was marked confidential and not for public release.", diff:"medium", cats:["business","academic"], synonyms:["secret","private","classified","restricted"], antonyms:["public","open","accessible","transparent"] },
  { word:"Conscientious", phonetic:"kon·shee·en·shus", ipa:"/ˌkɒnʃiˈenʃəs/", meaning:"wishing to do what is right; diligent and thorough", sentence:"She was conscientious and always checked her work carefully.", diff:"medium", cats:["character","academic"], synonyms:["diligent","careful","thorough","dedicated"], antonyms:["negligent","careless","lazy","indifferent"] },
  { word:"Consensus", phonetic:"kon·sen·sus", ipa:"/kənˈsensəs/", meaning:"a general agreement among a group of people", sentence:"The committee eventually reached a consensus on the matter.", diff:"medium", cats:["social","academic"], synonyms:["agreement","unity","accord","unanimity"], antonyms:["disagreement","conflict","division","discord"] },
  { word:"Contention", phonetic:"kon·ten·shun", ipa:"/kənˈtenʃən/", meaning:"heated disagreement; an assertion in an argument", sentence:"There was considerable contention over how to interpret the results.", diff:"medium", cats:["academic","academic"], synonyms:["dispute","disagreement","claim","argument"], antonyms:["agreement","harmony","accord","consensus"] },
  { word:"Conviction", phonetic:"kon·vik·shun", ipa:"/kənˈvɪkʃən/", meaning:"a firmly held belief; a formal declaration of guilt", sentence:"She spoke with absolute conviction about the importance of education.", diff:"medium", cats:["character","academic"], synonyms:["belief","certainty","confidence","assurance"], antonyms:["doubt","uncertainty","scepticism","hesitation"] },
  { word:"Credible", phonetic:"kred·ih·bul", ipa:"/ˈkredɪbəl/", meaning:"able to be believed; convincing and trustworthy", sentence:"The witness gave a highly credible account of the events.", diff:"medium", cats:["academic","academic"], synonyms:["believable","convincing","trustworthy","reliable"], antonyms:["implausible","unconvincing","dubious","unreliable"] },
  { word:"Cynicism", phonetic:"sin·ih·siz·um", ipa:"/ˈsɪnɪsɪzəm/", meaning:"an inclination to believe that people are motivated by self-interest", sentence:"His cynicism about politics made him reluctant to vote.", diff:"medium", cats:["character","academic"], synonyms:["scepticism","distrust","pessimism","disillusionment"], antonyms:["idealism","optimism","trust","hopefulness"] },
  { word:"Debunk", phonetic:"deh·bunk", ipa:"/diːˈbʌŋk/", meaning:"expose the falseness or hollowness of a myth or belief", sentence:"The study aimed to debunk several popular misconceptions about health.", diff:"medium", cats:["academic","academic"], synonyms:["disprove","expose","refute","discredit"], antonyms:["prove","confirm","validate","support"] },
  { word:"Decisive", phonetic:"deh·sy·siv", ipa:"/dɪˈsaɪsɪv/", meaning:"settling an issue conclusively; showing resolution", sentence:"Her decisive action at the critical moment saved the project.", diff:"medium", cats:["character","academic"], synonyms:["conclusive","determined","firm","resolute"], antonyms:["indecisive","hesitant","wavering","uncertain"] },
  { word:"Deference", phonetic:"def·er·ens", ipa:"/ˈdefərəns/", meaning:"polite submission and respect toward another's authority", sentence:"The junior members showed great deference to the senior partner.", diff:"medium", cats:["social","academic"], synonyms:["respect","submission","compliance","regard"], antonyms:["defiance","disrespect","contempt","insubordination"] },
  { word:"Deliberate", phonetic:"deh·lib·er·it", ipa:"/dɪˈlɪbərɪt/", meaning:"engage in long and careful consideration", sentence:"The committee deliberated for several hours before reaching a verdict.", diff:"medium", cats:["character","academic"], synonyms:["consider","reflect","weigh","ponder"], antonyms:["act hastily","rush","decide impulsively","overlook"] },
  { word:"Delusion", phonetic:"deh·loo·zhun", ipa:"/dɪˈluːʒən/", meaning:"an idiosyncratic belief or impression that is not in accord with reality", sentence:"He clung to the delusion that he could still win the race.", diff:"medium", cats:["academic","academic"], synonyms:["illusion","fantasy","misconception","hallucination"], antonyms:["reality","truth","fact","clarity"] },
  { word:"Detrimental", phonetic:"det·rih·men·tul", ipa:"/ˌdetrɪˈmentəl/", meaning:"tending to cause harm; damaging", sentence:"Lack of sleep is detrimental to both mental and physical health.", diff:"medium", cats:["academic","academic"], synonyms:["harmful","damaging","injurious","adverse"], antonyms:["beneficial","helpful","advantageous","positive"] },
  { word:"Discrepancy", phonetic:"dis·krep·un·see", ipa:"/dɪˈskrepənsi/", meaning:"a lack of compatibility between facts or claims", sentence:"There was a clear discrepancy between the two sets of accounts.", diff:"medium", cats:["academic","academic"], synonyms:["inconsistency","difference","disparity","mismatch"], antonyms:["consistency","agreement","harmony","match"] },
  { word:"Disproportionate", phonetic:"dis·proh·por·shun·it", ipa:"/ˌdɪsprəˈpɔːʃənɪt/", meaning:"too large or too small in comparison to something", sentence:"The punishment seemed disproportionate to the minor offence.", diff:"medium", cats:["academic","academic"], synonyms:["excessive","unequal","imbalanced","unreasonable"], antonyms:["proportionate","balanced","fair","equal"] },
  { word:"Divisive", phonetic:"dih·vy·siv", ipa:"/dɪˈvaɪsɪv/", meaning:"tending to cause disagreement or hostility between people", sentence:"The proposal was divisive and split the community in two.", diff:"medium", cats:["social","academic"], synonyms:["controversial","polarising","contentious","splitting"], antonyms:["unifying","conciliatory","harmonious","inclusive"] },
  { word:"Dysfunctional", phonetic:"dis·funk·shun·ul", ipa:"/dɪsˈfʌŋkʃənəl/", meaning:"not operating normally or properly", sentence:"The dysfunctional team struggled to meet any of its deadlines.", diff:"medium", cats:["everyday","academic"], synonyms:["broken","malfunctioning","disordered","chaotic"], antonyms:["functional","healthy","effective","well-organised"] },
  { word:"Eccentric", phonetic:"ek·sen·trik", ipa:"/ɪkˈsentrɪk/", meaning:"unconventional and slightly strange in behaviour", sentence:"Her eccentric habits made her instantly memorable to everyone she met.", diff:"medium", cats:["character","academic"], synonyms:["unconventional","quirky","unusual","odd"], antonyms:["conventional","ordinary","typical","normal"] },
  { word:"Elucidate", phonetic:"ih·loo·sih·dayt", ipa:"/ɪˈluːsɪdeɪt/", meaning:"make something clear; explain it in greater detail", sentence:"She asked the professor to elucidate his complex theory.", diff:"medium", cats:["academic","academic"], synonyms:["explain","clarify","illuminate","spell out"], antonyms:["obscure","confuse","complicate","muddy"] },
  { word:"Eloquence", phonetic:"el·oh·kwens", ipa:"/ˈeləkwəns/", meaning:"fluent or persuasive speaking or writing", sentence:"The politician\'s eloquence captivated the audience completely.", diff:"medium", cats:["communication","academic"], synonyms:["fluency","articulacy","expressiveness","rhetoric"], antonyms:["inarticulacy","incoherence","mumbling","stumbling"] },
  { word:"Emphasise", phonetic:"em·fah·syz", ipa:"/ˈemfəsaɪz/", meaning:"give special importance or prominence to something", sentence:"She emphasised the need for immediate action at the meeting.", diff:"medium", cats:["communication","academic"], synonyms:["stress","highlight","underline","underscore"], antonyms:["downplay","minimise","overlook","disregard"] },
  { word:"Empiricism", phonetic:"em·pir·ih·siz·um", ipa:"/ɪmˈpɪrɪsɪzəm/", meaning:"the theory that knowledge derives from sense-experience", sentence:"The scientist\'s empiricism meant she trusted evidence over theory.", diff:"medium", cats:["academic","academic"], synonyms:["observation","experience","experimentation","evidence"], antonyms:["dogmatism","rationalism","speculation","theory"] },
  { word:"Estrange", phonetic:"es·traynj", ipa:"/ɪˈstreɪndʒ/", meaning:"cause someone to be no longer close to another", sentence:"His prolonged absences had estranged him from his family.", diff:"medium", cats:["social","academic"], synonyms:["alienate","distance","separate","isolate"], antonyms:["reconcile","reunite","connect","bond"] },
  { word:"Exempt", phonetic:"ig·zempt", ipa:"/ɪɡˈzempt/", meaning:"free from an obligation or liability imposed on others", sentence:"Certain categories of employees were exempt from the new policy.", diff:"medium", cats:["business","academic"], synonyms:["excused","free","immune","excluded"], antonyms:["liable","subject","obligated","included"] },
  { word:"Exorbitant", phonetic:"ig·zor·bih·tunt", ipa:"/ɪɡˈzɔːbɪtənt/", meaning:"unreasonably high; exceeding what is normal or appropriate", sentence:"The price of accommodation in the city had become exorbitant.", diff:"medium", cats:["business","academic"], synonyms:["excessive","extortionate","outrageous","overpriced"], antonyms:["reasonable","fair","modest","affordable"] },
  { word:"Expedite", phonetic:"ek·speh·dyt", ipa:"/ˈekspɪdaɪt/", meaning:"make something happen sooner; speed up a process", sentence:"The manager agreed to expedite the approval process.", diff:"medium", cats:["business","academic"], synonyms:["accelerate","hasten","speed up","facilitate"], antonyms:["slow","delay","hinder","obstruct"] },
  { word:"Exploit", phonetic:"ek·sployt", ipa:"/ɪkˈsplɔɪt/", meaning:"take advantage of someone unfairly; make the most of", sentence:"The documentary showed how workers were being exploited.", diff:"medium", cats:["social","academic"], synonyms:["use","take advantage","misuse","abuse"], antonyms:["protect","support","honour","treat fairly"] },
  { word:"Extravagant", phonetic:"ek·strav·ah·gunt", ipa:"/ɪkˈstrævəɡənt/", meaning:"lacking restraint in spending money or use of resources", sentence:"His extravagant lifestyle left him with serious financial problems.", diff:"medium", cats:["character","academic"], synonyms:["wasteful","excessive","lavish","excessive"], antonyms:["frugal","thrifty","restrained","modest"] },
  { word:"Fabricate", phonetic:"fab·rih·kayt", ipa:"/ˈfæbrɪkeɪt/", meaning:"invent information in order to deceive", sentence:"She was accused of having fabricated her entire story.", diff:"medium", cats:["communication","academic"], synonyms:["invent","concoct","lie","make up"], antonyms:["tell the truth","report accurately","confirm","prove"] },
  { word:"Fictitious", phonetic:"fik·tish·us", ipa:"/fɪkˈtɪʃəs/", meaning:"not real or true; invented or fabricated", sentence:"The name given to the police turned out to be entirely fictitious.", diff:"medium", cats:["literary","academic"], synonyms:["false","made-up","invented","fabricated"], antonyms:["real","genuine","true","factual"] },
  { word:"Formidable", phonetic:"for·mid·ah·bul", ipa:"/ˈfɔːmɪdəbəl/", meaning:"inspiring fear or respect through being impressively large", sentence:"She faced a formidable array of challenges in her new role.", diff:"medium", cats:["everyday","academic"], synonyms:["impressive","daunting","powerful","intimidating"], antonyms:["weak","manageable","minor","easy"] },
  { word:"Fraught", phonetic:"frawt", ipa:"/frɔːt/", meaning:"filled with or likely to result in something undesirable", sentence:"The negotiations were fraught with difficulties and misunderstandings.", diff:"medium", cats:["everyday","academic"], synonyms:["tense","stressful","troubled","anxious"], antonyms:["smooth","relaxed","trouble-free","easy"] },
  { word:"Frivolous", phonetic:"friv·oh·lus", ipa:"/ˈfrɪvələs/", meaning:"not having any serious purpose; carefree", sentence:"The frivolous spending of company funds caused significant damage.", diff:"medium", cats:["character","academic"], synonyms:["flippant","trivial","silly","superficial"], antonyms:["serious","important","meaningful","responsible"] },
  { word:"Futile", phonetic:"fyoo·tyl", ipa:"/ˈfjuːtaɪl/", meaning:"incapable of producing any useful result; pointless", sentence:"It seemed futile to try to persuade him once his mind was made up.", diff:"medium", cats:["character","academic"], synonyms:["useless","pointless","hopeless","vain"], antonyms:["effective","useful","worthwhile","productive"] },
  { word:"Generalise", phonetic:"jen·er·ah·lyz", ipa:"/ˈdʒenərəlaɪz/", meaning:"make general or widespread statements from limited facts", sentence:"It is dangerous to generalise from a single example.", diff:"medium", cats:["academic","academic"], synonyms:["assume broadly","conclude loosely","oversimplify","extrapolate"], antonyms:["specify","distinguish","particularise","differentiate"] },
  { word:"Gross", phonetic:"grohs", ipa:"/ɡrəʊs/", meaning:"obviously wrong; total before deductions", sentence:"This was a gross misuse of the authority she had been given.", diff:"medium", cats:["business","academic"], synonyms:["blatant","flagrant","obvious","total"], antonyms:["minor","subtle","net","partial"] },
  { word:"Homogeneous", phonetic:"hoh·moh·jee·nee·us", ipa:"/ˌhɒməˈdʒiːniəs/", meaning:"of the same kind; alike in nature or composition", sentence:"The team was homogeneous in background, which limited creativity.", diff:"medium", cats:["academic","academic"], synonyms:["uniform","identical","similar","consistent"], antonyms:["heterogeneous","diverse","mixed","varied"] },
  { word:"Hypocritical", phonetic:"hip·oh·krit·ih·kul", ipa:"/ˌhɪpəˈkrɪtɪkəl/", meaning:"claiming virtues or beliefs one does not actually have", sentence:"It seemed hypocritical to preach honesty while lying regularly.", diff:"medium", cats:["character","academic"], synonyms:["insincere","two-faced","deceitful","sanctimonious"], antonyms:["sincere","honest","genuine","consistent"] },
  { word:"Impartial", phonetic:"im·par·shul", ipa:"/ɪmˈpɑːʃəl/", meaning:"treating all rivals or disputants equally; unbiased", sentence:"An impartial referee is essential to fair competition.", diff:"medium", cats:["character","academic"], synonyms:["unbiased","fair","neutral","objective"], antonyms:["biased","partial","prejudiced","one-sided"] },
  { word:"Impede", phonetic:"im·peed", ipa:"/ɪmˈpiːd/", meaning:"delay or block the progress or action of someone", sentence:"Bad weather threatened to impede the rescue operation.", diff:"medium", cats:["everyday","academic"], synonyms:["hinder","obstruct","block","delay"], antonyms:["assist","help","facilitate","accelerate"] },
  { word:"Inevitable", phonetic:"ih·nev·ih·tah·bul", ipa:"/ɪˈnevɪtəbəl/", meaning:"certain to happen; unable to be avoided or prevented", sentence:"The collapse of the failing company seemed inevitable.", diff:"medium", cats:["everyday","academic"], synonyms:["certain","unavoidable","inescapable","destined"], antonyms:["avoidable","preventable","uncertain","possible"] },
  { word:"Influence", phonetic:"in·floo·ens", ipa:"/ˈɪnfluəns/", meaning:"have an effect on the character or behaviour of someone", sentence:"She used her influence to secure better conditions for the workers.", diff:"medium", cats:["social","academic"], synonyms:["impact","affect","shape","sway"], antonyms:["ignore","be indifferent","have no effect","disregard"] },
  { word:"Inherent", phonetic:"in·heer·unt", ipa:"/ɪnˈhɪərənt/", meaning:"existing as an essential or permanent characteristic", sentence:"There is an inherent tension between freedom and security.", diff:"medium", cats:["academic","academic"], synonyms:["intrinsic","fundamental","built-in","natural"], antonyms:["extrinsic","external","acquired","added"] },
  { word:"Innovative", phonetic:"in·oh·vay·tiv", ipa:"/ˈɪnəveɪtɪv/", meaning:"introducing new ideas; creative and original in approach", sentence:"The company developed an innovative method for recycling plastic.", diff:"medium", cats:["business","academic"], synonyms:["creative","original","pioneering","groundbreaking"], antonyms:["conventional","traditional","outdated","unoriginal"] },
  { word:"Instigate", phonetic:"in·stih·gayt", ipa:"/ˈɪnstɪɡeɪt/", meaning:"bring about or initiate something, especially by incitement", sentence:"He was accused of instigating the riot with his inflammatory speech.", diff:"medium", cats:["social","academic"], synonyms:["initiate","incite","trigger","cause"], antonyms:["prevent","stop","suppress","deter"] },
  { word:"Integrity", phonetic:"in·teg·rih·tee", ipa:"/ɪnˈteɡrɪti/", meaning:"the quality of being honest and having strong moral principles", sentence:"Integrity is the foundation of every truly trusted institution.", diff:"medium", cats:["character","academic"], synonyms:["honesty","honour","virtue","ethics"], antonyms:["corruption","dishonesty","deceit","fraud"] },
  { word:"Intervene", phonetic:"in·ter·veen", ipa:"/ˌɪntəˈviːn/", meaning:"come between so as to prevent or alter a result or course", sentence:"She had to intervene to stop the argument from getting worse.", diff:"medium", cats:["everyday","academic"], synonyms:["intercede","step in","mediate","interfere"], antonyms:["ignore","stay out","withdraw","avoid"] },
  { word:"Intuitive", phonetic:"in·tyoo·ih·tiv", ipa:"/ɪnˈtjuːɪtɪv/", meaning:"using or based on what one feels to be true; instinctive", sentence:"She had an intuitive understanding of how people felt.", diff:"medium", cats:["character","academic"], synonyms:["instinctive","innate","natural","spontaneous"], antonyms:["learned","analytical","deliberate","studied"] },
  { word:"Irrefutable", phonetic:"ir·ref·yoo·tah·bul", ipa:"/ɪˈrefjʊtəbəl/", meaning:"impossible to deny or disprove", sentence:"The evidence against him was irrefutable and he was convicted.", diff:"medium", cats:["academic","academic"], synonyms:["undeniable","conclusive","incontrovertible","absolute"], antonyms:["debatable","disputable","questionable","doubtful"] },
  { word:"Jeopardise", phonetic:"jep·er·dyz", ipa:"/ˈdʒepədaɪz/", meaning:"put someone or something at risk of harm or failure", sentence:"Poor planning could jeopardise the entire venture.", diff:"medium", cats:["everyday","academic"], synonyms:["endanger","threaten","risk","undermine"], antonyms:["protect","secure","safeguard","preserve"] },
  { word:"Judiciously", phonetic:"joo·dish·us·lee", ipa:"/dʒuːˈdɪʃəsli/", meaning:"having or showing sound judgement; done wisely", sentence:"She judiciously avoided making any promises she could not keep.", diff:"medium", cats:["character","academic"], synonyms:["wisely","carefully","prudently","sensibly"], antonyms:["rashly","carelessly","foolishly","impulsively"] },
  { word:"Lenient", phonetic:"lee·nee·unt", ipa:"/ˈliːniənt/", meaning:"more merciful or tolerant than expected; not strict", sentence:"The court took a lenient approach given the mitigating circumstances.", diff:"medium", cats:["character","academic"], synonyms:["tolerant","mild","gentle","forgiving"], antonyms:["strict","harsh","severe","rigid"] },
  { word:"Lucid", phonetic:"loo·sid", ipa:"/ˈluːsɪd/", meaning:"expressed clearly; easy to understand", sentence:"His lucid explanation made even the most complex ideas accessible.", diff:"medium", cats:["communication","academic"], synonyms:["clear","coherent","transparent","intelligible"], antonyms:["confusing","unclear","obscure","muddled"] },
  { word:"Manifold", phonetic:"man·ih·fold", ipa:"/ˈmænɪfəʊld/", meaning:"many and various; having many different forms", sentence:"The challenges she faced were manifold and sometimes overwhelming.", diff:"medium", cats:["academic","academic"], synonyms:["many","various","numerous","diverse"], antonyms:["few","singular","limited","rare"] },
  { word:"Marginalise", phonetic:"mar·jih·nah·lyz", ipa:"/ˈmɑːdʒɪnəlaɪz/", meaning:"treat a person as if they were unimportant or powerless", sentence:"Certain groups have historically been marginalised by society.", diff:"medium", cats:["social","academic"], synonyms:["sideline","exclude","dismiss","ignore"], antonyms:["include","empower","value","centre"] },
  { word:"Methodical", phonetic:"meh·thod·ih·kul", ipa:"/məˈθɒdɪkəl/", meaning:"done according to a systematic or established procedure", sentence:"She was methodical in her research, leaving nothing to chance.", diff:"medium", cats:["character","academic"], synonyms:["systematic","orderly","organised","structured"], antonyms:["chaotic","disorganised","haphazard","random"] },
  { word:"Meticulous", phonetic:"meh·tik·yoo·lus", ipa:"/məˈtɪkjʊləs/", meaning:"showing great attention to detail; extremely thorough", sentence:"Her meticulous preparation for the case impressed the entire court.", diff:"medium", cats:["character","academic"], synonyms:["careful","thorough","precise","painstaking"], antonyms:["careless","sloppy","hasty","negligent"] },
  { word:"Mitigate", phonetic:"mit·ih·gayt", ipa:"/ˈmɪtɪɡeɪt/", meaning:"lessen the gravity or severity of something", sentence:"The new measures were designed to mitigate the financial risks.", diff:"medium", cats:["academic","academic"], synonyms:["reduce","lessen","alleviate","ease"], antonyms:["worsen","intensify","aggravate","increase"] },
  { word:"Negate", phonetic:"neh·gayt", ipa:"/nɪˈɡeɪt/", meaning:"make ineffective; deny the existence or truth of", sentence:"The new evidence served to negate the prosecution\'s earlier argument.", diff:"medium", cats:["academic","academic"], synonyms:["cancel","nullify","invalidate","contradict"], antonyms:["affirm","confirm","validate","support"] },
  { word:"Negligible", phonetic:"neg·lih·jih·bul", ipa:"/ˈneɡlɪdʒɪbəl/", meaning:"so small as to be not worth considering", sentence:"The risk was so negligible that no action was deemed necessary.", diff:"medium", cats:["academic","academic"], synonyms:["insignificant","minor","trivial","unimportant"], antonyms:["significant","considerable","important","major"] },
  { word:"Neutral", phonetic:"nyoo·trul", ipa:"/ˈnjuːtrəl/", meaning:"not supporting or helping either side; impartial", sentence:"The chairman tried to remain neutral during the heated debate.", diff:"medium", cats:["academic","academic"], synonyms:["impartial","unbiased","objective","nonaligned"], antonyms:["biased","partisan","involved","committed"] },
  { word:"Nominal", phonetic:"nom·ih·nul", ipa:"/ˈnɒmɪnəl/", meaning:"very small; existing in name only", sentence:"She was paid a nominal fee for her work on the charity project.", diff:"medium", cats:["business","academic"], synonyms:["token","minimal","small","symbolic"], antonyms:["substantial","significant","actual","real"] },
  { word:"Nuance", phonetic:"nyoo·ahns", ipa:"/ˈnjuːɑːns/", meaning:"a subtle difference in meaning or expression", sentence:"She appreciated every nuance of the complex legal argument.", diff:"medium", cats:["literary","academic"], synonyms:["subtlety","shade","refinement","gradation"], antonyms:["bluntness","crudeness","exaggeration","obviousness"] },
  { word:"Objective", phonetic:"ob·jek·tiv", ipa:"/əbˈdʒektɪv/", meaning:"not influenced by personal feelings; the goal to be reached", sentence:"She tried to give an objective assessment of her own work.", diff:"medium", cats:["academic","academic"], synonyms:["unbiased","impartial","fair","detached"], antonyms:["subjective","biased","personal","partial"] },
  { word:"Obsolete", phonetic:"ob·soh·leet", ipa:"/ˌɒbsəˈliːt/", meaning:"no longer produced or in current use; outdated", sentence:"Several previously important skills have now become completely obsolete.", diff:"medium", cats:["academic","academic"], synonyms:["outdated","archaic","redundant","old-fashioned"], antonyms:["current","modern","contemporary","relevant"] },
  { word:"Oppressive", phonetic:"oh·pres·iv", ipa:"/əˈpresɪv/", meaning:"inflicting harsh and authoritarian treatment on others", sentence:"The workers lived under oppressive conditions with no rights.", diff:"medium", cats:["social","academic"], synonyms:["harsh","tyrannical","brutal","authoritarian"], antonyms:["liberal","humane","fair","just"] },
  { word:"Paradox", phonetic:"par·ah·doks", ipa:"/ˈpærədɒks/", meaning:"a statement that contradicts itself but may still be true", sentence:"There is a paradox at the heart of the new policy.", diff:"medium", cats:["academic","academic"], synonyms:["contradiction","inconsistency","anomaly","puzzle"], antonyms:["agreement","consistency","clarity","straightforwardness"] },
  { word:"Pejorative", phonetic:"peh·jor·ah·tiv", ipa:"/pɪˈdʒɒrətɪv/", meaning:"expressing contempt or disapproval; derogatory", sentence:"The term had acquired a pejorative meaning over the decades.", diff:"medium", cats:["communication","academic"], synonyms:["derogatory","disparaging","insulting","belittling"], antonyms:["complimentary","flattering","positive","praising"] },
  { word:"Pervasive", phonetic:"pur·vay·siv", ipa:"/pəˈveɪsɪv/", meaning:"spreading widely through an area or a group of people", sentence:"The sense of unease was pervasive and affected everyone present.", diff:"medium", cats:["academic","academic"], synonyms:["widespread","omnipresent","universal","rife"], antonyms:["limited","rare","localised","confined"] },
  { word:"Pivotal", phonetic:"piv·uh·tul", ipa:"/ˈpɪvətəl/", meaning:"of crucial importance in relation to the success of something", sentence:"Her decision turned out to be pivotal to the outcome of the election.", diff:"medium", cats:["academic","academic"], synonyms:["crucial","critical","central","key"], antonyms:["minor","peripheral","unimportant","trivial"] },
  { word:"Polarise", phonetic:"poh·lah·ryz", ipa:"/ˈpəʊləraɪz/", meaning:"divide into two sharply contrasting groups or sets", sentence:"The debate over the new policy polarised opinion across the country.", diff:"medium", cats:["social","academic"], synonyms:["divide","split","separate","antagonise"], antonyms:["unite","reconcile","bring together","integrate"] },
  { word:"Precedent", phonetic:"pres·ih·dunt", ipa:"/ˈpresɪdənt/", meaning:"an earlier event used as an example or guide", sentence:"The verdict set an important precedent for similar future cases.", diff:"medium", cats:["academic","academic"], synonyms:["example","model","standard","guideline"], antonyms:["exception","anomaly","deviation","departure"] },
  { word:"Preemptive", phonetic:"pree·emp·tiv", ipa:"/priˈemptɪv/", meaning:"taken as a measure against something possible or anticipated", sentence:"The general ordered a preemptive strike to prevent an attack.", diff:"medium", cats:["academic","academic"], synonyms:["preventive","anticipatory","precautionary","forward-thinking"], antonyms:["reactive","responsive","belated","defensive"] },
  { word:"Proliferate", phonetic:"proh·lif·er·ayt", ipa:"/prəˈlɪfəreɪt/", meaning:"increase rapidly in number; spread widely", sentence:"Misinformation has proliferated alarmingly in the age of social media.", diff:"medium", cats:["academic","academic"], synonyms:["multiply","increase","spread","grow"], antonyms:["decrease","reduce","dwindle","diminish"] },
  { word:"Prone", phonetic:"prohn", ipa:"/prəʊn/", meaning:"likely to suffer from or do something undesirable", sentence:"She was prone to making decisions without thinking them through.", diff:"medium", cats:["character","academic"], synonyms:["inclined","liable","susceptible","disposed"], antonyms:["resistant","unlikely","immune","disinclined"] },
  { word:"Provisional", phonetic:"proh·vizh·un·ul", ipa:"/prəˈvɪʒənəl/", meaning:"arranged for the present but possibly changed later", sentence:"The government formed a provisional committee pending elections.", diff:"medium", cats:["business","academic"], synonyms:["temporary","interim","tentative","conditional"], antonyms:["permanent","final","definitive","confirmed"] },
  { word:"Rational", phonetic:"rash·un·ul", ipa:"/ˈræʃənəl/", meaning:"based on reason or logic; able to think clearly", sentence:"She made a careful, rational decision based on the available facts.", diff:"medium", cats:["academic","academic"], synonyms:["logical","sensible","reasonable","sound"], antonyms:["irrational","illogical","emotional","unreasonable"] },
  { word:"Redundant", phonetic:"reh·dun·dunt", ipa:"/rɪˈdʌndənt/", meaning:"not or no longer needed or useful; using more words than needed", sentence:"The sentence was redundant as the point had already been made.", diff:"medium", cats:["business","academic"], synonyms:["unnecessary","superfluous","obsolete","excessive"], antonyms:["necessary","essential","useful","needed"] },
  { word:"Reinforce", phonetic:"ree·in·fors", ipa:"/ˌriːɪnˈfɔːs/", meaning:"strengthen or support something; make it more forceful", sentence:"This research reinforced the conclusions of the earlier study.", diff:"medium", cats:["academic","academic"], synonyms:["strengthen","support","confirm","back up"], antonyms:["weaken","undermine","contradict","diminish"] },
  { word:"Scrutinise", phonetic:"skroo·tih·nyz", ipa:"/ˈskruːtɪnaɪz/", meaning:"examine or inspect closely and critically", sentence:"Every document was scrutinised before being approved.", diff:"medium", cats:["academic","academic"], synonyms:["examine","inspect","analyse","probe"], antonyms:["ignore","overlook","skim","accept uncritically"] },
  { word:"Secular", phonetic:"sek·yoo·ler", ipa:"/ˈsekjʊlə/", meaning:"not connected with religious or spiritual matters", sentence:"The school was secular and taught no religious doctrine.", diff:"medium", cats:["academic","academic"], synonyms:["non-religious","worldly","temporal","lay"], antonyms:["religious","sacred","spiritual","divine"] },
  { word:"Speculative", phonetic:"spek·yoo·lah·tiv", ipa:"/ˈspekjʊlətɪv/", meaning:"based on conjecture rather than fact; involving financial risk", sentence:"The investment turned out to be highly speculative.", diff:"medium", cats:["business","academic"], synonyms:["theoretical","conjectural","uncertain","risky"], antonyms:["factual","proven","safe","certain"] },
  { word:"Stereotype", phonetic:"steer·ee·oh·typ", ipa:"/ˈsteriətaɪp/", meaning:"a widely held but oversimplified image of a type of person", sentence:"She challenged every stereotype about what a scientist looks like.", diff:"medium", cats:["social","academic"], synonyms:["cliché","oversimplification","prejudice","caricature"], antonyms:["individual","nuance","distinction","complexity"] },
  { word:"Stimulate", phonetic:"stim·yoo·layt", ipa:"/ˈstɪmjʊleɪt/", meaning:"encourage or arouse interest or activity", sentence:"The new exhibition was designed to stimulate public debate.", diff:"medium", cats:["everyday","academic"], synonyms:["encourage","inspire","activate","motivate"], antonyms:["discourage","suppress","dull","inhibit"] },
  { word:"Subjective", phonetic:"sub·jek·tiv", ipa:"/səbˈdʒektɪv/", meaning:"based on personal feelings or opinions rather than facts", sentence:"Art appreciation is inherently subjective.", diff:"medium", cats:["academic","academic"], synonyms:["personal","biased","opinionated","partial"], antonyms:["objective","impartial","factual","unbiased"] },
  { word:"Suppress", phonetic:"suh·pres", ipa:"/səˈpres/", meaning:"prevent from being expressed or known; put an end to", sentence:"Evidence suggests the government tried to suppress the findings.", diff:"medium", cats:["everyday","academic"], synonyms:["stifle","repress","silence","conceal"], antonyms:["release","express","reveal","disclose"] },
  { word:"Susceptible", phonetic:"suh·sep·tih·bul", ipa:"/səˈseptɪbəl/", meaning:"likely to be influenced or harmed by something", sentence:"Young children are especially susceptible to certain infections.", diff:"medium", cats:["academic","academic"], synonyms:["vulnerable","prone","open","defenceless"], antonyms:["resistant","immune","hardened","protected"] },
  { word:"Tenuous", phonetic:"ten·yoo·us", ipa:"/ˈtenjuəs/", meaning:"very weak or slight; having little substance or strength", sentence:"The connection between the two events was tenuous at best.", diff:"medium", cats:["academic","academic"], synonyms:["weak","slight","fragile","insubstantial"], antonyms:["strong","solid","substantial","clear"] },
  { word:"Threshold", phonetic:"thresh·ohld", ipa:"/ˈθreʃhəʊld/", meaning:"the magnitude or intensity that must be exceeded to begin an effect", sentence:"The company had just crossed the threshold into profitability.", diff:"medium", cats:["academic","academic"], synonyms:["limit","boundary","point","level"], antonyms:["interior","depth","heart","middle"] },
  { word:"Transparent", phonetic:"trans·pair·unt", ipa:"/trænsˈpærənt/", meaning:"open and honest; easy to see through", sentence:"The process was made fully transparent to restore public trust.", diff:"medium", cats:["business","academic"], synonyms:["open","honest","clear","visible"], antonyms:["opaque","secretive","deceptive","obscure"] },
  { word:"Trivial", phonetic:"triv·ee·ul", ipa:"/ˈtrɪviəl/", meaning:"of little importance or significance", sentence:"She did not want to waste time on trivial matters.", diff:"medium", cats:["everyday","academic"], synonyms:["minor","unimportant","petty","insignificant"], antonyms:["significant","important","major","serious"] },
  { word:"Ubiquitous", phonetic:"yoo·bik·wih·tus", ipa:"/juːˈbɪkwɪtəs/", meaning:"present or found everywhere; seemingly everywhere at once", sentence:"The ubiquitous phone screens made genuine conversation harder.", diff:"medium", cats:["academic","academic"], synonyms:["omnipresent","universal","pervasive","widespread"], antonyms:["rare","scarce","limited","uncommon"] },
  { word:"Undermine", phonetic:"un·der·myn", ipa:"/ˌʌndəˈmaɪn/", meaning:"erode the base or foundation of; weaken gradually", sentence:"Constant criticism can seriously undermine a person\'s confidence.", diff:"medium", cats:["everyday","academic"], synonyms:["weaken","damage","erode","sabotage"], antonyms:["support","strengthen","reinforce","bolster"] },
  { word:"Unprecedented", phonetic:"un·pres·ih·den·tid", ipa:"/ʌnˈpresɪdentɪd/", meaning:"never done or known before; novel", sentence:"The speed of the scientific response was truly unprecedented.", diff:"medium", cats:["academic","academic"], synonyms:["unheard-of","novel","exceptional","remarkable"], antonyms:["typical","familiar","common","expected"] },
  { word:"Vague", phonetic:"vayg", ipa:"/veɪɡ/", meaning:"of uncertain, indefinite, or unclear character", sentence:"His answer was deliberately vague and impossible to pin down.", diff:"medium", cats:["communication","academic"], synonyms:["unclear","ambiguous","indefinite","uncertain"], antonyms:["clear","precise","definite","specific"] },
  { word:"Validate", phonetic:"val·ih·dayt", ipa:"/ˈvælɪdeɪt/", meaning:"check or prove the accuracy, truth, or validity of something", sentence:"She needed to validate her findings before publishing them.", diff:"medium", cats:["academic","academic"], synonyms:["confirm","verify","prove","authenticate"], antonyms:["invalidate","disprove","refute","undermine"] },
  { word:"Variable", phonetic:"vair·ee·ah·bul", ipa:"/ˈveəriəbəl/", meaning:"not consistent or having a fixed pattern; liable to change", sentence:"The quality of the work was variable and hard to predict.", diff:"medium", cats:["academic","academic"], synonyms:["inconsistent","changing","fluctuating","erratic"], antonyms:["constant","stable","fixed","consistent"] },
  { word:"Versatile", phonetic:"vur·sah·tyl", ipa:"/ˈvɜːsətaɪl/", meaning:"able to adapt or be adapted to many different functions", sentence:"He was a versatile musician, skilled in many different styles.", diff:"medium", cats:["character","academic"], synonyms:["adaptable","flexible","all-round","multifaceted"], antonyms:["limited","narrow","one-dimensional","specialised"] },
  { word:"Viable", phonetic:"vy·ah·bul", ipa:"/ˈvaɪəbəl/", meaning:"capable of working successfully; feasible and practical", sentence:"The new approach proved more viable than the previous one.", diff:"medium", cats:["business","academic"], synonyms:["feasible","practical","workable","achievable"], antonyms:["unworkable","impossible","impractical","unfeasible"] },
  { word:"Volatile", phonetic:"vol·ah·tyl", ipa:"/ˈvɒlətaɪl/", meaning:"liable to change rapidly and unpredictably; explosive", sentence:"The political situation remained volatile and difficult to predict.", diff:"medium", cats:["business","academic"], synonyms:["unstable","unpredictable","explosive","erratic"], antonyms:["stable","calm","predictable","steady"] },
  { word:"Wary", phonetic:"wair·ee", ipa:"/ˈweəri/", meaning:"feeling or showing caution about possible risks", sentence:"Investors were wary following the unexpected market downturn.", diff:"medium", cats:["character","academic"], synonyms:["cautious","guarded","suspicious","careful"], antonyms:["trusting","careless","reckless","naive"] },
  { word:"Zealous", phonetic:"zel·us", ipa:"/ˈzeləs/", meaning:"having or showing great energy or enthusiasm for a cause", sentence:"The zealous reformer worked tirelessly to change the system.", diff:"medium", cats:["character","academic"], synonyms:["enthusiastic","passionate","dedicated","fervent"], antonyms:["apathetic","indifferent","half-hearted","unenthusiastic"] },
{ word:"Abjure", phonetic:"ab·joor", ipa:"/æbˈdʒʊə/", meaning:"solemnly renounce a belief, cause, or claim", sentence:"He abjured his former political beliefs when he left the party.", diff:"hard", cats:["character","literary"], synonyms:["renounce","disavow","recant","forswear"], antonyms:["embrace","adopt","profess","affirm"] },
  { word:"Abstruse", phonetic:"ab·stroos", ipa:"/æbˈstruːs/", meaning:"difficult to understand; obscure in meaning", sentence:"The lecture was so abstruse that few students followed it.", diff:"hard", cats:["academic","literary"], synonyms:["obscure","arcane","esoteric","impenetrable"], antonyms:["clear","simple","accessible","straightforward"] },
  { word:"Acrimony", phonetic:"ak·rih·moh·nee", ipa:"/ˈækrɪməni/", meaning:"bitterness or ill feeling expressed openly", sentence:"The acrimony between the two rivals was plain for all to see.", diff:"hard", cats:["character","literary"], synonyms:["bitterness","hostility","rancour","animosity"], antonyms:["goodwill","harmony","warmth","cordiality"] },
  { word:"Adulation", phonetic:"ad·yoo·lay·shun", ipa:"/ˌædjʊˈleɪʃən/", meaning:"obsequious flattery; excessive admiration", sentence:"The pop star received adulation wherever she went.", diff:"hard", cats:["social","literary"], synonyms:["worship","idolisation","praise","veneration"], antonyms:["criticism","condemnation","censure","disapproval"] },
  { word:"Aesthetic", phonetic:"es·thet·ik", ipa:"/iːsˈθetɪk/", meaning:"concerned with beauty or the appreciation of beauty", sentence:"The building was designed with great aesthetic care.", diff:"hard", cats:["literary","literary"], synonyms:["artistic","beautiful","stylistic","tasteful"], antonyms:["functional","ugly","utilitarian","inelegant"] },
  { word:"Affected", phonetic:"ah·fek·tid", ipa:"/əˈfektɪd/", meaning:"artificial and designed to impress; pretentious", sentence:"His affected manner of speaking irritated everyone around him.", diff:"hard", cats:["character","literary"], synonyms:["pretentious","artificial","mannered","contrived"], antonyms:["genuine","natural","sincere","spontaneous"] },
  { word:"Affront", phonetic:"ah·frunt", ipa:"/əˈfrʌnt/", meaning:"an action or remark causing offence or insult", sentence:"She regarded the comment as a direct affront to her dignity.", diff:"hard", cats:["social","literary"], synonyms:["insult","offence","slight","indignity"], antonyms:["compliment","honour","praise","respect"] },
  { word:"Allegory", phonetic:"al·eh·gor·ee", ipa:"/ˈæləɡəri/", meaning:"a story in which abstract ideas are symbolised by people", sentence:"The novel is an allegory for the corrupting effects of power.", diff:"hard", cats:["literary","literary"], synonyms:["parable","metaphor","symbol","fable"], antonyms:["literal account","factual report","direct statement","plain truth"] },
  { word:"Altruistic", phonetic:"al·troo·is·tik", ipa:"/ˌæltruˈɪstɪk/", meaning:"showing selfless concern for the well-being of others", sentence:"Her decision to donate her prize money was entirely altruistic.", diff:"hard", cats:["character","literary"], synonyms:["selfless","generous","charitable","benevolent"], antonyms:["selfish","self-centred","greedy","egotistical"] },
  { word:"Ambivalence", phonetic:"am·biv·ah·lens", ipa:"/æmˈbɪvələns/", meaning:"the state of having mixed feelings about something", sentence:"She felt profound ambivalence about accepting the prestigious offer.", diff:"hard", cats:["emotion","literary"], synonyms:["uncertainty","indecision","conflict","wavering"], antonyms:["certainty","decisiveness","clarity","commitment"] },
  { word:"Ameliorate", phonetic:"ah·meel·ee·oh·rayt", ipa:"/əˈmiːliəreɪt/", meaning:"make something bad or unsatisfactory better", sentence:"Efforts were made to ameliorate the suffering of those affected.", diff:"hard", cats:["academic","literary"], synonyms:["improve","better","relieve","enhance"], antonyms:["worsen","aggravate","exacerbate","damage"] },
  { word:"Anachronism", phonetic:"ah·nak·roh·niz·um", ipa:"/əˈnækrənɪzəm/", meaning:"something out of its proper historical time", sentence:"The steam engine in the science fiction film was an obvious anachronism.", diff:"hard", cats:["academic","literary"], synonyms:["relic","archaism","throwback","out-of-date element"], antonyms:["contemporary thing","modern element","current feature","up-to-date matter"] },
  { word:"Anocracy", phonetic:"ah·nok·rah·see", ipa:"/əˈnɒkrəsi/", meaning:"a form of government that is neither fully democratic nor authoritarian", sentence:"Many transitional states operate as anocracies during periods of reform.", diff:"hard", cats:["academic","literary"], synonyms:["hybrid regime","partial democracy","mixed government","unstable rule"], antonyms:["democracy","autocracy","stable government","clear regime"] },
  { word:"Antipodal", phonetic:"an·tip·oh·dul", ipa:"/ænˈtɪpədəl/", meaning:"relating to or situated on the opposite side; contrary", sentence:"Their views were entirely antipodal and no compromise was possible.", diff:"hard", cats:["academic","literary"], synonyms:["opposite","contrary","polar","diametrically opposed"], antonyms:["similar","identical","comparable","aligned"] },
  { word:"Apathy", phonetic:"ap·ah·thee", ipa:"/ˈæpəθi/", meaning:"lack of interest, enthusiasm, or concern", sentence:"The widespread apathy of voters was a threat to democracy.", diff:"hard", cats:["emotion","literary"], synonyms:["indifference","disinterest","lethargy","passiveness"], antonyms:["enthusiasm","passion","concern","interest"] },
  { word:"Apostate", phonetic:"ah·pos·tayt", ipa:"/əˈpɒsteɪt/", meaning:"a person who renounces a former religious or political belief", sentence:"The community shunned him once he was declared an apostate.", diff:"hard", cats:["academic","literary"], synonyms:["renegade","traitor","defector","backslider"], antonyms:["believer","adherent","loyalist","faithful"] },
  { word:"Approbation", phonetic:"ap·roh·bay·shun", ipa:"/ˌæprəˈbeɪʃən/", meaning:"approval or praise; an expression of warm commendation", sentence:"She sought the approbation of her peers before going public.", diff:"hard", cats:["academic","literary"], synonyms:["approval","praise","endorsement","commendation"], antonyms:["disapproval","criticism","censure","condemnation"] },
  { word:"Arcane", phonetic:"ar·kayn", ipa:"/ɑːˈkeɪn/", meaning:"understood by very few; mysterious and specialised", sentence:"The ritual relied on arcane knowledge passed down for centuries.", diff:"hard", cats:["literary","literary"], synonyms:["mysterious","obscure","esoteric","secret"], antonyms:["familiar","common","well-known","accessible"] },
  { word:"Ardent", phonetic:"ar·dunt", ipa:"/ˈɑːdənt/", meaning:"enthusiastic or passionate; burning with strong feeling", sentence:"She was an ardent admirer of the philosopher\'s early work.", diff:"hard", cats:["character","literary"], synonyms:["passionate","fervent","intense","zealous"], antonyms:["indifferent","apathetic","lukewarm","half-hearted"] },
  { word:"Artifice", phonetic:"ar·tih·fis", ipa:"/ˈɑːtɪfɪs/", meaning:"clever or cunning devices or expedients; trickery", sentence:"The magician\'s performance relied on artifice rather than genuine magic.", diff:"hard", cats:["character","literary"], synonyms:["trickery","cunning","deceit","manipulation"], antonyms:["honesty","sincerity","directness","transparency"] },
  { word:"Assiduous", phonetic:"ah·sid·yoo·us", ipa:"/əˈsɪdjuəs/", meaning:"showing great care and persistent effort", sentence:"Her assiduous attention to detail set her work apart.", diff:"hard", cats:["character","literary"], synonyms:["diligent","hardworking","dedicated","conscientious"], antonyms:["lazy","careless","negligent","idle"] },
  { word:"Attenuate", phonetic:"ah·ten·yoo·ayt", ipa:"/əˈtenjueɪt/", meaning:"reduce the force, effect, or value of something", sentence:"The thick walls helped to attenuate the noise from outside.", diff:"hard", cats:["scientific","literary"], synonyms:["reduce","weaken","diminish","lessen"], antonyms:["amplify","intensify","strengthen","increase"] },
  { word:"Augury", phonetic:"aw·gyoo·ree", ipa:"/ˈɔːɡjʊri/", meaning:"an omen; a sign of what will happen in the future", sentence:"The early results were seen as an augury of success.", diff:"hard", cats:["literary","literary"], synonyms:["omen","portent","sign","forewarning"], antonyms:["certainty","fact","confirmation","reality"] },
  { word:"Baleful", phonetic:"bale·ful", ipa:"/ˈbeɪlfʊl/", meaning:"threatening harm; having a harmful or threatening influence", sentence:"She cast a baleful glance at her rival across the room.", diff:"hard", cats:["literary","literary"], synonyms:["menacing","malevolent","sinister","threatening"], antonyms:["benign","friendly","harmless","kind"] },
  { word:"Banality", phonetic:"bah·nal·ih·tee", ipa:"/bəˈnælɪti/", meaning:"the fact or condition of being obvious and uninteresting", sentence:"He was struck by the sheer banality of the conversation.", diff:"hard", cats:["literary","literary"], synonyms:["triteness","ordinariness","dullness","commonplaceness"], antonyms:["originality","novelty","distinction","creativity"] },
  { word:"Beleaguer", phonetic:"beh·lee·ger", ipa:"/bɪˈliːɡə/", meaning:"lay siege to; put in a very difficult situation", sentence:"The beleaguered company was threatened by lawsuits from multiple sides.", diff:"hard", cats:["literary","literary"], synonyms:["besiege","harass","beset","trouble"], antonyms:["support","assist","relieve","help"] },
  { word:"Beneficent", phonetic:"beh·nef·ih·sunt", ipa:"/bɪˈnefɪsənt/", meaning:"resulting in good; doing good; generous in giving", sentence:"The beneficent ruler was much loved by his people.", diff:"hard", cats:["character","literary"], synonyms:["generous","charitable","kind","benevolent"], antonyms:["mean","selfish","unkind","malevolent"] },
  { word:"Bombast", phonetic:"bom·bast", ipa:"/ˈbɒmbæst/", meaning:"high-sounding language with little meaning; pompous talk", sentence:"His speech was full of bombast but remarkably short on substance.", diff:"hard", cats:["communication","literary"], synonyms:["pomposity","rhetoric","bluster","grandiosity"], antonyms:["simplicity","plainness","sincerity","directness"] },
  { word:"Broach", phonetic:"brohch", ipa:"/brəʊtʃ/", meaning:"raise a subject for discussion for the first time", sentence:"She found it difficult to broach the difficult topic with him.", diff:"hard", cats:["communication","literary"], synonyms:["raise","introduce","bring up","mention"], antonyms:["avoid","suppress","conceal","withhold"] },
  { word:"Buffoon", phonetic:"buh·foon", ipa:"/bəˈfuːn/", meaning:"a person who uses comedy or ridicule; a clown", sentence:"The politician was regarded as a buffoon by serious commentators.", diff:"hard", cats:["character","literary"], synonyms:["clown","joker","fool","jester"], antonyms:["dignitary","statesman","authority","serious person"] },
  { word:"Cabal", phonetic:"kah·bal", ipa:"/kəˈbæl/", meaning:"a secret group united in a plot", sentence:"A small cabal of officials attempted to undermine the minister.", diff:"hard", cats:["social","literary"], synonyms:["clique","faction","conspiracy","plot"], antonyms:["open group","public body","transparent organisation","honest association"] },
  { word:"Callous", phonetic:"kal·us", ipa:"/ˈkæləs/", meaning:"showing or having an insensitive and cruel disregard", sentence:"The callous response to the tragedy shocked the entire nation.", diff:"hard", cats:["character","literary"], synonyms:["heartless","cruel","cold","indifferent"], antonyms:["compassionate","empathetic","sensitive","caring"] },
  { word:"Cant", phonetic:"kant", ipa:"/kænt/", meaning:"hypocritical and sanctimonious talk; jargon of a group", sentence:"The politician\'s speech was full of cant and empty promises.", diff:"hard", cats:["communication","literary"], synonyms:["hypocrisy","piety","jargon","humbug"], antonyms:["sincerity","honesty","plain speech","directness"] },
  { word:"Capitulate", phonetic:"kah·pich·oo·layt", ipa:"/kəˈpɪtʃʊleɪt/", meaning:"cease to resist an opponent or unwelcome demand", sentence:"After hours of negotiation, they finally capitulated to the demands.", diff:"hard", cats:["character","literary"], synonyms:["surrender","yield","submit","concede"], antonyms:["resist","defy","hold out","refuse"] },
  { word:"Castigate", phonetic:"kas·tih·gayt", ipa:"/ˈkæstɪɡeɪt/", meaning:"reprimand someone severely", sentence:"The editor castigated the reporter for his irresponsible article.", diff:"hard", cats:["communication","literary"], synonyms:["criticise","rebuke","censure","berate"], antonyms:["praise","commend","approve","congratulate"] },
  { word:"Cavil", phonetic:"kav·ul", ipa:"/ˈkævɪl/", meaning:"make petty or unnecessary objections", sentence:"He spent the entire meeting cavilling over minor points.", diff:"hard", cats:["communication","literary"], synonyms:["quibble","nitpick","find fault","complain"], antonyms:["accept","approve","agree","commend"] },
  { word:"Censorious", phonetic:"sen·sor·ee·us", ipa:"/senˈsɔːriəs/", meaning:"severely critical of others; finding fault readily", sentence:"Her censorious attitude made it hard for others to share ideas.", diff:"hard", cats:["character","literary"], synonyms:["critical","judgmental","fault-finding","harsh"], antonyms:["tolerant","approving","lenient","generous"] },
  { word:"Chagrin", phonetic:"shah·grin", ipa:"/ʃəˈɡrɪn/", meaning:"distress or embarrassment at having failed or been humiliated", sentence:"To his great chagrin, he discovered he had been completely wrong.", diff:"hard", cats:["emotion","literary"], synonyms:["embarrassment","mortification","humiliation","shame"], antonyms:["pleasure","satisfaction","delight","pride"] },
  { word:"Circuitous", phonetic:"sur·kyoo·ih·tus", ipa:"/sɜːˈkjuːɪtəs/", meaning:"longer than the most direct way; roundabout", sentence:"She gave a circuitous explanation that confused everyone further.", diff:"hard", cats:["literary","literary"], synonyms:["roundabout","indirect","winding","tortuous"], antonyms:["direct","straight","brief","concise"] },
  { word:"Clemency", phonetic:"klem·un·see", ipa:"/ˈklemənsi/", meaning:"mercy and lenience shown to an enemy or offender", sentence:"The prisoner appealed for clemency on grounds of ill health.", diff:"hard", cats:["character","literary"], synonyms:["mercy","leniency","compassion","forgiveness"], antonyms:["harshness","severity","cruelty","rigour"] },
  { word:"Cloister", phonetic:"kloy·ster", ipa:"/ˈklɔɪstə/", meaning:"seclude or shut away from the world", sentence:"She had cloistered herself away to write her third novel.", diff:"hard", cats:["literary","literary"], synonyms:["seclude","isolate","sequester","confine"], antonyms:["integrate","open up","join society","connect"] },
  { word:"Corollary", phonetic:"koh·rol·ah·ree", ipa:"/kəˈrɒləri/", meaning:"a natural consequence or result", sentence:"Increased responsibility is the corollary of greater authority.", diff:"hard", cats:["academic","literary"], synonyms:["consequence","result","implication","outcome"], antonyms:["cause","source","origin","antecedent"] },
  { word:"Cosmopolitan", phonetic:"koz·moh·pol·ih·tun", ipa:"/ˌkɒzməˈpɒlɪtən/", meaning:"familiar with many countries and at ease in many cultures", sentence:"She had a truly cosmopolitan outlook after living in six countries.", diff:"hard", cats:["social","literary"], synonyms:["worldly","cultured","sophisticated","international"], antonyms:["provincial","parochial","narrow-minded","insular"] },
  { word:"Craven", phonetic:"kray·vun", ipa:"/ˈkreɪvən/", meaning:"contemptibly lacking in courage; cowardly", sentence:"His craven decision to say nothing made him complicit in the crime.", diff:"hard", cats:["character","literary"], synonyms:["cowardly","spineless","timid","gutless"], antonyms:["brave","courageous","bold","fearless"] },
  { word:"Cryptic", phonetic:"krip·tik", ipa:"/ˈkrɪptɪk/", meaning:"having a meaning that is mysterious or obscure", sentence:"She left a cryptic note that nobody could quite decipher.", diff:"hard", cats:["literary","literary"], synonyms:["mysterious","obscure","puzzling","enigmatic"], antonyms:["clear","obvious","straightforward","transparent"] },
  { word:"Cupidity", phonetic:"kyoo·pid·ih·tee", ipa:"/kjuːˈpɪdɪti/", meaning:"greed for money or possessions", sentence:"His cupidity led him to betray those who had trusted him.", diff:"hard", cats:["character","literary"], synonyms:["greed","avarice","acquisitiveness","covetousness"], antonyms:["generosity","contentment","selflessness","altruism"] },
  { word:"Dauntless", phonetic:"dawnt·lis", ipa:"/ˈdɔːntləs/", meaning:"showing fearlessness and determination", sentence:"Despite the overwhelming odds, she remained dauntless.", diff:"hard", cats:["character","literary"], synonyms:["fearless","intrepid","brave","undaunted"], antonyms:["cowardly","timid","fearful","hesitant"] },
  { word:"Debacle", phonetic:"deh·bah·kul", ipa:"/dɪˈbɑːkəl/", meaning:"a sudden and complete disaster; a chaotic collapse", sentence:"The launch was a total debacle that embarrassed the company.", diff:"hard", cats:["literary","literary"], synonyms:["disaster","fiasco","catastrophe","collapse"], antonyms:["success","triumph","achievement","victory"] },
  { word:"Decry", phonetic:"deh·kry", ipa:"/dɪˈkraɪ/", meaning:"publicly denounce as being wrong or inferior", sentence:"She was quick to decry the use of misleading statistics.", diff:"hard", cats:["communication","literary"], synonyms:["condemn","denounce","criticise","deplore"], antonyms:["praise","approve","commend","support"] },
  { word:"Deign", phonetic:"dayn", ipa:"/deɪn/", meaning:"do something that one considers beneath one's dignity", sentence:"He finally deigned to acknowledge the existence of the problem.", diff:"hard", cats:["character","literary"], synonyms:["condescend","lower oneself","stoop","consent"], antonyms:["refuse","decline","reject","disdain"] },
  { word:"Deleterious", phonetic:"del·eh·teer·ee·us", ipa:"/ˌdelɪˈtɪəriəs/", meaning:"causing harm or damage; injurious", sentence:"Smoking has a deleterious effect on virtually every organ of the body.", diff:"hard", cats:["academic","literary"], synonyms:["harmful","damaging","detrimental","injurious"], antonyms:["beneficial","helpful","advantageous","positive"] },
  { word:"Delineate", phonetic:"deh·lin·ee·ayt", ipa:"/dɪˈlɪnɪeɪt/", meaning:"describe or indicate something precisely; portray or outline", sentence:"She carefully delineated the boundaries of the project.", diff:"hard", cats:["academic","literary"], synonyms:["describe","outline","define","specify"], antonyms:["blur","obscure","confuse","generalise"] },
  { word:"Demur", phonetic:"deh·mur", ipa:"/dɪˈmɜː/", meaning:"raise doubts or objections; show reluctance", sentence:"She accepted, but not without some demur at the conditions.", diff:"hard", cats:["character","literary"], synonyms:["object","hesitate","protest","resist"], antonyms:["agree","accept","comply","acquiesce"] },
  { word:"Derisive", phonetic:"deh·ry·siv", ipa:"/dɪˈraɪsɪv/", meaning:"expressing contempt or ridicule", sentence:"The audience responded with derisive laughter to his suggestion.", diff:"hard", cats:["character","literary"], synonyms:["mocking","scornful","contemptuous","sneering"], antonyms:["respectful","admiring","approving","supportive"] },
  { word:"Desiccate", phonetic:"des·ih·kayt", ipa:"/ˈdesɪkeɪt/", meaning:"remove moisture from; cause to become dry", sentence:"Years in the desert had desiccated the ancient scrolls.", diff:"hard", cats:["scientific","literary"], synonyms:["dry out","dehydrate","parch","wither"], antonyms:["moisten","hydrate","saturate","dampen"] },
  { word:"Desultory", phonetic:"des·ul·tor·ee", ipa:"/ˈdesəltəri/", meaning:"lacking a plan, purpose, or enthusiasm; unfocused", sentence:"The meeting ended in desultory conversation that led nowhere.", diff:"hard", cats:["character","literary"], synonyms:["aimless","half-hearted","random","unfocused"], antonyms:["methodical","purposeful","focused","deliberate"] },
  { word:"Diaphanous", phonetic:"dy·af·ah·nus", ipa:"/daɪˈæfənəs/", meaning:"light, delicate, and translucent; sheer", sentence:"The diaphanous fabric caught the light in a stunning fashion.", diff:"hard", cats:["literary","literary"], synonyms:["sheer","translucent","delicate","gossamer"], antonyms:["opaque","thick","solid","heavy"] },
  { word:"Diffident", phonetic:"dif·ih·dunt", ipa:"/ˈdɪfɪdənt/", meaning:"modest or shy due to lack of self-confidence", sentence:"He was too diffident to speak up in front of large crowds.", diff:"hard", cats:["character","literary"], synonyms:["shy","modest","timid","self-effacing"], antonyms:["confident","assertive","bold","outspoken"] },
  { word:"Discordant", phonetic:"dis·kor·dunt", ipa:"/dɪˈskɔːdənt/", meaning:"not in harmony; clashing; producing disagreement", sentence:"The discordant notes created an unsettling but memorable atmosphere.", diff:"hard", cats:["literary","literary"], synonyms:["clashing","jarring","conflicting","incongruous"], antonyms:["harmonious","concordant","compatible","agreeable"] },
  { word:"Dissonance", phonetic:"dis·oh·nuns", ipa:"/ˈdɪsənəns/", meaning:"tension or clash resulting from combining incompatible things", sentence:"There was a strong dissonance between his words and his actions.", diff:"hard", cats:["literary","literary"], synonyms:["conflict","discord","tension","incongruity"], antonyms:["harmony","agreement","consonance","accord"] },
  { word:"Dogmatic", phonetic:"dog·mat·ik", ipa:"/dɒɡˈmætɪk/", meaning:"inclined to lay down principles as undeniably true", sentence:"His dogmatic insistence on one approach prevented any new ideas.", diff:"hard", cats:["character","literary"], synonyms:["rigid","inflexible","authoritarian","opinionated"], antonyms:["open-minded","flexible","questioning","reasonable"] },
  { word:"Ebullience", phonetic:"ih·bul·ee·ens", ipa:"/ɪˈbʌliəns/", meaning:"the quality of being enthusiastic and full of energy", sentence:"Her natural ebullience lit up every room she entered.", diff:"hard", cats:["emotion","literary"], synonyms:["exuberance","enthusiasm","vivacity","liveliness"], antonyms:["gloom","depression","lethargy","dullness"] },
  { word:"Effete", phonetic:"eh·feet", ipa:"/ɪˈfiːt/", meaning:"no longer effective; overrefined and ineffectual", sentence:"The critics dismissed the movement as effete and irrelevant.", diff:"hard", cats:["literary","literary"], synonyms:["weak","ineffectual","decadent","exhausted"], antonyms:["vigorous","strong","vital","effective"] },
  { word:"Egregious", phonetic:"ih·gree·jus", ipa:"/ɪˈɡriːdʒəs/", meaning:"outstandingly bad; remarkably offensive", sentence:"The egregious error was immediately noticed by every expert in the room.", diff:"hard", cats:["character","literary"], synonyms:["shocking","outrageous","flagrant","appalling"], antonyms:["minor","slight","unremarkable","acceptable"] },
  { word:"Elicit", phonetic:"ih·lis·it", ipa:"/ɪˈlɪsɪt/", meaning:"evoke or draw out a response, fact, or answer", sentence:"The question was designed to elicit an honest response.", diff:"hard", cats:["communication","literary"], synonyms:["evoke","draw out","provoke","extract"], antonyms:["suppress","conceal","withhold","stifle"] },
  { word:"Eloquent", phonetic:"el·oh·kwunt", ipa:"/ˈeləkwənt/", meaning:"fluent or persuasive in speaking or writing", sentence:"His eloquent defence of the accused moved the entire court.", diff:"hard", cats:["communication","literary"], synonyms:["articulate","fluent","expressive","persuasive"], antonyms:["inarticulate","stumbling","mumbling","incoherent"] },
  { word:"Emollient", phonetic:"ih·mol·ee·unt", ipa:"/ɪˈmɒliənt/", meaning:"soothing or calming; a substance that softens", sentence:"He adopted an emollient tone in an attempt to defuse the crisis.", diff:"hard", cats:["literary","literary"], synonyms:["soothing","calming","softening","conciliatory"], antonyms:["harsh","abrasive","provocative","inflammatory"] },
  { word:"Empirical", phonetic:"em·pir·ih·kul", ipa:"/ɪmˈpɪrɪkəl/", meaning:"verifiable by observation or experience; evidence-based", sentence:"The theory was supported by extensive empirical evidence.", diff:"hard", cats:["scientific","literary"], synonyms:["observable","experimental","factual","evidence-based"], antonyms:["theoretical","speculative","hypothetical","abstract"] },
  { word:"Encumber", phonetic:"en·kum·ber", ipa:"/ɪnˈkʌmbə/", meaning:"restrict or burden so as to make progress difficult", sentence:"The complex regulations encumbered the business with excessive compliance.", diff:"hard", cats:["everyday","literary"], synonyms:["burden","hinder","obstruct","weigh down"], antonyms:["free","liberate","unburden","assist"] },
  { word:"Enduring", phonetic:"en·dyoor·ing", ipa:"/ɪnˈdjʊərɪŋ/", meaning:"lasting over a long period of time; durable", sentence:"The film left an enduring impression on all who watched it.", diff:"hard", cats:["character","literary"], synonyms:["lasting","permanent","persistent","timeless"], antonyms:["temporary","fleeting","brief","transient"] },
  { word:"Enigma", phonetic:"ih·nig·mah", ipa:"/ɪˈnɪɡmə/", meaning:"a person or thing that is mysterious or puzzling", sentence:"Her true motivations remained an enigma even to those closest to her.", diff:"hard", cats:["literary","literary"], synonyms:["mystery","puzzle","riddle","conundrum"], antonyms:["explanation","clarity","revelation","solution"] },
  { word:"Ennui", phonetic:"on·wee", ipa:"/ɒnˈwiː/", meaning:"a feeling of listlessness and dissatisfaction arising from boredom", sentence:"A deep ennui settled over the office as the project dragged on.", diff:"hard", cats:["literary","literary"], synonyms:["boredom","listlessness","tedium","dissatisfaction"], antonyms:["excitement","enthusiasm","engagement","interest"] },
  { word:"Ephemeral", phonetic:"eh·fem·er·ul", ipa:"/ɪˈfemərəl/", meaning:"lasting for a very short time; transitory", sentence:"Social media trends are ephemeral and quickly forgotten.", diff:"hard", cats:["literary","literary"], synonyms:["fleeting","transient","momentary","short-lived"], antonyms:["permanent","lasting","enduring","eternal"] },
  { word:"Equanimity", phonetic:"ee·kwah·nim·ih·tee", ipa:"/ˌiːkwəˈnɪmɪti/", meaning:"mental calmness, especially in difficult situations", sentence:"She faced the terrible news with remarkable equanimity.", diff:"hard", cats:["character","literary"], synonyms:["calmness","composure","serenity","poise"], antonyms:["anxiety","agitation","distress","turmoil"] },
  { word:"Erudite", phonetic:"er·yoo·dyt", ipa:"/ˈeruːdaɪt/", meaning:"having or showing great knowledge or learning", sentence:"She was an erudite scholar with expertise in many fields.", diff:"hard", cats:["academic","literary"], synonyms:["learned","knowledgeable","scholarly","well-read"], antonyms:["ignorant","uneducated","unlearned","illiterate"] },
  { word:"Esoteric", phonetic:"es·oh·ter·ik", ipa:"/ˌesəˈterɪk/", meaning:"intended for and understood by only a few specialists", sentence:"The professor\'s esoteric interests attracted only a handful of students.", diff:"hard", cats:["academic","literary"], synonyms:["obscure","arcane","specialised","abstruse"], antonyms:["accessible","popular","familiar","mainstream"] },
  { word:"Eulogy", phonetic:"yoo·loh·jee", ipa:"/ˈjuːlədʒi/", meaning:"a speech of warm praise, typically for a deceased person", sentence:"She delivered a moving eulogy that brought tears to everyone\'s eyes.", diff:"hard", cats:["literary","literary"], synonyms:["tribute","commendation","praise","homage"], antonyms:["condemnation","criticism","denunciation","censure"] },
  { word:"Exacerbate", phonetic:"ig·zas·er·bayt", ipa:"/ɪɡˈzæsəbeɪt/", meaning:"make a problem, bad situation, or feeling worse", sentence:"His dismissive response only served to exacerbate the conflict.", diff:"hard", cats:["academic","literary"], synonyms:["worsen","aggravate","intensify","inflame"], antonyms:["improve","alleviate","ease","reduce"] },
  { word:"Exemplary", phonetic:"eg·zem·plah·ree", ipa:"/ɪɡˈzemplɑːri/", meaning:"serving as a desirable model; representing the best", sentence:"She provided an exemplary model of leadership under extreme pressure.", diff:"hard", cats:["character","literary"], synonyms:["ideal","outstanding","admirable","model"], antonyms:["poor","unworthy","bad","mediocre"] },
  { word:"Exigent", phonetic:"ek·sih·junt", ipa:"/ˈeksɪdʒənt/", meaning:"pressing and demanding immediate attention", sentence:"The exigent circumstances required an immediate response.", diff:"hard", cats:["academic","literary"], synonyms:["urgent","pressing","demanding","critical"], antonyms:["unimportant","trivial","minor","low-priority"] },
  { word:"Expunge", phonetic:"ek·spunj", ipa:"/ɪkˈspʌndʒ/", meaning:"remove completely from memory or a record", sentence:"She wanted to expunge that painful episode from her memory entirely.", diff:"hard", cats:["academic","literary"], synonyms:["erase","delete","remove","obliterate"], antonyms:["keep","preserve","retain","record"] },
  { word:"Facetious", phonetic:"fah·see·shus", ipa:"/fəˈsiːʃəs/", meaning:"treating serious issues with inappropriately light humour", sentence:"His facetious remark was entirely out of place at such a solemn occasion.", diff:"hard", cats:["character","literary"], synonyms:["flippant","frivolous","glib","jocular"], antonyms:["serious","sincere","earnest","solemn"] },
  { word:"Fallacious", phonetic:"fah·lay·shus", ipa:"/fəˈleɪʃəs/", meaning:"based on a mistaken belief; misleading", sentence:"The argument was fallacious and collapsed under scrutiny.", diff:"hard", cats:["academic","literary"], synonyms:["false","wrong","misleading","erroneous"], antonyms:["sound","correct","valid","truthful"] },
  { word:"Fatalism", phonetic:"fay·tah·liz·um", ipa:"/ˈfeɪtəlɪzəm/", meaning:"the belief that all events are predetermined and inevitable", sentence:"His fatalism prevented him from trying to improve his circumstances.", diff:"hard", cats:["philosophy","literary"], synonyms:["resignation","determinism","passivity","nihilism"], antonyms:["optimism","agency","proactivity","hope"] },
  { word:"Fecund", phonetic:"fek·und", ipa:"/ˈfekənd/", meaning:"producing much new growth or many new ideas; fertile", sentence:"She had a fecund imagination that produced dozens of original stories.", diff:"hard", cats:["literary","literary"], synonyms:["fertile","productive","prolific","creative"], antonyms:["barren","sterile","unproductive","infertile"] },
  { word:"Fervent", phonetic:"fur·vunt", ipa:"/ˈfɜːvənt/", meaning:"having or showing great warmth and sincerity of feeling", sentence:"She was a fervent supporter of free and universal education.", diff:"hard", cats:["character","literary"], synonyms:["passionate","ardent","intense","zealous"], antonyms:["indifferent","apathetic","cold","lukewarm"] },
  { word:"Filibuster", phonetic:"fil·ih·bus·ter", ipa:"/ˈfɪlɪbʌstə/", meaning:"obstruct legislation by making prolonged speeches", sentence:"The senator used a filibuster to prevent the vote from taking place.", diff:"hard", cats:["academic","literary"], synonyms:["obstruct","delay","block","stall"], antonyms:["allow","facilitate","expedite","permit"] },
  { word:"Furtive", phonetic:"fur·tiv", ipa:"/ˈfɜːtɪv/", meaning:"attempting to avoid notice; secretive and sly", sentence:"He cast a furtive glance over his shoulder before slipping away.", diff:"hard", cats:["character","literary"], synonyms:["secretive","sly","sneaky","covert"], antonyms:["open","bold","transparent","obvious"] },
  { word:"Garrulity", phonetic:"gah·roo·lih·tee", ipa:"/ɡəˈruːlɪti/", meaning:"the quality of being excessively talkative", sentence:"Her garrulity was charming in small doses but exhausting at length.", diff:"hard", cats:["character","literary"], synonyms:["talkativeness","verbosity","loquacity","chattering"], antonyms:["taciturnity","silence","reticence","brevity"] },
  { word:"Germane", phonetic:"jur·mayn", ipa:"/dʒɜːˈmeɪn/", meaning:"relevant to a subject under consideration", sentence:"She raised a highly germane question that nobody else had thought to ask.", diff:"hard", cats:["academic","literary"], synonyms:["relevant","pertinent","applicable","appropriate"], antonyms:["irrelevant","inapplicable","unrelated","beside the point"] },
  { word:"Grandiloquent", phonetic:"gran·dil·oh·kwunt", ipa:"/ɡrænˈdɪləkwənt/", meaning:"pompous or extravagant in language or manner", sentence:"His grandiloquent prose obscured rather than illuminated his ideas.", diff:"hard", cats:["literary","literary"], synonyms:["pompous","bombastic","verbose","rhetorical"], antonyms:["plain","modest","simple","understated"] },
  { word:"Gregarious", phonetic:"greh·gair·ee·us", ipa:"/ɡrɪˈɡeəriəs/", meaning:"fond of company; sociable by nature", sentence:"He was gregarious by temperament and hated spending time alone.", diff:"hard", cats:["character","literary"], synonyms:["sociable","outgoing","convivial","affable"], antonyms:["introverted","solitary","reclusive","antisocial"] },
  { word:"Hackneyed", phonetic:"hak·need", ipa:"/ˈhæknid/", meaning:"lacking originality; unoriginal because used too often", sentence:"The speech was full of hackneyed phrases that everyone had heard before.", diff:"hard", cats:["literary","literary"], synonyms:["clichéd","trite","overused","stale"], antonyms:["original","fresh","novel","innovative"] },
  { word:"Hapless", phonetic:"hap·lis", ipa:"/ˈhæpləs/", meaning:"unfortunate and unlucky", sentence:"The hapless traveller arrived at the station just as the train left.", diff:"hard", cats:["literary","literary"], synonyms:["unlucky","unfortunate","wretched","luckless"], antonyms:["lucky","fortunate","blessed","successful"] },
  { word:"Harangue", phonetic:"hah·rang", ipa:"/həˈræŋ/", meaning:"deliver a lengthy and aggressive speech to", sentence:"He harangued the audience for over an hour about their failings.", diff:"hard", cats:["communication","literary"], synonyms:["lecture","berate","rant","scold"], antonyms:["listen","praise","compliment","stay silent"] },
  { word:"Hegemony", phonetic:"heh·jem·oh·nee", ipa:"/hɪˈɡeməni/", meaning:"predominant influence or authority over others", sentence:"The country maintained its economic hegemony for several decades.", diff:"hard", cats:["academic","literary"], synonyms:["dominance","supremacy","control","authority"], antonyms:["subservience","weakness","dependence","submission"] },
  { word:"Heresy", phonetic:"her·ih·see", ipa:"/ˈherɪsi/", meaning:"an opinion profoundly contrary to what is generally accepted", sentence:"In those days, suggesting the earth orbited the sun was heresy.", diff:"hard", cats:["academic","literary"], synonyms:["dissent","blasphemy","heterodoxy","apostasy"], antonyms:["orthodoxy","conformity","tradition","belief"] },
  { word:"Hubris", phonetic:"hyoo·bris", ipa:"/ˈhjuːbrɪs/", meaning:"excessive pride or self-confidence that leads to a downfall", sentence:"His hubris blinded him to the obvious weaknesses in his plan.", diff:"hard", cats:["literary","literary"], synonyms:["arrogance","pride","conceit","overconfidence"], antonyms:["humility","modesty","diffidence","self-awareness"] },
  { word:"Iconoclasm", phonetic:"y·kon·oh·klaz·um", ipa:"/aɪˈkɒnəklæzəm/", meaning:"the attacking of cherished beliefs or established institutions", sentence:"Her iconoclasm made her controversial but ultimately influential.", diff:"hard", cats:["academic","literary"], synonyms:["nonconformity","dissent","radicalism","rebellion"], antonyms:["conformity","tradition","conservatism","orthodoxy"] },
  { word:"Idiosyncratic", phonetic:"id·ee·oh·sin·krat·ik", ipa:"/ˌɪdiəsɪŋˈkrætɪk/", meaning:"peculiar or individual in a distinctive and unusual way", sentence:"Her idiosyncratic painting style was instantly recognisable.", diff:"hard", cats:["character","literary"], synonyms:["eccentric","quirky","unusual","distinctive"], antonyms:["conventional","ordinary","typical","unremarkable"] },
  { word:"Ignominious", phonetic:"ig·noh·min·ee·us", ipa:"/ˌɪɡnəˈmɪniəs/", meaning:"deserving or causing public disgrace or shame", sentence:"He suffered an ignominious defeat after a campaign of such high expectations.", diff:"hard", cats:["literary","literary"], synonyms:["disgraceful","shameful","humiliating","dishonourable"], antonyms:["glorious","honourable","triumphant","praiseworthy"] },
  { word:"Immutable", phonetic:"ih·myoo·tah·bul", ipa:"/ɪˈmjuːtəbəl/", meaning:"unchanging over time or unable to be changed or altered", sentence:"These were regarded as immutable principles of natural law.", diff:"hard", cats:["academic","literary"], synonyms:["unchangeable","permanent","fixed","constant"], antonyms:["changeable","mutable","variable","flexible"] },
  { word:"Impecunious", phonetic:"im·peh·kyoo·nee·us", ipa:"/ˌɪmpɪˈkjuːniəs/", meaning:"having little or no money; penniless", sentence:"The impecunious student struggled to afford even basic necessities.", diff:"hard", cats:["literary","literary"], synonyms:["poor","penniless","destitute","broke"], antonyms:["wealthy","affluent","rich","prosperous"] },
  { word:"Implacable", phonetic:"im·plak·ah·bul", ipa:"/ɪmˈplækəbəl/", meaning:"unable to be appeased or satisfied; relentless", sentence:"She was an implacable opponent who never gave up the fight.", diff:"hard", cats:["character","literary"], synonyms:["relentless","unyielding","inexorable","merciless"], antonyms:["flexible","forgiving","accommodating","yielding"] },
  { word:"Impudent", phonetic:"im·pyoo·dunt", ipa:"/ˈɪmpjʊdənt/", meaning:"not showing due respect; bold and impertinent", sentence:"Her impudent reply shocked the interviewer into silence.", diff:"hard", cats:["character","literary"], synonyms:["insolent","impertinent","rude","audacious"], antonyms:["respectful","polite","courteous","deferential"] },
  { word:"Inane", phonetic:"ih·nayn", ipa:"/ɪˈneɪn/", meaning:"lacking sense or meaning; silly", sentence:"His inane comments contributed nothing to the debate.", diff:"hard", cats:["character","literary"], synonyms:["silly","meaningless","foolish","vapid"], antonyms:["sensible","meaningful","intelligent","profound"] },
  { word:"Incorrigible", phonetic:"in·kor·ih·jih·bul", ipa:"/ɪnˈkɒrɪdʒɪbəl/", meaning:"not able to be corrected, improved, or reformed", sentence:"He was an incorrigible optimist who saw good in everything.", diff:"hard", cats:["character","literary"], synonyms:["hopeless","irredeemable","hardened","confirmed"], antonyms:["reformable","improvable","teachable","correctable"] },
  { word:"Insolent", phonetic:"in·soh·lunt", ipa:"/ˈɪnsələnt/", meaning:"showing a rude and overbearing lack of respect", sentence:"The insolent student refused to stand when the headteacher entered.", diff:"hard", cats:["character","literary"], synonyms:["rude","disrespectful","impertinent","contemptuous"], antonyms:["respectful","polite","deferential","courteous"] },
  { word:"Insular", phonetic:"in·syoo·ler", ipa:"/ˈɪnsjʊlə/", meaning:"ignorant of or uninterested in what lies beyond one's experience", sentence:"His insular worldview prevented him from engaging with new ideas.", diff:"hard", cats:["character","literary"], synonyms:["narrow-minded","parochial","isolated","provincial"], antonyms:["cosmopolitan","broad-minded","worldly","open"] },
  { word:"Intrepid", phonetic:"in·trep·id", ipa:"/ɪnˈtrepɪd/", meaning:"fearless and adventurous; bold", sentence:"The intrepid explorer crossed the ice field alone.", diff:"hard", cats:["character","literary"], synonyms:["fearless","brave","bold","dauntless"], antonyms:["cowardly","timid","fearful","cautious"] },
  { word:"Irascible", phonetic:"ih·ras·ih·bul", ipa:"/ɪˈræsɪbəl/", meaning:"having or showing a tendency to be easily angered", sentence:"He was irascible by nature and quick to take offence.", diff:"hard", cats:["character","literary"], synonyms:["irritable","hot-tempered","cantankerous","choleric"], antonyms:["calm","even-tempered","patient","placid"] },
  { word:"Jocular", phonetic:"jok·yoo·ler", ipa:"/ˈdʒɒkjʊlə/", meaning:"fond of or characterised by joking; humorous", sentence:"His jocular manner put everyone immediately at ease.", diff:"hard", cats:["character","literary"], synonyms:["humorous","jolly","playful","witty"], antonyms:["serious","solemn","grave","humourless"] },
  { word:"Lachrymose", phonetic:"lak·rih·mohs", ipa:"/ˈlækrɪməʊs/", meaning:"tearful or given to weeping; mournful", sentence:"The lachrymose film left the entire audience in tears.", diff:"hard", cats:["literary","literary"], synonyms:["tearful","weeping","mournful","sad"], antonyms:["cheerful","happy","upbeat","joyful"] },
  { word:"Languid", phonetic:"lang·gwid", ipa:"/ˈlæŋɡwɪd/", meaning:"displaying or having a disinclination for physical effort", sentence:"She spent the afternoon in languid contemplation by the river.", diff:"hard", cats:["literary","literary"], synonyms:["listless","slow","sluggish","unenergetic"], antonyms:["energetic","lively","vigorous","active"] },
  { word:"Magniloquent", phonetic:"mag·nil·oh·kwunt", ipa:"/mæɡˈnɪləkwənt/", meaning:"using high-flown or bombastic language", sentence:"His magniloquent prose impressed few who actually understood it.", diff:"hard", cats:["literary","literary"], synonyms:["pompous","grandiose","bombastic","verbose"], antonyms:["plain","simple","modest","understated"] },
  { word:"Malevolent", phonetic:"mah·lev·oh·lunt", ipa:"/məˈlevələnt/", meaning:"having or showing a wish to do evil to others", sentence:"The malevolent character in the novel was utterly chilling.", diff:"hard", cats:["character","literary"], synonyms:["evil","spiteful","malicious","wicked"], antonyms:["benevolent","kind","gentle","compassionate"] },
  { word:"Mendacity", phonetic:"men·das·ih·tee", ipa:"/menˈdæsɪti/", meaning:"untruthfulness; the tendency to tell lies", sentence:"The witness\'s mendacity was eventually exposed under cross-examination.", diff:"hard", cats:["character","literary"], synonyms:["dishonesty","deceit","lying","falseness"], antonyms:["honesty","truthfulness","sincerity","candour"] },
  { word:"Meretricious", phonetic:"mer·eh·trish·us", ipa:"/ˌmerɪˈtrɪʃəs/", meaning:"apparently attractive but showy and false", sentence:"The meretricious glitter of the entertainment world soon faded.", diff:"hard", cats:["literary","literary"], synonyms:["showy","flashy","gaudy","fake"], antonyms:["genuine","tasteful","authentic","understated"] },
  { word:"Metamorphosis", phonetic:"met·ah·mor·foh·sis", ipa:"/ˌmetəˈmɔːfəsɪs/", meaning:"a complete change of form, nature, or character", sentence:"The city underwent a remarkable metamorphosis over the decade.", diff:"hard", cats:["academic","literary"], synonyms:["transformation","change","evolution","conversion"], antonyms:["stagnation","preservation","continuation","sameness"] },
  { word:"Mutable", phonetic:"myoo·tah·bul", ipa:"/ˈmjuːtəbəl/", meaning:"liable to change; changeable and inconstant", sentence:"Fashion is inherently mutable and never stays the same for long.", diff:"hard", cats:["academic","literary"], synonyms:["changeable","variable","fluid","flexible"], antonyms:["immutable","fixed","constant","unchangeable"] },
  { word:"Mystify", phonetic:"mis·tih·fy", ipa:"/ˈmɪstɪfaɪ/", meaning:"utterly bewilder or perplex", sentence:"The magician\'s performance continued to mystify even the sceptics.", diff:"hard", cats:["everyday","literary"], synonyms:["puzzle","bewilder","confuse","perplex"], antonyms:["explain","clarify","illuminate","enlighten"] },
  { word:"Nepotism", phonetic:"nep·oh·tiz·um", ipa:"/ˈnepətɪzəm/", meaning:"giving jobs to relatives regardless of their merit", sentence:"The minister was accused of nepotism for appointing his nephew.", diff:"hard", cats:["academic","literary"], synonyms:["favouritism","cronyism","partisanship","bias"], antonyms:["meritocracy","fairness","impartiality","equity"] },
  { word:"Nihilism", phonetic:"ny·ih·liz·um", ipa:"/ˈnaɪɪlɪzəm/", meaning:"the rejection of all moral and religious principles", sentence:"His nihilism made it impossible for him to find any sense of meaning.", diff:"hard", cats:["philosophy","literary"], synonyms:["cynicism","pessimism","despair","negativism"], antonyms:["idealism","optimism","faith","hope"] },
  { word:"Noxious", phonetic:"nok·shus", ipa:"/ˈnɒkʃəs/", meaning:"harmful, poisonous, or very unpleasant", sentence:"The factory was producing noxious gases that harmed residents nearby.", diff:"hard", cats:["scientific","literary"], synonyms:["harmful","toxic","poisonous","dangerous"], antonyms:["harmless","safe","wholesome","benign"] },
  { word:"Oblique", phonetic:"oh·bleek", ipa:"/əˈbliːk/", meaning:"not direct in approach; indirect and somewhat misleading", sentence:"He made an oblique reference to her past that she found unsettling.", diff:"hard", cats:["communication","literary"], synonyms:["indirect","roundabout","evasive","ambiguous"], antonyms:["direct","straight","explicit","frank"] },
  { word:"Obstinate", phonetic:"ob·stih·nit", ipa:"/ˈɒbstɪnɪt/", meaning:"stubbornly refusing to change one's opinion", sentence:"He was too obstinate to admit that he had been wrong.", diff:"hard", cats:["character","literary"], synonyms:["stubborn","headstrong","unyielding","determined"], antonyms:["flexible","open-minded","accommodating","yielding"] },
  { word:"Opaque", phonetic:"oh·payk", ipa:"/əʊˈpeɪk/", meaning:"not able to be seen through; difficult to understand", sentence:"His explanation was deliberately opaque and left everyone confused.", diff:"hard", cats:["academic","literary"], synonyms:["unclear","obscure","murky","impenetrable"], antonyms:["transparent","clear","obvious","comprehensible"] },
  { word:"Opportunistic", phonetic:"op·or·tyoo·nis·tik", ipa:"/ˌɒpətjuːˈnɪstɪk/", meaning:"exploiting immediately available opportunities", sentence:"His opportunistic behaviour angered those who had trusted him.", diff:"hard", cats:["character","literary"], synonyms:["exploitative","calculating","self-serving","pragmatic"], antonyms:["principled","ethical","disinterested","fair"] },
  { word:"Ostentatious", phonetic:"os·ten·tay·shus", ipa:"/ˌɒstenˈteɪʃəs/", meaning:"characterised by vulgar or excessive display", sentence:"Her ostentatious jewellery was designed to attract maximum attention.", diff:"hard", cats:["character","literary"], synonyms:["showy","flamboyant","pretentious","flashy"], antonyms:["modest","understated","simple","restrained"] },
  { word:"Overt", phonetic:"oh·vurt", ipa:"/əʊˈvɜːt/", meaning:"done openly; not secret", sentence:"His overt hostility towards her made the meeting very uncomfortable.", diff:"hard", cats:["communication","literary"], synonyms:["obvious","open","apparent","blatant"], antonyms:["covert","hidden","secret","subtle"] },
  { word:"Palpable", phonetic:"pal·pah·bul", ipa:"/ˈpælpəbəl/", meaning:"able to be touched or felt; so intense as to be almost felt", sentence:"The tension in the room was palpable and impossible to ignore.", diff:"hard", cats:["literary","literary"], synonyms:["tangible","real","noticeable","evident"], antonyms:["imperceptible","intangible","vague","subtle"] },
  { word:"Panegyric", phonetic:"pan·eh·jir·ik", ipa:"/ˌpænɪˈdʒɪrɪk/", meaning:"a public speech or published text in praise of someone", sentence:"The biographical film was more panegyric than honest portrait.", diff:"hard", cats:["literary","literary"], synonyms:["tribute","eulogy","encomium","praise"], antonyms:["criticism","condemnation","censure","attack"] },
  { word:"Paramount", phonetic:"par·ah·mownt", ipa:"/ˈpærəmaʊnt/", meaning:"more important than anything else; supreme", sentence:"The paramount concern of every government must be public safety.", diff:"hard", cats:["academic","literary"], synonyms:["supreme","foremost","primary","chief"], antonyms:["unimportant","minor","secondary","trivial"] },
  { word:"Pernicious", phonetic:"pur·nish·us", ipa:"/pəˈnɪʃəs/", meaning:"having a harmful effect, especially gradually", sentence:"The pernicious influence of the cult had damaged many lives.", diff:"hard", cats:["literary","literary"], synonyms:["harmful","damaging","destructive","dangerous"], antonyms:["beneficial","helpful","positive","constructive"] },
  { word:"Perspicacity", phonetic:"pur·spih·kas·ih·tee", ipa:"/ˌpɜːspɪˈkæsɪti/", meaning:"having a ready insight; shrewdness", sentence:"Her perspicacity allowed her to see through his façade immediately.", diff:"hard", cats:["character","literary"], synonyms:["shrewdness","insight","perceptiveness","acuity"], antonyms:["dullness","obtuseness","ignorance","imperceptiveness"] },
  { word:"Petty", phonetic:"pet·ee", ipa:"/ˈpeti/", meaning:"of little importance; mean in a small or spiteful way", sentence:"She refused to be drawn into petty office arguments.", diff:"hard", cats:["character","literary"], synonyms:["trivial","minor","small-minded","spiteful"], antonyms:["important","significant","generous","magnanimous"] },
  { word:"Philanthropy", phonetic:"fih·lan·throh·pee", ipa:"/fɪˈlænθrəpi/", meaning:"the desire to promote the welfare of others; charitable giving", sentence:"Her philanthropy funded dozens of schools across the country.", diff:"hard", cats:["social","literary"], synonyms:["charity","benevolence","generosity","humanitarianism"], antonyms:["selfishness","greed","avarice","misanthropy"] },
  { word:"Phlegmatic", phonetic:"fleg·mat·ik", ipa:"/fleɡˈmætɪk/", meaning:"having a calm, stolidly unemotional manner", sentence:"His phlegmatic response to the crisis surprised those who expected panic.", diff:"hard", cats:["character","literary"], synonyms:["calm","impassive","unflappable","stoic"], antonyms:["excitable","emotional","passionate","reactive"] },
  { word:"Piquant", phonetic:"pee·kwunt", ipa:"/ˈpiːkənt/", meaning:"pleasantly stimulating to the senses; having a lively quality", sentence:"The story had a piquant twist that delighted readers.", diff:"hard", cats:["literary","literary"], synonyms:["stimulating","lively","interesting","pungent"], antonyms:["bland","dull","insipid","uninteresting"] },
  { word:"Plethora", phonetic:"pleth·or·ah", ipa:"/ˈpleθərə/", meaning:"a large or excessive amount of something", sentence:"There was a plethora of advice available but very little of it was useful.", diff:"hard", cats:["academic","literary"], synonyms:["abundance","excess","surplus","profusion"], antonyms:["lack","scarcity","shortage","dearth"] },
  { word:"Poignant", phonetic:"poy·nyunt", ipa:"/ˈpɔɪnjənt/", meaning:"evoking a keen sense of sadness or regret", sentence:"The final scene of the play was deeply poignant.", diff:"hard", cats:["literary","literary"], synonyms:["moving","touching","emotional","heartfelt"], antonyms:["unemotional","cold","indifferent","detached"] },
  { word:"Polemic", phonetic:"poh·lem·ik", ipa:"/pəˈlemɪk/", meaning:"a strong verbal or written attack on a person or idea", sentence:"The article was a polemic against the failures of modern medicine.", diff:"hard", cats:["communication","literary"], synonyms:["attack","criticism","tirade","diatribe"], antonyms:["defence","praise","support","commendation"] },
  { word:"Pragmatism", phonetic:"prag·mah·tiz·um", ipa:"/ˈpræɡmətɪzəm/", meaning:"dealing with things practically rather than theoretically", sentence:"Her pragmatism served her well in the complex world of politics.", diff:"hard", cats:["philosophy","literary"], synonyms:["practicality","realism","common sense","functionality"], antonyms:["idealism","utopianism","dogmatism","theory"] },
  { word:"Prosaic", phonetic:"proh·zay·ik", ipa:"/prəˈzeɪɪk/", meaning:"having the style of prose as opposed to poetry; dull and unimaginative", sentence:"He gave a prosaic account of the adventure that failed to excite.", diff:"hard", cats:["literary","literary"], synonyms:["ordinary","dull","unimaginative","mundane"], antonyms:["poetic","imaginative","inspiring","lyrical"] },
  { word:"Querulous", phonetic:"kwer·uh·lus", ipa:"/ˈkwerʊləs/", meaning:"complaining in a whining manner; fretful", sentence:"Her querulous tone alienated those who might otherwise have helped.", diff:"hard", cats:["character","literary"], synonyms:["whining","peevish","grumbling","complaining"], antonyms:["content","cheerful","satisfied","easygoing"] },
  { word:"Quiescence", phonetic:"kwee·es·uns", ipa:"/kwiˈesəns/", meaning:"a state of inactivity or dormancy", sentence:"There was a brief quiescence before the storm began in earnest.", diff:"hard", cats:["literary","literary"], synonyms:["stillness","inactivity","calm","dormancy"], antonyms:["activity","agitation","movement","energy"] },
  { word:"Rancour", phonetic:"rank·er", ipa:"/ˈræŋkə/", meaning:"a feeling of bitter resentment or hostility", sentence:"There was deep rancour between the two factions that never healed.", diff:"hard", cats:["character","literary"], synonyms:["bitterness","resentment","hatred","hostility"], antonyms:["goodwill","warmth","cordiality","friendship"] },
  { word:"Rapacious", phonetic:"rah·pay·shus", ipa:"/rəˈpeɪʃəs/", meaning:"aggressively greedy or grasping", sentence:"The rapacious developer destroyed the wetlands for profit.", diff:"hard", cats:["character","literary"], synonyms:["greedy","grasping","voracious","avaricious"], antonyms:["generous","satisfied","content","giving"] },
  { word:"Recalcitrant", phonetic:"reh·kal·sih·trunt", ipa:"/rɪˈkælsɪtrənt/", meaning:"obstinately resistant to authority; uncooperative", sentence:"The recalcitrant employee refused every reasonable request.", diff:"hard", cats:["character","literary"], synonyms:["defiant","uncooperative","rebellious","stubborn"], antonyms:["compliant","cooperative","obedient","amenable"] },
  { word:"Redolent", phonetic:"red·oh·lunt", ipa:"/ˈredələnt/", meaning:"strongly reminiscent or suggestive of something", sentence:"The old house was redolent of lavender and childhood memories.", diff:"hard", cats:["literary","literary"], synonyms:["evocative","suggestive","reminiscent","fragrant"], antonyms:["unscented","unrelated","dissimilar","neutral"] },
  { word:"Reprehensible", phonetic:"rep·reh·hen·sih·bul", ipa:"/ˌreprɪˈhensɪbəl/", meaning:"deserving censure or condemnation", sentence:"His behaviour was described as reprehensible by the judge.", diff:"hard", cats:["character","literary"], synonyms:["disgraceful","inexcusable","shameful","appalling"], antonyms:["admirable","praiseworthy","exemplary","acceptable"] },
  { word:"Resigned", phonetic:"reh·zynd", ipa:"/rɪˈzaɪnd/", meaning:"having accepted something undesirable but inevitable", sentence:"She was resigned to spending another year working on the project.", diff:"hard", cats:["character","literary"], synonyms:["accepting","submissive","stoic","passive"], antonyms:["hopeful","resistant","defiant","fighting"] },
  { word:"Resolute", phonetic:"rez·oh·loot", ipa:"/ˈrezəluːt/", meaning:"admirably purposeful, determined, and unwavering", sentence:"She remained resolute in her commitment despite enormous pressure.", diff:"hard", cats:["character","literary"], synonyms:["determined","firm","steadfast","unwavering"], antonyms:["irresolute","weak","wavering","indecisive"] },
  { word:"Rhetoric", phonetic:"ret·oh·rik", ipa:"/ˈretərɪk/", meaning:"language designed to have a persuasive or impressive effect", sentence:"His rhetoric was powerful but many found it ultimately hollow.", diff:"hard", cats:["communication","literary"], synonyms:["oratory","persuasion","language","eloquence"], antonyms:["plain speech","honesty","bluntness","directness"] },
  { word:"Sagacity", phonetic:"sah·gas·ih·tee", ipa:"/səˈɡæsɪti/", meaning:"the quality of being wise and having good judgement", sentence:"His sagacity in financial matters saved the company.", diff:"hard", cats:["character","literary"], synonyms:["wisdom","shrewdness","judgement","insight"], antonyms:["foolishness","ignorance","naivety","stupidity"] },
  { word:"Sanctimonious", phonetic:"sank·tih·moh·nee·us", ipa:"/ˌsæŋktɪˈməʊniəs/", meaning:"making a show of being morally superior to others", sentence:"His sanctimonious lectures about ethics annoyed his colleagues.", diff:"hard", cats:["character","literary"], synonyms:["self-righteous","preachy","hypocritical","smug"], antonyms:["humble","sincere","genuine","modest"] },
  { word:"Sardonic", phonetic:"sar·don·ik", ipa:"/sɑːˈdɒnɪk/", meaning:"grimly mocking or cynical", sentence:"He observed the chaos with sardonic amusement.", diff:"hard", cats:["literary","literary"], synonyms:["mocking","cynical","sarcastic","wry"], antonyms:["sincere","warm","earnest","kind"] },
  { word:"Sedulous", phonetic:"sed·yoo·lus", ipa:"/ˈsedjʊləs/", meaning:"showing dedicated and diligent attention", sentence:"His sedulous research produced a truly definitive biography.", diff:"hard", cats:["character","literary"], synonyms:["diligent","assiduous","industrious","conscientious"], antonyms:["lazy","careless","negligent","half-hearted"] },
  { word:"Solecism", phonetic:"sol·eh·siz·um", ipa:"/ˈsɒlɪsɪzəm/", meaning:"a grammatical mistake; a breach of etiquette", sentence:"Using \'decimate\' to mean \'destroy completely\' is technically a solecism.", diff:"hard", cats:["literary","literary"], synonyms:["error","mistake","blunder","impropriety"], antonyms:["correctness","propriety","accuracy","elegance"] },
  { word:"Solipsism", phonetic:"sol·ip·siz·um", ipa:"/ˈsɒlɪpsɪzəm/", meaning:"the view that only one's own mind is known to exist", sentence:"His solipsism made genuine empathy and connection nearly impossible.", diff:"hard", cats:["philosophy","literary"], synonyms:["self-absorption","egocentrism","narcissism","introversion"], antonyms:["altruism","empathy","social awareness","community"] },
  { word:"Specious", phonetic:"spee·shus", ipa:"/ˈspiːʃəs/", meaning:"superficially plausible but actually wrong or misleading", sentence:"The argument was specious and collapsed under any real scrutiny.", diff:"hard", cats:["academic","literary"], synonyms:["misleading","fallacious","plausible-sounding","false"], antonyms:["sound","valid","genuine","correct"] },
  { word:"Squalid", phonetic:"skwol·id", ipa:"/ˈskwɒlɪd/", meaning:"extremely dirty and unpleasant; showing a contemptible lack of moral standards", sentence:"The living conditions were squalid and utterly inhumane.", diff:"hard", cats:["literary","literary"], synonyms:["filthy","dirty","sordid","wretched"], antonyms:["clean","decent","respectable","comfortable"] },
  { word:"Stoic", phonetic:"stoh·ik", ipa:"/ˈstəʊɪk/", meaning:"enduring pain and difficulty without complaint", sentence:"She bore her illness with quiet, stoic dignity.", diff:"hard", cats:["philosophy","literary"], synonyms:["impassive","patient","enduring","composed"], antonyms:["emotional","expressive","sensitive","reactive"] },
  { word:"Strident", phonetic:"stry·dunt", ipa:"/ˈstraɪdənt/", meaning:"making or having a harsh sound; presenting a point of view in a harsh way", sentence:"Her strident criticism alienated many who might have been sympathetic.", diff:"hard", cats:["character","literary"], synonyms:["harsh","loud","aggressive","shrill"], antonyms:["gentle","soft","measured","restrained"] },
  { word:"Sublime", phonetic:"sub·lym", ipa:"/səˈblaɪm/", meaning:"of such excellence that it inspires great admiration", sentence:"The view from the summit was truly sublime.", diff:"hard", cats:["literary","literary"], synonyms:["magnificent","glorious","exquisite","transcendent"], antonyms:["ordinary","mediocre","poor","mundane"] },
  { word:"Surreptitious", phonetic:"sur·ep·tish·us", ipa:"/ˌsʌrəpˈtɪʃəs/", meaning:"kept secret; done by stealth", sentence:"He cast a surreptitious glance at his rival\'s paper.", diff:"hard", cats:["character","literary"], synonyms:["secretive","covert","stealthy","furtive"], antonyms:["open","transparent","overt","obvious"] },
  { word:"Temerity", phonetic:"teh·mer·ih·tee", ipa:"/tɪˈmerɪti/", meaning:"excessive confidence or boldness; audacity", sentence:"She had the temerity to question the board\'s decision directly.", diff:"hard", cats:["character","literary"], synonyms:["audacity","boldness","nerve","cheek"], antonyms:["timidity","caution","cowardice","deference"] },
  { word:"Tendentious", phonetic:"ten·den·shus", ipa:"/tenˈdenʃəs/", meaning:"promoting a particular cause or point of view", sentence:"The programme was widely criticised as tendentious and unfair.", diff:"hard", cats:["communication","literary"], synonyms:["biased","partisan","slanted","one-sided"], antonyms:["balanced","impartial","objective","neutral"] },
  { word:"Terse", phonetic:"turs", ipa:"/tɜːs/", meaning:"sparing in the use of words; brief and abrupt", sentence:"His terse reply made it clear that he did not wish to discuss it.", diff:"hard", cats:["communication","literary"], synonyms:["brief","concise","blunt","curt"], antonyms:["verbose","wordy","expansive","long-winded"] },
  { word:"Torpid", phonetic:"tor·pid", ipa:"/ˈtɔːpɪd/", meaning:"mentally or physically inactive; sluggish and lethargic", sentence:"The torpid economy showed little sign of recovery.", diff:"hard", cats:["character","literary"], synonyms:["sluggish","lethargic","dormant","inactive"], antonyms:["active","energetic","vibrant","lively"] },
  { word:"Truculent", phonetic:"truk·yoo·lunt", ipa:"/ˈtrʌkjʊlənt/", meaning:"eager to argue or fight; aggressively defiant", sentence:"The truculent employee made every meeting a confrontation.", diff:"hard", cats:["literary","literary"], synonyms:["combative","aggressive","belligerent","confrontational"], antonyms:["cooperative","peaceful","docile","gentle"] },
  { word:"Tumultuous", phonetic:"tyoo·mul·choo·us", ipa:"/tjuːˈmʌltʃuəs/", meaning:"making a loud, confused noise; excited, confused, or disorderly", sentence:"It was a tumultuous period in the nation\'s history.", diff:"hard", cats:["literary","literary"], synonyms:["chaotic","turbulent","stormy","loud"], antonyms:["calm","peaceful","orderly","quiet"] },
  { word:"Turgid", phonetic:"tur·jid", ipa:"/ˈtɜːdʒɪd/", meaning:"swollen; pompous or tediously complex in style", sentence:"The report was so turgid and overwritten that it was almost unreadable.", diff:"hard", cats:["literary","literary"], synonyms:["pompous","overblown","bloated","verbose"], antonyms:["simple","clear","concise","readable"] },
  { word:"Ubiquitous", phonetic:"yoo·bik·wih·tus", ipa:"/juːˈbɪkwɪtəs/", meaning:"present or found everywhere at the same time", sentence:"Plastic has become ubiquitous and is now found even in the deepest oceans.", diff:"hard", cats:["academic","literary"], synonyms:["omnipresent","pervasive","universal","widespread"], antonyms:["rare","absent","uncommon","scarce"] },
  { word:"Vacuous", phonetic:"vak·yoo·us", ipa:"/ˈvækjuəs/", meaning:"having or showing a lack of thought or intelligence", sentence:"The celebrity interview was vacuous and completely without substance.", diff:"hard", cats:["character","literary"], synonyms:["empty","shallow","inane","pointless"], antonyms:["thoughtful","intelligent","profound","meaningful"] },
  { word:"Variegated", phonetic:"vair·ee·eh·gay·tid", ipa:"/ˈveəriɪɡeɪtɪd/", meaning:"exhibiting different colours; varied in appearance or character", sentence:"The variegated leaves of the plant were its most striking feature.", diff:"hard", cats:["literary","literary"], synonyms:["varied","diverse","multicoloured","mixed"], antonyms:["uniform","monochromatic","homogeneous","plain"] },
  { word:"Venality", phonetic:"veh·nal·ih·tee", ipa:"/viːˈnælɪti/", meaning:"the showing of a willingness to act dishonestly for money", sentence:"The venality of the officials became apparent during the inquiry.", diff:"hard", cats:["character","literary"], synonyms:["corruption","greed","bribery","dishonesty"], antonyms:["integrity","honesty","incorruptibility","virtue"] },
  { word:"Verbose", phonetic:"vur·bohs", ipa:"/vɜːˈbəʊs/", meaning:"using or expressed in more words than are needed", sentence:"His verbose style tested the patience of even the most dedicated reader.", diff:"hard", cats:["communication","literary"], synonyms:["wordy","long-winded","garrulous","rambling"], antonyms:["concise","succinct","brief","pithy"] },
  { word:"Vicious", phonetic:"vish·us", ipa:"/ˈvɪʃəs/", meaning:"deliberately cruel or violent; of a severe nature", sentence:"The vicious attack left the victim with lifelong injuries.", diff:"hard", cats:["character","literary"], synonyms:["cruel","savage","brutal","violent"], antonyms:["gentle","kind","mild","humane"] },
  { word:"Vindictive", phonetic:"vin·dik·tiv", ipa:"/vɪnˈdɪktɪv/", meaning:"having or showing a strong desire to harm someone who has harmed you", sentence:"She was vindictive towards anyone who had ever crossed her.", diff:"hard", cats:["character","literary"], synonyms:["spiteful","vengeful","retaliatory","unforgiving"], antonyms:["forgiving","magnanimous","generous","lenient"] },
  { word:"Virulent", phonetic:"vir·yoo·lunt", ipa:"/ˈvɪrʊlənt/", meaning:"extremely severe or harmful in its effects; bitterly hostile", sentence:"The virulent strain of the virus spread with alarming speed.", diff:"hard", cats:["scientific","literary"], synonyms:["deadly","harmful","potent","caustic"], antonyms:["mild","harmless","benign","gentle"] },
  { word:"Vitriolic", phonetic:"vit·ree·ol·ik", ipa:"/ˌvɪtriˈɒlɪk/", meaning:"filled with bitter criticism; sharp and corrosive", sentence:"The vitriolic review destroyed the author\'s confidence entirely.", diff:"hard", cats:["character","literary"], synonyms:["bitter","scathing","caustic","venomous"], antonyms:["gentle","kind","supportive","favourable"] },
  { word:"Vociferous", phonetic:"voh·sif·er·us", ipa:"/vəˈsɪfərəs/", meaning:"expressing or characterised by vehement opinions loudly", sentence:"She was a vociferous opponent of the new development plans.", diff:"hard", cats:["communication","literary"], synonyms:["loud","outspoken","clamorous","noisy"], antonyms:["quiet","subdued","restrained","silent"] },
  { word:"Wistful", phonetic:"wist·ful", ipa:"/ˈwɪstfʊl/", meaning:"having or showing a feeling of vague or regretful longing", sentence:"She gave a wistful smile as she thought about the past.", diff:"hard", cats:["emotion","literary"], synonyms:["nostalgic","pensive","longing","melancholy"], antonyms:["cheerful","content","upbeat","carefree"] },
  { word:"Zealotry", phonetic:"zel·uh·tree", ipa:"/ˈzelətri/", meaning:"fanatical and uncompromising pursuit of religious or political ideals", sentence:"His zealotry alienated allies who might otherwise have joined his cause.", diff:"hard", cats:["character","literary"], synonyms:["fanaticism","extremism","fervour","obsession"], antonyms:["moderation","tolerance","restraint","flexibility"] },
];

// ── Vocabulary helpers ──
const VOCAB_CATS = ["all","everyday","character","communication","social","emotion","business","academic","literary","scientific","action","quality","knowledge","philosophy","lifestyle","power","culture"];
const VOCAB_MODES = [
  { key:"word2meaning", label:"WORD → MEANING",   desc:"See the word, pick its definition", icon:"📖" },
  { key:"meaning2word", label:"MEANING → WORD",   desc:"See the definition, identify the word", icon:"🔤" },
  { key:"antonym",      label:"ANTONYM ROUND",    desc:"Pick the opposite meaning", icon:"↔️" },
  { key:"spelling",     label:"SPELLING ROUND",   desc:"See the definition, type the word", icon:"✏️" },
  { key:"review",       label:"❌ WRONG ANSWERS",  desc:"Words you got wrong (5 correct = mastered)", icon:"🔁" },
];

function getVocabPool(diff, cat, seenRecently) {
  let pool = VOCAB_WORDS.filter(w => {
    if (diff !== "all" && w.diff !== diff) return false;
    if (cat !== "all") { const wc = w.cats || (w.cat ? [w.cat] : ["everyday"]); if (!wc.includes(cat)) return false; }
    if (isWordFullyMastered(w.word)) return false; // skip fully mastered words
    if (isWordDisabled(w.word)) return false; // skip disabled words
    return true;
  });
  // If all words are mastered/disabled, include non-disabled anyway (so game doesn't break)
  if (pool.length < 4) {
    pool = VOCAB_WORDS.filter(w => {
      if (diff !== "all" && w.diff !== diff) return false;
      if (cat !== "all") { const wc = w.cats || (w.cat ? [w.cat] : ["everyday"]); if (!wc.includes(cat)) return false; }
      if (isWordDisabled(w.word)) return false;
      return true;
    });
  }
  // Last resort: all non-disabled words
  if (pool.length < 4) {
    pool = VOCAB_WORDS.filter(w => !isWordDisabled(w.word));
  }
  // Prefer unseen words
  const unseen = pool.filter(w => !seenRecently.has(w.word));
  return unseen.length >= 4 ? unseen : pool;
}

function makeVocabQuestion(word, mode, pool) {
  if (!word || !mode) return null;
  const ant = word.antonyms || [];
  const syn = word.synonyms || [];
  if (mode === "word2meaning") {
    const wrongs = pool.filter(w => w.word !== word.word).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.meaning);
    while (wrongs.length < 3) wrongs.push("none of the above");
    const choices = [...wrongs, word.meaning].sort(() => Math.random() - 0.5);
    return { type:"word2meaning", prompt: word.word, answer: word.meaning, choices, word };
  }
  if (mode === "meaning2word") {
    const wrongs = pool.filter(w => w.word !== word.word).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.word);
    while (wrongs.length < 3) wrongs.push("—");
    const choices = [...wrongs, word.word].sort(() => Math.random() - 0.5);
    return { type:"meaning2word", prompt: word.meaning, answer: word.word, choices, word };
  }
  if (mode === "antonym") {
    if (ant.length === 0) {
      // Fall back to word2meaning if no antonyms
      const wrongs = pool.filter(w => w.word !== word.word).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.meaning);
      const choices = [...wrongs, word.meaning].sort(() => Math.random() - 0.5);
      return { type:"word2meaning", prompt: word.word, answer: word.meaning, choices, word };
    }
    const correct = ant[0];
    const otherAntonyms = pool.filter(w => w.word !== word.word).flatMap(w => w.antonyms||[]).filter(a => !ant.includes(a));
    const wrongs = [...new Set(otherAntonyms)].sort(() => Math.random() - 0.5).slice(0, 3);
    while (wrongs.length < 3) wrongs.push(pool[Math.floor(Math.random()*pool.length)].word);
    const choices = [...wrongs, correct].sort(() => Math.random() - 0.5);
    return { type:"antonym", prompt: word.word, answer: correct, choices, word };
  }
  if (mode === "spelling") {
    return { type:"spelling", prompt: word.meaning, answer: word.word.toLowerCase(), choices: null, word };
  }
  return null;
}

// Persistent vocab state helpers
function loadVocabSave() {
  try { const r = localStorage.getItem("mathos_vocab_v1"); return r ? JSON.parse(r) : null; } catch(e) { return null; }
}
function writeVocabSave(d) { try { localStorage.setItem("mathos_vocab_v1", JSON.stringify(d)); } catch(e) {} }
function buildDefaultVocabSave() { return { wrongWords: {}, masteredWords: [], seenWords: [], wordStats: {}, wordMastery: {}, disabledWords: [], userName: null, onboarded: false, preferredDiff: "easy", preferredModules: ["math","vocab","sudoku"] }; }

let vocabSave = loadVocabSave() || buildDefaultVocabSave();
// wrongWords: { word: { count: N, correctStreak: N } }
// masteredWords: [word strings mastered from review]
// seenWords: [word strings seen recently — persistent]

function recordVocabWrong(word) {
  if (!vocabSave.wordStats) vocabSave.wordStats = {};
  if (!vocabSave.wordStats[word]) vocabSave.wordStats[word] = { seen: 0, correct: 0 };
  vocabSave.wordStats[word].seen++;
  if (!vocabSave.wrongWords[word]) vocabSave.wrongWords[word] = { count: 0, correctStreak: 0 };
  vocabSave.wrongWords[word].count++;
  vocabSave.wrongWords[word].correctStreak = 0;
  writeVocabSave(vocabSave);
}

function recordVocabCorrect(word) {
  if (!vocabSave.wordStats) vocabSave.wordStats = {};
  if (!vocabSave.wordStats[word]) vocabSave.wordStats[word] = { seen: 0, correct: 0 };
  vocabSave.wordStats[word].seen++;
  vocabSave.wordStats[word].correct++;
  if (vocabSave.wrongWords[word]) {
    vocabSave.wrongWords[word].correctStreak = (vocabSave.wrongWords[word].correctStreak || 0) + 1;
    if (vocabSave.wrongWords[word].correctStreak >= 5) {
      delete vocabSave.wrongWords[word];
      if (!vocabSave.masteredWords.includes(word)) vocabSave.masteredWords.push(word);
    }
  }
  if (!vocabSave.seenWords.includes(word)) {
    vocabSave.seenWords.push(word);
    if (vocabSave.seenWords.length > 60) vocabSave.seenWords.shift();
  }
  writeVocabSave(vocabSave);
}

// ── Word mastery helpers ──
// wordMastery[word][mode] = consecutive correct count (0-5)
// A word is fully mastered when all 4 modes reach 5
const MASTERY_MODES = ["word2meaning","meaning2word","antonym","spelling"];
const MASTERY_THRESHOLD = 5;

function getWordMastery(word) {
  if (!vocabSave.wordMastery) vocabSave.wordMastery = {};
  return vocabSave.wordMastery[word] || {};
}

function recordWordMasteryCorrect(word, mode) {
  if (!vocabSave.wordMastery) vocabSave.wordMastery = {};
  if (!vocabSave.wordMastery[word]) vocabSave.wordMastery[word] = {};
  const cur = vocabSave.wordMastery[word][mode] || 0;
  vocabSave.wordMastery[word][mode] = Math.min(MASTERY_THRESHOLD, cur + 1);
  writeVocabSave(vocabSave);
}

function recordWordMasteryWrong(word, mode) {
  if (!vocabSave.wordMastery) vocabSave.wordMastery = {};
  if (!vocabSave.wordMastery[word]) vocabSave.wordMastery[word] = {};
  vocabSave.wordMastery[word][mode] = 0; // reset to 0 on wrong
  writeVocabSave(vocabSave);
}

function isWordFullyMastered(word) {
  const m = getWordMastery(word);
  return MASTERY_MODES.every(mode => (m[mode] || 0) >= MASTERY_THRESHOLD);
}

function getWordMasteryPct(word) {
  const m = getWordMastery(word);
  const total = MASTERY_MODES.reduce((sum, mode) => sum + (m[mode] || 0), 0);
  return Math.round((total / (MASTERY_MODES.length * MASTERY_THRESHOLD)) * 100);
}

function getMasteryStars(word) {
  const m = getWordMastery(word);
  return MASTERY_MODES.filter(mode => (m[mode] || 0) >= MASTERY_THRESHOLD).length;
}


function isWordDisabled(word) {
  return (vocabSave.disabledWords || []).includes(word);
}
function toggleWordDisabled(word) {
  if (!vocabSave.disabledWords) vocabSave.disabledWords = [];
  if (vocabSave.disabledWords.includes(word)) {
    vocabSave.disabledWords = vocabSave.disabledWords.filter(w => w !== word);
  } else {
    vocabSave.disabledWords.push(word);
  }
  writeVocabSave(vocabSave);
}
function getWrongWordsPool() {
  return Object.keys(vocabSave.wrongWords).map(w => VOCAB_WORDS.find(v => v.word === w)).filter(Boolean);
}

// ── Persistence helpers ──
const STORAGE_KEY = "mathos_save_v1";

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function writeSave(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}

function buildDefaultSave() {
  return {
    xp: 0,
    stats: {},
    powerups: { fifty: 2, time: 2, skip: 2 },
    missedQuestions: [],
    streak: { lastDate: null, count: 0 },
    xpPenaltyApplied: null, // date string of last penalty applied
  };
}

// Load or init save
let save = loadSave() || buildDefaultSave();

// ── Apply streak XP penalty on load ──
// For every missed day since last play, reduce XP by 25% (compounded)
(function applyStreakPenalty() {
  if (!save.streak.lastDate) return;
  const last = new Date(save.streak.lastDate);
  const today = new Date();
  today.setHours(0,0,0,0);
  last.setHours(0,0,0,0);
  const diffDays = Math.round((today - last) / 86400000);
  // diffDays=0: same day, diffDays=1: yesterday (ok), diffDays>=2: missed days
  const missedDays = Math.max(0, diffDays - 1);
  if (missedDays > 0 && save.xpPenaltyApplied !== today.toDateString()) {
    // Compound 25% reduction per missed day: XP = XP * 0.75^missedDays
    const factor = Math.pow(0.75, missedDays);
    save.xp = Math.max(0, Math.floor(save.xp * factor));
    save.streak.count = 0; // streak broken
    save.xpPenaltyApplied = today.toDateString();
    writeSave(save);
  }
})();

// ── Global state (backed by save) ──
let globalXP = save.xp;
let globalStats = save.stats || {};
let globalPowerups = save.powerups || { fifty: 2, time: 2, skip: 2 };
let missedQuestions = (save.missedQuestions || []).map(q => ({...q}));
let dailyStreak = save.streak || { lastDate: null, count: 0 };
let sessionHistory = [];
let spacedQueue = [];
const recentQuestions = new Set(); // tracks last 20 question strings to avoid repeats
const MAX_RECENT = 20;

function persistAll() {
  save.xp = globalXP;
  save.stats = globalStats;
  save.powerups = globalPowerups;
  save.missedQuestions = missedQuestions;
  save.streak = dailyStreak;
  writeSave(save);
}

// ── Brain Score persistence ──
const BS_KEY = "braintrain_brainscore";
function loadBrainScoreHistory() {
  try { const r=localStorage.getItem(BS_KEY); return r?JSON.parse(r):[]; } catch(e){return [];}
}
function saveBrainScoreEntry(entry) {
  try {
    const hist = loadBrainScoreHistory();
    hist.push(entry);
    if (hist.length>30) hist.shift(); // keep last 30 days
    localStorage.setItem(BS_KEY, JSON.stringify(hist));
  } catch(e){}
}

function recordStat(topic, correct) {
  if (!globalStats[topic]) globalStats[topic]={correct:0,total:0};
  globalStats[topic].total++; if (correct) globalStats[topic].correct++;
  persistAll();
}
function getWeakTopics() {
  return Object.entries(globalStats).filter(([,v])=>v.total>=2).sort(([,a],[,b])=>(a.correct/a.total)-(b.correct/b.total)).slice(0,3).map(([k,v])=>({topic:k,pct:Math.round(v.correct/v.total*100),total:v.total}));
}

const LEVELS = [
  { name:"BASIC",    color:"#00ff88", gen:generateBasic },
  { name:"ALGEBRA",  color:"#00cfff", gen:generateAlgebra },
  { name:"ADVANCED", color:"#ff6b35", gen:generateAdvanced },
];
const DIFFICULTIES = [
  { key:"easy",   label:"EASY",   color:"#00ff88", desc:"Small numbers, one-step" },
  { key:"medium", label:"MEDIUM", color:"#ffcc00", desc:"Multi-step, larger numbers" },
  { key:"hard",   label:"HARD",   color:"#ff4466", desc:"Complex, big numbers" },
];
const INPUT_MODES = [
  { key:"mcq",    label:"MULTIPLE CHOICE", desc:"Pick from 4 options" },
  { key:"type",   label:"TYPE ANSWER",     desc:"Best for real skill building" },
  { key:"speed",  label:"SPEED ROUND",     desc:"Score by how fast you answer" },
  { key:"drill",  label:"TOPIC DRILL",     desc:"Target one weakness" },
  { key:"review", label:"❌ WRONG ANSWERS", desc:"Retry every question you got wrong" },
  { key:"audio",  label:"🎧 AUDIO ROUND",   desc:"Questions spoken aloud only" },
];
const DRILL_TOPICS = ["addition","subtraction","multiplication","division","algebra","percentages","powers","roots","averages","estimation","expressions"];
const TOTAL_TIME = 20;

// Sound synthesis
function playSound(type) {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    if (type==="correct") { o.frequency.setValueAtTime(523,ctx.currentTime); o.frequency.setValueAtTime(659,ctx.currentTime+0.1); o.frequency.setValueAtTime(784,ctx.currentTime+0.2); g.gain.setValueAtTime(0.3,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4); o.start(); o.stop(ctx.currentTime+0.4); }
    else if (type==="wrong") { o.frequency.setValueAtTime(200,ctx.currentTime); o.frequency.setValueAtTime(150,ctx.currentTime+0.1); g.gain.setValueAtTime(0.3,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3); o.start(); o.stop(ctx.currentTime+0.3); }
    else if (type==="levelup") { [523,659,784,1047].forEach((f,i)=>{ const o2=ctx.createOscillator(),g2=ctx.createGain(); o2.connect(g2);g2.connect(ctx.destination); o2.frequency.value=f; g2.gain.setValueAtTime(0.2,ctx.currentTime+i*0.1); g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.1+0.2); o2.start(ctx.currentTime+i*0.1); o2.stop(ctx.currentTime+i*0.1+0.2); }); }
    else if (type==="streak") { o.frequency.setValueAtTime(880,ctx.currentTime); g.gain.setValueAtTime(0.2,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3); o.start(); o.stop(ctx.currentTime+0.3); }
  } catch(e) {}
}


// ── Speech Synthesis ──
function speakText(text, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const readable = text
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/√/g, " square root of ")
    .replace(/\^/g, " to the power of ")
    .replace(/avg\(/g, "average of ")
    .replace(/\)/g, " ")
    .replace(/≈/g, " approximately ");
  const u = new SpeechSynthesisUtterance(readable);
  u.rate = 0.88;
  u.pitch = 1.0;
  u.volume = 1.0;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ── Speech Recognition ──
function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function MathGame() {
  // ── App mode ──
  const [appMode, setAppMode] = useState("home"); // home | math | sudoku
  const [screen, setScreen] = useState("intro");
  const [difficulty, setDifficulty] = useState("medium");
  const [inputMode, setInputMode] = useState("mcq");
  const [drillTopics, setDrillTopics] = useState(new Set(["multiplication"]));
  const drillTopic = [...drillTopics][0] || "multiplication"; // compat alias
  const [questionsPerLevel, setQuestionsPerLevel] = useState(5);
  const [inputError, setInputError] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [theme, setTheme] = useState("dark");

  // ── Game state ──
  const [levelIdx, setLevelIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [startTime, setStartTime] = useState(null);
  const [current, setCurrent] = useState(null);
  const [choices, setChoices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [particles, setParticles] = useState([]);
  const [adaptiveLevel, setAdaptiveLevel] = useState(0);
  const [consCorrect, setConsCorrect] = useState(0);
  const [consWrong, setConsWrong] = useState(0);
  const [weakTopics, setWeakTopics] = useState([]);
  const [xp, setXp] = useState(globalXP);
  const [xpPenaltyInfo, setXpPenaltyInfo] = useState(()=>{ const s=loadSave(); if(!s) return null; const last=s.streak?.lastDate; if(!last) return null; const diff=Math.round((new Date().setHours(0,0,0,0)-new Date(last).setHours(0,0,0,0))/86400000); const missed=Math.max(0,diff-1); return missed>0&&s.xpPenaltyApplied===new Date().toDateString()?missed:null; });
  const [powerups, setPowerups] = useState({...globalPowerups});
  const [hiddenChoices, setHiddenChoices] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // ── Vocab module state ──
  const [vocabMode, setVocabMode] = useState("word2meaning");
  const [vocabDiff, setVocabDiff] = useState("easy");
  const [vocabCat, setVocabCat] = useState("all");
  const [vocabQ, setVocabQ] = useState(null);
  const [vocabAnswer, setVocabAnswer] = useState("");
  const [vocabFeedback, setVocabFeedback] = useState(null); // null | "correct" | "wrong"
  const [vocabScore, setVocabScore] = useState(0);
  const [vocabStreak, setVocabStreak] = useState(0);
  const [vocabTotal, setVocabTotal] = useState(0);
  const [vocabCorrect, setVocabCorrect] = useState(0);
  const [vocabSessionWords, setVocabSessionWords] = useState([]);
  const [vocabScreen, setVocabScreen] = useState("intro"); // intro | game | summary | library
  const [libraryFilter, setLibraryFilter] = useState("all"); // all | easy | medium | hard | mastered | learning
  const [librarySearch, setLibrarySearch] = useState(""); 
  const [expandedWord, setExpandedWord] = useState(null);
  const [disabledWordsVersion, setDisabledWordsVersion] = useState(0); // incremented on toggle to force re-render
  const [vocabRecentSeen, setVocabRecentSeen] = useState(new Set());
  const [showSentence, setShowSentence] = useState(false);
  const [vocabQCount, setVocabQCount] = useState(10);
  const [vocabQIdx, setVocabQIdx] = useState(0);
  const [vocabSessionStart, setVocabSessionStart] = useState(null);
  const [vocabXpEarned, setVocabXpEarned] = useState(0);
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardName, setOnboardName] = useState("");
  // ── Reflex module state ──
  const [reflexRounds, setReflexRounds] = useState(10);
  const [reflexPhase, setReflexPhase] = useState("intro"); // intro | waiting | go | result | summary
  const [reflexColor, setReflexColor] = useState("red");
  const [reflexRoundIdx, setReflexRoundIdx] = useState(0);
  const [reflexTimes, setReflexTimes] = useState([]);
  const [reflexStart, setReflexStart] = useState(null);
  const [reflexResult, setReflexResult] = useState(null); // ms or "early"
  const [reflexTimer, setReflexTimer] = useState(null);
  const [reflexDifficulty, setReflexDifficulty] = useState("medium");
  const [reflexPB, setReflexPB] = useState(() => { try { return JSON.parse(localStorage.getItem("braintrain_reflex_pb")||"null"); } catch(e){return null;} });

  // ── Memory module state ──
  const [memPhase, setMemPhase] = useState("intro");   // intro|show|recall|result|summary
  const [memDiff, setMemDiff]   = useState("medium");
  const [memRounds, setMemRounds] = useState(5);
  const [memRoundIdx, setMemRoundIdx] = useState(0);
  const [memNumbers, setMemNumbers] = useState([]);     // numbers to show
  const [memGrid, setMemGrid]   = useState([]);         // grid cells: {num|null, pos}
  const [memVisible, setMemVisible] = useState([]);     // which numbers still showing
  const [memTapped, setMemTapped] = useState([]);       // player's taps in order
  const [memNext, setMemNext]   = useState(1);          // next number player should tap
  const [memErrors, setMemErrors] = useState(0);
  const [memRoundResults, setMemRoundResults] = useState([]); // per-round {correct,total,errors}
  const [memTimer, setMemTimer] = useState(null);
  const [memCountdown, setMemCountdown] = useState(3);
  const [memShowCountdown, setMemShowCountdown] = useState(false);
  const [memRoundCorrect, setMemRoundCorrect] = useState(0);
  const [memLives, setMemLives] = useState(3);

  // ── Pattern module state ──
  const [patPhase, setPatPhase]       = useState("intro"); // intro|question|feedback|summary
  const [patDiff, setPatDiff]         = useState("medium");
  const [patRounds, setPatRounds]     = useState(10);
  const [patRoundIdx, setPatRoundIdx] = useState(0);
  const [patQ, setPatQ]               = useState(null);   // current question
  const [patSelected, setPatSelected] = useState(null);   // index player chose
  const [patFeedback, setPatFeedback] = useState(null);   // "correct"|"wrong"
  const [patScore, setPatScore]       = useState(0);
  const [patStreak, setPatStreak]     = useState(0);
  const [patCorrect, setPatCorrect]   = useState(0);
  const [patRoundResults, setPatRoundResults] = useState([]);

  // ── Brain Score dashboard state ──
  const [showBrainScore, setShowBrainScore] = useState(false);

  // ── Spatial Rotation module state ──
  const [spatPhase, setSpatPhase]       = useState("intro");
  const [spatDiff, setSpatDiff]         = useState("medium");
  const [spatRounds, setSpatRounds]     = useState(10);
  const [spatRoundIdx, setSpatRoundIdx] = useState(0);
  const [spatQ, setSpatQ]               = useState(null);
  const [spatSelected, setSpatSelected] = useState(null);
  const [spatFeedback, setSpatFeedback] = useState(null);
  const [spatScore, setSpatScore]       = useState(0);
  const [spatStreak, setSpatStreak]     = useState(0);
  const [spatCorrect, setSpatCorrect]   = useState(0);
  const [spatResults, setSpatResults]   = useState([]);

  // ── Dual N-Back state ──
  const [dnPhase, setDnPhase]           = useState("intro");  // intro|playing|summary
  const [dnN, setDnN]                   = useState(2);         // N level (1,2,3,4)
  const [dnRounds, setDnRounds]         = useState(20);        // stimuli per session
  const [dnIdx, setDnIdx]               = useState(0);         // current stimulus index
  const [dnSequence, setDnSequence]     = useState([]);        // [{pos,letter}]
  const [dnPosAnswered, setDnPosAnswered]   = useState(false); // user already tapped pos
  const [dnLetAnswered, setDnLetAnswered]   = useState(false); // user already tapped letter
  const [dnResults, setDnResults]       = useState([]);        // {posCorrect,letCorrect,posMatch,letMatch}
  const [dnScore, setDnScore]           = useState(0);
  const [dnShowStimulus, setDnShowStimulus] = useState(false); // true while stimulus on screen
  const [dnTimer, setDnTimer]           = useState(null);
  const [dnFeedback, setDnFeedback]     = useState(null);      // brief flash {pos,let}
  const [dnHighScore, setDnHighScore]   = useState(()=>{ try{return JSON.parse(localStorage.getItem("bt_dnback_hs")||"null");}catch(e){return null;} });

  const [showOnboard, setShowOnboard] = useState(false); // only show when user triggers it
  const [playerName, setPlayerName] = useState(vocabSave.userName||"");
  const [showSettings, setShowSettings] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // ── Audio round state ──
  const [audioMode, setAudioMode] = useState(false);        // questions spoken, not shown
  const [voiceAnswer, setVoiceAnswer] = useState(false);    // mic input for answers
  const [isSpeaking, setIsSpeaking] = useState(false);      // TTS in progress
  const [isListening, setIsListening] = useState(false);    // STT in progress
  const [voiceTranscript, setVoiceTranscript] = useState(""); // what mic heard
  const [voiceStatus, setVoiceStatus] = useState("");        // status message
  const recognitionRef = useRef(null);
  const [keypadInput, setKeypadInput] = useState("");

  // ── Race mode ──
  const [raceScores, setRaceScores] = useState([0,0]);
  const [raceRound, setRaceRound] = useState(0);
  const [raceWinner, setRaceWinner] = useState(null);
  const [raceInput, setRaceInput] = useState(["",""]);
  const [raceFeedback, setRaceFeedback] = useState([null,null]);
  const RACE_ROUNDS = 10;

  // ── Sudoku state ──
  const [sudokuPuzzle, setSudokuPuzzle] = useState(null);
  const [sudokuSolved, setSudokuSolved] = useState(null);
  const [sudokuGrid, setSudokuGrid] = useState(null);
  const [sudokuFixed, setSudokuFixed] = useState(null);
  const [sudokuSelected, setSudokuSelected] = useState(null);
  const [sudokuErrors, setSudokuErrors] = useState([]);
  const [sudokuTime, setSudokuTime] = useState(0);
  const [sudokuComplete, setSudokuComplete] = useState(false);
  const [sudokuDiff, setSudokuDiff] = useState("medium");
  const [sudokuHints, setSudokuHints] = useState(3);
  const [sudokuMistakes, setSudokuMistakes] = useState(0);
  const [sudokuNotes, setSudokuNotes] = useState(Array.from({length:9},()=>Array.from({length:9},()=>new Set())));
  const [notesMode, setNotesMode] = useState(false);

  const typeInputRef = useRef(null);
  const raceInputRefs = [useRef(null), useRef(null)];
  const level = LEVELS[Math.min(levelIdx, LEVELS.length-1)];
  const diff = DIFFICULTIES.find(d=>d.key===difficulty)||DIFFICULTIES[1];
  const isDrill = inputMode==="drill";
  const isSpeed = inputMode==="speed";
  const isType = inputMode==="type";
  const isRace = inputMode==="race";
  const isReview = inputMode==="review";
  const isAudio = inputMode==="audio" || audioMode;
  const bg = theme==="dark" ? "#050a0f" : "#f0f4f8";
  const cardBg = theme==="dark" ? "#0a1520" : "#ffffff";
  const textColor = theme==="dark" ? "#fff" : "#1a2530";
  const mutedColor = theme==="dark" ? "#ffffff" : "#1a2530";
  const borderColor = theme==="dark" ? "#1a3040" : "#dde8f0";

  const snd = useCallback((t) => { if (soundOn) playSound(t); }, [soundOn]);

  // ── XP rank ──
  const xpLvl = getXpLevel(xp);
  const xpRank = XP_LEVELS[xpLvl];

  const getEffDiff = useCallback(() => {
    const diffs=["easy","medium","hard"];
    return diffs[clamp(diffs.indexOf(difficulty)+Math.sign(adaptiveLevel),0,2)];
  }, [difficulty,adaptiveLevel]);

  const makeQuestion = useCallback((lvlIdx2) => {
    // Review mode: serve from missedQuestions pool
    if (isReview) {
      if (missedQuestions.length === 0) return null;
      const idx = rand(0, missedQuestions.length - 1);
      return { ...missedQuestions[idx] };
    }
    // Spaced repetition: 25% chance to revisit missed question
    if (spacedQueue.length>0 && Math.random()<0.25) {
      const q = spacedQueue.shift();
      return q;
    }
    const eff = getEffDiff();
    if (isDrill) {
      const topics = [...drillTopics];
      const pick = topics[rand(0, topics.length-1)];
      if (pick==="estimation") return generateEstimation(eff);
      for (const gen of [generateBasic,generateAlgebra,generateAdvanced]) {
        for (let i=0;i<12;i++) { const q=gen(eff); if (q.topic===pick) return q; }
      }
      return generateBasic(eff);
    }
    if (Math.random()<0.12) return generateEstimation(eff);
    return LEVELS[Math.min(lvlIdx2,LEVELS.length-1)].gen(eff);
  }, [getEffDiff,isDrill,drillTopics,isReview]);

  const loadQuestion = useCallback((lvlIdx2=levelIdx) => {
    // Anti-repetition: try up to 10 times to get a non-recent question
    let q = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = makeQuestion(lvlIdx2);
      if (!candidate) break; // review mode pool empty
      if (!recentQuestions.has(candidate.question)) {
        q = candidate;
        break;
      }
      // On last attempt, just use it regardless
      if (attempt === 9) q = candidate;
    }
    if (!q) return; // nothing to show (review pool empty)
    // Track this question as recently seen
    recentQuestions.add(q.question);
    if (recentQuestions.size > MAX_RECENT) {
      // Remove oldest entry
      const first = recentQuestions.values().next().value;
      recentQuestions.delete(first);
    }
    setCurrent(q);
    setChoices(q.isEstimation?q.estimationOpts:generateWrongAnswers(q.answer));
    setFeedback(null); setSelectedIdx(null); setTypedAnswer("");
    setTimeLeft(TOTAL_TIME); setStartTime(Date.now());
    setHiddenChoices([]); setHintUsed(false); setShowHint(false);
    setVoiceTranscript(""); setVoiceStatus(""); setIsListening(false);
    setTimeout(()=>{ if(typeInputRef.current) typeInputRef.current.focus(); },100);
  }, [levelIdx,makeQuestion]);

  // Speak question whenever current changes in audio mode
  useEffect(() => {
    if (current && (inputMode==="audio" || audioMode)) {
      setTimeout(() => speakQuestion(current), 300);
    }
  }, [current, inputMode, audioMode]);

  // ── Speak current question ──
  function speakQuestion(q) {
    if (!q) return;
    setIsSpeaking(true);
    const intro = audioMode ? "" : "";
    const text = q.hint + ". " + q.question;
    speakText(text, () => setIsSpeaking(false));
  }

  // ── Start voice recognition for answer ──
  function parseSpokenNumber(t) {
    // Try direct digits first
    const digits = t.replace(/[^0-9]/g,"");
    if (digits.length > 0) return parseInt(digits, 10);
    // Word to number
    const words = {"zero":0,"oh":0,"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,"eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,"sixteen":16,"seventeen":17,"eighteen":18,"nineteen":19,"twenty":20,"thirty":30,"forty":40,"fifty":50,"sixty":60,"seventy":70,"eighty":80,"ninety":90,"hundred":100,"thousand":1000};
    const lower = t.toLowerCase().replace(/[^a-z\s]/g,"");
    const parts = lower.trim().split(/\s+/);
    let total = 0, curr = 0;
    for (const w of parts) {
      if (words[w] === undefined) continue;
      const v = words[w];
      if (v === 1000) { total += (curr||1)*1000; curr = 0; }
      else if (v === 100) { curr = (curr||1)*100; }
      else if (v >= 20) curr += v;
      else curr += v;
    }
    total += curr;
    return total > 0 ? total : NaN;
  }

  function startVoiceAnswer() {
    const SR = getSpeechRecognition();
    if (!SR) { setVoiceStatus("❌ Speech recognition not supported. Use Safari on iPhone or Chrome on desktop."); return; }
    if (feedback !== null) return;
    if (isListening) { recognitionRef.current?.abort?.() || recognitionRef.current?.stop(); setIsListening(false); setVoiceStatus(""); return; }
    try {
      const r = new SR();
      recognitionRef.current = r;
      r.continuous = false;
      r.interimResults = true;
      r.lang = "en-US";
      r.maxAlternatives = 3;
      r.onstart = () => { setIsListening(true); setVoiceStatus("🎤 Listening — say your answer..."); setVoiceTranscript(""); };
      r.onresult = (e) => {
        // Try all alternatives for best number parse
        let bestNum = NaN;
        let bestTranscript = "";
        for (let ri = 0; ri < e.results.length; ri++) {
          for (let ai = 0; ai < e.results[ri].length; ai++) {
            const t = e.results[ri][ai].transcript.trim();
            const n = parseSpokenNumber(t);
            if (!isNaN(n)) { bestNum = n; bestTranscript = t; break; }
            if (!bestTranscript) bestTranscript = t;
          }
          if (!isNaN(bestNum)) break;
        }
        setVoiceTranscript(bestTranscript);
        if (e.results[e.results.length-1].isFinal) {
          setIsListening(false); setVoiceStatus("");
          if (!isNaN(bestNum)) { handleAnswer(null, bestNum); }
          else setVoiceStatus(`Heard: "${bestTranscript}" — say a number clearly and try again.`);
        }
      };
      r.onerror = (ev) => {
        setIsListening(false);
        if (ev.error === "no-speech") setVoiceStatus("No speech detected — tap mic and try again.");
        else if (ev.error === "not-allowed") setVoiceStatus("❌ Microphone permission denied. Allow mic access in browser settings.");
        else setVoiceStatus(`Mic error: ${ev.error}. Tap mic to retry.`);
      };
      r.onend = () => setIsListening(false);
      r.start();
    } catch(err) { setVoiceStatus("Could not start microphone: " + err.message); }
  }

  function stopVoiceAnswer() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceStatus("");
  }

  const loadVocabQuestion = useCallback(() => {
    let pool;
    if (vocabMode === "review") {
      pool = getWrongWordsPool();
      if (!pool || pool.length === 0) { setVocabScreen("summary"); return; }
    } else {
      // Filter by difficulty
      pool = VOCAB_WORDS.filter(w => vocabDiff === "all" || w.diff === vocabDiff);
      // Filter by category
      if (vocabCat !== "all") {
        const catFiltered = pool.filter(w => {
          const wc = w.cats || (w.cat ? [w.cat] : ["everyday"]);
          return wc.includes(vocabCat);
        });
        if (catFiltered.length >= 4) pool = catFiltered;
      }
      if (!pool || pool.length === 0) pool = [...VOCAB_WORDS];
    }
    if (!pool || pool.length === 0) { setVocabScreen("summary"); return; }
    const word = pool[Math.floor(Math.random() * pool.length)];
    const effectiveMode = vocabMode === "review"
      ? ["word2meaning","meaning2word","antonym"][Math.floor(Math.random()*3)]
      : vocabMode;
    const q = makeVocabQuestion(word, effectiveMode, pool.length >= 4 ? pool : VOCAB_WORDS);
    if (!q) {
      // Try again with word2meaning as safe fallback
      const fallback = makeVocabQuestion(word, "word2meaning", VOCAB_WORDS);
      if (!fallback) return;
      setVocabQ(fallback);
    } else {
      setVocabQ(q);
    }
    setVocabAnswer("");
    setVocabFeedback(null);
    setShowSentence(false);
  }, [vocabMode, vocabDiff, vocabCat]);

  function handleVocabAnswer(chosen) {
    if (vocabFeedback) return;
    const correct = chosen.toLowerCase().trim() === vocabQ.answer.toLowerCase().trim();
    setVocabFeedback(correct ? "correct" : "wrong");
    setVocabTotal(t => t + 1);
    setShowSentence(true);
    const wordStr = vocabQ.word.word;
    if (correct) {
      try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}
      setVocabScore(s => s + 10 + vocabStreak * 2);
      setVocabStreak(s => s + 1);
      setVocabCorrect(c => c + 1);
      recordVocabCorrect(wordStr);
      recordWordMasteryCorrect(wordStr, vocabQ.type);
      const xpAward = vocabQ.word.diff==="easy"?5:vocabQ.word.diff==="medium"?12:20;
      setVocabXpEarned(e => e + xpAward + vocabStreak);
      setXp(x => { const nx = x + xpAward + vocabStreak; globalXP = nx; persistAll(); return nx; });
    } else {
      try{navigator.vibrate&&navigator.vibrate([80,30,80]);}catch(e){}
      setVocabStreak(0);
      recordVocabWrong(wordStr);
      recordWordMasteryWrong(wordStr, vocabQ.type);
    }
    setVocabSessionWords(prev => [...prev, {
      word: wordStr, meaning: vocabQ.word.meaning, sentence: vocabQ.word.sentence,
      yourAnswer: chosen, correct, mode: vocabQ.type
    }]);
  }

  function nextVocabQuestion() {
    const next = vocabQIdx + 1;
    if (vocabMode !== "review" && next >= vocabQCount) {
      setVocabScreen("summary");
    } else {
      setVocabQIdx(next);
      setVocabQ(null); // null triggers useEffect → loadVocabQuestion
    }
  }

  function startVocabGame() {
    setVocabScore(0); setVocabStreak(0); setVocabTotal(0); setVocabCorrect(0);
    setVocabSessionWords([]); setVocabQIdx(0); setVocabFeedback(null);
    setVocabSessionStart(Date.now()); setVocabXpEarned(0);
    setVocabQ(null); // clear old question
    setVocabScreen("game");
  }

  // ── Reflex helpers ──
  function reflexGetDelay() {
    if (reflexDifficulty==="easy")   return 2000 + Math.random()*3000;   // 2-5s
    if (reflexDifficulty==="medium") return 1500 + Math.random()*2500;   // 1.5-4s
    return 500 + Math.random()*3000;  // hard: 0.5-3.5s
  }

  function startReflexRound() {
    setReflexColor("red");
    setReflexResult(null);
    setReflexPhase("waiting");
    const delay = reflexGetDelay();
    // Hard mode: 25% chance of a fake green flash
    const doFake = reflexDifficulty==="hard" && Math.random()<0.25;
    let t;
    if (doFake) {
      const fakeAt = delay * 0.4;
      const fakeTimer = setTimeout(() => {
        setReflexColor("fake"); // briefly flash a different shade
        setTimeout(() => setReflexColor("red"), 300);
      }, fakeAt);
    }
    t = setTimeout(() => {
      setReflexColor("green");
      setReflexStart(Date.now());
      setReflexPhase("go");
    }, delay);
    setReflexTimer(t);
  }

  function handleReflexTap() {
    if (reflexPhase==="waiting") {
      // Tapped too early
      clearTimeout(reflexTimer);
      try{navigator.vibrate&&navigator.vibrate([80,30,80]);}catch(e){}
      setReflexResult("early");
      setReflexPhase("result");
      return;
    }
    if (reflexPhase==="go") {
      const ms = Date.now() - reflexStart;
      try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}
      setReflexResult(ms);
      setReflexTimes(prev => [...prev, ms]);
      setReflexPhase("result");
      // XP based on speed
      const xpEarned = ms<150?20:ms<200?14:ms<250?10:ms<300?7:4;
      setXp(x=>{ const nx=x+xpEarned; globalXP=nx; persistAll(); return nx; });
      return;
    }
    if (reflexPhase==="result") {
      // Advance
      const next = reflexRoundIdx + 1;
      if (next >= reflexRounds) {
        // Save PB
        const validTimes = [...reflexTimes, typeof reflexResult==="number"?reflexResult:null].filter(Boolean);
        if (validTimes.length > 0) {
          const avg = Math.round(validTimes.reduce((a,b)=>a+b,0)/validTimes.length);
          if (!reflexPB || avg < reflexPB) {
            setReflexPB(avg);
            try{ localStorage.setItem("braintrain_reflex_pb", JSON.stringify(avg)); }catch(e){}
          }
        }
        setReflexPhase("summary");
      } else {
        setReflexRoundIdx(next);
        startReflexRound();
      }
    }
  }

  function startReflexGame() {
    setReflexTimes([]);
    setReflexRoundIdx(0);
    setReflexResult(null);
    startReflexRound();
  }

  function reflexRating(ms) {
    if (ms<150) return { label:"⚡ ELITE", color:"#ffcc00" };
    if (ms<200) return { label:"🌟 EXCELLENT", color:"#00ff88" };
    if (ms<250) return { label:"✅ GOOD", color:"#00cfff" };
    if (ms<300) return { label:"👍 AVERAGE", color:"#a78bfa" };
    return { label:"📈 KEEP TRAINING", color:"#ff6b35" };
  }

  // ── Memory helpers ──
  function memGetConfig() {
    // returns { count, gridSize, showMs }
    if (memDiff==="easy")   return { count:5,  gridSize:3, showMs:2500 };
    if (memDiff==="medium") return { count:8,  gridSize:4, showMs:1800 };
    if (memDiff==="hard")   return { count:12, gridSize:5, showMs:1200 };
    return { count:5, gridSize:3, showMs:2500 };
  }

  function memBuildGrid(count, gridSize) {
    const total = gridSize * gridSize;
    const nums = Array.from({length: count}, (_, i) => i + 1);
    // Shuffle positions
    const positions = Array.from({length: total}, (_, i) => i).sort(() => Math.random() - 0.5);
    const grid = Array(total).fill(null);
    nums.forEach((n, i) => { grid[positions[i]] = n; });
    return { grid, nums };
  }

  function startMemRound(roundIdx) {
    const { count, gridSize, showMs } = memGetConfig();
    const { grid, nums } = memBuildGrid(count, gridSize);
    setMemNumbers(nums);
    setMemGrid(grid);
    setMemVisible(nums.slice()); // all visible at start
    setMemTapped([]);
    setMemNext(1);
    setMemErrors(0);
    setMemRoundCorrect(0);
    setMemShowCountdown(true);
    setMemCountdown(3);
    // Countdown 3-2-1 then show
    let cd = 3;
    const cdInt = setInterval(() => {
      cd--;
      setMemCountdown(cd);
      if (cd <= 0) {
        clearInterval(cdInt);
        setMemShowCountdown(false);
        setMemPhase("show");
        // After showMs, hide all and switch to recall
        const t = setTimeout(() => {
          setMemVisible([]);
          setMemPhase("recall");
        }, showMs);
        setMemTimer(t);
      }
    }, 1000);
  }

  function handleMemTap(cellIdx) {
    if (memPhase !== "recall") return;
    const num = memGrid[cellIdx];
    if (num === null) return; // empty cell
    if (memTapped.includes(cellIdx)) return; // already tapped

    if (num === memNext) {
      // Correct
      try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}
      const newTapped = [...memTapped, cellIdx];
      setMemTapped(newTapped);
      setMemNext(memNext + 1);
      setMemRoundCorrect(c => c + 1);

      // Round complete when all numbers tapped correctly
      const { count } = memGetConfig();
      if (newTapped.length === count) {
        finishMemRound(memErrors, count, count);
      }
    } else {
      // Wrong
      try{navigator.vibrate&&navigator.vibrate([80,30,80]);}catch(e){}
      const newErrors = memErrors + 1;
      setMemErrors(newErrors);
      setMemLives(l => {
        const nl = l - 1;
        if (nl <= 0) {
          // Out of lives — end round
          const { count } = memGetConfig();
          finishMemRound(newErrors, memRoundCorrect, count);
        }
        return nl;
      });
    }
  }

  function finishMemRound(errors, correct, total) {
    clearTimeout(memTimer);
    const xpEarned = errors===0 ? (memDiff==="easy"?10:memDiff==="medium"?18:28) :
                     errors<=2  ? (memDiff==="easy"?5:memDiff==="medium"?10:16) : 2;
    setXp(x => { const nx=x+xpEarned; globalXP=nx; persistAll(); return nx; });
    setMemRoundResults(prev => [...prev, { correct, total, errors, perfect: errors===0 }]);
    setMemPhase("result");
  }

  function advanceMemRound() {
    const next = memRoundIdx + 1;
    if (next >= memRounds) {
      setMemPhase("summary");
    } else {
      setMemRoundIdx(next);
      setMemLives(3);
      startMemRound(next);
    }
  }

  function startMemGame() {
    setMemRoundIdx(0);
    setMemRoundResults([]);
    setMemTapped([]);
    setMemErrors(0);
    setMemLives(3);
    startMemRound(0);
  }

  // ── Pattern helpers ──
  function patMakeQuestion(diff) {
    const type = Math.floor(Math.random() * (diff==="easy"?3:diff==="medium"?5:7));
    // Each generator returns { sequence:[], answer, choices:[], explanation }
    let seq, answer, choices, explanation, label;

    if (type===0) {
      // Arithmetic sequence
      const start = rand(1, diff==="easy"?10:diff==="medium"?20:50);
      const step  = rand(2, diff==="easy"?5:diff==="medium"?10:20) * (Math.random()<0.3?-1:1);
      const len   = diff==="easy"?4:diff==="medium"?5:6;
      seq = Array.from({length:len}, (_,i) => start + step*i);
      answer = start + step*len;
      explanation = `Each term ${step>0?"increases by":"decreases by"} ${Math.abs(step)}`;
      label = "NUMBER SEQUENCE";
    } else if (type===1) {
      // Geometric sequence
      const start = rand(1,8);
      const ratio = rand(2, diff==="easy"?3:5);
      const len   = diff==="easy"?4:5;
      seq = Array.from({length:len}, (_,i) => start * Math.pow(ratio,i));
      answer = seq[seq.length-1] * ratio;
      explanation = `Each term is multiplied by ${ratio}`;
      label = "MULTIPLY SEQUENCE";
    } else if (type===2) {
      // Fibonacci-style
      const a = rand(1,5), b = rand(a+1, a+6);
      seq = [a, b];
      for (let i=2; i<(diff==="easy"?5:6); i++) seq.push(seq[i-1]+seq[i-2]);
      answer = seq[seq.length-1] + seq[seq.length-2];
      seq = seq.slice(0,-1);
      explanation = "Each term = sum of the two before it";
      label = "SUM SEQUENCE";
    } else if (type===3) {
      // Squares
      const start = rand(1, diff==="medium"?7:10);
      const len = 5;
      seq = Array.from({length:len}, (_,i) => Math.pow(start+i,2));
      answer = Math.pow(start+len,2);
      explanation = `Sequence of perfect squares: ${start}², ${start+1}², ...`;
      label = "SQUARE SEQUENCE";
    } else if (type===4) {
      // Alternating add/multiply
      const start = rand(2,8);
      const addStep = rand(2,5);
      const mulStep = rand(2,3);
      seq = [start];
      for (let i=0; i<4; i++) {
        if (i%2===0) seq.push(seq[seq.length-1]+addStep);
        else seq.push(seq[seq.length-1]*mulStep);
      }
      answer = seq.length%2===0 ? seq[seq.length-1]+addStep : seq[seq.length-1]*mulStep;
      explanation = `Alternates: +${addStep}, ×${mulStep}, +${addStep}, ×${mulStep}...`;
      label = "ALTERNATING PATTERN";
    } else if (type===5) {
      // Prime numbers
      const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
      const start = rand(0,8);
      seq = primes.slice(start, start+5);
      answer = primes[start+5];
      explanation = "Sequence of prime numbers";
      label = "PRIME SEQUENCE";
    } else {
      // Difference of differences (2nd order)
      const start = rand(1,10);
      const d1 = rand(1,5);
      const d2 = rand(1,4);
      seq = [start, start+d1];
      for (let i=2; i<6; i++) {
        const prevDiff = seq[i-1]-seq[i-2];
        seq.push(seq[i-1]+prevDiff+d2);
      }
      answer = seq.pop();
      explanation = "The differences between terms increase by a fixed amount";
      label = "2ND ORDER SEQUENCE";
    }

    // Generate wrong choices: answer ± spread, no duplicates, no negatives
    const spread = Math.max(3, Math.floor(Math.abs(answer)*0.2));
    const wrongSet = new Set();
    let attempts = 0;
    while (wrongSet.size < 3 && attempts < 200) {
      attempts++;
      const delta = rand(-spread, spread);
      const w = answer + (delta===0 ? rand(1,4) : delta);
      if (w!==answer && w>0 && !wrongSet.has(w)) wrongSet.add(w);
    }
    choices = [...wrongSet, answer].sort(() => Math.random()-0.5);
    return { seq, answer, choices, explanation, label };
  }

  function loadPatQuestion() {
    setPatQ(patMakeQuestion(patDiff));
    setPatSelected(null);
    setPatFeedback(null);
  }

  function handlePatAnswer(choiceIdx) {
    if (patFeedback) return;
    const chosen = patQ.choices[choiceIdx];
    const correct = chosen === patQ.answer;
    setPatSelected(choiceIdx);
    setPatFeedback(correct ? "correct" : "wrong");
    if (correct) {
      try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}
      const xp = patDiff==="easy"?5:patDiff==="medium"?10:18;
      const bonus = patStreak>=4?4:patStreak>=2?2:0;
      setXp(x=>{ const nx=x+xp+bonus; globalXP=nx; persistAll(); return nx; });
      setPatScore(s=>s+10+(patStreak*2));
      setPatStreak(s=>s+1);
      setPatCorrect(c=>c+1);
    } else {
      try{navigator.vibrate&&navigator.vibrate([80,30,80]);}catch(e){}
      setPatStreak(0);
    }
    setPatRoundResults(prev=>[...prev,{correct, answer:patQ.answer, chosen, label:patQ.label}]);
  }

  function advancePatRound() {
    const next = patRoundIdx+1;
    if (next>=patRounds) {
      setPatPhase("summary");
    } else {
      setPatRoundIdx(next);
      loadPatQuestion();
    }
  }

  function startPatGame() {
    setPatScore(0); setPatStreak(0); setPatCorrect(0);
    setPatRoundResults([]); setPatRoundIdx(0);
    setPatPhase("question");
    setPatQ(patMakeQuestion(patDiff));
    setPatSelected(null); setPatFeedback(null);
  }

  // ── Brain Score calculator ──
  function calcBrainScore() {
    // Returns object with scores 0-100 per domain and overall 0-1000
    // MATH domain: from globalStats
    const mathTopics = Object.values(globalStats);
    const mathScore = mathTopics.length>0
      ? Math.min(100, Math.round(mathTopics.reduce((s,v)=>s+(v.correct/v.total)*100,0)/mathTopics.length))
      : 0;

    // VOCAB domain: from vocabSave
    const totalWords = VOCAB_WORDS.length;
    const masteredWords = (vocabSave.masteredWords||[]).length;
    const seenWords = (vocabSave.seenWords||[]).length;
    const vocabScore = Math.min(100, Math.round((masteredWords/totalWords)*60 + (seenWords/totalWords)*40));

    // MEMORY domain: from localStorage session history
    const memPct = memRoundResults.length>0
      ? Math.round(memRoundResults.reduce((s,r)=>s+(r.correct/r.total),0)/memRoundResults.length*100)
      : 0;

    // REFLEX domain: from PB
    const reflexScore = reflexPB
      ? Math.min(100, Math.max(0, Math.round(((400-reflexPB)/250)*100)))
      : 0;

    // PATTERN domain: from last session
    const patPct = patResults_for_score();

    // SPATIAL domain: from last session
    const spatPct = spatResults.length>0
      ? Math.round((spatCorrect/spatResults.length)*100)
      : 0;

    const dnValid = dnResults.filter(r=>r!==null); const dnAcc = dnValid.length>0 ? Math.round((dnValid.filter(r=>r.posCorrect).length+dnValid.filter(r=>r.letCorrect).length)/(dnValid.length*2)*100) : 0;
    const domains = { math:mathScore, vocab:vocabScore, memory:memPct, reflex:reflexScore, pattern:patPct, spatial:spatPct, dualnback:dnAcc };
    const activeDomains = Object.values(domains).filter(v=>v>0);
    const overall = activeDomains.length>0
      ? Math.round(activeDomains.reduce((s,v)=>s+v,0)/6 * 10) // scale to 0-1000
      : 0;
    return { domains, overall };
  }

  function patResults_for_score() {
    if (patRoundResults.length===0) return 0;
    return Math.round(patRoundResults.filter(r=>r.correct).length/patRoundResults.length*100);
  }

  // ── Spatial Rotation helpers ──
  // Shapes are represented as arrays of [x,y] offsets from center
  // We draw them on a small grid (5x5)
  const SPAT_SHAPES = [
    [[0,0],[1,0],[2,0],[0,1]],         // L
    [[0,0],[1,0],[2,0],[2,1]],         // J
    [[0,0],[1,0],[1,1],[2,1]],         // S
    [[0,1],[1,1],[1,0],[2,0]],         // Z
    [[0,0],[1,0],[2,0],[1,1]],         // T
    [[0,0],[1,0],[0,1],[1,1]],         // O
    [[0,0],[1,0],[2,0],[3,0]],         // I
    [[0,0],[0,1],[1,1],[1,2]],         // tall-S
    [[0,0],[1,0],[2,0],[0,1],[0,2]],   // corner-L
    [[0,0],[1,0],[2,0],[2,1],[2,2]],   // corner-J
    [[0,0],[1,0],[1,1],[1,2],[2,2]],   // Z-long
    [[0,2],[1,2],[1,1],[1,0],[2,0]],   // S-long
  ];

  function rotatePts(pts, times) {
    let p = pts.map(([x,y])=>[x,y]);
    for (let t=0;t<times;t++) {
      // 90deg CW: [x,y] -> [y, -x]  then normalise
      p = p.map(([x,y])=>[y,-x]);
      const minX = Math.min(...p.map(([x])=>x));
      const minY = Math.min(...p.map(([,y])=>y));
      p = p.map(([x,y])=>[x-minX,y-minY]);
    }
    return p;
  }

  function spatMakeQuestion(diff) {
    const shapeIdx = rand(0, SPAT_SHAPES.length-1);
    const base = SPAT_SHAPES[shapeIdx];
    const correctRot = rand(0,3); // 0,1,2,3 = 0°,90°,180°,270°
    const correctPts = rotatePts(base, correctRot);

    // Generate 3 wrong rotations — pick rotations different from correct
    const allRots = [0,1,2,3];
    const wrongRots = allRots.filter(r=>r!==correctRot).sort(()=>Math.random()-0.5);

    // In hard mode also add a mirrored shape as a distractor
    const distractorRots = diff==="hard"
      ? [wrongRots[0], wrongRots[1], (correctRot+2)%4] // includes 180° as harder distractor
      : wrongRots.slice(0,3);

    const choices = [
      { pts: correctPts, isCorrect: true },
      ...distractorRots.map(r=>({ pts: rotatePts(base, r), isCorrect: false }))
    ].sort(()=>Math.random()-0.5);

    return { base, choices, correctPts };
  }

  function handleSpatAnswer(idx) {
    if (spatFeedback) return;
    const correct = spatQ.choices[idx].isCorrect;
    setSpatSelected(idx);
    setSpatFeedback(correct?"correct":"wrong");
    if (correct) {
      try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}
      const xp = spatDiff==="easy"?6:spatDiff==="medium"?12:20;
      setXp(x=>{ const nx=x+xp; globalXP=nx; persistAll(); return nx; });
      setSpatScore(s=>s+10+(spatStreak*2));
      setSpatStreak(s=>s+1);
      setSpatCorrect(c=>c+1);
    } else {
      try{navigator.vibrate&&navigator.vibrate([80,30,80]);}catch(e){}
      setSpatStreak(0);
    }
    setSpatResults(prev=>[...prev,{correct}]);
  }

  function advanceSpatRound() {
    const next = spatRoundIdx+1;
    if (next>=spatRounds) { setSpatPhase("summary"); return; }
    setSpatRoundIdx(next);
    setSpatQ(spatMakeQuestion(spatDiff));
    setSpatSelected(null);
    setSpatFeedback(null);
  }

  function startSpatGame() {
    setSpatScore(0); setSpatStreak(0); setSpatCorrect(0);
    setSpatResults([]); setSpatRoundIdx(0);
    setSpatQ(spatMakeQuestion(spatDiff));
    setSpatSelected(null); setSpatFeedback(null);
    setSpatPhase("question");
  }

  // Helper: render a shape as a mini SVG grid (5x5 cells)
  function renderShape(pts, col, size=80) {
    const cell = size/5;
    const maxX = Math.max(...pts.map(([x])=>x));
    const maxY = Math.max(...pts.map(([,y])=>y));
    const offX = Math.floor((5-maxX-1)/2);
    const offY = Math.floor((5-maxY-1)/2);
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block"}}>
        {pts.map(([x,y],i)=>(
          <rect key={i}
            x={(x+offX)*cell+1} y={(y+offY)*cell+1}
            width={cell-2} height={cell-2}
            rx={2}
            fill={col+"33"} stroke={col} strokeWidth={1.5}
          />
        ))}
      </svg>
    );
  }

  // ── Dual N-Back helpers ──
  const DN_LETTERS = ["C","H","K","L","Q","R","S","T"];  // 8 consonants — easy to distinguish
  const DN_GRID    = 9;  // 3×3 grid positions 0-8

  function dnBuildSequence(n, rounds) {
    // Build sequence ensuring ~33% position matches and ~33% letter matches
    const seq = [];
    for (let i=0; i<rounds; i++) {
      if (i < n) {
        seq.push({ pos: Math.floor(Math.random()*DN_GRID), letter: DN_LETTERS[Math.floor(Math.random()*DN_LETTERS.length)] });
      } else {
        const matchPos = Math.random() < 0.33;
        const matchLet = Math.random() < 0.33;
        seq.push({
          pos:    matchPos ? seq[i-n].pos    : (() => { let p; do { p=Math.floor(Math.random()*DN_GRID); } while(p===seq[i-n].pos); return p; })(),
          letter: matchLet ? seq[i-n].letter : (() => { let l; do { l=DN_LETTERS[Math.floor(Math.random()*DN_LETTERS.length)]; } while(l===seq[i-n].letter); return l; })(),
        });
      }
    }
    return seq;
  }

  function startDnGame() {
    const seq = dnBuildSequence(dnN, dnRounds);
    setDnSequence(seq);
    setDnIdx(0);
    setDnResults([]);
    setDnScore(0);
    setDnPosAnswered(false);
    setDnLetAnswered(false);
    setDnFeedback(null);
    setDnPhase("playing");
    // start first stimulus after short delay
    setTimeout(() => dnShowNext(seq, 0, dnN), 600);
  }

  function dnShowNext(seq, idx, n) {
    if (idx >= seq.length) {
      setDnPhase("summary");
      return;
    }
    setDnShowStimulus(true);
    setDnPosAnswered(false);
    setDnLetAnswered(false);
    setDnFeedback(null);
    setDnIdx(idx);
    // Stimulus on screen for 2500ms, then inter-stimulus interval 500ms
    const t = setTimeout(() => {
      setDnShowStimulus(false);
      // score this trial (only valid from index n onwards)
      if (idx >= n) {
        // scoring done when stimulus disappears
      }
      // advance after ISI
      setTimeout(() => {
        dnShowNext(seq, idx+1, n);
      }, 500);
    }, 2500);
    setDnTimer(t);
  }

  function handleDnResponse(type) {
    // type = "pos" | "let"
    if (!dnShowStimulus) return;
    if (type==="pos" && dnPosAnswered) return;
    if (type==="let" && dnLetAnswered) return;
    if (type==="pos") setDnPosAnswered(true);
    if (type==="let") setDnLetAnswered(true);
  }

  // Score a trial at end of stimulus — called via useEffect watching dnShowStimulus
  // We track results per-trial including misses
  function dnScoreTrial(seq, idx, n, posAnswered, letAnswered) {
    if (idx < n) return null;
    const posMatch  = seq[idx].pos    === seq[idx-n].pos;
    const letMatch  = seq[idx].letter === seq[idx-n].letter;
    const posHit    = posMatch  && posAnswered;
    const posFA     = !posMatch && posAnswered;   // false alarm
    const letHit    = letMatch  && letAnswered;
    const letFA     = !letMatch && letAnswered;
    const posMiss   = posMatch  && !posAnswered;
    const letMiss   = letMatch  && !letAnswered;
    const posCorrect = posHit || (!posMatch && !posAnswered);
    const letCorrect = letHit || (!letMatch && !letAnswered);
    return { posMatch, letMatch, posAnswered, letAnswered, posCorrect, letCorrect, posHit, letHit, posFA, letFA, posMiss, letMiss };
  }

  function handleStart() {
    if (isReview && missedQuestions.length === 0) {
      setInputError("No wrong answers yet! Play other modes first to build your review list.");
      return;
    }
    setInputError("");
    setLives(3); setAdaptiveLevel(0); setConsCorrect(0); setConsWrong(0);
    setScore(0); setStreak(0); setMaxStreak(0); setTotalCorrect(0); setTotalAnswered(0);
    sessionHistory=[];
    // Check daily streak
    const today=new Date().toDateString();
    if (dailyStreak.lastDate!==today) {
      const yesterday=new Date(Date.now()-86400000).toDateString();
      dailyStreak.count = dailyStreak.lastDate===yesterday ? dailyStreak.count+1 : 1;
      dailyStreak.lastDate=today;
      persistAll();
    }
    if (isRace) { setRaceScores([0,0]); setRaceRound(0); setRaceWinner(null); setRaceInput(["",""]); setRaceFeedback([null,null]); setScreen("race"); }
    else { setLevelIdx(0); setQIdx(0); setScreen("game"); }
  }

  // ── Timer ──
  useEffect(() => {
    if (screen!=="game"||feedback!==null||isSpeed) return;
    if (timeLeft<=0) { handleAnswer(null,null); return; }
    const t=setTimeout(()=>setTimeLeft(v=>v-1),1000);
    return ()=>clearTimeout(t);
  }, [timeLeft,screen,feedback,isSpeed]);

  // ── Sudoku timer ──
  useEffect(() => {
    if (appMode!=="sudoku"||sudokuComplete) return;
    const t=setInterval(()=>setSudokuTime(v=>v+1),1000);
    return ()=>clearInterval(t);
  }, [appMode,sudokuComplete]);

  // ── Load question on game start ──
  useEffect(() => { if (screen==="game") loadQuestion(levelIdx); }, [screen,levelIdx,loadQuestion]);

  // ── Dual N-Back: score trial when stimulus disappears ──
  useEffect(() => {
    if (appMode==="dualnback" && dnPhase==="playing" && !dnShowStimulus && dnSequence.length>0 && dnIdx>=dnN) {
      const result = dnScoreTrial(dnSequence, dnIdx, dnN, dnPosAnswered, dnLetAnswered);
      if (result) {
        setDnResults(prev=>[...prev, result]);
        const pts = (result.posCorrect?10:0)+(result.letCorrect?10:0);
        if (pts>0) setDnScore(s=>s+pts);
        setDnFeedback({ pos:result.posCorrect?"correct":result.posMatch?"miss":"ok", let:result.letCorrect?"correct":result.letMatch?"miss":"ok" });
      }
    }
  }, [dnShowStimulus, dnIdx, appMode, dnPhase]);

  // ── Load vocab question when vocab game starts or question is null ──
  useEffect(() => {
    if (appMode==="vocab" && vocabScreen==="game" && !vocabQ) {
      loadVocabQuestion();
    }
  }, [appMode, vocabScreen, vocabQ, loadVocabQuestion]);

  // ── Race question ──
  const [raceCurrent, setRaceCurrent] = useState(null);
  useEffect(() => {
    if (screen==="race"&&!raceCurrent) {
      const q=LEVELS[0].gen(difficulty);
      setRaceCurrent(q);
      setRaceFeedback([null,null]);
      setRaceInput(["",""]);
    }
  }, [screen,raceCurrent]);

  function spawnParticles(correct, many=false) {
    const n = many?24:correct?12:5;
    const pts=Array.from({length:n},(_,i)=>({id:Date.now()+i,x:rand(10,90),y:rand(10,80),color:correct?level.color:"#ff4466"}));
    setParticles(pts); setTimeout(()=>setParticles([]),1000);
  }

  function handleAnswer(idx,val) {
    if (feedback!==null) return;
    const isTimeout=val===null;
    const correct=!isTimeout&&Number(val)===Number(current.answer);
    const elapsed=startTime?(Date.now()-startTime)/1000:0;
    setSelectedIdx(idx); setFeedback(correct?"correct":isTimeout?"timeout":"wrong");
    setTotalAnswered(t=>t+1);
    recordStat(current.topic||"general",correct);
    sessionHistory.push({question:current.question,answer:current.answer,yours:val,correct,elapsed:elapsed.toFixed(1)});

    if (correct) {
      const streakBonus=streak>=3?2:1;
      const speedBonus=isSpeed?Math.max(0,Math.round(50-elapsed*5)):0;
      const pts=isSpeed?speedBonus:10*streakBonus+timeLeft;
      const earnedXP=pts+(difficulty==="easy"?4:difficulty==="medium"?8:14);
      setScore(s=>s+pts);
      setXp(x=>{ const nx=x+earnedXP; globalXP=nx; persistAll(); return nx; });
      setStreak(s=>{ const ns=s+1; setMaxStreak(m=>Math.max(m,ns));
        if (ns%5===0) { setShowCelebration(true); setTimeout(()=>setShowCelebration(false),2000); spawnParticles(true,true); snd("streak"); }
        return ns;
      });
      setTotalCorrect(t=>t+1);
      // In review mode, remove from missed pool when answered correctly
      if (isReview) {
        missedQuestions = missedQuestions.filter(q=>q.question!==current.question);
        persistAll();
      }
      setConsCorrect(c=>{ const nc=c+1; if(nc>=3){setAdaptiveLevel(l=>Math.min(1,l+1));return 0;} return nc; });
      setConsWrong(0);
      snd("correct");
    } else {
      setLives(l=>l-1);
      setStreak(0);
      // Add to spaced repetition queue
      if (!isTimeout) spacedQueue.push(current);
      // Add to persistent wrong answers pool (avoid duplicates by question text)
      if (!missedQuestions.find(q=>q.question===current.question)) {
        missedQuestions.push({...current});
        persistAll();
      }
      setConsWrong(w=>{ const nw=w+1; if(nw>=2){setAdaptiveLevel(l=>Math.max(-1,l-1));return 0;} return nw; });
      setConsCorrect(0);
      snd("wrong");
    }
    spawnParticles(correct);

    const delay = correct ? 900 : null;
    if (correct) {
      setTimeout(()=>{
        // Review mode: end when pool is empty, else keep going
        if (isReview) {
          const remaining = missedQuestions.filter(q=>q.question!==current.question);
          if (remaining.length === 0) { setWeakTopics(getWeakTopics()); setScreen("win"); return; }
          setQIdx(q=>q+1); loadQuestion(levelIdx); return;
        }
        const next=qIdx+1;
        if (!isDrill&&next>=questionsPerLevel) {
          if (levelIdx+1>=LEVELS.length) { setWeakTopics(getWeakTopics()); setScreen("win"); }
          else { snd("levelup"); setScreen("levelup"); }
        } else if (isDrill&&next>=questionsPerLevel*3) {
          setWeakTopics(getWeakTopics()); setScreen("win");
        } else { setQIdx(next); loadQuestion(levelIdx); }
      }, 900);
    }
    // Wrong/timeout: user must click to continue (handled by advanceQuestion)
  }

  function advanceQuestion() {
    if (feedback === "correct" || feedback === null) return;
    const newLives = lives;
    if (!isReview && newLives <= 0) { setWeakTopics(getWeakTopics()); setScreen("win"); return; }
    if (isReview) {
      if (missedQuestions.length === 0) { setWeakTopics(getWeakTopics()); setScreen("win"); return; }
      setQIdx(q=>q+1); loadQuestion(levelIdx); return;
    }
    const next = qIdx + 1;
    if (!isDrill && next >= questionsPerLevel) {
      if (levelIdx + 1 >= LEVELS.length) { setWeakTopics(getWeakTopics()); setScreen("win"); }
      else { snd("levelup"); setScreen("levelup"); }
    } else if (isDrill && next >= questionsPerLevel * 3) {
      setWeakTopics(getWeakTopics()); setScreen("win");
    } else { setQIdx(next); loadQuestion(levelIdx); }
  }

  function handleTypedSubmit() {
    if (typedAnswer===""||feedback!==null) return;
    handleAnswer(null,parseInt(typedAnswer,10));
  }

  // ── Powerups ──
  function usePowerup(type) {
    if (feedback) return;
    if (type==="fifty"&&powerups.fifty>0) {
      const wrongOnes=choices.filter(c=>Number(c)!==Number(current.answer));
      const toHide=[wrongOnes[rand(0,wrongOnes.length-1)],wrongOnes[rand(0,wrongOnes.length-1)]];
      setHiddenChoices(toHide); setPowerups(p=>({...p,fifty:p.fifty-1})); globalPowerups.fifty--; persistAll();
    } else if (type==="time"&&powerups.time>0) {
      setTimeLeft(t=>t+10); setPowerups(p=>({...p,time:p.time-1})); globalPowerups.time--; persistAll();
    } else if (type==="skip"&&powerups.skip>0) {
      setPowerups(p=>({...p,skip:p.skip-1})); globalPowerups.skip--; persistAll();
      setQIdx(q=>q+1); loadQuestion(levelIdx);
    }
  }

  function nextLevel() {
    const nl = levelIdx + 1;
    setLevelIdx(nl);
    setQIdx(0);
    setScreen("game");
    // Directly load question for new level to avoid stale closure in useEffect
    setTimeout(() => loadQuestion(nl), 50);
  }

  function restart() {
    setLevelIdx(0);setQIdx(0);setScore(0);setStreak(0);setMaxStreak(0);
    setTotalCorrect(0);setTotalAnswered(0);setLives(3);setAdaptiveLevel(0);
    setConsCorrect(0);setConsWrong(0);
    setInputError(""); sessionHistory=[];
    setScreen("intro");
  }

  // ── Race mode handlers ──
  function handleRaceInput(player,val) {
    const ni=[...raceInput]; ni[player]=val; setRaceInput(ni);
  }
  function handleRaceSubmit(player) {
    if (raceFeedback[player]!==null) return;
    const val=parseInt(raceInput[player],10);
    const correct=Number(val)===Number(raceCurrent.answer);
    const nf=[...raceFeedback]; nf[player]=correct?"correct":"wrong"; setRaceFeedback(nf);
    if (correct) {
      const ns=[...raceScores]; ns[player]+=1; setRaceScores(ns);
      snd("correct"); spawnParticles(true);
      const nextRound=raceRound+1;
      if (nextRound>=RACE_ROUNDS) { setRaceWinner(ns[0]>ns[1]?0:ns[1]>ns[0]?1:-1); setScreen("racewin"); }
      else {
        setTimeout(()=>{
          setRaceRound(nextRound);
          const q=LEVELS[rand(0,LEVELS.length-1)].gen(difficulty);
          setRaceCurrent(q); setRaceFeedback([null,null]); setRaceInput(["",""]);
        },800);
      }
    } else { snd("wrong"); }
  }

  // ── Sudoku functions ──
  function startSudoku() {
    const { solved, puzzle } = generateSudoku(sudokuDiff);
    setSudokuSolved(solved); setSudokuPuzzle(puzzle);
    setSudokuGrid(puzzle.map(r=>[...r]));
    setSudokuFixed(puzzle.map(r=>r.map(v=>v!==0)));
    setSudokuSelected(null); setSudokuErrors([]); setSudokuTime(0);
    setSudokuComplete(false); setSudokuHints(3); setSudokuMistakes(0);
    setSudokuNotes(Array.from({length:9},()=>Array.from({length:9},()=>new Set())));
    setNotesMode(false);
    setAppMode("sudoku");
  }

  function handleSudokuCell(r,c) {
    if (sudokuFixed&&sudokuFixed[r][c]) return;
    setSudokuSelected([r,c]);
  }

  function handleSudokuInput(val) {
    if (!sudokuSelected||!sudokuGrid) return;
    const [r,c]=sudokuSelected;
    if (sudokuFixed[r][c]) return;
    const n=parseInt(val,10);
    if (notesMode && n>=1&&n<=9) {
      const nn=sudokuNotes.map(row=>row.map(cell=>new Set(cell)));
      if (nn[r][c].has(n)) nn[r][c].delete(n); else nn[r][c].add(n);
      setSudokuNotes(nn); return;
    }
    if (isNaN(n)||n<1||n>9) return;
    const ng=sudokuGrid.map(row=>[...row]); ng[r][c]=n; setSudokuGrid(ng);
    if (n!==sudokuSolved[r][c]) {
      setSudokuMistakes(m=>m+1);
      setSudokuErrors(e=>[...e,`${r}-${c}`]);
      setTimeout(()=>setSudokuErrors(e=>e.filter(x=>x!==`${r}-${c}`)),1500);
    } else {
      const errs=sudokuErrors.filter(x=>x!==`${r}-${c}`); setSudokuErrors(errs);
      // Check complete
      const complete=ng.every((row,ri)=>row.every((v,ci)=>v===sudokuSolved[ri][ci]));
      if (complete) { setSudokuComplete(true); snd("levelup"); spawnParticles(true,true); }
    }
  }

  function clearSudokuCell() {
    if (!sudokuSelected||!sudokuGrid) return;
    const [r,c]=sudokuSelected;
    if (sudokuFixed[r][c]) return;
    const ng=sudokuGrid.map(row=>[...row]); ng[r][c]=0; setSudokuGrid(ng);
  }

  function useSudokuHint() {
    if (sudokuHints<=0||!sudokuSelected) return;
    const [r,c]=sudokuSelected;
    if (sudokuFixed[r][c]) return;
    const ng=sudokuGrid.map(row=>[...row]); ng[r][c]=sudokuSolved[r][c]; setSudokuGrid(ng);
    setSudokuHints(h=>h-1);
  }

  // Stop speech when leaving game
  useEffect(() => { return () => { stopSpeech(); stopVoiceAnswer(); }; }, []);

  // ── PWA push notification registration ──
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    // Only prompt after first session complete
    if (!vocabSave.onboarded) return;
    if (Notification.permission === "default") {
      // Gentle ask after 3 seconds
      const t = setTimeout(() => {
        Notification.requestPermission().then(perm => {
          if (perm === "granted") {
            // Schedule a daily reminder via periodic check on next load
            try { localStorage.setItem("mathos_notify","1"); } catch(e) {}
          }
        });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, []);

  // Check if notification due on load
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      const last = localStorage.getItem("mathos_last_notif");
      const today = new Date().toDateString();
      if (last !== today && dailyStreak.count > 0) {
        // Show a reminder if they haven't played today yet
        const lastPlay = dailyStreak.lastDate;
        if (lastPlay && lastPlay !== today) {
          new Notification("BRain_TRain — Keep your streak!", {
            body: `You have a ${dailyStreak.count}-day streak. Don't lose it today!`,
            icon: "/icons/icon-192.png",
            tag: "daily-reminder"
          });
          localStorage.setItem("mathos_last_notif", today);
        }
      }
    } catch(e) {}
  }, []);

  const timerPct=(timeLeft/TOTAL_TIME)*100;
  const timerColor=timeLeft>10?level.color:timeLeft>5?"#ffcc00":"#ff4466";
  const adaptiveLabel=adaptiveLevel>0?"↑ HARDER":adaptiveLevel<0?"↓ EASIER":"ADAPTIVE";
  const adaptiveColor=adaptiveLevel>0?"#ff6b35":adaptiveLevel<0?"#00cfff":mutedColor;

  const panelStyle = { background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"16px 20px", marginBottom:12 };


    // ── HOME ──
  if (appMode==="home") return (
    <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 max(12px,3.5vw)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ position:"fixed",inset:0,opacity:theme==="dark"?0.04:0.02, backgroundImage:"linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />
      <style>{`@keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-2px)}} @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes pop{0%{transform:scale(0);opacity:1}100%{transform:scale(2.5) translateY(-50px);opacity:0}}`}</style>
      {/* Onboarding overlay */}
      {showOnboard&&(
        <div style={{ position:"fixed",inset:0,background:"#050a0f",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
          <div style={{ width:"100%",maxWidth:"min(420px,100%)",animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center",marginBottom:28 }}>
              <div style={{ fontSize:52,marginBottom:10 }}>{["👋","✏️","🎯"][onboardStep]}</div>
              <h2 style={{ fontSize:26,color:"#fff",margin:"0 0 6px",letterSpacing:2 }}>{["Welcome!","Your Name","Difficulty"][onboardStep]}</h2>
              <div style={{ color:mutedColor,fontSize:12,letterSpacing:2 }}>{["Let's personalise your experience","What should we call you?","You can change this anytime"][onboardStep]}</div>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"center",marginBottom:28 }}>
              {[0,1,2].map(i=><div key={i} style={{ width:i===onboardStep?24:8,height:8,borderRadius:4,background:i===onboardStep?"#00ff88":i<onboardStep?"#00ff8844":"#1a3040",transition:"all 0.3s" }} />)}
            </div>
            {onboardStep===0&&(
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:22,color:"#00ff88",marginBottom:12,letterSpacing:3 }}>BRain_TRain</div>
                <div style={{ color:mutedColor,fontSize:12,lineHeight:1.9,marginBottom:24 }}>Math · Vocabulary · Logic<br/><span style={{color:"#fff"}}>XP · Streaks · Progress tracking</span></div>
                <button onClick={()=>setOnboardStep(1)} style={{ width:"100%",background:"transparent",border:"2px solid #00ff88",color:"#00ff88",padding:"16px",fontSize:14,letterSpacing:4,cursor:"pointer",borderRadius:10,fontFamily:"inherit",minHeight:54 }}>GET STARTED →</button>
              </div>
            )}
            {onboardStep===1&&(
              <div>
                <input value={onboardName} onChange={e=>setOnboardName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&onboardName.trim())setOnboardStep(2);}} placeholder="Your name..." maxLength={20}
                  style={{ width:"100%",boxSizing:"border-box",background:"#0a1520",border:"1px solid #1a3040",color:"#fff",padding:"16px",fontSize:18,letterSpacing:2,borderRadius:10,fontFamily:"inherit",outline:"none",marginBottom:12,textAlign:"center" }} />
                <button onClick={()=>onboardName.trim()&&setOnboardStep(2)} style={{ width:"100%",background:onboardName.trim()?"transparent":"#050a0f",border:`2px solid ${onboardName.trim()?"#00ff88":"#1a3040"}`,color:onboardName.trim()?"#00ff88":"#2a4050",padding:"16px",fontSize:14,letterSpacing:4,cursor:"pointer",borderRadius:10,fontFamily:"inherit",minHeight:54 }}>NEXT →</button>
                <button onClick={()=>{setShowOnboard(false);}} style={{ width:"100%",marginTop:8,background:"transparent",border:"none",color:"#2a4050",padding:"10px",fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>Skip for now</button>
              </div>
            )}
            {onboardStep===2&&(
              <div>
                <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:16 }}>
                  {[{k:"easy",l:"EASY",d:"Start simple",c:"#00ff88"},{k:"medium",l:"MEDIUM",d:"Balanced challenge",c:"#ffcc00"},{k:"hard",l:"HARD",d:"Maximum challenge",c:"#ff4466"}].map(d=>(
                    <button key={d.k} onClick={()=>setDifficulty(d.k)} style={{ background:difficulty===d.k?`${d.c}18`:"transparent",border:`2px solid ${difficulty===d.k?d.c:"#1a3040"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:12 }}>
                      <div style={{ width:10,height:10,borderRadius:"50%",background:d.c,flexShrink:0 }} />
                      <div><div style={{ fontSize:13,color:difficulty===d.k?d.c:"#fff",letterSpacing:2 }}>{d.l}</div><div style={{ fontSize:10,color:mutedColor,marginTop:2 }}>{d.d}</div></div>
                    </button>
                  ))}
                </div>
                <button onClick={()=>{
                  vocabSave.onboarded=true;
                  vocabSave.userName=onboardName.trim()||"Player";
                  vocabSave.preferredDiff=difficulty;
                  writeVocabSave(vocabSave);
                  setPlayerName(onboardName.trim()||"Player");
                  setShowOnboard(false);
                }} style={{ width:"100%",background:"transparent",border:"2px solid #00ff88",color:"#00ff88",padding:"16px",fontSize:14,letterSpacing:4,cursor:"pointer",borderRadius:10,fontFamily:"inherit",minHeight:54 }}>LET'S GO →</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ textAlign:"center", animation:"fadeIn 0.6s ease", maxWidth:"min(480px,100%)", width:"100%", paddingTop:"max(env(safe-area-inset-top), 40px)", paddingBottom:"max(env(safe-area-inset-bottom), 32px)" }}>
        <div style={{ fontSize:10, letterSpacing:6, color:"#00ff88", marginBottom:8, opacity:0.6 }}>{playerName ? `WELCOME BACK, ${playerName.toUpperCase()}` : "SELECT MODULE"}</div>
        <h1 style={{ fontSize:"clamp(44px,11vw,72px)", color:textColor, margin:"0 0 4px", textShadow:"0 0 30px #00ff88,0 0 60px #00ff8844", animation:"glitch 3s infinite", letterSpacing:3 }}>BRain<span style={{color:"#00ff88"}}>_</span>TRain</h1>
        <div style={{ color:"#00ff88", fontSize:13, letterSpacing:5, marginBottom:24, opacity:0.7 }}>COGNITIVE TRAINING SYSTEM v3.0</div>

        {/* XP penalty notification */}
        {xpPenaltyInfo&&(
          <div style={{ background:"#ff446618",border:"1px solid #ff446666",borderRadius:10,padding:"12px 16px",marginBottom:12,textAlign:"left",animation:"fadeIn 0.5s ease" }}>
            <div style={{ fontSize:13,color:"#ff4466",fontWeight:"bold",marginBottom:4 }}>⚠️ Streak broken!</div>
            <div style={{ fontSize:11,color:"#fff" }}>You missed {xpPenaltyInfo} day{xpPenaltyInfo>1?"s":""} — your XP was reduced by {Math.round((1-Math.pow(0.75,xpPenaltyInfo))*100)}%. Play daily to protect your XP!</div>
          </div>
        )}

        {/* XP Bar */}
        <div style={{ ...panelStyle, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:14, color:xpRank.color, letterSpacing:3 }}>{xpRank.name}</span>
            <span style={{ fontSize:12, color:mutedColor }}>{xp} XP · {xpToNext(xp)} to next</span>
          </div>
          <div style={{ height:8, background:"#ff446622", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${xpPct(xp)}%`, background:xpRank.color, boxShadow:`0 0 8px ${xpRank.color}`, transition:"width 0.5s", borderRadius:4 }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <span style={{ fontSize:11, color:textColor }}>🔥 {dailyStreak.count} day streak</span>
            <span style={{ fontSize:10, color:mutedColor }}>💡 {powerups.fifty}×50/50 · {powerups.time}×+10s · {powerups.skip}×skip</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
          {/* Math */}
          <button onClick={()=>{setAppMode("math");setScreen("intro");}}
            style={{ background:"transparent", border:"2px solid #00ff88", color:"#00ff88", padding:"18px 10px", fontSize:"clamp(11px,3vw,13px)", letterSpacing:2, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 16px #00ff8833", transition:"all 0.2s", minHeight:"clamp(100px,26vw,120px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00ff8818";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:"clamp(26px,7vw,34px)", marginBottom:6 }}>🧮</div>
            <div style={{ fontWeight:"bold" }}>MATH</div>
            <div style={{ fontSize:9, color:"#00ff8888", marginTop:3, letterSpacing:0 }}>Arithmetic · Algebra</div>
          </button>
          {/* Vocab */}
          <button onClick={()=>{setAppMode("vocab");setVocabScreen("intro");}}
            style={{ background:"transparent", border:"2px solid #a78bfa", color:"#a78bfa", padding:"18px 10px", fontSize:"clamp(11px,3vw,13px)", letterSpacing:2, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 16px #a78bfa33", transition:"all 0.2s", minHeight:"clamp(100px,26vw,120px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#a78bfa18";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:"clamp(26px,7vw,34px)", marginBottom:6 }}>📚</div>
            <div style={{ fontWeight:"bold" }}>VOCAB</div>
            <div style={{ fontSize:9, color:"#a78bfa88", marginTop:3, letterSpacing:0 }}>Words · Meanings</div>
          </button>
          {/* Sudoku */}
          <button onClick={()=>startSudoku()}
            style={{ background:"transparent", border:"2px solid #00cfff", color:"#00cfff", padding:"18px 10px", fontSize:"clamp(11px,3vw,13px)", letterSpacing:2, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 16px #00cfff33", transition:"all 0.2s", minHeight:"clamp(100px,26vw,120px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00cfff18";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:"clamp(26px,7vw,34px)", marginBottom:6 }}>🔢</div>
            <div style={{ fontWeight:"bold" }}>SUDOKU</div>
            <div style={{ fontSize:9, color:"#00cfff88", marginTop:3, letterSpacing:0 }}>Logic · Deduction</div>
          </button>
          {/* Reflex */}
          <button onClick={()=>{setAppMode("reflex");setReflexPhase("intro");setReflexTimes([]);setReflexRoundIdx(0);}}
            style={{ background:"transparent", border:"2px solid #ff6b35", color:"#ff6b35", padding:"18px 10px", fontSize:"clamp(11px,3vw,13px)", letterSpacing:2, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 16px #ff6b3533", transition:"all 0.2s", minHeight:"clamp(100px,26vw,120px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#ff6b3518";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:"clamp(26px,7vw,34px)", marginBottom:6 }}>⚡</div>
            <div style={{ fontWeight:"bold" }}>REFLEX</div>
            <div style={{ fontSize:9, color:"#ff6b3588", marginTop:3, letterSpacing:0 }}>Reaction · Speed</div>
          </button>
          {/* Memory */}
          <button onClick={()=>{setAppMode("memory");setMemPhase("intro");setMemRoundResults([]);setMemRoundIdx(0);}}
            style={{ background:"transparent", border:"2px solid #f59e0b", color:"#f59e0b", padding:"18px 10px", fontSize:"clamp(11px,3vw,13px)", letterSpacing:2, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 16px #f59e0b33", transition:"all 0.2s", minHeight:"clamp(100px,26vw,120px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#f59e0b18";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:"clamp(26px,7vw,34px)", marginBottom:6 }}>🧠</div>
            <div style={{ fontWeight:"bold" }}>MEMORY</div>
            <div style={{ fontSize:9, color:"#f59e0b88", marginTop:3, letterSpacing:0 }}>Sequence · Spatial</div>
          </button>
          {/* Pattern */}
          <button onClick={()=>{setAppMode("pattern");setPatPhase("intro");setPatRoundResults([]);setPatRoundIdx(0);}}
            style={{ background:"transparent", border:"2px solid #ec4899", color:"#ec4899", padding:"18px 10px", fontSize:"clamp(11px,3vw,13px)", letterSpacing:2, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 16px #ec489933", transition:"all 0.2s", minHeight:"clamp(100px,26vw,120px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#ec489918";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:"clamp(26px,7vw,34px)", marginBottom:6 }}>🎨</div>
            <div style={{ fontWeight:"bold" }}>PATTERN</div>
            <div style={{ fontSize:9, color:"#ec489988", marginTop:3, letterSpacing:0 }}>Logic · Sequences</div>
          </button>
          {/* Spatial */}
          <button onClick={()=>{setAppMode("spatial");setSpatPhase("intro");setSpatResults([]);setSpatRoundIdx(0);}}
            style={{ background:"transparent", border:"2px solid #06b6d4", color:"#06b6d4", padding:"18px 10px", fontSize:"clamp(11px,3vw,13px)", letterSpacing:2, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 16px #06b6d433", transition:"all 0.2s", minHeight:"clamp(100px,26vw,120px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#06b6d418";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:"clamp(26px,7vw,34px)", marginBottom:6 }}>🌀</div>
            <div style={{ fontWeight:"bold" }}>SPATIAL</div>
            <div style={{ fontSize:9, color:"#06b6d488", marginTop:3, letterSpacing:0 }}>Rotation · 3D Thinking</div>
          </button>
          {/* Dual N-Back */}
          <button onClick={()=>{setAppMode("dualnback");setDnPhase("intro");setDnResults([]);setDnIdx(0);}}
            style={{ background:"transparent", border:"2px solid #8b5cf6", color:"#8b5cf6", padding:"18px 10px", fontSize:"clamp(11px,3vw,13px)", letterSpacing:2, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 16px #8b5cf633", transition:"all 0.2s", minHeight:"clamp(100px,26vw,120px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#8b5cf618";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:"clamp(26px,7vw,34px)", marginBottom:6 }}>🔮</div>
            <div style={{ fontWeight:"bold" }}>DUAL N-BACK</div>
            <div style={{ fontSize:9, color:"#8b5cf688", marginTop:3, letterSpacing:0 }}>Working Memory · Focus</div>
          </button>
          {/* Brain Score — full width */}
          <button onClick={()=>setShowBrainScore(true)}
            style={{ gridColumn:"1/-1", background:"linear-gradient(135deg,#1a3040,#0a1520)", border:"2px solid #ffcc00", color:"#ffcc00", padding:"16px 20px", fontSize:"clamp(12px,3.5vw,15px)", letterSpacing:3, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 20px #ffcc0033", transition:"all 0.2s", minHeight:64, display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}
            onMouseEnter={e=>{e.currentTarget.style.background="linear-gradient(135deg,#ffcc0018,#1a3040)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,#1a3040,#0a1520)";}}>
            <span style={{ fontSize:26 }}>🏆</span>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontWeight:"bold", letterSpacing:3 }}>BRAIN SCORE DASHBOARD</div>
              <div style={{ fontSize:9, color:"#ffcc0088", marginTop:2, letterSpacing:1 }}>Your cognitive profile across all modules</div>
            </div>
            <span style={{ marginLeft:"auto", fontSize:18 }}>→</span>
          </button>
        </div>

        {/* Settings row */}
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={()=>setSoundOn(s=>!s)} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"14px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:48 }}>{soundOn?"🔊":"🔇"}</button>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"14px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:48 }}>{theme==="dark"?"☀️":"🌙"}</button>
          {Object.keys(globalStats).length>0&&<button onClick={()=>setShowStats(s=>!s)} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"14px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:48 }}>📊</button>}
          <button onClick={()=>setShowSettings(s=>!s)} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"14px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:48 }}>⚙️</button>
        </div>

        {showSettings&&(
          <div style={{ ...panelStyle, marginTop:12, textAlign:"left" }}>
            <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:12 }}>SETTINGS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={()=>{setShowOnboard(true);setOnboardStep(0);}} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 16px", fontSize:12, cursor:"pointer", borderRadius:8, fontFamily:"inherit", textAlign:"left" }}>✏️ Edit Name / Difficulty</button>
              {!showReset
                ? <button onClick={()=>setShowReset(true)} style={{ background:"transparent", border:"1px solid #ff446644", color:"#ff446688", padding:"12px 16px", fontSize:12, cursor:"pointer", borderRadius:8, fontFamily:"inherit", textAlign:"left" }}>🗑️ Reset All Progress</button>
                : <div style={{ background:"#ff446618", border:"1px solid #ff4466", borderRadius:8, padding:"14px 16px" }}>
                    <div style={{ color:"#ff4466", fontSize:12, marginBottom:10 }}>⚠️ This will erase all XP, stats, vocab progress, and saved data. Cannot be undone.</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>setShowReset(false)} style={{ flex:1, background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"10px", fontSize:12, cursor:"pointer", borderRadius:6, fontFamily:"inherit" }}>Cancel</button>
                      <button onClick={()=>{
                        localStorage.removeItem("mathos_save_v1"); localStorage.removeItem("mathos_vocab_v1");
                        window.location.reload();
                      }} style={{ flex:1, background:"#ff446618", border:"1px solid #ff4466", color:"#ff4466", padding:"10px", fontSize:12, cursor:"pointer", borderRadius:6, fontFamily:"inherit" }}>RESET</button>
                    </div>
                  </div>
              }
            </div>
          </div>
        )}

        {showStats&&Object.keys(globalStats).length>0&&(
          <div style={{ ...panelStyle, marginTop:16, textAlign:"left" }}>
            <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:10 }}>ALL-TIME STATS</div>
            {Object.entries(globalStats).map(([topic,v])=>(
              <div key={topic} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:10, color:mutedColor, letterSpacing:1 }}>{topic.toUpperCase()}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:60, height:3, background:borderColor, borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${Math.round(v.correct/v.total*100)}%`, background:Math.round(v.correct/v.total*100)<50?"#ff4466":Math.round(v.correct/v.total*100)<70?"#ffcc00":"#00ff88", borderRadius:2 }} />
                  </div>
                  <span style={{ fontSize:10, color:Math.round(v.correct/v.total*100)<50?"#ff4466":"#00ff88", minWidth:32 }}>{Math.round(v.correct/v.total*100)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BRAIN SCORE DASHBOARD OVERLAY ── */}
        {showBrainScore&&(()=>{
          const bs = calcBrainScore();
          const history = loadBrainScoreHistory();
          const domainConfig = [
            { key:"math",    label:"MATH",    icon:"🧮", col:"#00ff88" },
            { key:"dualnback",label:"N-BACK",  icon:"🔮", col:"#8b5cf6" },
            { key:"vocab",   label:"VOCAB",   icon:"📚", col:"#a78bfa" },
            { key:"memory",  label:"MEMORY",  icon:"🧠", col:"#f59e0b" },
            { key:"reflex",  label:"REFLEX",  icon:"⚡", col:"#ff6b35" },
            { key:"pattern", label:"PATTERN", icon:"🎨", col:"#ec4899" },
            { key:"spatial", label:"SPATIAL", icon:"🌀", col:"#06b6d4" },
          ];
          return (
            <div style={{ position:"fixed",inset:0,background:"#050a0fee",zIndex:200,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"max(env(safe-area-inset-top),20px) max(12px,3.5vw) max(env(safe-area-inset-bottom),20px)" }}>
              <div style={{ maxWidth:"min(480px,100%)",margin:"0 auto",animation:"fadeIn 0.4s ease" }}>
                {/* Header */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:10,color:"#ffcc00",letterSpacing:4 }}>COGNITIVE PROFILE</div>
                    <h2 style={{ fontSize:26,color:"#fff",margin:0,letterSpacing:2 }}>🏆 BRAIN SCORE</h2>
                  </div>
                  <button onClick={()=>setShowBrainScore(false)} style={{ background:"transparent",border:`1px solid ${borderColor}`,color:mutedColor,padding:"12px 16px",fontSize:13,cursor:"pointer",borderRadius:8,fontFamily:"inherit",minHeight:44 }}>✕ CLOSE</button>
                </div>

                {/* Overall score */}
                <div style={{ background:"linear-gradient(135deg,#1a3040,#0a1520)",border:"2px solid #ffcc00",borderRadius:14,padding:"24px 20px",marginBottom:16,textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#ffcc0088",letterSpacing:4,marginBottom:8 }}>OVERALL BRAIN SCORE</div>
                  <div style={{ fontSize:72,color:"#ffcc00",fontWeight:"bold",lineHeight:1,marginBottom:4 }}>{bs.overall}</div>
                  <div style={{ fontSize:10,color:mutedColor,letterSpacing:2 }}>OUT OF 1000</div>
                  <div style={{ height:8,background:"#1a3040",borderRadius:4,overflow:"hidden",marginTop:14 }}>
                    <div style={{ height:"100%",width:`${bs.overall/10}%`,background:"linear-gradient(90deg,#ffcc00,#ff6b35)",borderRadius:4,transition:"width 1s" }} />
                  </div>
                  <div style={{ fontSize:11,color:"#ffcc00",marginTop:8 }}>
                    {bs.overall>=800?"🏆 ELITE COGNITIVE ATHLETE":bs.overall>=600?"⭐ ADVANCED THINKER":bs.overall>=400?"✅ SOLID PERFORMER":bs.overall>=200?"📈 DEVELOPING SKILLS":"🌱 JUST GETTING STARTED — KEEP GOING!"}
                  </div>
                </div>

                {/* Domain radar — 6 bars */}
                <div style={{ background:cardBg,border:`1px solid ${borderColor}`,borderRadius:12,padding:"16px 18px",marginBottom:14 }}>
                  <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:14 }}>DOMAIN BREAKDOWN</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    {domainConfig.map(d=>{
                      const score = bs.domains[d.key] || 0;
                      return (
                        <div key={d.key}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                              <span style={{ fontSize:16 }}>{d.icon}</span>
                              <span style={{ fontSize:11,color:"#fff",letterSpacing:2 }}>{d.label}</span>
                            </div>
                            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                              <span style={{ fontSize:11,color:score>0?d.col:mutedColor }}>{score>0?`${score}%`:"—"}</span>
                              {score===0&&<span style={{ fontSize:9,color:mutedColor }}>not played</span>}
                            </div>
                          </div>
                          <div style={{ height:8,background:"#0a1520",borderRadius:4,overflow:"hidden" }}>
                            <div style={{ height:"100%",width:`${score}%`,background:d.col,borderRadius:4,transition:"width 0.8s",boxShadow:`0 0 8px ${d.col}66` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                {(()=>{
                  const played = domainConfig.filter(d=>bs.domains[d.key]>0);
                  if (played.length<2) return (
                    <div style={{ background:cardBg,border:`1px solid ${borderColor}`,borderRadius:10,padding:"14px 18px",marginBottom:14,textAlign:"center" }}>
                      <div style={{ fontSize:12,color:mutedColor }}>Play more modules to see your strengths and weaknesses</div>
                    </div>
                  );
                  const sorted = [...played].sort((a,b)=>bs.domains[b.key]-bs.domains[a.key]);
                  const best = sorted[0];
                  const worst = sorted[sorted.length-1];
                  return (
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
                      <div style={{ background:cardBg,border:`1px solid ${best.col}44`,borderRadius:10,padding:"14px 12px",textAlign:"center" }}>
                        <div style={{ fontSize:9,color:mutedColor,letterSpacing:2,marginBottom:6 }}>💪 STRENGTH</div>
                        <div style={{ fontSize:24 }}>{best.icon}</div>
                        <div style={{ fontSize:11,color:best.col,marginTop:4,letterSpacing:2 }}>{best.label}</div>
                        <div style={{ fontSize:16,color:best.col,fontWeight:"bold",marginTop:2 }}>{bs.domains[best.key]}%</div>
                      </div>
                      <div style={{ background:cardBg,border:`1px solid ${worst.col}44`,borderRadius:10,padding:"14px 12px",textAlign:"center" }}>
                        <div style={{ fontSize:9,color:mutedColor,letterSpacing:2,marginBottom:6 }}>📈 FOCUS ON</div>
                        <div style={{ fontSize:24 }}>{worst.icon}</div>
                        <div style={{ fontSize:11,color:worst.col,marginTop:4,letterSpacing:2 }}>{worst.label}</div>
                        <div style={{ fontSize:16,color:worst.col,fontWeight:"bold",marginTop:2 }}>{bs.domains[worst.key]}%</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Score history */}
                {history.length>1&&(
                  <div style={{ background:cardBg,border:`1px solid ${borderColor}`,borderRadius:10,padding:"14px 18px",marginBottom:14 }}>
                    <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:12 }}>SCORE HISTORY</div>
                    <div style={{ display:"flex",gap:3,alignItems:"flex-end",height:48 }}>
                      {history.slice(-15).map((h,i)=>{
                        const h2 = Math.round((h.overall/1000)*44)+4;
                        const isLast = i===Math.min(history.length,15)-1;
                        return <div key={i} style={{ flex:1,height:h2,background:isLast?"#ffcc00":"#ffcc0044",borderRadius:2 }} />;
                      })}
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",marginTop:6 }}>
                      <span style={{ fontSize:9,color:mutedColor }}>Past sessions</span>
                      <span style={{ fontSize:9,color:"#ffcc00" }}>Today: {bs.overall}</span>
                    </div>
                  </div>
                )}

                {/* Quick play suggestions */}
                <div style={{ background:cardBg,border:`1px solid ${borderColor}`,borderRadius:10,padding:"14px 18px",marginBottom:16 }}>
                  <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:10 }}>SUGGESTED NEXT</div>
                  {(()=>{
                    const unplayed = domainConfig.filter(d=>!bs.domains[d.key]||bs.domains[d.key]===0);
                    const weak = domainConfig.filter(d=>bs.domains[d.key]>0&&bs.domains[d.key]<60);
                    const suggestions = [...unplayed.slice(0,2),...weak.slice(0,2)].slice(0,3);
                    if (suggestions.length===0) return <div style={{ fontSize:12,color:"#00ff88",textAlign:"center" }}>All modules played! Keep your scores up. 🏆</div>;
                    return suggestions.map(d=>(
                      <div key={d.key} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${borderColor}` }}>
                        <span style={{ fontSize:20 }}>{d.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:11,color:"#fff" }}>{d.label}</div>
                          <div style={{ fontSize:9,color:mutedColor }}>{bs.domains[d.key]>0?`Currently ${bs.domains[d.key]}% — needs improvement`:"Not yet played"}</div>
                        </div>
                        <button onClick={()=>{
                          setShowBrainScore(false);
                          if(d.key==="math"){setAppMode("math");setScreen("intro");}
                          else if(d.key==="vocab"){setAppMode("vocab");setVocabScreen("intro");}
                          else if(d.key==="memory"){setAppMode("memory");setMemPhase("intro");}
                          else if(d.key==="reflex"){setAppMode("reflex");setReflexPhase("intro");}
                          else if(d.key==="pattern"){setAppMode("pattern");setPatPhase("intro");}
                          else if(d.key==="spatial"){setAppMode("spatial");setSpatPhase("intro");}
                        }} style={{ background:`${d.col}18`,border:`1px solid ${d.col}`,color:d.col,padding:"8px 12px",fontSize:10,cursor:"pointer",borderRadius:6,fontFamily:"inherit",letterSpacing:1 }}>PLAY →</button>
                      </div>
                    ));
                  })()}
                </div>

                <button onClick={()=>setShowBrainScore(false)}
                  style={{ width:"100%",background:"transparent",border:`1px solid ${borderColor}`,color:mutedColor,padding:"16px",fontSize:13,letterSpacing:3,cursor:"pointer",borderRadius:10,fontFamily:"inherit",minHeight:52 }}>
                  CLOSE
                </button>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );


  // ── VOCAB MODULE ──
  if (appMode==="vocab") {
    const wrongCount = Object.keys(vocabSave.wrongWords).length;
    const masteredCount = vocabSave.masteredWords.length;
    const totalSeen = vocabSave.seenWords.length;
    const vcol = "#a78bfa";
    const vcolLight = "#a78bfa18";
    const vcolBorder = "#a78bfa44";
    const isSpelling = vocabQ?.type === "spelling";

    return (
      <div style={{ minHeight:"100vh", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 max(12px,3.5vw)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fadeInFast{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pop{0%{transform:scale(0);opacity:1}100%{transform:scale(2.5) translateY(-50px);opacity:0}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
          @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
          .vbtn:hover{filter:brightness(1.2);transform:scale(1.02);}
          .vchoice:active{transform:scale(0.97);}
        `}</style>

        {/* Header */}
        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingTop:"max(env(safe-area-inset-top),16px)", paddingBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <button onClick={()=>setAppMode("home")} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:44 }}>← HOME</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:4 }}>MODULE</div>
              <div style={{ fontSize:14, color:vcol, letterSpacing:3 }}>VOCABULARY</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setVocabScreen("library")} style={{ background:"transparent", border:`1px solid ${vcol}`, color:vcol, padding:"10px 14px", fontSize:12, cursor:"pointer", borderRadius:8, minHeight:44, letterSpacing:1 }}>📖</button>
              <button onClick={()=>setSoundOn(s=>!s)} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"10px 14px", fontSize:14, cursor:"pointer", borderRadius:8, minHeight:44 }}>{soundOn?"🔊":"🔇"}</button>
            </div>
          </div>
        </div>

        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>

        {/* ── INTRO ── */}
        {vocabScreen==="intro"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <h2 style={{ fontSize:32, color:vcol, letterSpacing:3, margin:"0 0 4px", textShadow:`0 0 20px ${vcol}44` }}>📚 VOCAB</h2>
            <div style={{ color:mutedColor, fontSize:12, letterSpacing:3, marginBottom:20 }}>TRAINING SYSTEM</div>

            {/* Stats bar */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:20, color:vcol, fontWeight:"bold" }}>{totalSeen}</div><div style={{ fontSize:9, color:mutedColor, letterSpacing:2 }}>SEEN</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:20, color:"#00ff88", fontWeight:"bold" }}>{masteredCount}</div><div style={{ fontSize:9, color:mutedColor, letterSpacing:2 }}>MASTERED</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:20, color:"#ff4466", fontWeight:"bold" }}>{wrongCount}</div><div style={{ fontSize:9, color:mutedColor, letterSpacing:2 }}>TO REVIEW</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:20, color:"#ffcc00", fontWeight:"bold" }}>{VOCAB_WORDS.length}</div><div style={{ fontSize:9, color:mutedColor, letterSpacing:2 }}>TOTAL</div></div>
            </div>

            {/* Mode selector */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"16px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>PRACTICE MODE</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {VOCAB_MODES.map(m => {
                  const sel = vocabMode === m.key;
                  const disabled = m.key === "review" && wrongCount === 0;
                  return (
                    <button key={m.key} onClick={()=>!disabled&&setVocabMode(m.key)} style={{ background:sel?vcolLight:"transparent", border:`1px solid ${sel?vcol:borderColor}`, borderRadius:10, padding:"12px 16px", cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.15s", textAlign:"left", display:"flex", alignItems:"center", gap:14, opacity:disabled?0.4:1 }}>
                      <span style={{ fontSize:22 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontSize:12, color:sel?vcol:"#fff", letterSpacing:2, marginBottom:2 }}>{m.label}</div>
                        <div style={{ fontSize:10, color:mutedColor }}>
                          {m.key==="review"?`${wrongCount} word${wrongCount!==1?"s":""} to review (5 correct = mastered)`:m.desc}
                        </div>
                      </div>
                      {sel&&<div style={{ marginLeft:"auto", color:vcol, fontSize:16 }}>✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty + Category (not for review) */}
            {vocabMode!=="review"&&(
              <>
                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>DIFFICULTY</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                    {["all","easy","medium","hard"].map(d=>{
                      const sel=vocabDiff===d;
                      const col=d==="easy"?"#00ff88":d==="medium"?"#ffcc00":d==="hard"?"#ff4466":"#a78bfa";
                      return <button key={d} onClick={()=>setVocabDiff(d)} style={{ background:sel?`${col}18`:"transparent", border:`1px solid ${sel?col:borderColor}`, borderRadius:8, padding:"10px 4px", cursor:"pointer", fontFamily:"inherit", color:sel?col:mutedColor, fontSize:11, letterSpacing:1, minHeight:40 }}>{d.toUpperCase()}</button>;
                    })}
                  </div>
                </div>

                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>CATEGORY</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {VOCAB_CATS.map(c=>{
                      const sel=vocabCat===c;
                      return <button key={c} onClick={()=>setVocabCat(c)} style={{ background:sel?vcolLight:"transparent", border:`1px solid ${sel?vcol:borderColor}`, borderRadius:20, padding:"8px 12px", cursor:"pointer", fontFamily:"inherit", color:sel?vcol:"#fff", fontSize:10, letterSpacing:1, minHeight:36 }}>{c.toUpperCase()}</button>;
                    })}
                  </div>
                </div>

                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>NO. OF QUESTIONS</div>
                  <select value={vocabQCount} onChange={e=>setVocabQCount(Number(e.target.value))} style={{ background:bg, border:`1px solid ${borderColor}`, color:"#fff", padding:"12px", fontSize:16, borderRadius:8, fontFamily:"inherit", width:"100%", outline:"none", minHeight:48, WebkitAppearance:"none" }}>
                    {[5,10,15,20,25,30].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </>
            )}

            <button onClick={startVocabGame} style={{ width:"100%", background:"transparent", border:`2px solid ${vcol}`, color:vcol, padding:"18px", fontSize:16, letterSpacing:5, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 20px ${vcol}44`, transition:"all 0.2s", minHeight:58 }}
              onMouseEnter={e=>{e.currentTarget.style.background=vcolLight;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              [ START ]
            </button>
          </div>
        )}

        {/* ── GAME ── */}
        {vocabScreen==="game"&&!vocabQ&&(<div style={{textAlign:"center",padding:"60px 20px",color:"#a78bfa",letterSpacing:3,fontSize:14}}>LOADING...</div>)}
        {vocabScreen==="game"&&vocabQ&&(
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            {/* HUD */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div><div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>SCORE</div><div style={{ fontSize:22, color:"#fff", letterSpacing:2 }}>{vocabScore.toString().padStart(5,"0")}</div></div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>
                  {vocabMode==="review"?`❌ ${Object.keys(vocabSave.wrongWords).length} left`:`Q ${vocabQIdx+1} / ${vocabQCount}`}
                </div>
                <div style={{ fontSize:12, color:vcol, letterSpacing:2 }}>{VOCAB_MODES.find(m=>m.key===vocabMode)?.label||"REVIEW"}</div>
              </div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>STREAK</div><div style={{ fontSize:18, color:vocabStreak>=3?"#ffcc00":"#fff" }}>{vocabStreak>=3?"🔥 ":""}×{vocabStreak}</div></div>
            </div>

            {/* Progress bar */}
            {vocabMode!=="review"&&(
              <div style={{ height:4, background:cardBg, borderRadius:2, marginBottom:16, overflow:"hidden" }}>
                <div style={{ height:"100%", background:vcol, width:`${(vocabQIdx/vocabQCount)*100}%`, transition:"width 0.4s", borderRadius:2 }} />
              </div>
            )}

            {/* Mode badge */}
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              <div style={{ background:vcolLight, border:`1px solid ${vcolBorder}`, borderRadius:20, padding:"4px 12px", fontSize:10, color:vcol, letterSpacing:2 }}>
                {vocabQ.type==="word2meaning"?"WORD → MEANING":vocabQ.type==="meaning2word"?"MEANING → WORD":vocabQ.type==="antonym"?"ANTONYM":vocabQ.type==="spelling"?"SPELLING":"REVIEW"}
              </div>
              <div style={{ background:"transparent", border:`1px solid ${borderColor}`, borderRadius:20, padding:"4px 12px", fontSize:10, color:mutedColor }}>
                {(vocabQ.word.cats?vocabQ.word.cats[0]:vocabQ.word.cat||"general").toUpperCase()} · {vocabQ.word.diff.toUpperCase()}
              </div>
              {vocabSave.wrongWords[vocabQ.word.word]&&(
                <div style={{ background:"#ff446618", border:"1px solid #ff446644", borderRadius:20, padding:"4px 12px", fontSize:10, color:"#ff4466" }}>
                  ✓ {vocabSave.wrongWords[vocabQ.word.word].correctStreak||0}/5 correct
                </div>
              )}
            </div>

            {/* Question card */}
            <div style={{ background:cardBg, border:`1px solid ${vcol}44`, borderRadius:12, padding:"28px 22px", marginBottom:16, textAlign:"center", boxShadow:`0 0 30px ${vcol}08` }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:3, marginBottom:12 }}>
                {vocabQ.type==="word2meaning"?"WHAT DOES THIS WORD MEAN?":vocabQ.type==="meaning2word"?"WHICH WORD MATCHES THIS MEANING?":vocabQ.type==="antonym"?"WHAT IS THE ANTONYM OF...":vocabQ.type==="spelling"?"SPELL THE WORD FOR THIS MEANING:":"IDENTIFY THIS WORD"}
              </div>
              <div style={{ fontSize:"clamp(18px,5.5vw,34px)", color:"#fff", fontWeight:"bold", letterSpacing:2, lineHeight:1.3 }}>{vocabQ.prompt}</div>
              {(vocabQ.type==="word2meaning"||vocabQ.type==="antonym")&&(
                <div style={{ marginTop:8, display:"flex", gap:10, justifyContent:"center", alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:13, color:"#a78bfa99", letterSpacing:1 }}>{vocabQ.word.phonetic}</span>
                  <span style={{ fontSize:12, color:"#a78bfa66", fontStyle:"italic" }}>{vocabQ.word.ipa}</span>
                  <button onClick={()=>speakText(vocabQ.word.word,null)} style={{ background:"transparent", border:"1px solid #a78bfa44", color:"#a78bfa", padding:"3px 10px", fontSize:11, borderRadius:12, cursor:"pointer", fontFamily:"inherit" }}>🔊</button>
                </div>
              )}

              {/* Example sentence + synonyms + antonyms after answer */}
              {showSentence&&(
                <div style={{ animation:"slideUp 0.4s ease", marginTop:16, paddingTop:14, borderTop:`1px solid ${borderColor}` }}>
                  <div style={{ fontSize:9, color:vcol, letterSpacing:3, marginBottom:6 }}>EXAMPLE SENTENCE</div>
                  <div style={{ fontSize:13, color:"#ffffffbb", fontStyle:"italic", lineHeight:1.5, marginBottom:12 }}>"{vocabQ.word.sentence}"</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <div>
                      <div style={{ fontSize:9, color:"#00ff88", letterSpacing:2, marginBottom:4 }}>SYNONYMS</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {(vocabQ.word.synonyms||[]).slice(0,4).map(s=><span key={s} style={{ fontSize:11, color:"#00ff88", border:"1px solid #00ff8844", borderRadius:12, padding:"3px 10px" }}>{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:9, color:"#ff6b35", letterSpacing:2, marginBottom:4 }}>ANTONYMS</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {(vocabQ.word.antonyms||[]).slice(0,4).map(a=><span key={a} style={{ fontSize:11, color:"#ff6b35", border:"1px solid #ff6b3544", borderRadius:12, padding:"3px 10px" }}>{a}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MCQ choices */}
            {!isSpelling&&vocabQ.choices&&(
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
                {vocabQ.choices.map((c,i)=>{
                  const isCorrect = c.toLowerCase()===vocabQ.answer.toLowerCase();
                  let bg=cardBg, border2=borderColor, col="#fff";
                  if (vocabFeedback) {
                    if (isCorrect) { bg="#00ff8818"; border2="#00ff88"; col="#00ff88"; }
                    else if (c===vocabFeedback) { bg="#ff446618"; border2="#ff4466"; col="#ff4466"; }
                  }
                  return (
                    <button key={i} className="vchoice" onClick={()=>handleVocabAnswer(c)} disabled={!!vocabFeedback}
                      style={{ background:bg, border:`1px solid ${border2}`, color:col, padding:"16px 18px", fontSize:14, borderRadius:12, cursor:vocabFeedback?"default":"pointer", fontFamily:"inherit", textAlign:"left", transition:"all 0.15s", lineHeight:1.4, fontWeight:isCorrect&&vocabFeedback?"bold":"normal", minHeight:54 }}>
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Spelling input */}
            {isSpelling&&(
              <div style={{ marginBottom:12 }}>
                <div style={{ background:cardBg, border:`1px solid ${vocabFeedback==="correct"?"#00ff88":vocabFeedback?"#ff4466":borderColor}`, borderRadius:12, padding:"16px 20px", marginBottom:10, textAlign:"center", minHeight:58, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:28, color:"#fff", letterSpacing:4, fontWeight:"bold" }}>{vocabAnswer||<span style={{color:mutedColor,fontSize:14}}>tap letters below</span>}</span>
                </div>
                {!vocabFeedback&&(
                  <>
                    {/* Letter keyboard */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5, marginBottom:8 }}>
                      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=>(
                        <button key={l} onClick={()=>setVocabAnswer(p=>p+l.toLowerCase())}
                          style={{ background:cardBg, border:`1px solid ${borderColor}`, color:"#fff", fontSize:14, fontWeight:"bold", padding:"10px 0", borderRadius:8, cursor:"pointer", fontFamily:"inherit", minHeight:42, touchAction:"manipulation" }}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>setVocabAnswer(p=>p.slice(0,-1))} style={{ flex:1, background:cardBg, border:`1px solid ${borderColor}`, color:"#ff6b35", fontSize:18, padding:"14px", borderRadius:10, cursor:"pointer", fontFamily:"inherit", minHeight:50 }}>⌫</button>
                      <button onClick={()=>handleVocabAnswer(vocabAnswer)} disabled={!vocabAnswer} style={{ flex:2, background:vocabAnswer?vcolLight:"transparent", border:`2px solid ${vocabAnswer?vcol:borderColor}`, color:vocabAnswer?vcol:mutedColor, fontSize:14, letterSpacing:3, padding:"14px", borderRadius:10, cursor:vocabAnswer?"pointer":"default", fontFamily:"inherit", minHeight:50 }}>CHECK</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Feedback + Next */}
            {vocabFeedback&&(
              <div style={{ animation:"fadeInFast 0.3s ease" }}>
                <div style={{ textAlign:"center", fontSize:14, letterSpacing:3, color:vocabFeedback==="correct"?"#00ff88":"#ff4466", marginBottom:12 }}>
                  {vocabFeedback==="correct"?`✓ CORRECT${vocabStreak>1?` · ${vocabStreak}× STREAK`:""}`:`✗ WRONG — ANSWER: "${vocabQ.answer}"`}
                </div>
                {vocabSave.wrongWords[vocabQ.word.word]&&vocabFeedback==="correct"&&(
                  <div style={{ textAlign:"center", fontSize:11, color:mutedColor, marginBottom:10 }}>
                    Review progress: {vocabSave.wrongWords[vocabQ.word.word].correctStreak}/5 correct to master
                  </div>
                )}
                {vocabFeedback==="correct"&&vocabSave.masteredWords.includes(vocabQ.word.word)&&(
                  <div style={{ textAlign:"center", fontSize:13, color:"#ffcc00", marginBottom:10 }}>⭐ WORD MASTERED!</div>
                )}
                <button onClick={nextVocabQuestion} style={{ width:"100%", background:vocabFeedback==="correct"?`${vcol}18`:"#ff446618", border:`2px solid ${vocabFeedback==="correct"?vcol:"#ff4466"}`, color:vocabFeedback==="correct"?vcol:"#ff4466", padding:"16px", fontSize:14, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:54 }}>
                  {vocabMode==="review"&&Object.keys(vocabSave.wrongWords).length===0?"✓ ALL MASTERED →":"NEXT →"}
                </button>
              </div>
            )}
          </div>
        )}


        {/* ── WORD LIBRARY ── */}
        {vocabScreen==="library"&&(
          <div style={{ animation:"fadeIn 0.4s ease" }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, color:"#fff", letterSpacing:3, marginBottom:2 }}>📖 WORD LIBRARY</div>
              <div style={{ fontSize:10, color:mutedColor }}>{VOCAB_WORDS.length} words · tap a word to expand</div>
            </div>

            {/* Search */}
            <div style={{ marginBottom:12 }}>
              <input
                value={librarySearch}
                onChange={e=>setLibrarySearch(e.target.value)}
                placeholder="Search words..."
                style={{ width:"100%", boxSizing:"border-box", background:cardBg, border:`1px solid ${borderColor}`, color:"#fff", padding:"12px 16px", fontSize:14, borderRadius:10, fontFamily:"inherit", outline:"none" }}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {[
                { key:"all",      label:"ALL",      col:vcol },
                { key:"easy",     label:"EASY",     col:"#00ff88" },
                { key:"medium",   label:"MEDIUM",   col:"#ffcc00" },
                { key:"hard",     label:"HARD",     col:"#ff4466" },
                { key:"mastered", label:"⭐ MASTERED", col:"#a78bfa" },
                { key:"learning", label:"📚 LEARNING", col:"#00cfff" },
                { key:"unseen",   label:"🆕 UNSEEN",   col:"#4a6070" },
                { key:"disabled",  label:"🚫 DISABLED",  col:"#ff6b35" },
              ].map(f=>{
                const sel = libraryFilter===f.key;
                return (
                  <button key={f.key} onClick={()=>setLibraryFilter(f.key)}
                    style={{ background:sel?`${f.col}20`:"transparent", border:`1px solid ${sel?f.col:borderColor}`, borderRadius:20, padding:"7px 13px", cursor:"pointer", fontFamily:"inherit", color:sel?f.col:mutedColor, fontSize:10, letterSpacing:1, minHeight:34 }}>
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Stats summary row */}
            {(()=>{
              const total=VOCAB_WORDS.length;
              const mastered=VOCAB_WORDS.filter(w=>isWordFullyMastered(w.word)).length;
              const seen=VOCAB_WORDS.filter(w=>vocabSave.seenWords.includes(w.word)).length;
              const learning=seen-mastered;
              const disabledCount=(vocabSave.disabledWords||[]).length;
              return (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:6, marginBottom:14 }}>
                  {[
                    { label:"TOTAL", val:total, col:vcol },
                    { label:"MASTERED", val:mastered, col:"#a78bfa" },
                    { label:"LEARNING", val:learning, col:"#00cfff" },
                    { label:"UNSEEN", val:total-seen, col:"#4a6070" },
                    { label:"DISABLED", val:disabledCount, col:"#ff6b35" },
                  ].map(s=>(
                    <div key={s.label} style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:8, padding:"10px 6px", textAlign:"center" }}>
                      <div style={{ fontSize:18, color:s.col, fontWeight:"bold" }}>{s.val}</div>
                      <div style={{ fontSize:8, color:mutedColor, letterSpacing:1, marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Word list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {VOCAB_WORDS
                .filter(w => {
                  // Search filter
                  if (librarySearch && !w.word.toLowerCase().includes(librarySearch.toLowerCase()) && !w.meaning.toLowerCase().includes(librarySearch.toLowerCase())) return false;
                  // Category filter
                  if (libraryFilter==="easy") return w.diff==="easy";
                  if (libraryFilter==="medium") return w.diff==="medium";
                  if (libraryFilter==="hard") return w.diff==="hard";
                  if (libraryFilter==="mastered") return isWordFullyMastered(w.word);
                  if (libraryFilter==="learning") return vocabSave.seenWords.includes(w.word) && !isWordFullyMastered(w.word);
                  if (libraryFilter==="unseen") return !vocabSave.seenWords.includes(w.word);
                  if (libraryFilter==="disabled") return isWordDisabled(w.word);
                  return true;
                })
                .map(w => {
                  const mastery = getWordMastery(w.word);
                  const pct = getWordMasteryPct(w.word);
                  const stars = getMasteryStars(w.word);
                  const fullyMastered = isWordFullyMastered(w.word);
                  const seen = vocabSave.seenWords.includes(w.word);
                  const inReview = !!vocabSave.wrongWords[w.word];
                  const isExpanded = expandedWord === w.word;
                  const diffCol = w.diff==="easy"?"#00ff88":w.diff==="medium"?"#ffcc00":"#ff4466";

                  return (
                    <div key={w.word} style={{ background:cardBg, border:`1px solid ${isWordDisabled(w.word)?"#ff6b3533":fullyMastered?"#a78bfa44":inReview?"#ff446633":borderColor}`, borderRadius:12, overflow:"hidden", transition:"all 0.2s", opacity:isWordDisabled(w.word)?0.6:1 }}>
                      {/* Word row */}
                      <div onClick={()=>setExpandedWord(isExpanded?null:w.word)}
                        style={{ padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
                        
                        {/* Diff badge */}
                        <div style={{ background:`${diffCol}22`, border:`1px solid ${diffCol}55`, borderRadius:6, padding:"3px 8px", fontSize:9, color:diffCol, letterSpacing:1, flexShrink:0, minWidth:52, textAlign:"center" }}>
                          {w.diff.toUpperCase()}
                        </div>

                        {/* Word + phonetic */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:15, color:"#fff", fontWeight:"bold" }}>{w.word}</span>
                            {fullyMastered&&<span style={{ fontSize:14 }}>⭐</span>}
                            {inReview&&<span style={{ fontSize:11, color:"#ff4466" }}>❌</span>}
                            {!seen&&<span style={{ fontSize:9, color:mutedColor, border:`1px solid ${borderColor}`, borderRadius:10, padding:"1px 6px" }}>NEW</span>}
                            {isWordDisabled(w.word)&&<span style={{ fontSize:9, color:"#ff6b35", border:"1px solid #ff6b3544", borderRadius:10, padding:"1px 6px" }}>DISABLED</span>}
                          </div>
                          <div style={{ fontSize:10, color:mutedColor, marginTop:1 }}>{w.phonetic} <span style={{color:"#a78bfa66"}}>{w.ipa}</span></div>
                        </div>

                        {/* Mastery progress */}
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontSize:11, color:fullyMastered?"#a78bfa":seen?"#00cfff":mutedColor, marginBottom:3 }}>
                            {fullyMastered?"MASTERED":seen?`${pct}%`:"UNSEEN"}
                          </div>
                          <div style={{ width:60, height:4, background:"#1a3040", borderRadius:2, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:fullyMastered?"#a78bfa":pct>=60?"#00ff88":pct>=30?"#ffcc00":"#ff4466", borderRadius:2, transition:"width 0.4s" }} />
                          </div>
                        </div>

                        {/* Expand arrow */}
                        <div style={{ color:mutedColor, fontSize:12, flexShrink:0 }}>{isExpanded?"▲":"▼"}</div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded&&(
                        <div style={{ borderTop:`1px solid ${borderColor}`, padding:"14px 16px", animation:"fadeInFast 0.2s ease" }}>
                          {/* Meaning */}
                          <div style={{ fontSize:13, color:"#ffffffcc", lineHeight:1.5, marginBottom:10 }}>
                            <span style={{ fontSize:9, color:mutedColor, letterSpacing:2, display:"block", marginBottom:4 }}>MEANING</span>
                            {w.meaning}
                          </div>

                          {/* Example sentence */}
                          <div style={{ fontSize:12, color:"#ffffff88", fontStyle:"italic", lineHeight:1.5, marginBottom:12 }}>"{w.sentence}"</div>

                          {/* Synonyms + Antonyms */}
                          <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
                            <div>
                              <div style={{ fontSize:9, color:"#00ff88", letterSpacing:2, marginBottom:4 }}>SYNONYMS</div>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                                {(w.synonyms||[]).map(s=><span key={s} style={{ fontSize:10, color:"#00ff88", border:"1px solid #00ff8833", borderRadius:10, padding:"2px 8px" }}>{s}</span>)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize:9, color:"#ff6b35", letterSpacing:2, marginBottom:4 }}>ANTONYMS</div>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                                {(w.antonyms||[]).map(a=><span key={a} style={{ fontSize:10, color:"#ff6b35", border:"1px solid #ff6b3533", borderRadius:10, padding:"2px 8px" }}>{a}</span>)}
                              </div>
                            </div>
                          </div>

                          {/* Per-mode mastery breakdown */}
                          <div style={{ background:bg, borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:9, color:mutedColor, letterSpacing:2, marginBottom:8 }}>MASTERY BY MODE</div>
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              {MASTERY_MODES.map(mode => {
                                const streak = mastery[mode] || 0;
                                const modeLabel = mode==="word2meaning"?"Word → Meaning":mode==="meaning2word"?"Meaning → Word":mode==="antonym"?"Antonym":"Spelling";
                                return (
                                  <div key={mode} style={{ display:"flex", alignItems:"center", gap:10 }}>
                                    <div style={{ fontSize:10, color:"#fff", minWidth:120 }}>{modeLabel}</div>
                                    <div style={{ flex:1, height:6, background:"#1a3040", borderRadius:3, overflow:"hidden" }}>
                                      <div style={{ height:"100%", width:`${(streak/MASTERY_THRESHOLD)*100}%`, background:streak>=MASTERY_THRESHOLD?"#a78bfa":streak>=3?"#00ff88":streak>=1?"#ffcc00":"#1a3040", borderRadius:3, transition:"width 0.4s" }} />
                                    </div>
                                    <div style={{ fontSize:10, color:streak>=MASTERY_THRESHOLD?"#a78bfa":mutedColor, minWidth:28, textAlign:"right" }}>
                                      {streak>=MASTERY_THRESHOLD?"✓":`${streak}/5`}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                            <button onClick={()=>speakText(w.word,null)}
                              style={{ flex:1, minWidth:80, background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"10px", fontSize:12, cursor:"pointer", borderRadius:8, fontFamily:"inherit" }}>
                              🔊 Listen
                            </button>
                            <button onClick={()=>{
                              toggleWordDisabled(w.word);
                              setDisabledWordsVersion(v=>v+1);
                            }}
                              style={{ flex:1, minWidth:80, background:isWordDisabled(w.word)?"#00ff8818":"#ff6b3518", border:`1px solid ${isWordDisabled(w.word)?"#00ff88":"#ff6b35"}`, color:isWordDisabled(w.word)?"#00ff88":"#ff6b35", padding:"10px", fontSize:11, cursor:"pointer", borderRadius:8, fontFamily:"inherit", letterSpacing:1 }}>
                              {isWordDisabled(w.word)?"✓ Re-enable":"🚫 Disable"}
                            </button>
                            <button onClick={()=>{
                              setVocabMode("word2meaning");
                              setVocabDiff(w.diff);
                              setVocabCat("all");
                              setExpandedWord(null);
                              setVocabScreen("intro");
                            }}
                              style={{ flex:2, minWidth:120, background:vcolLight, border:`1px solid ${vcol}`, color:vcol, padding:"10px", fontSize:12, cursor:"pointer", borderRadius:8, fontFamily:"inherit", letterSpacing:1 }}>
                              Practice →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              }

              {/* Empty state */}
              {VOCAB_WORDS.filter(w=>{
                if (librarySearch && !w.word.toLowerCase().includes(librarySearch.toLowerCase()) && !w.meaning.toLowerCase().includes(librarySearch.toLowerCase())) return false;
                if (libraryFilter==="mastered") return isWordFullyMastered(w.word);
                if (libraryFilter==="learning") return vocabSave.seenWords.includes(w.word) && !isWordFullyMastered(w.word);
                if (libraryFilter==="unseen") return !vocabSave.seenWords.includes(w.word);
                if (libraryFilter==="disabled") return isWordDisabled(w.word);
                return libraryFilter==="all"||w.diff===libraryFilter;
              }).length===0&&(
                <div style={{ textAlign:"center", padding:"40px 20px", color:mutedColor, fontSize:13 }}>
                  {librarySearch?"No words match your search":"No words in this category yet"}
                </div>
              )}
            </div>

            {/* Back button at bottom */}
            <div style={{ marginTop:20, marginBottom:8 }}>
              <button onClick={()=>{setVocabScreen("intro");setExpandedWord(null);setLibrarySearch("");}}
                style={{ width:"100%", background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"14px", fontSize:13, letterSpacing:3, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:50 }}>
                ← BACK TO MENU
              </button>
            </div>
          </div>
        )}

        {/* ── SUMMARY ── */}
        {vocabScreen==="summary"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:10, color:vcol, letterSpacing:6, marginBottom:8 }}>SESSION COMPLETE</div>
              <h2 style={{ fontSize:40, color:"#fff", margin:"0 0 4px" }}>VOCAB DONE</h2>
              <div style={{ fontSize:12, color:mutedColor, letterSpacing:3 }}>{VOCAB_MODES.find(m=>m.key===vocabMode)?.label}</div>
            </div>

            {/* Session recap card */}
            {vocabSessionStart&&(
              <div style={{ background:"#a78bfa18", border:"1px solid #a78bfa44", borderRadius:10, padding:"14px 18px", marginBottom:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div><div style={{ fontSize:9, color:mutedColor, letterSpacing:2 }}>TIME</div><div style={{ fontSize:16, color:"#fff" }}>{Math.floor((Date.now()-vocabSessionStart)/60000)}m {Math.floor(((Date.now()-vocabSessionStart)%60000)/1000)}s</div></div>
                <div><div style={{ fontSize:9, color:mutedColor, letterSpacing:2 }}>XP EARNED</div><div style={{ fontSize:16, color:"#ffcc00" }}>+{vocabXpEarned} XP</div></div>
                <div><div style={{ fontSize:9, color:mutedColor, letterSpacing:2 }}>NEW WORDS</div><div style={{ fontSize:16, color:"#00ff88" }}>{vocabSessionWords.filter(w=>!vocabSave.seenWords.slice(0,-vocabSessionWords.length).includes(w.word)).length}</div></div>
                <div><div style={{ fontSize:9, color:mutedColor, letterSpacing:2 }}>ACCURACY</div><div style={{ fontSize:16, color:vocabTotal>0&&Math.round(vocabCorrect/vocabTotal*100)>=70?"#00ff88":"#ff4466" }}>{vocabTotal>0?Math.round(vocabCorrect/vocabTotal*100):0}%</div></div>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[
                { label:"SCORE", val:vocabScore, color:vcol },
                { label:"STREAK", val:`×${vocabStreak}`, color:"#ffcc00" },
                { label:"CORRECT", val:`${vocabCorrect}/${vocabTotal}`, color:"#00ff88" },
                { label:"MASTERED", val:vocabSave.masteredWords.length, color:"#ff6b35" },
              ].map(({label,val,color})=>(
                <div key={label} style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"16px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:26, color, fontWeight:"bold" }}>{val}</div>
                  <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Session word log */}
            {vocabSessionWords.length>0&&(
              <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 16px", marginBottom:14, maxHeight:200, overflowY:"auto" }}>
                <div style={{ fontSize:10, color:mutedColor, letterSpacing:3, marginBottom:10 }}>THIS SESSION</div>
                {vocabSessionWords.map((w,i)=>{
                  const stats = vocabSave.wordStats?.[w.word];
                  const pct = stats ? Math.round((stats.correct/stats.seen)*100) : 0;
                  const inReview = vocabSave.wrongWords[w.word];
                  return (
                  <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:i<vocabSessionWords.length-1?`1px solid ${borderColor}`:"none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                      <div>
                        <div style={{ fontSize:13, color:"#fff", fontWeight:"bold" }}>{w.word} <span style={{ fontSize:10, color:"#a78bfa66", fontWeight:"normal" }}>{VOCAB_WORDS.find(v=>v.word===w.word)?.phonetic||""}</span></div>
                        <div style={{ fontSize:10, color:mutedColor, marginTop:1 }}>{w.meaning.slice(0,45)}{w.meaning.length>45?"...":""}</div>
                      </div>
                      <span style={{ fontSize:20, color:w.correct?"#00ff88":"#ff4466" }}>{w.correct?"✓":"✗"}</span>
                    </div>
                    {stats&&<div style={{ height:4, background:"#ff446618", borderRadius:2, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:pct>=80?"#00ff88":pct>=50?"#ffcc00":"#ff4466", borderRadius:2, transition:"width 0.5s" }} /></div>}
                    {stats&&<div style={{ fontSize:9, color:mutedColor, marginTop:2 }}>{stats.correct}/{stats.seen} correct ({pct}%) {inReview?`· review: ${inReview.correctStreak||0}/5`:""}  {vocabSave.masteredWords.includes(w.word)?"⭐ mastered":""}</div>}
                  </div>
                  );
                })}
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setVocabScreen("intro")} style={{ flex:1, background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"16px", fontSize:13, letterSpacing:3, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:52 }}>CHANGE MODE</button>
              <button onClick={startVocabGame} style={{ flex:2, background:"transparent", border:`2px solid ${vcol}`, color:vcol, padding:"16px", fontSize:13, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 16px ${vcol}44`, minHeight:52 }}>PLAY AGAIN</button>
            </div>
          </div>
        )}

        </div>
      </div>
    );
  }






  // ── DUAL N-BACK MODULE ──
  if (appMode==="dualnback") {
    const dcol      = "#8b5cf6";
    const dcolLight = "#8b5cf618";
    const validResults = dnResults.filter(r=>r!==null);
    const posAcc  = validResults.length>0 ? Math.round(validResults.filter(r=>r.posCorrect).length/validResults.length*100) : 0;
    const letAcc  = validResults.length>0 ? Math.round(validResults.filter(r=>r.letCorrect).length/validResults.length*100) : 0;
    const overallAcc = validResults.length>0 ? Math.round((validResults.filter(r=>r.posCorrect).length+validResults.filter(r=>r.letCorrect).length)/(validResults.length*2)*100) : 0;
    const curStim = dnSequence[dnIdx];
    const prevStim = dnIdx>=dnN ? dnSequence[dnIdx-dnN] : null;

    return (
      <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 max(12px,3.5vw)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
          @keyframes popIn{0%{transform:scale(0.7);opacity:0}100%{transform:scale(1);opacity:1}}
          @keyframes glowPulse{0%,100%{box-shadow:0 0 12px #8b5cf644}50%{box-shadow:0 0 28px #8b5cf6aa}}
          @keyframes flashGreen{0%,100%{background:transparent}30%{background:#00ff8822}}
          @keyframes flashRed{0%,100%{background:transparent}30%{background:#ff446622}}
        `}</style>

        {/* Header */}
        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingTop:"max(env(safe-area-inset-top),16px)", paddingBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <button onClick={()=>{ clearTimeout(dnTimer); setAppMode("home"); }}
              style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:44 }}>← HOME</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:4 }}>MODULE</div>
              <div style={{ fontSize:14, color:dcol, letterSpacing:3 }}>DUAL N-BACK</div>
            </div>
            <div style={{ minWidth:70, textAlign:"right" }}>
              {dnPhase==="playing"&&<div style={{ fontSize:10, color:mutedColor }}>{dnIdx+1}/{dnRounds}</div>}
            </div>
          </div>
        </div>

        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>

        {/* ── INTRO ── */}
        {dnPhase==="intro"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:52, marginBottom:8 }}>🔮</div>
              <h2 style={{ fontSize:30, color:dcol, letterSpacing:3, margin:"0 0 4px", textShadow:`0 0 20px ${dcol}44` }}>DUAL N-BACK</h2>
              <div style={{ color:mutedColor, fontSize:11, letterSpacing:3 }}>WORKING MEMORY TRAINING</div>
              {dnHighScore&&<div style={{ marginTop:8, fontSize:12, color:"#ffcc00" }}>🏆 High Score: {dnHighScore}</div>}
            </div>

            {/* Explanation */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>HOW TO PLAY</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { icon:"🔲", text:"A square lights up in a 3×3 grid AND a letter is spoken" },
                  { icon:"🧠", text:`If the POSITION matches what was shown ${dnN} step${dnN>1?"s":""} ago — tap POSITION` },
                  { icon:"🔤", text:`If the LETTER matches what was spoken ${dnN} step${dnN>1?"s":""} ago — tap LETTER` },
                  { icon:"⚡", text:"Both can match at the same time — tap both!" },
                  { icon:"🚫", text:"Don't tap if there's no match — false alarms cost points" },
                ].map(({icon,text})=>(
                  <div key={text} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                    <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{icon}</span>
                    <span style={{ fontSize:12, color:mutedColor, lineHeight:1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual example */}
            <div style={{ background:cardBg, border:`1px solid ${dcol}44`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:9, color:dcol, letterSpacing:3, marginBottom:10 }}>EXAMPLE — N=2</div>
              <div style={{ display:"flex", gap:8, alignItems:"center", justifyContent:"center", flexWrap:"wrap" }}>
                {[
                  { step:1, pos:4, letter:"C", posM:false, letM:false },
                  { step:2, pos:0, letter:"H", posM:false, letM:false },
                  { step:3, pos:4, letter:"R", posM:true,  letM:false },
                  { step:4, pos:7, letter:"H", posM:false, letM:true  },
                ].map(s=>(
                  <div key={s.step} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:9, color:mutedColor, marginBottom:4 }}>Step {s.step}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,14px)", gap:2, margin:"0 auto 4px" }}>
                      {Array.from({length:9}).map((_,i)=>(
                        <div key={i} style={{ width:14, height:14, borderRadius:3, background:i===s.pos?`${dcol}cc`:"#1a3040", border:`1px solid ${i===s.pos?dcol:"#1a3040"}` }} />
                      ))}
                    </div>
                    <div style={{ fontSize:13, color:dcol, fontWeight:"bold" }}>{s.letter}</div>
                    <div style={{ fontSize:8, marginTop:3 }}>
                      {s.posM&&<span style={{ color:"#00ff88" }}>POS✓ </span>}
                      {s.letM&&<span style={{ color:"#ffcc00" }}>LET✓</span>}
                      {!s.posM&&!s.letM&&<span style={{ color:mutedColor }}>—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* N level selector */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:4 }}>N LEVEL</div>
              <div style={{ fontSize:10, color:mutedColor, marginBottom:10 }}>Higher N = harder. Start with N=2 if new.</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {[1,2,3,4].map(n=>{
                  const sel=dnN===n;
                  const labels=["EASY","MEDIUM","HARD","EXPERT"];
                  const cols=["#00ff88","#ffcc00","#ff6b35","#ff4466"];
                  return (
                    <button key={n} onClick={()=>setDnN(n)}
                      style={{ background:sel?`${cols[n-1]}18`:"transparent", border:`2px solid ${sel?cols[n-1]:borderColor}`, borderRadius:10, padding:"12px 6px", cursor:"pointer", fontFamily:"inherit", textAlign:"center", transition:"all 0.15s" }}>
                      <div style={{ fontSize:18, color:sel?cols[n-1]:"#fff", fontWeight:"bold" }}>N={n}</div>
                      <div style={{ fontSize:9, color:sel?cols[n-1]:mutedColor, marginTop:3 }}>{labels[n-1]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stimuli count */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>STIMULI COUNT</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {[10,15,20,25,30].map(n=>{
                  const sel=dnRounds===n;
                  return <button key={n} onClick={()=>setDnRounds(n)}
                    style={{ background:sel?dcolLight:"transparent", border:`1px solid ${sel?dcol:borderColor}`, borderRadius:8, padding:"12px 4px", cursor:"pointer", fontFamily:"inherit", color:sel?dcol:mutedColor, fontSize:13, fontWeight:sel?"bold":"normal", minHeight:44 }}>{n}</button>;
                })}
              </div>
            </div>

            <button onClick={startDnGame}
              style={{ width:"100%", background:"transparent", border:`2px solid ${dcol}`, color:dcol, padding:"18px", fontSize:16, letterSpacing:5, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 20px ${dcol}44`, transition:"all 0.2s", minHeight:58 }}
              onMouseEnter={e=>{e.currentTarget.style.background=dcolLight;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              [ START ]
            </button>
          </div>
        )}

        {/* ── PLAYING ── */}
        {dnPhase==="playing"&&(
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            {/* HUD */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>SCORE</div>
                <div style={{ fontSize:20, color:"#fff" }}>{String(dnScore).padStart(5,"0")}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:dcol, letterSpacing:3, fontWeight:"bold" }}>N = {dnN}</div>
                <div style={{ fontSize:9, color:mutedColor, marginTop:2 }}>stimulus {dnIdx+1} / {dnRounds}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>ACCURACY</div>
                <div style={{ fontSize:18, color:overallAcc>=70?"#00ff88":overallAcc>=50?"#ffcc00":"#ff6b35" }}>{validResults.length>0?`${overallAcc}%`:"—"}</div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ height:4, background:cardBg, borderRadius:2, marginBottom:18, overflow:"hidden" }}>
              <div style={{ height:"100%", background:dcol, width:`${((dnIdx+1)/dnRounds)*100}%`, transition:"width 0.3s", borderRadius:2 }} />
            </div>

            {/* N-back reminder */}
            <div style={{ textAlign:"center", marginBottom:10 }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:2 }}>
                Does this match <span style={{ color:dcol }}>N={dnN} step{dnN>1?"s":""} ago</span>?
              </div>
            </div>

            {/* 3x3 Grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"clamp(6px,2vw,10px)", width:"min(280px,80vw)", margin:"0 auto 16px", aspectRatio:"1" }}>
              {Array.from({length:9}).map((_,i)=>{
                const isActive = dnShowStimulus && curStim && curStim.pos===i;
                const wasPrev  = prevStim && prevStim.pos===i;
                return (
                  <div key={i} style={{
                    aspectRatio:"1",
                    borderRadius:"clamp(8px,2.5vw,14px)",
                    background: isActive ? `${dcol}dd` : wasPrev ? `${dcol}18` : cardBg,
                    border: `2px solid ${isActive ? dcol : wasPrev ? `${dcol}44` : borderColor}`,
                    boxShadow: isActive ? `0 0 20px ${dcol}88, 0 0 40px ${dcol}44` : "none",
                    transition:"all 0.15s",
                    animation: isActive ? "glowPulse 0.5s ease" : "none",
                  }} />
                );
              })}
            </div>

            {/* Letter display */}
            <div style={{ textAlign:"center", marginBottom:20, height:72, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {dnShowStimulus && curStim ? (
                <div style={{ fontSize:"clamp(52px,16vw,72px)", color:dcol, fontWeight:"bold", animation:"popIn 0.2s ease", textShadow:`0 0 24px ${dcol}88`, lineHeight:1 }}>
                  {curStim.letter}
                </div>
              ) : (
                <div style={{ fontSize:32, color:`${dcol}33`, fontWeight:"bold" }}>·</div>
              )}
            </div>

            {/* Previous N-back hint */}
            {prevStim&&(
              <div style={{ textAlign:"center", marginBottom:14, fontSize:11, color:mutedColor }}>
                {dnN} step{dnN>1?"s":""} ago: position {prevStim.pos+1} · letter <span style={{ color:dcol }}>{prevStim.letter}</span>
              </div>
            )}

            {/* Response buttons */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {/* Position button */}
              <button onClick={()=>handleDnResponse("pos")}
                disabled={!dnShowStimulus||dnPosAnswered||dnIdx<dnN}
                style={{
                  background: dnPosAnswered ? "#00ff8822" : dnIdx<dnN ? "transparent" : cardBg,
                  border: `2px solid ${dnPosAnswered?"#00ff88":dnIdx<dnN?borderColor:"#00ff8866"}`,
                  color: dnPosAnswered ? "#00ff88" : dnIdx<dnN ? mutedColor : "#00ff88",
                  padding:"clamp(16px,4vw,22px) 10px",
                  fontSize:"clamp(12px,3.5vw,15px)",
                  letterSpacing:2,
                  cursor: dnShowStimulus&&!dnPosAnswered&&dnIdx>=dnN ? "pointer" : "default",
                  borderRadius:12,
                  fontFamily:"inherit",
                  transition:"all 0.15s",
                  minHeight:64,
                  touchAction:"manipulation",
                  opacity: dnIdx<dnN ? 0.4 : 1,
                }}>
                {dnPosAnswered?"✓ ":""}POSITION
                <div style={{ fontSize:9, marginTop:4, opacity:0.7 }}>same grid spot?</div>
              </button>

              {/* Letter button */}
              <button onClick={()=>handleDnResponse("let")}
                disabled={!dnShowStimulus||dnLetAnswered||dnIdx<dnN}
                style={{
                  background: dnLetAnswered ? "#ffcc0022" : dnIdx<dnN ? "transparent" : cardBg,
                  border: `2px solid ${dnLetAnswered?"#ffcc00":dnIdx<dnN?borderColor:"#ffcc0066"}`,
                  color: dnLetAnswered ? "#ffcc00" : dnIdx<dnN ? mutedColor : "#ffcc00",
                  padding:"clamp(16px,4vw,22px) 10px",
                  fontSize:"clamp(12px,3.5vw,15px)",
                  letterSpacing:2,
                  cursor: dnShowStimulus&&!dnLetAnswered&&dnIdx>=dnN ? "pointer" : "default",
                  borderRadius:12,
                  fontFamily:"inherit",
                  transition:"all 0.15s",
                  minHeight:64,
                  touchAction:"manipulation",
                  opacity: dnIdx<dnN ? 0.4 : 1,
                }}>
                {dnLetAnswered?"✓ ":""}LETTER
                <div style={{ fontSize:9, marginTop:4, opacity:0.7 }}>same letter?</div>
              </button>
            </div>

            {/* Live feedback flash */}
            {dnFeedback&&dnIdx>dnN&&(
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:12 }}>
                <div style={{ fontSize:10, padding:"4px 10px", borderRadius:12,
                  background: dnFeedback.pos==="correct"?"#00ff8822":dnFeedback.pos==="miss"?"#ff446622":"transparent",
                  color: dnFeedback.pos==="correct"?"#00ff88":dnFeedback.pos==="miss"?"#ff4466":mutedColor,
                  border:`1px solid ${dnFeedback.pos==="correct"?"#00ff8844":dnFeedback.pos==="miss"?"#ff446644":borderColor}` }}>
                  POS {dnFeedback.pos==="correct"?"✓":dnFeedback.pos==="miss"?"MISS":"—"}
                </div>
                <div style={{ fontSize:10, padding:"4px 10px", borderRadius:12,
                  background: dnFeedback.let==="correct"?"#ffcc0022":dnFeedback.let==="miss"?"#ff446622":"transparent",
                  color: dnFeedback.let==="correct"?"#ffcc00":dnFeedback.let==="miss"?"#ff4466":mutedColor,
                  border:`1px solid ${dnFeedback.let==="correct"?"#ffcc0044":dnFeedback.let==="miss"?"#ff446644":borderColor}` }}>
                  LET {dnFeedback.let==="correct"?"✓":dnFeedback.let==="miss"?"MISS":"—"}
                </div>
              </div>
            )}

            {/* N-back count reminder */}
            <div style={{ marginTop:16, background:cardBg, border:`1px solid ${borderColor}`, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", fontSize:10, color:mutedColor }}>
              <span>Hits: <span style={{ color:"#00ff88" }}>{validResults.filter(r=>r.posHit||r.letHit).length}</span></span>
              <span>Misses: <span style={{ color:"#ff4466" }}>{validResults.filter(r=>r.posMiss||r.letMiss).length}</span></span>
              <span>False alarms: <span style={{ color:"#ff6b35" }}>{validResults.filter(r=>r.posFA||r.letFA).length}</span></span>
            </div>
          </div>
        )}

        {/* ── SUMMARY ── */}
        {dnPhase==="summary"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:10, color:dcol, letterSpacing:6, marginBottom:8 }}>SESSION COMPLETE</div>
              <div style={{ fontSize:44, marginBottom:4 }}>{overallAcc>=85?"🏆":overallAcc>=70?"⭐":"🔮"}</div>
              <h2 style={{ fontSize:26, color:"#fff", margin:"0 0 4px", letterSpacing:2 }}>N-BACK DONE</h2>
              <div style={{ fontSize:12, color:dcol, letterSpacing:2 }}>N = {dnN} · {dnRounds} stimuli</div>
            </div>

            {/* Main stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {[
                { label:"OVERALL ACC",   val:`${overallAcc}%`,  col:overallAcc>=70?"#00ff88":"#ff6b35" },
                { label:"SCORE",          val:dnScore,            col:dcol },
                { label:"POSITION ACC",  val:`${posAcc}%`,      col:"#00ff88" },
                { label:"LETTER ACC",    val:`${letAcc}%`,      col:"#ffcc00" },
              ].map(({label,val,col})=>(
                <div key={label} style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:22, color:col, fontWeight:"bold" }}>{val}</div>
                  <div style={{ fontSize:9, color:mutedColor, letterSpacing:2, marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Hit / Miss / FA breakdown */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:10 }}>RESPONSE BREAKDOWN</div>
              {[
                { label:"Correct (hits + correct rejects)", val: validResults.filter(r=>r.posCorrect).length + validResults.filter(r=>r.letCorrect).length, total:validResults.length*2, col:"#00ff88" },
                { label:"Misses (matched but didn't tap)",  val: validResults.filter(r=>r.posMiss).length + validResults.filter(r=>r.letMiss).length, total:null, col:"#ff4466" },
                { label:"False alarms (tapped no match)",   val: validResults.filter(r=>r.posFA).length + validResults.filter(r=>r.letFA).length, total:null, col:"#ff6b35" },
              ].map(({label,val,total,col})=>(
                <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${borderColor}` }}>
                  <span style={{ fontSize:10, color:mutedColor }}>{label}</span>
                  <span style={{ fontSize:13, color:col, fontWeight:"bold" }}>{total?`${val}/${total}`:val}</span>
                </div>
              ))}
            </div>

            {/* Performance tier */}
            <div style={{ background:cardBg, border:`1px solid ${dcol}44`, borderRadius:10, padding:"14px 18px", marginBottom:14, textAlign:"center" }}>
              <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:8 }}>PERFORMANCE</div>
              <div style={{ fontSize:15, color:overallAcc>=85?"#ffcc00":overallAcc>=70?"#00ff88":overallAcc>=55?"#00cfff":"#ff6b35", fontWeight:"bold", letterSpacing:2 }}>
                {overallAcc>=85?`🏆 EXCELLENT — Consider trying N=${Math.min(4,dnN+1)}`:
                 overallAcc>=70?`⭐ GOOD — Keep training at N=${dnN}`:
                 overallAcc>=55?`✅ IMPROVING — Stay at N=${dnN}`:
                 `📈 CHALLENGING — Try N=${Math.max(1,dnN-1)} to build up`}
              </div>
              {overallAcc>=85&&dnN<4&&(
                <div style={{ fontSize:10, color:mutedColor, marginTop:6 }}>Research suggests 85%+ accuracy means you're ready for the next N level.</div>
              )}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setDnPhase("intro")}
                style={{ flex:1, background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"16px", fontSize:13, letterSpacing:2, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:52 }}>SETTINGS</button>
              <button onClick={()=>{ setDnResults([]); setDnIdx(0); startDnGame(); }}
                style={{ flex:2, background:"transparent", border:`2px solid ${dcol}`, color:dcol, padding:"16px", fontSize:13, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 16px ${dcol}44`, minHeight:52 }}>PLAY AGAIN</button>
            </div>
          </div>
        )}

        </div>
      </div>
    );
  }

  // ── SPATIAL ROTATION MODULE ──
  if (appMode==="spatial") {
    const scol      = "#06b6d4";
    const scolLight = "#06b6d418";
    const accuracy  = spatResults.length>0 ? Math.round((spatCorrect/spatResults.length)*100) : 0;

    return (
      <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 max(12px,3.5vw)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
          @keyframes popIn{0%{transform:scale(0.7);opacity:0}100%{transform:scale(1);opacity:1}}
          @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        `}</style>

        {/* Header */}
        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingTop:"max(env(safe-area-inset-top),16px)", paddingBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <button onClick={()=>setAppMode("home")}
              style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:44 }}>← HOME</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:4 }}>MODULE</div>
              <div style={{ fontSize:14, color:scol, letterSpacing:3 }}>SPATIAL</div>
            </div>
            <div style={{ minWidth:60, textAlign:"right" }}>
              {spatPhase==="question"&&<div style={{ fontSize:11, color:mutedColor }}>{spatRoundIdx+1}/{spatRounds}</div>}
            </div>
          </div>
        </div>

        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>

        {/* ── INTRO ── */}
        {spatPhase==="intro"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:56, marginBottom:8 }}>🌀</div>
              <h2 style={{ fontSize:32, color:scol, letterSpacing:3, margin:"0 0 4px", textShadow:`0 0 20px ${scol}44` }}>SPATIAL</h2>
              <div style={{ color:mutedColor, fontSize:12, letterSpacing:3 }}>ROTATION TRAINING</div>
            </div>

            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>HOW TO PLAY</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { icon:"👁️",  text:"A shape is shown on the left" },
                  { icon:"🔄",  text:"Four rotated versions are shown as options" },
                  { icon:"☝️",  text:"Tap the one that matches the ORIGINAL shape — just rotated" },
                  { icon:"❌",  text:"Mirrored (flipped) shapes are wrong — rotation only" },
                ].map(({icon,text})=>(
                  <div key={text} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                    <span style={{ fontSize:12, color:mutedColor }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>DIFFICULTY</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { key:"easy",   label:"EASY",   desc:"Simple 4-cell shapes · obvious rotations",     col:"#00ff88" },
                  { key:"medium", label:"MEDIUM", desc:"5-cell shapes · closer rotations",              col:"#ffcc00" },
                  { key:"hard",   label:"HARD",   desc:"6-cell shapes · near-identical distractors",    col:"#ff4466" },
                ].map(d=>{
                  const sel = spatDiff===d.key;
                  return (
                    <button key={d.key} onClick={()=>setSpatDiff(d.key)}
                      style={{ background:sel?`${d.col}18`:"transparent", border:`2px solid ${sel?d.col:borderColor}`, borderRadius:10, padding:"12px 16px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:14, transition:"all 0.15s" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:d.col, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:12, color:sel?d.col:"#fff", letterSpacing:2 }}>{d.label}</div>
                        <div style={{ fontSize:10, color:mutedColor, marginTop:2 }}>{d.desc}</div>
                      </div>
                      {sel&&<div style={{ marginLeft:"auto", color:d.col, fontSize:14 }}>✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rounds */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>QUESTIONS</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {[5,10,15,20,25].map(n=>{
                  const sel=spatRounds===n;
                  return <button key={n} onClick={()=>setSpatRounds(n)}
                    style={{ background:sel?scolLight:"transparent", border:`1px solid ${sel?scol:borderColor}`, borderRadius:8, padding:"12px 4px", cursor:"pointer", fontFamily:"inherit", color:sel?scol:mutedColor, fontSize:14, fontWeight:sel?"bold":"normal", minHeight:44 }}>{n}</button>;
                })}
              </div>
            </div>

            <button onClick={startSpatGame}
              style={{ width:"100%", background:"transparent", border:`2px solid ${scol}`, color:scol, padding:"18px", fontSize:16, letterSpacing:5, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 20px ${scol}44`, transition:"all 0.2s", minHeight:58 }}
              onMouseEnter={e=>{e.currentTarget.style.background=scolLight;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              [ START ]
            </button>
          </div>
        )}

        {/* ── QUESTION ── */}
        {spatPhase==="question"&&spatQ&&(
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            {/* HUD */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>SCORE</div>
                <div style={{ fontSize:20, color:"#fff" }}>{String(spatScore).padStart(5,"0")}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>Q {spatRoundIdx+1} / {spatRounds}</div>
                <div style={{ fontSize:10, color:scol, letterSpacing:2, marginTop:2 }}>WHICH MATCHES?</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>STREAK</div>
                <div style={{ fontSize:18, color:spatStreak>=3?"#ffcc00":"#fff" }}>{spatStreak>=3?"🔥":""}{spatStreak>0?`×${spatStreak}`:"-"}</div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ height:4, background:cardBg, borderRadius:2, marginBottom:18, overflow:"hidden" }}>
              <div style={{ height:"100%", background:scol, width:`${(spatRoundIdx/spatRounds)*100}%`, transition:"width 0.4s", borderRadius:2 }} />
            </div>

            {/* Original shape */}
            <div style={{ background:cardBg, border:`2px solid ${scol}`, borderRadius:14, padding:"20px", marginBottom:16, display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ fontSize:9, color:scol, letterSpacing:4, marginBottom:12 }}>ORIGINAL SHAPE</div>
              {renderShape(spatQ.base, scol, Math.min(120, Math.round(window?.innerWidth*0.28)||100))}
            </div>

            {/* 4 choices in 2×2 grid */}
            <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, textAlign:"center", marginBottom:10 }}>TAP THE MATCHING ROTATION</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {spatQ.choices.map((c,i)=>{
                const isCorrect = c.isCorrect;
                let border2 = borderColor, bg2 = cardBg, label2col = mutedColor;
                if (spatFeedback) {
                  if (isCorrect)       { border2="#00ff88"; bg2="#00ff8818"; label2col="#00ff88"; }
                  else if (i===spatSelected) { border2="#ff4466"; bg2="#ff446618"; label2col="#ff4466"; }
                }
                return (
                  <button key={i} onClick={()=>handleSpatAnswer(i)} disabled={!!spatFeedback}
                    style={{ background:bg2, border:`2px solid ${border2}`, borderRadius:12, padding:"16px 10px", cursor:spatFeedback?"default":"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:"all 0.15s", minHeight:120, touchAction:"manipulation" }}>
                    {renderShape(c.pts, spatFeedback?(isCorrect?"#00ff88":i===spatSelected?"#ff4466":mutedColor):scol, Math.min(80, Math.round((window?.innerWidth||390)*0.18)||70))}
                    {spatFeedback&&isCorrect&&<div style={{ fontSize:10, color:"#00ff88", letterSpacing:2 }}>✓ CORRECT</div>}
                    {spatFeedback&&i===spatSelected&&!isCorrect&&<div style={{ fontSize:10, color:"#ff4466", letterSpacing:2 }}>✗ WRONG</div>}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {spatFeedback&&(
              <div style={{ animation:"slideUp 0.3s ease", marginTop:14 }}>
                <div style={{ textAlign:"center", fontSize:14, letterSpacing:2, color:spatFeedback==="correct"?"#00ff88":"#ff4466", marginBottom:12 }}>
                  {spatFeedback==="correct"
                    ? `✓ CORRECT${spatStreak>1?` · ${spatStreak}× STREAK`:""}`
                    : "✗ WRONG — see the highlighted answer"}
                </div>
                <button onClick={advanceSpatRound}
                  style={{ width:"100%", background:spatFeedback==="correct"?scolLight:"#ff446618", border:`2px solid ${spatFeedback==="correct"?scol:"#ff4466"}`, color:spatFeedback==="correct"?scol:"#ff4466", padding:"16px", fontSize:14, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:54 }}>
                  {spatRoundIdx+1>=spatRounds?"SEE RESULTS →":"NEXT →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUMMARY ── */}
        {spatPhase==="summary"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:10, color:scol, letterSpacing:6, marginBottom:8 }}>SESSION COMPLETE</div>
              <div style={{ fontSize:44, marginBottom:4 }}>{accuracy>=90?"🏆":accuracy>=70?"⭐":"🌀"}</div>
              <h2 style={{ fontSize:28, color:"#fff", margin:"0 0 4px", letterSpacing:2 }}>SPATIAL DONE</h2>
              <div style={{ fontSize:12, color:mutedColor, letterSpacing:2 }}>
                {accuracy>=90?"EXCEPTIONAL 3D THINKING!":accuracy>=70?"STRONG SPATIAL AWARENESS":"KEEP ROTATING — IT GETS EASIER"}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                { label:"ACCURACY",  val:`${accuracy}%`,                      col:accuracy>=80?"#00ff88":"#ff6b35" },
                { label:"SCORE",     val:spatScore,                             col:scol },
                { label:"CORRECT",   val:`${spatCorrect}/${spatResults.length}`, col:"#00ff88" },
                { label:"STREAK",    val:`×${spatStreak}`,                     col:"#ffcc00" },
              ].map(({label,val,col})=>(
                <div key={label} style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:22, color:col, fontWeight:"bold" }}>{val}</div>
                  <div style={{ fontSize:9, color:mutedColor, letterSpacing:2, marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Round dots */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:14 }}>
              <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:10 }}>ROUND BY ROUND</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {spatResults.map((r,i)=>(
                  <div key={i} style={{ width:20, height:20, borderRadius:"50%", background:r.correct?"#00ff88":"#ff4466", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>
                    {r.correct?"✓":"✗"}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setSpatPhase("intro")}
                style={{ flex:1, background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"16px", fontSize:13, letterSpacing:2, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:52 }}>
                SETTINGS
              </button>
              <button onClick={startSpatGame}
                style={{ flex:2, background:"transparent", border:`2px solid ${scol}`, color:scol, padding:"16px", fontSize:13, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 16px ${scol}44`, minHeight:52 }}>
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}

        </div>
      </div>
    );
  }

  // ── PATTERN MODULE ──
  if (appMode==="pattern") {
    const pcol     = "#ec4899";
    const pcolLight = "#ec489918";
    const accuracy = patRoundResults.length>0 ? Math.round((patCorrect/patRoundResults.length)*100) : 0;

    return (
      <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 max(12px,3.5vw)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes popIn{0%{transform:scale(0.7);opacity:0}100%{transform:scale(1);opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingTop:"max(env(safe-area-inset-top),16px)", paddingBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <button onClick={()=>setAppMode("home")}
              style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:44 }}>← HOME</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:4 }}>MODULE</div>
              <div style={{ fontSize:14, color:pcol, letterSpacing:3 }}>PATTERN</div>
            </div>
            <div style={{ textAlign:"right", minWidth:60 }}>
              {patPhase==="question"&&<div style={{ fontSize:11, color:mutedColor }}>{patRoundIdx+1}/{patRounds}</div>}
            </div>
          </div>
        </div>

        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>

        {/* ── INTRO ── */}
        {patPhase==="intro"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:56, marginBottom:8 }}>🎨</div>
              <h2 style={{ fontSize:32, color:pcol, letterSpacing:3, margin:"0 0 4px", textShadow:`0 0 20px ${pcol}44` }}>PATTERN</h2>
              <div style={{ color:mutedColor, fontSize:12, letterSpacing:3 }}>SEQUENCE RECOGNITION</div>
            </div>

            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>HOW TO PLAY</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { icon:"🔢", text:"A number sequence is shown with one term missing" },
                  { icon:"🧩", text:"Find the pattern — arithmetic, geometric, prime, Fibonacci..." },
                  { icon:"☝️", text:"Tap the correct next number from 4 choices" },
                  { icon:"⭐", text:"Streak bonus XP for consecutive correct answers" },
                ].map(({icon,text})=>(
                  <div key={text} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                    <span style={{ fontSize:12, color:mutedColor }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>DIFFICULTY</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { key:"easy",   label:"EASY",   desc:"Arithmetic & geometric · smaller numbers", col:"#00ff88" },
                  { key:"medium", label:"MEDIUM", desc:"Squares, alternating & Fibonacci patterns", col:"#ffcc00" },
                  { key:"hard",   label:"HARD",   desc:"Primes, 2nd order & complex sequences",    col:"#ff4466" },
                ].map(d=>{
                  const sel = patDiff===d.key;
                  return (
                    <button key={d.key} onClick={()=>setPatDiff(d.key)}
                      style={{ background:sel?`${d.col}18`:"transparent", border:`2px solid ${sel?d.col:borderColor}`, borderRadius:10, padding:"12px 16px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:14, transition:"all 0.15s" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:d.col, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:12, color:sel?d.col:"#fff", letterSpacing:2 }}>{d.label}</div>
                        <div style={{ fontSize:10, color:mutedColor, marginTop:2 }}>{d.desc}</div>
                      </div>
                      {sel&&<div style={{ marginLeft:"auto", color:d.col, fontSize:14 }}>✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rounds */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>QUESTIONS</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {[5,10,15,20,25].map(n=>{
                  const sel=patRounds===n;
                  return <button key={n} onClick={()=>setPatRounds(n)}
                    style={{ background:sel?pcolLight:"transparent", border:`1px solid ${sel?pcol:borderColor}`, borderRadius:8, padding:"12px 4px", cursor:"pointer", fontFamily:"inherit", color:sel?pcol:mutedColor, fontSize:14, fontWeight:sel?"bold":"normal", minHeight:44 }}>{n}</button>;
                })}
              </div>
            </div>

            <button onClick={startPatGame}
              style={{ width:"100%", background:"transparent", border:`2px solid ${pcol}`, color:pcol, padding:"18px", fontSize:16, letterSpacing:5, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 20px ${pcol}44`, transition:"all 0.2s", minHeight:58 }}
              onMouseEnter={e=>{e.currentTarget.style.background=pcolLight;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              [ START ]
            </button>
          </div>
        )}

        {/* ── QUESTION ── */}
        {patPhase==="question"&&patQ&&(
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            {/* HUD */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>SCORE</div>
                <div style={{ fontSize:20, color:"#fff" }}>{String(patScore).padStart(5,"0")}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>Q {patRoundIdx+1} / {patRounds}</div>
                <div style={{ fontSize:10, color:pcol, letterSpacing:2, marginTop:2 }}>{patQ.label}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>STREAK</div>
                <div style={{ fontSize:18, color:patStreak>=3?"#ffcc00":"#fff" }}>{patStreak>=3?"🔥":""}{patStreak>0?`×${patStreak}`:"-"}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height:4, background:cardBg, borderRadius:2, marginBottom:20, overflow:"hidden" }}>
              <div style={{ height:"100%", background:pcol, width:`${(patRoundIdx/patRounds)*100}%`, transition:"width 0.4s", borderRadius:2 }} />
            </div>

            {/* Sequence display */}
            <div style={{ background:cardBg, border:`1px solid ${pcol}44`, borderRadius:14, padding:"24px 16px", marginBottom:20, textAlign:"center" }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:3, marginBottom:16 }}>WHAT COMES NEXT?</div>
              <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8 }}>
                {patQ.seq.map((n,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ background:`${pcol}18`, border:`1px solid ${pcol}44`, borderRadius:8, padding:"10px 14px", fontSize:"clamp(16px,4.5vw,22px)", color:pcol, fontWeight:"bold", minWidth:44, textAlign:"center" }}>
                      {n}
                    </div>
                    <div style={{ color:mutedColor, fontSize:14 }}>→</div>
                  </div>
                ))}
                {/* The missing term */}
                <div style={{ background:"#ffffff18", border:`2px dashed ${pcol}`, borderRadius:8, padding:"10px 14px", fontSize:"clamp(16px,4.5vw,22px)", color:"#fff", fontWeight:"bold", minWidth:44, textAlign:"center", animation:"pulse 1s ease infinite" }}>
                  ?
                </div>
              </div>
            </div>

            {/* Choices */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {patQ.choices.map((c,i)=>{
                const isCorrect = c===patQ.answer;
                let bg=cardBg, border2=borderColor, col="#fff";
                if (patFeedback) {
                  if (isCorrect) { bg="#00ff8818"; border2="#00ff88"; col="#00ff88"; }
                  else if (i===patSelected) { bg="#ff446618"; border2="#ff4466"; col="#ff4466"; }
                }
                return (
                  <button key={i} onClick={()=>handlePatAnswer(i)} disabled={!!patFeedback}
                    style={{ background:bg, border:`2px solid ${border2}`, color:col, padding:"18px 10px", fontSize:"clamp(18px,5vw,26px)", fontWeight:"bold", borderRadius:12, cursor:patFeedback?"default":"pointer", fontFamily:"inherit", transition:"all 0.15s", minHeight:64, touchAction:"manipulation" }}>
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Feedback + explanation */}
            {patFeedback&&(
              <div style={{ animation:"slideUp 0.3s ease", marginTop:16 }}>
                <div style={{ textAlign:"center", fontSize:14, letterSpacing:2, color:patFeedback==="correct"?"#00ff88":"#ff4466", marginBottom:8 }}>
                  {patFeedback==="correct"
                    ? `✓ CORRECT${patStreak>1?` · ${patStreak}× STREAK`:""}`
                    : `✗ WRONG — Answer was ${patQ.answer}`}
                </div>
                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"12px 16px", marginBottom:12, textAlign:"center" }}>
                  <div style={{ fontSize:9, color:pcol, letterSpacing:3, marginBottom:4 }}>PATTERN</div>
                  <div style={{ fontSize:13, color:"#fff" }}>{patQ.explanation}</div>
                </div>
                <button onClick={advancePatRound}
                  style={{ width:"100%", background:patFeedback==="correct"?pcolLight:"#ff446618", border:`2px solid ${patFeedback==="correct"?pcol:"#ff4466"}`, color:patFeedback==="correct"?pcol:"#ff4466", padding:"16px", fontSize:14, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:54 }}>
                  {patRoundIdx+1>=patRounds?"RESULTS →":"NEXT →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUMMARY ── */}
        {patPhase==="summary"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:10, color:pcol, letterSpacing:6, marginBottom:8 }}>SESSION COMPLETE</div>
              <div style={{ fontSize:44, marginBottom:4 }}>{accuracy>=90?"🏆":accuracy>=70?"⭐":"🎨"}</div>
              <h2 style={{ fontSize:28, color:"#fff", margin:"0 0 4px", letterSpacing:2 }}>PATTERN DONE</h2>
              <div style={{ fontSize:12, color:mutedColor, letterSpacing:2 }}>
                {accuracy>=90?"EXCELLENT PATTERN RECOGNITION!":accuracy>=70?"GOOD WORK — KEEP TRAINING":"MORE PRACTICE WILL HELP"}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                { label:"ACCURACY",  val:`${accuracy}%`,  col:accuracy>=80?"#00ff88":"#ff6b35" },
                { label:"SCORE",     val:patScore,          col:pcol },
                { label:"CORRECT",   val:`${patCorrect}/${patRoundResults.length}`, col:"#00ff88" },
                { label:"BEST STREAK",val:`×${Math.max(0,...patRoundResults.reduce((acc,r)=>{
                  const last=acc[acc.length-1];
                  if(r.correct) acc[acc.length-1]=last+1; else acc.push(0);
                  return acc;
                },[0]))}`, col:"#ffcc00" },
              ].map(({label,val,col})=>(
                <div key={label} style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:22, color:col, fontWeight:"bold" }}>{val}</div>
                  <div style={{ fontSize:9, color:mutedColor, letterSpacing:2, marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Question type breakdown */}
            {(()=>{
              const byType = {};
              patRoundResults.forEach(r=>{ if(!byType[r.label]) byType[r.label]={correct:0,total:0}; byType[r.label].total++; if(r.correct) byType[r.label].correct++; });
              return Object.keys(byType).length>0?(
                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
                  <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:10 }}>BY PATTERN TYPE</div>
                  {Object.entries(byType).map(([type,{correct,total}])=>{
                    const pct=Math.round((correct/total)*100);
                    return (
                      <div key={type} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                        <div style={{ fontSize:9, color:mutedColor, minWidth:90, letterSpacing:0 }}>{type}</div>
                        <div style={{ flex:1, height:6, background:"#1a3040", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:pct>=80?"#00ff88":pct>=50?"#ffcc00":"#ff4466", borderRadius:3, transition:"width 0.5s" }} />
                        </div>
                        <div style={{ fontSize:9, color:mutedColor, minWidth:40, textAlign:"right" }}>{correct}/{total}</div>
                      </div>
                    );
                  })}
                </div>
              ):null;
            })()}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setPatPhase("intro")}
                style={{ flex:1, background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"16px", fontSize:13, letterSpacing:2, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:52 }}>
                SETTINGS
              </button>
              <button onClick={startPatGame}
                style={{ flex:2, background:"transparent", border:`2px solid ${pcol}`, color:pcol, padding:"16px", fontSize:13, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 16px ${pcol}44`, minHeight:52 }}>
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}

        </div>
      </div>
    );
  }

  // ── MEMORY MODULE ──
  if (appMode==="memory") {
    const mcol = "#f59e0b";
    const mcolLight = "#f59e0b18";
    const { count, gridSize } = memGetConfig();
    const totalCells = gridSize * gridSize;
    const perfects = memRoundResults.filter(r=>r.perfect).length;
    const totalCorrect = memRoundResults.reduce((s,r)=>s+r.correct,0);
    const totalPossible = memRoundResults.reduce((s,r)=>s+r.total,0);
    const accuracy = totalPossible>0 ? Math.round((totalCorrect/totalPossible)*100) : 0;

    return (
      <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 max(12px,3.5vw)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
          @keyframes popIn{0%{transform:scale(0.6);opacity:0}100%{transform:scale(1);opacity:1}}
          @keyframes flashWrong{0%,100%{background:inherit}50%{background:#ff446644}}
          @keyframes shimmer{0%{opacity:1}100%{opacity:0.3}}
          .mem-cell-correct{animation:popIn 0.2s ease;}
        `}</style>

        {/* Header */}
        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingTop:"max(env(safe-area-inset-top),16px)", paddingBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <button onClick={()=>{ clearTimeout(memTimer); setAppMode("home"); }}
              style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:44 }}>← HOME</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:4 }}>MODULE</div>
              <div style={{ fontSize:14, color:mcol, letterSpacing:3 }}>MEMORY</div>
            </div>
            {(memPhase==="show"||memPhase==="recall"||memPhase==="result")?(
              <div style={{ display:"flex", gap:4 }}>
                {Array.from({length:3}).map((_,i)=>(
                  <span key={i} style={{ fontSize:16, opacity:i<memLives?1:0.2 }}>❤️</span>
                ))}
              </div>
            ):<div style={{ width:80 }} />}
          </div>
        </div>

        <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>

        {/* ── INTRO ── */}
        {memPhase==="intro"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:56, marginBottom:8 }}>🧠</div>
              <h2 style={{ fontSize:32, color:mcol, letterSpacing:3, margin:"0 0 4px", textShadow:`0 0 20px ${mcol}44` }}>MEMORY</h2>
              <div style={{ color:mutedColor, fontSize:12, letterSpacing:3 }}>SEQUENCE TRAINING</div>
            </div>

            {/* How to play */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>HOW TO PLAY</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { icon:"👀", text:"Numbers appear briefly in a grid — memorise their positions" },
                  { icon:"🙈", text:"Numbers disappear — grid goes blank" },
                  { icon:"☝️", text:"Tap the squares in order: 1, 2, 3..." },
                  { icon:"❤️", text:"3 lives per round — wrong tap costs a life" },
                  { icon:"⭐", text:"Perfect round = zero mistakes = bonus XP" },
                ].map(({icon,text})=>(
                  <div key={text} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                    <span style={{ fontSize:12, color:mutedColor }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>DIFFICULTY</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { key:"easy",   label:"EASY",   desc:"5 numbers · 3×3 grid · 2.5s display", col:"#00ff88" },
                  { key:"medium", label:"MEDIUM", desc:"8 numbers · 4×4 grid · 1.8s display", col:"#ffcc00" },
                  { key:"hard",   label:"HARD",   desc:"12 numbers · 5×5 grid · 1.2s display", col:"#ff4466" },
                ].map(d=>{
                  const sel = memDiff===d.key;
                  return (
                    <button key={d.key} onClick={()=>setMemDiff(d.key)}
                      style={{ background:sel?`${d.col}18`:"transparent", border:`2px solid ${sel?d.col:borderColor}`, borderRadius:10, padding:"12px 16px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:14, transition:"all 0.15s" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:d.col, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:12, color:sel?d.col:"#fff", letterSpacing:2 }}>{d.label}</div>
                        <div style={{ fontSize:10, color:mutedColor, marginTop:2 }}>{d.desc}</div>
                      </div>
                      {sel&&<div style={{ marginLeft:"auto", color:d.col, fontSize:14 }}>✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rounds */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>ROUNDS</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {[3,5,8,10,15].map(n=>{
                  const sel=memRounds===n;
                  return <button key={n} onClick={()=>setMemRounds(n)} style={{ background:sel?mcolLight:"transparent", border:`1px solid ${sel?mcol:borderColor}`, borderRadius:8, padding:"12px 4px", cursor:"pointer", fontFamily:"inherit", color:sel?mcol:mutedColor, fontSize:14, fontWeight:sel?"bold":"normal", minHeight:44 }}>{n}</button>;
                })}
              </div>
            </div>

            <button onClick={startMemGame}
              style={{ width:"100%", background:"transparent", border:`2px solid ${mcol}`, color:mcol, padding:"18px", fontSize:16, letterSpacing:5, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 20px ${mcol}44`, transition:"all 0.2s", minHeight:58 }}
              onMouseEnter={e=>{e.currentTarget.style.background=mcolLight;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              [ START ]
            </button>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {memShowCountdown&&(
          <div style={{ textAlign:"center", padding:"60px 20px", animation:"popIn 0.3s ease" }}>
            <div style={{ fontSize:10, color:mutedColor, letterSpacing:4, marginBottom:16 }}>ROUND {memRoundIdx+1} / {memRounds}</div>
            <div style={{ fontSize:"clamp(80px,22vw,120px)", color:mcol, fontWeight:"bold", lineHeight:1 }}>{memCountdown}</div>
            <div style={{ fontSize:14, color:mutedColor, letterSpacing:3, marginTop:16 }}>GET READY</div>
          </div>
        )}

        {/* ── SHOW + RECALL PHASE ── */}
        {(memPhase==="show"||memPhase==="recall")&&!memShowCountdown&&(
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            {/* HUD */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>ROUND</div>
                <div style={{ fontSize:18, color:"#fff" }}>{memRoundIdx+1} / {memRounds}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:memPhase==="show"?mcol:"#00ff88", letterSpacing:3, fontWeight:"bold" }}>
                  {memPhase==="show"?"👀 MEMORISE":"☝️ TAP IN ORDER"}
                </div>
                {memPhase==="recall"&&<div style={{ fontSize:12, color:mcol, marginTop:2 }}>Next: {memNext}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>PROGRESS</div>
                <div style={{ fontSize:18, color:"#fff" }}>{memTapped.length}/{count}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height:4, background:cardBg, borderRadius:2, marginBottom:14, overflow:"hidden" }}>
              <div style={{ height:"100%", background:mcol, width:`${(memTapped.length/count)*100}%`, transition:"width 0.3s", borderRadius:2 }} />
            </div>

            {/* Grid */}
            <div style={{
              display:"grid",
              gridTemplateColumns:`repeat(${gridSize}, 1fr)`,
              gap:"clamp(4px,1.5vw,8px)",
              width:"100%",
              maxWidth:"min(420px,100%)",
              margin:"0 auto",
              aspectRatio:"1",
            }}>
              {memGrid.map((num, idx) => {
                const isTapped = memTapped.includes(idx);
                const isVisible = memPhase==="show" && num!==null;
                const isRecallEmpty = memPhase==="recall" && !isTapped;

                let cellBg = cardBg;
                let cellColor = "transparent";
                let cellBorder = borderColor;
                let displayNum = null;

                if (isVisible) {
                  // Show phase: number visible
                  cellBg = `${mcol}22`;
                  cellBorder = mcol;
                  displayNum = num;
                  cellColor = mcol;
                } else if (isTapped) {
                  // Correctly tapped
                  cellBg = "#00ff8822";
                  cellBorder = "#00ff88";
                  displayNum = memGrid[idx];
                  cellColor = "#00ff88";
                } else if (memPhase==="recall") {
                  // Blank recall cell
                  cellBg = cardBg;
                  cellBorder = `${borderColor}`;
                }

                return (
                  <div key={idx}
                    onClick={()=>handleMemTap(idx)}
                    className={isTapped?"mem-cell-correct":""}
                    style={{
                      aspectRatio:"1",
                      background:cellBg,
                      border:`2px solid ${cellBorder}`,
                      borderRadius:"clamp(6px,2vw,10px)",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      cursor:memPhase==="recall"&&!isTapped&&num!==null?"pointer":"default",
                      transition:"all 0.15s",
                      fontSize:"clamp(16px,5vw,26px)",
                      fontWeight:"bold",
                      color:cellColor,
                      userSelect:"none",
                      WebkitUserSelect:"none",
                      touchAction:"manipulation",
                    }}>
                    {displayNum}
                  </div>
                );
              })}
            </div>

            {/* Errors indicator */}
            {memPhase==="recall"&&memErrors>0&&(
              <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"#ff4466", letterSpacing:2 }}>
                ✗ {memErrors} mistake{memErrors>1?"s":""} — {memLives} {memLives===1?"life":"lives"} left
              </div>
            )}
          </div>
        )}

        {/* ── RESULT (after each round) ── */}
        {memPhase==="result"&&(
          <div style={{ animation:"popIn 0.3s ease", textAlign:"center" }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:4, marginBottom:12 }}>
                ROUND {memRoundIdx+1} / {memRounds}
              </div>
              {(()=>{
                const last = memRoundResults[memRoundResults.length-1];
                if (!last) return null;
                const pct = Math.round((last.correct/last.total)*100);
                return (
                  <>
                    <div style={{ fontSize:56, marginBottom:8 }}>
                      {last.perfect?"⭐":last.errors<=2?"✅":"❌"}
                    </div>
                    <div style={{ fontSize:28, color:last.perfect?"#ffcc00":last.errors<=2?"#00ff88":"#ff4466", letterSpacing:2, fontWeight:"bold", marginBottom:4 }}>
                      {last.perfect?"PERFECT!":last.errors<=2?"GOOD":last.errors<=4?"CLOSE":"MISS"}
                    </div>
                    <div style={{ fontSize:14, color:mutedColor, marginBottom:16 }}>
                      {last.correct}/{last.total} correct · {last.errors} mistake{last.errors!==1?"s":""}
                    </div>
                    {/* Mini accuracy bar */}
                    <div style={{ height:8, background:"#ff446622", borderRadius:4, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:last.perfect?"#ffcc00":last.errors<=2?"#00ff88":"#ff4466", borderRadius:4, transition:"width 0.5s" }} />
                    </div>
                    {/* Replay the grid answer so player can learn */}
                    <div style={{ fontSize:11, color:mutedColor, letterSpacing:2, marginBottom:10 }}>CORRECT SEQUENCE WAS:</div>
                    <div style={{
                      display:"grid",
                      gridTemplateColumns:`repeat(${gridSize}, 1fr)`,
                      gap:"clamp(3px,1vw,6px)",
                      width:"100%",
                      maxWidth:"min(340px,100%)",
                      margin:"0 auto 20px",
                    }}>
                      {memGrid.map((num, idx) => (
                        <div key={idx} style={{
                          aspectRatio:"1",
                          background:num!==null?`${mcol}18`:cardBg,
                          border:`1px solid ${num!==null?mcol:borderColor}`,
                          borderRadius:6,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:"clamp(11px,3.5vw,18px)",
                          fontWeight:"bold",
                          color:num!==null?mcol:"transparent",
                        }}>
                          {num}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Round history dots */}
            {memRoundResults.length>0&&(
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:20 }}>
                {memRoundResults.map((r,i)=>(
                  <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:r.perfect?"#ffcc00":r.errors<=2?"#00ff88":"#ff4466" }} />
                ))}
                {Array.from({length:memRounds-memRoundResults.length}).map((_,i)=>(
                  <div key={"e"+i} style={{ width:10, height:10, borderRadius:"50%", background:borderColor }} />
                ))}
              </div>
            )}

            <button onClick={advanceMemRound}
              style={{ width:"100%", background:mcolLight, border:`2px solid ${mcol}`, color:mcol, padding:"16px", fontSize:14, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:54 }}>
              {memRoundIdx+1>=memRounds?"SEE RESULTS →":"NEXT ROUND →"}
            </button>
          </div>
        )}

        {/* ── SUMMARY ── */}
        {memPhase==="summary"&&(
          <div style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:10, color:mcol, letterSpacing:6, marginBottom:8 }}>SESSION COMPLETE</div>
              <div style={{ fontSize:44, marginBottom:4 }}>{perfects===memRounds?"🏆":perfects>0?"⭐":"🧠"}</div>
              <h2 style={{ fontSize:28, color:"#fff", margin:"0 0 4px", letterSpacing:2 }}>MEMORY DONE</h2>
              <div style={{ fontSize:12, color:mutedColor, letterSpacing:2 }}>
                {perfects===memRounds?"ALL PERFECT — OUTSTANDING!":perfects>0?`${perfects} PERFECT ROUND${perfects>1?"S":""}!`:"KEEP TRAINING"}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                { label:"ACCURACY",  val:`${accuracy}%`,  col:accuracy>=90?"#ffcc00":accuracy>=70?"#00ff88":"#ff6b35" },
                { label:"PERFECT",   val:`${perfects}/${memRounds}`, col:"#ffcc00" },
                { label:"CORRECT",   val:`${totalCorrect}/${totalPossible}`, col:"#00ff88" },
                { label:"DIFFICULTY",val:memDiff.toUpperCase(), col:memDiff==="easy"?"#00ff88":memDiff==="medium"?"#ffcc00":"#ff4466" },
              ].map(({label,val,col})=>(
                <div key={label} style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:22, color:col, fontWeight:"bold" }}>{val}</div>
                  <div style={{ fontSize:9, color:mutedColor, letterSpacing:2, marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Round-by-round results */}
            <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:10 }}>ROUND BY ROUND</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {memRoundResults.map((r,i)=>{
                  const pct=Math.round((r.correct/r.total)*100);
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ fontSize:10, color:mutedColor, minWidth:54 }}>Round {i+1}</div>
                      <div style={{ flex:1, height:8, background:"#1a3040", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:r.perfect?"#ffcc00":r.errors<=2?"#00ff88":"#ff4466", borderRadius:4, transition:"width 0.5s" }} />
                      </div>
                      <div style={{ fontSize:10, color:r.perfect?"#ffcc00":r.errors<=2?"#00ff88":"#ff4466", minWidth:36, textAlign:"right" }}>
                        {r.perfect?"⭐":`${pct}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setMemPhase("intro")}
                style={{ flex:1, background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"16px", fontSize:13, letterSpacing:2, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:52 }}>
                SETTINGS
              </button>
              <button onClick={()=>{ setMemRoundResults([]); setMemRoundIdx(0); setMemLives(3); startMemGame(); }}
                style={{ flex:2, background:"transparent", border:`2px solid ${mcol}`, color:mcol, padding:"16px", fontSize:13, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 16px ${mcol}44`, minHeight:52 }}>
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}

        </div>
      </div>
    );
  }

  // ── REFLEX MODULE ──
  if (appMode==="reflex") {
    const rcol = "#ff6b35";
    const rcolLight = "#ff6b3518";
    const screenBg = reflexPhase==="go" ? "#00c853" : reflexPhase==="waiting" ? (reflexColor==="fake"?"#ff9800":"#c62828") : bg;
    const isActive = reflexPhase==="waiting"||reflexPhase==="go";
    const validTimes = reflexTimes.filter(t=>typeof t==="number");
    const avgTime = validTimes.length>0 ? Math.round(validTimes.reduce((a,b)=>a+b,0)/validTimes.length) : null;
    const bestTime = validTimes.length>0 ? Math.min(...validTimes) : null;
    const worstTime = validTimes.length>0 ? Math.max(...validTimes) : null;

    // consistency score: 100 - (stddev/mean)*100, clamped 0-100
    let consistencyScore = null;
    if (validTimes.length>1 && avgTime) {
      const variance = validTimes.reduce((s,t)=>s+Math.pow(t-avgTime,2),0)/validTimes.length;
      const stddev = Math.sqrt(variance);
      consistencyScore = Math.max(0, Math.round(100-(stddev/avgTime)*100));
    }

    return (
      <div onClick={isActive?handleReflexTap:undefined}
        style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:screenBg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:isActive?"center":"flex-start", padding:isActive?"0":"0 max(12px,3.5vw)", overflowY:isActive?"hidden":"auto", WebkitOverflowScrolling:"touch", transition:"background 0.15s", cursor:isActive?"pointer":"default", userSelect:"none", WebkitUserSelect:"none" }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}} @keyframes popIn{0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>

        {/* ── ACTIVE SCREENS (waiting / go) ── */}
        {isActive&&(
          <div style={{ textAlign:"center", animation:"fadeIn 0.2s ease", padding:"20px" }}>
            {reflexPhase==="waiting"&&(
              <>
                <div style={{ fontSize:"clamp(48px,15vw,80px)", marginBottom:16 }}>🔴</div>
                <div style={{ fontSize:"clamp(22px,6vw,36px)", color:"#fff", letterSpacing:4, fontWeight:"bold", marginBottom:12 }}>WAIT...</div>
                <div style={{ fontSize:"clamp(12px,3vw,16px)", color:"rgba(255,255,255,0.7)", letterSpacing:2 }}>Don't tap yet — wait for GREEN</div>
                <div style={{ fontSize:"clamp(11px,2.5vw,14px)", color:"rgba(255,255,255,0.4)", marginTop:8, letterSpacing:1 }}>Round {reflexRoundIdx+1} / {reflexRounds}</div>
              </>
            )}
            {reflexPhase==="go"&&(
              <>
                <div style={{ fontSize:"clamp(48px,15vw,80px)", marginBottom:16, animation:"pulse 0.4s ease infinite" }}>🟢</div>
                <div style={{ fontSize:"clamp(28px,8vw,52px)", color:"#fff", letterSpacing:4, fontWeight:"bold", marginBottom:12 }}>TAP NOW!</div>
                <div style={{ fontSize:"clamp(12px,3vw,16px)", color:"rgba(255,255,255,0.7)", letterSpacing:2 }}>TAP ANYWHERE</div>
              </>
            )}
          </div>
        )}

        {/* ── NON-ACTIVE SCREENS ── */}
        {!isActive&&(
          <>
            {/* Header */}
            <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingTop:"max(env(safe-area-inset-top),16px)", paddingBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <button onClick={()=>{ clearTimeout(reflexTimer); setAppMode("home"); }} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:44 }}>← HOME</button>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:10, color:mutedColor, letterSpacing:4 }}>MODULE</div>
                  <div style={{ fontSize:14, color:rcol, letterSpacing:3 }}>REFLEX</div>
                </div>
                <div style={{ width:80 }} />
              </div>
            </div>

            <div style={{ width:"100%", maxWidth:"min(480px,100%)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>

            {/* ── INTRO ── */}
            {reflexPhase==="intro"&&(
              <div style={{ animation:"fadeIn 0.5s ease" }}>
                <div style={{ textAlign:"center", marginBottom:24 }}>
                  <div style={{ fontSize:56, marginBottom:8 }}>⚡</div>
                  <h2 style={{ fontSize:32, color:rcol, letterSpacing:3, margin:"0 0 4px", textShadow:`0 0 20px ${rcol}44` }}>REFLEX</h2>
                  <div style={{ color:mutedColor, fontSize:12, letterSpacing:3 }}>REACTION TIME TRAINER</div>
                  {reflexPB&&<div style={{ marginTop:8, fontSize:12, color:"#ffcc00" }}>🏆 Personal Best: {reflexPB}ms</div>}
                </div>

                {/* How to play */}
                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>HOW TO PLAY</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      { icon:"🔴", text:"Screen turns RED — wait..." },
                      { icon:"🟢", text:"Screen turns GREEN — tap immediately!" },
                      { icon:"⚡", text:"Your reaction time is recorded in ms" },
                      { icon:"🚫", text:"Tap too early = round doesn't count" },
                    ].map(({icon,text})=>(
                      <div key={text} style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                        <span style={{ fontSize:12, color:mutedColor }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>DIFFICULTY</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      { key:"easy",   label:"EASY",   desc:"2–5 second delay · No fakes", col:"#00ff88" },
                      { key:"medium", label:"MEDIUM", desc:"1.5–4 second delay · No fakes", col:"#ffcc00" },
                      { key:"hard",   label:"HARD",   desc:"0.5–3.5 second delay · Fake flashes!", col:"#ff4466" },
                    ].map(d=>{
                      const sel = reflexDifficulty===d.key;
                      return (
                        <button key={d.key} onClick={()=>setReflexDifficulty(d.key)}
                          style={{ background:sel?`${d.col}18`:"transparent", border:`2px solid ${sel?d.col:borderColor}`, borderRadius:10, padding:"12px 16px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:14, transition:"all 0.15s" }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", background:d.col, flexShrink:0 }} />
                          <div>
                            <div style={{ fontSize:12, color:sel?d.col:"#fff", letterSpacing:2 }}>{d.label}</div>
                            <div style={{ fontSize:10, color:mutedColor, marginTop:2 }}>{d.desc}</div>
                          </div>
                          {sel&&<div style={{ marginLeft:"auto", color:d.col, fontSize:14 }}>✓</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rounds */}
                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
                  <div style={{ fontSize:11, color:"#fff", letterSpacing:3, marginBottom:10 }}>NUMBER OF ROUNDS</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                    {[5,10,15,20,25].map(n=>{
                      const sel=reflexRounds===n;
                      return <button key={n} onClick={()=>setReflexRounds(n)} style={{ background:sel?rcolLight:"transparent", border:`1px solid ${sel?rcol:borderColor}`, borderRadius:8, padding:"12px 4px", cursor:"pointer", fontFamily:"inherit", color:sel?rcol:mutedColor, fontSize:14, fontWeight:sel?"bold":"normal", minHeight:44 }}>{n}</button>;
                    })}
                  </div>
                </div>

                <button onClick={startReflexGame}
                  style={{ width:"100%", background:"transparent", border:`2px solid ${rcol}`, color:rcol, padding:"18px", fontSize:16, letterSpacing:5, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 20px ${rcol}44`, transition:"all 0.2s", minHeight:58 }}
                  onMouseEnter={e=>{e.currentTarget.style.background=rcolLight;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                  [ START ]
                </button>
              </div>
            )}

            {/* ── RESULT (after each round) ── */}
            {reflexPhase==="result"&&(
              <div style={{ animation:"popIn 0.3s ease", textAlign:"center" }} onClick={handleReflexTap}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10, color:mutedColor, letterSpacing:4, marginBottom:8 }}>ROUND {reflexRoundIdx+1} / {reflexRounds}</div>

                  {reflexResult==="early"?(
                    <>
                      <div style={{ fontSize:56, marginBottom:8 }}>🚫</div>
                      <div style={{ fontSize:28, color:"#ff4466", letterSpacing:3, fontWeight:"bold" }}>TOO EARLY!</div>
                      <div style={{ fontSize:13, color:mutedColor, marginTop:8 }}>You tapped before the screen turned green.</div>
                      <div style={{ fontSize:12, color:"#ff446688", marginTop:4 }}>Round not counted.</div>
                    </>
                  ):(
                    <>
                      <div style={{ fontSize:"clamp(48px,14vw,72px)", color:rcol, fontWeight:"bold", letterSpacing:2, marginBottom:4 }}>{reflexResult}<span style={{ fontSize:"clamp(16px,4vw,22px)" }}>ms</span></div>
                      {(()=>{ const r=reflexRating(reflexResult); return <div style={{ fontSize:16, color:r.color, letterSpacing:3, marginBottom:8 }}>{r.label}</div>; })()}
                      {reflexTimes.length>1&&(
                        <div style={{ fontSize:12, color:mutedColor, marginTop:4 }}>
                          Avg so far: {Math.round(reflexTimes.reduce((a,b)=>a+b,0)/reflexTimes.length)}ms
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Round history mini-bars */}
                {reflexTimes.length>0&&(
                  <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
                    <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:8 }}>ROUND HISTORY</div>
                    <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:40 }}>
                      {reflexTimes.map((t,i)=>{
                        const maxT=Math.max(...reflexTimes,400);
                        const h=Math.round((t/maxT)*36)+4;
                        const col=t<150?"#ffcc00":t<200?"#00ff88":t<250?"#00cfff":t<300?"#a78bfa":"#ff6b35";
                        return <div key={i} style={{ flex:1, height:h, background:col, borderRadius:2, opacity:i===reflexTimes.length-1?1:0.6 }} />;
                      })}
                      {Array.from({length:reflexRounds-reflexTimes.length}).map((_,i)=>(
                        <div key={"e"+i} style={{ flex:1, height:4, background:borderColor, borderRadius:2 }} />
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleReflexTap}
                  style={{ width:"100%", background:rcolLight, border:`2px solid ${rcol}`, color:rcol, padding:"16px", fontSize:14, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:54 }}>
                  {reflexRoundIdx+1>=reflexRounds?"SEE RESULTS →":"NEXT ROUND →"}
                </button>
              </div>
            )}

            {/* ── SUMMARY ── */}
            {reflexPhase==="summary"&&(
              <div style={{ animation:"fadeIn 0.5s ease" }}>
                <div style={{ textAlign:"center", marginBottom:20 }}>
                  <div style={{ fontSize:10, color:rcol, letterSpacing:6, marginBottom:8 }}>SESSION COMPLETE</div>
                  <div style={{ fontSize:40, marginBottom:4 }}>⚡</div>
                  <h2 style={{ fontSize:28, color:"#fff", margin:"0 0 4px", letterSpacing:2 }}>REFLEX DONE</h2>
                  {avgTime&&(()=>{ const r=reflexRating(avgTime); return <div style={{ fontSize:14, color:r.color, letterSpacing:3 }}>{r.label}</div>; })()}
                </div>

                {/* Main stats */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  {[
                    { label:"AVERAGE", val:avgTime?`${avgTime}ms`:"—", col:rcol, big:true },
                    { label:"BEST", val:bestTime?`${bestTime}ms`:"—", col:"#00ff88", big:true },
                    { label:"WORST", val:worstTime?`${worstTime}ms`:"—", col:"#ff4466", big:false },
                    { label:"CONSISTENCY", val:consistencyScore!==null?`${consistencyScore}%`:"—", col:"#a78bfa", big:false },
                    { label:"ROUNDS", val:`${validTimes.length}/${reflexRounds}`, col:"#ffcc00", big:false },
                    { label:"PERSONAL BEST", val:reflexPB?`${reflexPB}ms`:"—", col:"#ffcc00", big:false },
                  ].map(({label,val,col})=>(
                    <div key={label} style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                      <div style={{ fontSize:22, color:col, fontWeight:"bold" }}>{val}</div>
                      <div style={{ fontSize:9, color:mutedColor, letterSpacing:2, marginTop:4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Benchmarks */}
                <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
                  <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:10 }}>REACTION TIME BENCHMARKS</div>
                  {[
                    { label:"⚡ ELITE", range:"< 150ms", col:"#ffcc00" },
                    { label:"🌟 EXCELLENT", range:"150–200ms", col:"#00ff88" },
                    { label:"✅ GOOD", range:"200–250ms", col:"#00cfff" },
                    { label:"👍 AVERAGE", range:"250–300ms", col:"#a78bfa" },
                    { label:"📈 KEEP TRAINING", range:"300ms+", col:"#ff6b35" },
                  ].map(b=>{
                    const isYours = avgTime && (
                      (b.label.includes("ELITE")&&avgTime<150)||
                      (b.label.includes("EXCELLENT")&&avgTime>=150&&avgTime<200)||
                      (b.label.includes("GOOD")&&avgTime>=200&&avgTime<250)||
                      (b.label.includes("AVERAGE")&&avgTime>=250&&avgTime<300)||
                      (b.label.includes("KEEP")&&avgTime>=300)
                    );
                    return (
                      <div key={b.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${borderColor}`, background:isYours?`${b.col}10`:"transparent", borderRadius:4, paddingLeft:isYours?8:0 }}>
                        <span style={{ fontSize:11, color:isYours?b.col:mutedColor }}>{b.label} {isYours?"← YOU":""}</span>
                        <span style={{ fontSize:11, color:isYours?b.col:mutedColor }}>{b.range}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Round bar chart */}
                {validTimes.length>0&&(
                  <div style={{ background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
                    <div style={{ fontSize:9, color:mutedColor, letterSpacing:3, marginBottom:10 }}>ALL ROUNDS</div>
                    <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:60 }}>
                      {reflexTimes.map((t,i)=>{
                        const maxT=Math.max(...reflexTimes,400);
                        const h=Math.round((t/maxT)*56)+4;
                        const col=t<150?"#ffcc00":t<200?"#00ff88":t<250?"#00cfff":t<300?"#a78bfa":"#ff6b35";
                        return (
                          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                            <div style={{ height:h, width:"100%", background:col, borderRadius:3 }} />
                            <div style={{ fontSize:7, color:mutedColor }}>{i+1}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                      <span style={{ fontSize:9, color:mutedColor }}>Best: {bestTime}ms</span>
                      <span style={{ fontSize:9, color:mutedColor }}>Worst: {worstTime}ms</span>
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>setReflexPhase("intro")}
                    style={{ flex:1, background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"16px", fontSize:13, letterSpacing:2, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:52 }}>
                    SETTINGS
                  </button>
                  <button onClick={()=>{ setReflexTimes([]); setReflexRoundIdx(0); setReflexResult(null); startReflexGame(); }}
                    style={{ flex:2, background:"transparent", border:`2px solid ${rcol}`, color:rcol, padding:"16px", fontSize:13, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", boxShadow:`0 0 16px ${rcol}44`, minHeight:52 }}>
                    PLAY AGAIN
                  </button>
                </div>
              </div>
            )}

            </div>
          </>
        )}
      </div>
    );
  }

  // ── SUDOKU ──
  if (appMode==="sudoku") {
    const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
    return (
      <div style={{ height:"100vh", height:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 max(10px,3vw)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <style>{`@keyframes pop{0%{transform:scale(0);opacity:1}100%{transform:scale(2.5) translateY(-50px);opacity:0}} @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
        {particles.map(p=>(<div key={p.id} style={{ position:"fixed",left:`${p.x}%`,top:`${p.y}%`,width:8,height:8,borderRadius:"50%",background:p.color,boxShadow:`0 0 10px ${p.color}`,pointerEvents:"none",zIndex:50,animation:"pop 1s ease-out forwards" }} />))}

        <div style={{ width:"100%", maxWidth:"min(430px,100%)", paddingTop:"max(env(safe-area-inset-top), 16px)", paddingBottom:"max(env(safe-area-inset-bottom), 20px)" }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <button onClick={()=>setAppMode("home")} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", letterSpacing:2, minHeight:44 }}>← HOME</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:mutedColor, letterSpacing:4 }}>SUDOKU</div>
              <div style={{ fontSize:13, color:"#00cfff", letterSpacing:3 }}>{sudokuDiff.toUpperCase()}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:mutedColor, letterSpacing:3 }}>TIME</div>
              <div style={{ fontSize:14, color:textColor }}>{fmt(sudokuTime)}</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontSize:14, color:"#ff4466" }}>✗ {sudokuMistakes}</div>
            <div style={{ fontSize:14, color:"#ffcc00" }}>💡 {sudokuHints}</div>
            <div style={{ fontSize:14, color:"#00ff88" }}>🎯 {sudokuDiff.toUpperCase()}</div>
          </div>

          {/* Grid */}
          {sudokuGrid && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(9,1fr)", gap:1, background:"#00cfff44", border:"2px solid #00cfff", borderRadius:8, overflow:"hidden", marginBottom:14, aspectRatio:"1", touchAction:"manipulation" }}>
              {sudokuGrid.map((row,r)=>row.map((val,c)=>{
                const isFixed=sudokuFixed[r][c];
                const isSel=sudokuSelected&&sudokuSelected[0]===r&&sudokuSelected[1]===c;
                const isErr=sudokuErrors.includes(`${r}-${c}`);
                const isSameNum=sudokuSelected&&!isSel&&val!==0&&val===sudokuGrid[sudokuSelected[0]][sudokuSelected[1]];
                const isSameRowCol=sudokuSelected&&!isSel&&(r===sudokuSelected[0]||c===sudokuSelected[1]||( Math.floor(r/3)===Math.floor(sudokuSelected[0]/3)&&Math.floor(c/3)===Math.floor(sudokuSelected[1]/3)));
                const notes=sudokuNotes[r][c];
                let cellBg=theme==="dark"?"#070e18":"#ffffff";
                if (isSameRowCol) cellBg=theme==="dark"?"#0d1e2e":"#e8f4ff";
                if (isSameNum) cellBg=theme==="dark"?"#00cfff18":"#d0f0ff";
                if (isSel) cellBg=theme==="dark"?"#00cfff33":"#b8e8ff";
                if (isErr) cellBg="#ff446622";
                const thickRight=(c+1)%3===0&&c!==8?"2px solid #00cfff44":"1px solid "+borderColor;
                const thickBottom=(r+1)%3===0&&r!==8?"2px solid #00cfff44":"1px solid "+borderColor;
                return (
                  <div key={`${r}-${c}`} onClick={()=>handleSudokuCell(r,c)} style={{ background:cellBg, borderRight:thickRight, borderBottom:thickBottom, display:"flex", alignItems:"center", justifyContent:"center", cursor:isFixed?"default":"pointer", position:"relative", aspectRatio:"1", animation:isErr?"shake 0.3s ease":undefined }}>
                    {val!==0
                      ? <span style={{ fontSize:"clamp(13px,3.5vw,22px)", color:isErr?"#ff4466":isFixed?"#00cfff":isSel?"#00ff88":textColor, fontWeight:isFixed?"bold":"normal" }}>{val}</span>
                      : notes.size>0
                        ? <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0, width:"90%", height:"90%" }}>
                            {[1,2,3,4,5,6,7,8,9].map(n=><div key={n} style={{ fontSize:"clamp(6px,1.5vw,10px)", color:"#00cfff88", display:"flex", alignItems:"center", justifyContent:"center" }}>{notes.has(n)?n:""}</div>)}
                          </div>
                        : null
                    }
                  </div>
                );
              }))}
            </div>
          )}

          {/* Number pad */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(9,1fr)", gap:5, marginBottom:14 }}>
            {[1,2,3,4,5,6,7,8,9].map(n=>(
              <button key={n} onClick={()=>handleSudokuInput(String(n))} style={{ background:cardBg, border:`1px solid ${borderColor}`, color:textColor, padding:"0", fontSize:"clamp(15px,4.5vw,18px)", cursor:"pointer", borderRadius:8, fontFamily:"inherit", transition:"all 0.15s", minHeight:"clamp(38px,10vw,44px)", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#00cfff";e.currentTarget.style.color="#00cfff";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=borderColor;e.currentTarget.style.color=textColor;}}>{n}</button>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:12 }}>
            {[
              { label:"✏️ NOTES", action:()=>setNotesMode(m=>!m), active:notesMode, color:"#ffcc00" },
              { label:"⌫ CLEAR", action:clearSudokuCell, color:mutedColor },
              { label:`💡 HINT (${sudokuHints})`, action:useSudokuHint, color:sudokuHints>0?"#00ff88":"#2a4050" },
            ].map(({label,action,active,color})=>(
              <button key={label} onClick={action} style={{ background:active?"#ffcc0018":"transparent", border:`1px solid ${active?"#ffcc00":borderColor}`, color, padding:"14px 20px", fontSize:13, letterSpacing:2, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:48, touchAction:"manipulation" }}>{label}</button>
            ))}
          </div>

          {/* Difficulty */}
          <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:12 }}>
            {["easy","medium","hard"].map(d=>(
              <button key={d} onClick={()=>{setSudokuDiff(d);startSudoku();}} style={{ background:sudokuDiff===d?"#00cfff18":"transparent", border:`1px solid ${sudokuDiff===d?"#00cfff":borderColor}`, color:sudokuDiff===d?"#00cfff":mutedColor, padding:"12px 18px", fontSize:13, letterSpacing:2, cursor:"pointer", borderRadius:20, fontFamily:"inherit", minHeight:44, touchAction:"manipulation" }}>{d.toUpperCase()}</button>
            ))}
            <button onClick={startSudoku} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, letterSpacing:2, cursor:"pointer", borderRadius:20, fontFamily:"inherit", minHeight:44, touchAction:"manipulation" }}>🔄 NEW</button>
          </div>

          {sudokuComplete&&(
            <div style={{ textAlign:"center", padding:"20px", animation:"fadeIn 0.5s ease" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🎉</div>
              <div style={{ color:"#00ff88", fontSize:14, letterSpacing:4, marginBottom:8 }}>PUZZLE COMPLETE!</div>
              <div style={{ color:textColor, fontSize:13 }}>Time: {fmt(sudokuTime)} · Mistakes: {sudokuMistakes}</div>
              <button onClick={startSudoku} style={{ marginTop:16, background:"transparent", border:"2px solid #00ff88", color:"#00ff88", padding:"10px 32px", fontSize:12, letterSpacing:4, cursor:"pointer", borderRadius:6, fontFamily:"inherit" }}>NEW PUZZLE</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MATH SCREENS ──
  return (
    <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 max(12px,3.5vw)", position:"relative", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ position:"fixed",inset:0,opacity:theme==="dark"?0.04:0.02,backgroundImage:"linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none" }} />
      <style>{`
        @keyframes pop{0%{transform:scale(0) translateY(0);opacity:1}100%{transform:scale(2.5) translateY(-60px);opacity:0}}
        @keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-2px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInFast{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        input[type=number]{-moz-appearance:textfield;} input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;} *{-webkit-tap-highlight-color:transparent;touch-action:manipulation;} body{overscroll-behavior:none;}
        :root{--safe-top:env(safe-area-inset-top,0px);--safe-bottom:env(safe-area-inset-bottom,0px);--safe-left:env(safe-area-inset-left,0px);--safe-right:env(safe-area-inset-right,0px);}
        .fluid-container{width:100%;max-width:min(480px,100%);padding-left:max(12px,3.5vw);padding-right:max(12px,3.5vw);}
        @keyframes celebrate{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
        .cbtn{transition:all 0.15s;cursor:pointer;} .cbtn:hover{transform:translateX(5px) scale(1.02)!important;filter:brightness(1.3);}
        .type-input:focus{outline:none;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#0a1520;} ::-webkit-scrollbar-thumb{background:#1a3040;}
      `}</style>

      {particles.map(p=>(<div key={p.id} style={{ position:"fixed",left:`${p.x}%`,top:`${p.y}%`,width:10,height:10,borderRadius:"50%",background:p.color,boxShadow:`0 0 14px ${p.color}`,pointerEvents:"none",zIndex:50,animation:"pop 0.9s ease-out forwards" }} />))}

      {showCelebration&&(
        <div style={{ position:"fixed",top:"30%",left:"50%",transform:"translateX(-50%)",zIndex:100,textAlign:"center",animation:"celebrate 0.5s ease",pointerEvents:"none" }}>
          <div style={{ fontSize:48 }}>🎉</div>
          <div style={{ color:"#ffcc00",fontSize:16,letterSpacing:4,textShadow:"0 0 20px #ffcc00" }}>STREAK MILESTONE!</div>
        </div>
      )}

      {/* Back button */}
      <button onClick={()=>{setAppMode("home");setScreen("intro");}} style={{ position:"fixed",top:"max(env(safe-area-inset-top), 16px)",left:16,background:"transparent",border:`1px solid ${borderColor}`,color:mutedColor,padding:"10px 16px",fontSize:12,cursor:"pointer",borderRadius:8,fontFamily:"inherit",letterSpacing:2,zIndex:20,minHeight:44,touchAction:"manipulation" }}>← HOME</button>

      {/* Settings */}
      <div style={{ position:"fixed",top:"max(env(safe-area-inset-top), 16px)",right:16,display:"flex",gap:8,zIndex:20 }}>
        <button onClick={()=>setSoundOn(s=>!s)} style={{ background:"transparent",border:`1px solid ${borderColor}`,color:mutedColor,padding:"10px 14px",fontSize:14,cursor:"pointer",borderRadius:8,minHeight:44,touchAction:"manipulation" }}>{soundOn?"🔊":"🔇"}</button>
        <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{ background:"transparent",border:`1px solid ${borderColor}`,color:mutedColor,padding:"10px 14px",fontSize:14,cursor:"pointer",borderRadius:8,minHeight:44,touchAction:"manipulation" }}>{theme==="dark"?"☀️":"🌙"}</button>
      </div>

      {/* ── INTRO ── */}
      {screen==="intro"&&(
        <div style={{ textAlign:"center",animation:"fadeIn 0.5s ease",maxWidth:"min(430px,100%)",width:"100%", paddingTop:"max(env(safe-area-inset-top),50px)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>
          <div style={{ fontSize:10,letterSpacing:6,color:"#00ff88",marginBottom:6,opacity:0.6 }}>MATH TRAINING</div>
          <h1 style={{ fontSize:"clamp(42px,10vw,68px)",color:textColor,margin:"0 0 4px",textShadow:"0 0 30px #00ff88,0 0 60px #00ff8844",animation:"glitch 3s infinite",letterSpacing:3 }}>BRain<span style={{color:"#00ff88"}}>_</span>TRain</h1>
          <div style={{ color:"#00ff88",fontSize:12,letterSpacing:5,marginBottom:14,opacity:0.7 }}>COGNITIVE TRAINING SYSTEM</div>

          {/* XP bar */}
          <div style={{ ...panelStyle }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
              <span style={{ fontSize:10,color:xpRank.color,letterSpacing:3 }}>{xpRank.name}</span>
              <span style={{ fontSize:9,color:mutedColor }}>{xp} XP</span>
            </div>
            <div style={{ height:3,background:borderColor,borderRadius:2,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${xpPct(xp)}%`,background:xpRank.color,transition:"width 0.5s" }} />
            </div>
          </div>

          {/* Mode */}
          <div style={{ ...panelStyle }}>
            <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:10 }}>PRACTICE MODE</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {INPUT_MODES.map(m=>{
                const sel=inputMode===m.key;
                return (<button key={m.key} onClick={()=>setInputMode(m.key)} style={{ background:sel?"#00ff8812":cardBg,border:`1px solid ${sel?"#00ff88":borderColor}`,borderRadius:10,padding:"14px 12px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",textAlign:"left",boxShadow:sel?"0 0 12px #00ff8828":"none",minHeight:70,touchAction:"manipulation" }}>
                  <div style={{ fontSize:12,letterSpacing:2,color:sel?"#00ff88":mutedColor,marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:11,color:sel?"#00ff8899":mutedColor,lineHeight:1.4 }}>{m.desc}</div>
                </button>);
              })}
            </div>
          </div>

          {/* Audio options - show for all modes */}
          <div style={{ ...panelStyle }}>
            <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:10 }}>AUDIO OPTIONS</div>
            <div style={{ display:"flex",gap:10,flexDirection:"column" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:14,color:audioMode?"#ff6b35":textColor,letterSpacing:1,fontWeight:"bold" }}>🎧 Audio Questions</div>
                  <div style={{ fontSize:11,color:mutedColor,marginTop:2 }}>Questions spoken aloud, hidden on screen</div>
                </div>
                <button onClick={()=>setAudioMode(a=>!a)} style={{ background:audioMode?"#ff6b3518":"transparent",border:`2px solid ${audioMode?"#ff6b35":borderColor}`,color:audioMode?"#ff6b35":mutedColor,padding:"10px 18px",fontSize:12,letterSpacing:2,cursor:"pointer",borderRadius:20,fontFamily:"inherit",minWidth:70,touchAction:"manipulation" }}>{audioMode?"ON":"OFF"}</button>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13,color:voiceAnswer?"#00cfff":textColor,letterSpacing:1 }}>🎤 Voice Answers</div>
                  <div style={{ fontSize:10,color:mutedColor,marginTop:2 }}>Speak your answer into the mic</div>
                </div>
                <button onClick={()=>setVoiceAnswer(v=>!v)} style={{ background:voiceAnswer?"#00cfff18":"transparent",border:`2px solid ${voiceAnswer?"#00cfff":borderColor}`,color:voiceAnswer?"#00cfff":mutedColor,padding:"10px 18px",fontSize:12,letterSpacing:2,cursor:"pointer",borderRadius:20,fontFamily:"inherit",minWidth:70,touchAction:"manipulation" }}>{voiceAnswer?"ON":"OFF"}</button>
              </div>
            </div>
          </div>

          {inputMode==="drill"&&(
            <div style={{ ...panelStyle, animation:"fadeInFast 0.3s ease" }}>
              <div style={{ fontSize:12,color:"#fff",letterSpacing:3,marginBottom:4 }}>DRILL TOPICS <span style={{color:mutedColor,fontSize:10}}>· tap to toggle, select multiple</span></div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginTop:8 }}>
                {DRILL_TOPICS.map(t=>{
                  const sel=drillTopics.has(t);
                  return (<button key={t} onClick={()=>setDrillTopics(prev=>{const n=new Set(prev);if(sel&&n.size>1)n.delete(t);else n.add(t);return n;})} style={{ background:sel?"#00cfff18":cardBg,border:`2px solid ${sel?"#00cfff":borderColor}`,borderRadius:20,padding:"10px 16px",cursor:"pointer",fontFamily:"inherit",fontSize:12,letterSpacing:2,color:sel?"#00cfff":"#fff",transition:"all 0.15s",minHeight:44,touchAction:"manipulation",fontWeight:sel?"bold":"normal" }}>{sel?"✓ ":""}{t.toUpperCase()}</button>);
                })}
              </div>
              <div style={{fontSize:10,color:mutedColor,marginTop:8}}>{drillTopics.size} topic{drillTopics.size!==1?"s":""} selected</div>
            </div>
          )}

          {/* Difficulty */}
          <div style={{ ...panelStyle }}>
            <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:8 }}>DIFFICULTY <span style={{fontSize:8,color:borderColor}}>· ADAPTS DURING GAME</span></div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
              {DIFFICULTIES.map(d=>{const sel=difficulty===d.key;return(<button key={d.key} onClick={()=>setDifficulty(d.key)} style={{ background:sel?`${d.color}12`:cardBg,border:`1px solid ${sel?d.color:borderColor}`,borderRadius:10,padding:"16px 6px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",textAlign:"center",boxShadow:sel?`0 0 12px ${d.color}33`:"none",minHeight:80,touchAction:"manipulation" }}>
                <div style={{ fontSize:14,letterSpacing:3,color:sel?d.color:mutedColor,marginBottom:6 }}>{d.label}</div>
                <div style={{ fontSize:11,color:sel?`${d.color}88`:borderColor,lineHeight:1.5 }}>{d.desc}</div>
              </button>);})}
            </div>
          </div>

          {/* Questions + Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
            <div style={{ ...panelStyle,marginBottom:0 }}>
              <div style={{ fontSize:12,color:"#fff",letterSpacing:3,marginBottom:8 }}>NO. OF QUESTIONS / ROUND</div>
              <select value={questionsPerLevel} onChange={e=>setQuestionsPerLevel(Number(e.target.value))}
                style={{ background:bg,border:`1px solid ${borderColor}`,color:"#fff",padding:"14px",fontSize:18,letterSpacing:2,borderRadius:8,fontFamily:"inherit",width:"100%",boxSizing:"border-box",outline:"none",textAlign:"center",minHeight:52,cursor:"pointer",WebkitAppearance:"none",appearance:"none" }}>
                {[5,10,15,20,25,30,35,40,45,50].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ ...panelStyle,marginBottom:0 }}>
              <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:8 }}>POWERUPS</div>
              <div style={{ fontSize:9,color:mutedColor,lineHeight:2 }}>
                <div>50/50: {powerups.fifty} left</div>
                <div>+10s: {powerups.time} left</div>
                <div>Skip: {powerups.skip} left</div>
              </div>
            </div>
          </div>

          {/* Review mode info */}
          {inputMode==="review"&&(
            <div style={{ ...panelStyle, border:`1px solid #ff446644`, background:"#ff446608" }}>
              <div style={{ fontSize:12,color:"#ff4466",letterSpacing:3,marginBottom:6 }}>❌ WRONG ANSWERS POOL</div>
              <div style={{ fontSize:14,color:"#fff",fontWeight:"bold" }}>{missedQuestions.length} question{missedQuestions.length!==1?"s":""} to review</div>
              <div style={{ fontSize:11,color:mutedColor,marginTop:4 }}>
                {missedQuestions.length===0?"Play other modes to populate your review list.":"Questions you answered wrong, removed as you get them right."}
              </div>
            </div>
          )}

          {getWeakTopics().length>0&&(
            <div style={{ ...panelStyle }}>
              <div style={{ fontSize:9,color:"#ff4466",letterSpacing:3,marginBottom:8 }}>⚠ FOCUS AREAS</div>
              {getWeakTopics().map(w=>(<div key={w.topic} style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:9,color:mutedColor }}>{w.topic.toUpperCase()}</span>
                <span style={{ fontSize:9,color:w.pct<50?"#ff4466":"#ffcc00" }}>{w.pct}%</span>
              </div>))}
            </div>
          )}

          <div style={{ color:mutedColor,fontSize:9,marginBottom:18,letterSpacing:1 }}>🔥 DAILY STREAK: {dailyStreak.count} DAYS · ❤️ 3 LIVES PER ROUND</div>
          <button onClick={handleStart} style={{ background:"transparent",border:"2px solid #00ff88",color:"#00ff88",padding:"clamp(14px,4vw,18px) 48px",fontSize:"clamp(13px,3.5vw,16px)",letterSpacing:5,cursor:"pointer",borderRadius:8,fontFamily:"inherit",boxShadow:"0 0 20px #00ff8844",transition:"all 0.2s",width:"100%",minHeight:"clamp(50px,13vw,58px)",touchAction:"manipulation" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00ff8818";e.currentTarget.style.boxShadow="0 0 32px #00ff8877";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.boxShadow="0 0 20px #00ff8844";}}>[ INITIALIZE ]</button>
        </div>
      )}

      {/* ── GAME ── */}
      {screen==="game"&&current&&(
        <div style={{ width:"100%",maxWidth:"min(430px,100%)",animation:"fadeIn 0.3s ease", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),24px)" }}>
          {/* HUD */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div>
              <div style={{ fontSize:11,color:mutedColor,letterSpacing:3,marginBottom:2 }}>{isDrill?"DRILL":"LEVEL"}</div>
              <div style={{ fontSize:14,color:level.color,letterSpacing:3 }}>{isDrill?drillTopic.toUpperCase():level.name}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11,color:mutedColor,letterSpacing:3,marginBottom:2 }}>SCORE</div>
              <div style={{ fontSize:"clamp(20px,5.5vw,28px)",color:textColor,letterSpacing:2 }}>{score.toString().padStart(6,"0")}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11,color:mutedColor,letterSpacing:3,marginBottom:2 }}>LIVES</div>
              <div style={{ fontSize:18 }}>{"❤️".repeat(lives)}{"🖤".repeat(3-lives)}</div>
            </div>
          </div>

          {/* Audio controls row */}
          {(isAudio||voiceAnswer)&&(
            <div style={{ display:"flex",gap:8,justifyContent:"center",marginBottom:10,flexWrap:"wrap" }}>
              {isAudio&&<div style={{ background:`#ff6b3518`,border:`1px solid #ff6b3544`,borderRadius:20,padding:"4px 14px",fontSize:11,color:"#ff6b35",letterSpacing:2 }}>🎧 AUDIO MODE</div>}
              {voiceAnswer&&<div style={{ background:`#00cfff18`,border:`1px solid #00cfff44`,borderRadius:20,padding:"4px 14px",fontSize:11,color:"#00cfff",letterSpacing:2 }}>🎤 VOICE INPUT</div>}
            </div>
          )}

          {/* Badges */}
          <div style={{ display:"flex",gap:6,justifyContent:"center",marginBottom:10,flexWrap:"wrap" }}>
            <div style={{ background:`${diff.color}12`,border:`1px solid ${diff.color}44`,borderRadius:20,padding:"2px 10px",fontSize:8,letterSpacing:2,color:diff.color }}>{diff.label}</div>
            <div style={{ background:"transparent",border:`1px solid ${adaptiveColor}44`,borderRadius:20,padding:"2px 10px",fontSize:8,letterSpacing:2,color:adaptiveColor }}>{adaptiveLabel}</div>
            <div style={{ background:"transparent",border:`1px solid ${borderColor}`,borderRadius:20,padding:"2px 10px",fontSize:8,letterSpacing:2,color:mutedColor }}>{isReview?`❌ ${missedQuestions.length} left`:`Q${qIdx+1}/${isDrill?questionsPerLevel*3:questionsPerLevel}`}</div>
            {streak>0&&<div style={{ background:"#ffcc0012",border:"1px solid #ffcc0044",borderRadius:20,padding:"2px 10px",fontSize:8,letterSpacing:2,color:"#ffcc00" }}>{streak>=3?"🔥 ":""}×{streak}</div>}
          </div>

          {/* XP bar mini */}
          <div style={{ height:5,background:"#ff446618",borderRadius:3,marginBottom:10,overflow:"hidden" }}>
            <div style={{ height:"100%",background:xpRank.color,width:`${xpPct(xp)}%`,transition:"width 0.5s",borderRadius:3 }} />
          </div>

          {/* Progress */}
          <div style={{ height:2,background:cardBg,borderRadius:2,marginBottom:12,overflow:"hidden" }}>
            <div style={{ height:"100%",background:level.color,width:`${(qIdx/(isDrill?questionsPerLevel*3:questionsPerLevel))*100}%`,boxShadow:`0 0 8px ${level.color}`,transition:"width 0.4s" }} />
          </div>

          {/* Timer */}
          {!isSpeed&&(
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:8,color:mutedColor,letterSpacing:3 }}>TIME</span>
                <span style={{ fontSize:10,color:timerColor,animation:timeLeft<=5?"pulse 0.5s infinite":"none" }}>{timeLeft}s</span>
              </div>
              <div style={{ height:4,background:cardBg,borderRadius:3,overflow:"hidden" }}>
                <div style={{ height:"100%",borderRadius:3,background:timerColor,width:`${timerPct}%`,boxShadow:`0 0 8px ${timerColor}`,transition:"width 1s linear,background 0.3s" }} />
              </div>
            </div>
          )}

          {/* Question */}
          <div style={{ background:cardBg,border:`1px solid ${level.color}44`,borderRadius:10,padding:"26px 22px",marginBottom:14,textAlign:"center",animation:feedback==="wrong"?"shake 0.4s ease":"none",boxShadow:`0 0 30px ${level.color}08` }}>
            {!isAudio&&<div style={{ fontSize:12,color:mutedColor,letterSpacing:3,marginBottom:12 }}>{current.hint.toUpperCase()}</div>}
            {isAudio ? (
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:20,padding:"12px 0" }}>
                <div style={{ fontSize:72,lineHeight:1 }}>{isSpeaking?"🔊":"👂"}</div>
                <div style={{ fontSize:14,color:isSpeaking?level.color:"#fff",letterSpacing:3,animation:isSpeaking?"pulse 1s infinite":"none",textAlign:"center" }}>
                  {isSpeaking?"SPEAKING QUESTION...":feedback?"ANSWER SUBMITTED":"LISTEN CAREFULLY"}
                </div>
                {!feedback&&<button onClick={()=>speakQuestion(current)} style={{ background:`${level.color}18`,border:`2px solid ${level.color}`,color:level.color,padding:"14px 28px",fontSize:14,letterSpacing:3,cursor:"pointer",borderRadius:24,fontFamily:"inherit",minHeight:52,touchAction:"manipulation" }}>🔁 REPEAT QUESTION</button>}
                {feedback&&<div style={{ fontSize:14,color:feedback==="correct"?level.color:"#ff4466",letterSpacing:3 }}>ANSWER WAS: {current.answer}</div>}
              </div>
            ) : (
              <>
                <div style={{ fontSize:"clamp(28px,7.5vw,52px)",color:textColor,letterSpacing:3,textShadow:`0 0 20px ${level.color}55` }}>{current.question}</div>
                {showHint&&current.steps&&!isAudio&&<div style={{ marginTop:12,fontSize:10,color:mutedColor,borderTop:`1px solid ${borderColor}`,paddingTop:10 }}>💡 {current.steps[0]}</div>}
              </>
            )}
          </div>

          {/* Solution on wrong */}
          {feedback&&feedback!=="correct"&&!isAudio&&(
            <div style={{ background:bg,border:`1px solid ${borderColor}`,borderRadius:8,padding:"12px 16px",marginBottom:12,animation:"fadeInFast 0.3s ease" }}>
              <div style={{ fontSize:8,color:mutedColor,letterSpacing:3,marginBottom:6 }}>SOLUTION</div>
              {current.steps.map((s,i)=>(<div key={i} style={{ fontSize:10,color:i===current.steps.length-1?"#00ff88":"#fff",marginBottom:2 }}>{i===current.steps.length-1?"→ ":"  "}{s}</div>))}
              {current.shortcut&&(<div style={{ marginTop:8,paddingTop:6,borderTop:`1px solid ${borderColor}` }}><span style={{ fontSize:8,color:"#ffcc00",letterSpacing:2 }}>💡 </span><span style={{ fontSize:11,color:"#ffcc00bb" }}>{current.shortcut}</span></div>)}
            </div>
          )}

          {/* MCQ */}
          {(inputMode==="mcq"||inputMode==="audio"||current.isEstimation)&&(
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
              {choices.map((c,i)=>{
                const isCorrectAns=Number(c)===Number(current.answer);
                const hidden=hiddenChoices.includes(c)&&!isCorrectAns;
                let cbg=cardBg,cborder=borderColor,cc=mutedColor;
                if (feedback) { if(isCorrectAns){cbg=`${level.color}18`;cborder=level.color;cc=level.color;} else if(selectedIdx===i){cbg="#ff446614";cborder="#ff4466";cc="#ff4466";} }
                return (<button key={i} className="cbtn" onClick={()=>!hidden&&handleAnswer(i,c)} style={{ background:cbg,border:`1px solid ${cborder}`,color:hidden?"#1a3040":"#ffffff",fontWeight:"bold",padding:"clamp(14px,4vw,20px) 8px",fontSize:"clamp(18px,5vw,22px)",letterSpacing:2,borderRadius:12,cursor:feedback||hidden?"default":"pointer",boxShadow:feedback&&isCorrectAns?`0 0 16px ${level.color}44`:"none",fontFamily:"inherit",transition:"all 0.2s",opacity:hidden?0.2:1,minHeight:"clamp(58px,16vw,70px)",touchAction:"manipulation" }}>{hidden?"—":c}</button>);
              })}
            </div>
          )}

          {/* On-screen numeric keypad for type/speed/drill/review mode */}
          {(isType||isSpeed||isDrill||isReview)&&!current.isEstimation&&!isAudio&&(
            <div style={{ marginBottom:12 }}>
              {/* Display */}
              <div style={{ background:cardBg,border:`1px solid ${feedback==="correct"?level.color:feedback?"#ff4466":borderColor}`,borderRadius:12,padding:"16px 20px",marginBottom:10,textAlign:"center",minHeight:58,display:"flex",alignItems:"center",justifyContent:"center" }}>
                <span style={{ fontSize:32,color:"#fff",letterSpacing:4,fontWeight:"bold" }}>{typedAnswer||<span style={{color:mutedColor,fontSize:18}}>tap numbers below</span>}</span>
              </div>
              {/* Keypad */}
              {!feedback&&(
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                  {[1,2,3,4,5,6,7,8,9].map(n=>(
                    <button key={n} onClick={()=>setTypedAnswer(p=>p+String(n))}
                      style={{ background:cardBg,border:`1px solid ${borderColor}`,color:"#fff",fontSize:"clamp(20px,6vw,26px)",fontWeight:"bold",padding:"clamp(14px,4vw,18px) 0",borderRadius:12,cursor:"pointer",fontFamily:"inherit",minHeight:"clamp(52px,15vw,64px)",touchAction:"manipulation",transition:"all 0.1s" }}
                      onTouchStart={e=>e.currentTarget.style.background=level.color+"33"}
                      onTouchEnd={e=>e.currentTarget.style.background=cardBg}>
                      {n}
                    </button>
                  ))}
                  {/* Bottom row: ⌫ — 0 — GO */}
                  <button onClick={()=>setTypedAnswer(p=>p.slice(0,-1))}
                    style={{ background:cardBg,border:`1px solid ${borderColor}`,color:"#ff6b35",fontSize:22,padding:"18px 0",borderRadius:12,cursor:"pointer",fontFamily:"inherit",minHeight:64,touchAction:"manipulation" }}>⌫</button>
                  <button onClick={()=>setTypedAnswer(p=>p+"0")}
                    style={{ background:cardBg,border:`1px solid ${borderColor}`,color:"#fff",fontSize:"clamp(20px,6vw,26px)",fontWeight:"bold",padding:"clamp(14px,4vw,18px) 0",borderRadius:12,cursor:"pointer",fontFamily:"inherit",minHeight:"clamp(52px,15vw,64px)",touchAction:"manipulation" }}>0</button>
                  <button onClick={handleTypedSubmit} disabled={!typedAnswer||!!feedback}
                    style={{ background:typedAnswer?"#00ff8820":"transparent",border:`2px solid ${typedAnswer?"#00ff88":borderColor}`,color:typedAnswer?"#00ff88":mutedColor,fontSize:16,fontWeight:"bold",letterSpacing:2,padding:"18px 0",borderRadius:12,cursor:typedAnswer?"pointer":"default",fontFamily:"inherit",minHeight:64,touchAction:"manipulation" }}>GO</button>
                </div>
              )}
            </div>
          )}

          {/* Voice Answer */}
          {voiceAnswer&&!current.isEstimation&&!feedback&&(inputMode==="mcq"||inputMode==="audio"||isAudio)&&(
            <div style={{ marginBottom:12 }}>
              <button onClick={isListening?stopVoiceAnswer:startVoiceAnswer} style={{ width:"100%",background:isListening?"#00cfff18":"transparent",border:`2px solid ${isListening?"#00cfff":mutedColor}`,color:isListening?"#00cfff":mutedColor,padding:"18px",fontSize:14,letterSpacing:3,cursor:"pointer",borderRadius:12,fontFamily:"inherit",minHeight:58,transition:"all 0.2s",touchAction:"manipulation",display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
                <span style={{ fontSize:24,animation:isListening?"pulse 0.8s infinite":"none" }}>{isListening?"🎤":"🎙️"}</span>
                <span>{isListening?"LISTENING... TAP TO STOP":"TAP TO SPEAK ANSWER"}</span>
              </button>
              {voiceTranscript&&<div style={{ textAlign:"center",marginTop:8,fontSize:14,color:textColor,fontWeight:"normal",letterSpacing:1 }}>Heard: <strong>"{voiceTranscript}"</strong></div>}
              {voiceStatus&&<div style={{ textAlign:"center",marginTop:6,fontSize:12,color:textColor,opacity:0.7 }}>{voiceStatus}</div>}
            </div>
          )}

          {/* Powerups */}
          {!feedback&&(
            <div style={{ display:"flex",gap:6,justifyContent:"center",marginBottom:10 }}>
              {[
                { key:"fifty", label:`50/50 (${powerups.fifty})`, disabled:powerups.fifty<=0||(isType||isSpeed) },
                { key:"time",  label:`+10s (${powerups.time})`,  disabled:powerups.time<=0||isSpeed },
                { key:"skip",  label:`Skip (${powerups.skip})`,  disabled:powerups.skip<=0 },
              ].map(({key,label,disabled})=>(
                <button key={key} onClick={()=>usePowerup(key)} disabled={disabled} style={{ background:"transparent",border:`1px solid ${disabled?borderColor:"#ffcc00"}`,color:disabled?borderColor:"#ffcc00",padding:"12px 14px",fontSize:12,letterSpacing:2,cursor:disabled?"default":"pointer",borderRadius:20,fontFamily:"inherit",minHeight:44,touchAction:"manipulation" }}>{label}</button>
              ))}
              {!feedback&&!showHint&&!hintUsed&&(
                <button onClick={()=>{setShowHint(true);setHintUsed(true);}} style={{ background:"transparent",border:`1px solid #00cfff`,color:"#00cfff",padding:"12px 14px",fontSize:12,letterSpacing:2,cursor:"pointer",borderRadius:20,fontFamily:"inherit",minHeight:44,touchAction:"manipulation" }}>💡 Hint</button>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback&&(
            <div style={{ textAlign:"center",animation:"fadeInFast 0.2s ease" }}>
              <div style={{ fontSize:14,letterSpacing:3,color:feedback==="correct"?level.color:"#ff4466",marginBottom:feedback!=="correct"?14:0 }}>
                {feedback==="correct"?streak>1?`✓ CORRECT · ${streak}× STREAK${streak>=3?" · BONUS!":""}`:("✓ CORRECT"):feedback==="timeout"?`⏰ TIMEOUT · ANSWER: ${current.answer}`:`✗ WRONG · ANSWER: ${current.answer}`}
              </div>
              {feedback!=="correct"&&(
                <button onClick={advanceQuestion} style={{ background:"#ff446618",border:"1px solid #ff4466",color:"#ff4466",padding:"10px 32px",fontSize:11,letterSpacing:4,cursor:"pointer",borderRadius:6,fontFamily:"inherit",transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="#ff446632";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#ff446618";}}>
                  NEXT QUESTION →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── LEVEL UP ── */}
      {screen==="levelup"&&(
        <div style={{ textAlign:"center",animation:"fadeIn 0.5s ease",maxWidth:"min(430px,100%)",width:"100%", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>
          <div style={{ fontSize:10,color:"#ffcc00",letterSpacing:6,marginBottom:8 }}>LEVEL COMPLETE</div>
          <h2 style={{ fontSize:44,color:textColor,margin:"0 0 6px",textShadow:`0 0 30px ${level.color}` }}>{LEVELS[levelIdx].name}</h2>
          <div style={{ color:level.color,fontSize:14,letterSpacing:4,marginBottom:20 }}>CLEARED</div>
          <div style={{ ...panelStyle,marginBottom:16 }}>
            <div style={{ fontSize:22,color:textColor,letterSpacing:2 }}>{score.toString().padStart(6,"0")}</div>
            <div style={{ color:mutedColor,fontSize:8,letterSpacing:3,marginTop:3 }}>CURRENT SCORE</div>
          </div>
          {getWeakTopics().length>0&&(<div style={{ ...panelStyle }}>
            <div style={{ fontSize:8,color:mutedColor,letterSpacing:3,marginBottom:8 }}>WEAK AREAS</div>
            {getWeakTopics().map(w=>(<div key={w.topic} style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
              <span style={{ fontSize:11,color:textColor }}>{w.topic.toUpperCase()}</span><span style={{ fontSize:11,color:w.pct<50?"#ff4466":"#ffcc00" }}>{w.pct}%</span>
            </div>))}
          </div>)}
          <div style={{ color:mutedColor,fontSize:12,letterSpacing:2,marginBottom:16 }}>NEXT: <span style={{color:LEVELS[levelIdx+1].color}}>{LEVELS[levelIdx+1].name}</span></div>
          <button onClick={nextLevel} style={{ background:"transparent",border:`2px solid ${LEVELS[levelIdx+1].color}`,color:LEVELS[levelIdx+1].color,padding:"18px 36px",fontSize:15,letterSpacing:4,cursor:"pointer",borderRadius:10,fontFamily:"inherit",transition:"all 0.2s",width:"100%",minHeight:58,touchAction:"manipulation" }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${LEVELS[levelIdx+1].color}15`;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>[ CONTINUE ]</button>
        </div>
      )}

      {/* ── WIN ── */}
      {screen==="win"&&(
        <div style={{ textAlign:"center",animation:"fadeIn 0.5s ease",maxWidth:"min(430px,100%)",width:"100%", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>
          <div style={{ fontSize:10,letterSpacing:6,color:"#00ff88",marginBottom:8 }}>SESSION COMPLETE</div>
          <h2 style={{ fontSize:"clamp(26px,6vw,48px)",color:textColor,margin:"0 0 6px",textShadow:"0 0 30px #00ff8888" }}>{isReview?"REVIEW DONE!":lives<=0?"GAME OVER":"MASTERED!"}</h2>
          <div style={{ color:diff.color,fontSize:12,letterSpacing:4,marginBottom:4 }}>{diff.label} · {xpRank.name}</div>
          <div style={{ color:"#ffcc00",fontSize:12,letterSpacing:2,marginBottom:16 }}>🔥 DAILY STREAK: {dailyStreak.count} DAYS</div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
            {[
              { label:"FINAL SCORE",val:score.toString().padStart(6,"0"),color:"#00ff88" },
              { label:"ACCURACY",val:`${totalAnswered>0?Math.round(totalCorrect/totalAnswered*100):0}%`,color:"#00cfff" },
              { label:"MAX STREAK",val:`×${maxStreak}`,color:"#ffcc00" },
              { label:"CORRECT",val:`${totalCorrect}/${totalAnswered}`,color:"#ff6b35" },
            ].map(({label,val,color})=>(<div key={label} style={{ background:cardBg,border:`1px solid ${borderColor}`,borderRadius:8,padding:"14px 10px" }}>
              <div style={{ fontSize:26,color,letterSpacing:2 }}>{val}</div>
              <div style={{ fontSize:11,color:mutedColor,letterSpacing:3,marginTop:4 }}>{label}</div>
            </div>))}
          </div>

          {/* XP gained */}
          <div style={{ ...panelStyle }}>
            <div style={{ fontSize:13,color:xpRank.color,letterSpacing:3,marginBottom:6 }}>{xpRank.name} · {xp} XP</div>
            <div style={{ height:8,background:"#ff446622",borderRadius:4,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${xpPct(xp)}%`,background:xpRank.color,transition:"width 0.8s",borderRadius:4 }} />
            </div>
            <div style={{ fontSize:8,color:mutedColor,marginTop:4 }}>{xpToNext(xp)} XP to next rank</div>
          </div>

          {/* Weak areas */}
          {weakTopics.length>0&&(<div style={{ ...panelStyle,border:`1px solid #ff446633` }}>
            <div style={{ fontSize:12,color:"#ff4466",letterSpacing:3,marginBottom:8 }}>⚠ FOCUS AREAS</div>
            {weakTopics.map(w=>(<div key={w.topic} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <span style={{ fontSize:12,color:"#fff",letterSpacing:1,textTransform:"uppercase" }}>{w.topic}</span>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:70,height:4,background:borderColor,borderRadius:2,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${w.pct}%`,background:w.pct<50?"#ff4466":"#ffcc00",borderRadius:2 }} />
                </div>
                <span style={{ fontSize:9,color:w.pct<50?"#ff4466":"#ffcc00",minWidth:30 }}>{w.pct}%</span>
              </div>
            </div>))}
          </div>)}

          {/* Session log */}
          <div style={{ ...panelStyle,textAlign:"left",maxHeight:160,overflowY:"auto" }}>
            <div style={{ fontSize:11,color:mutedColor,letterSpacing:3,marginBottom:8 }}>QUESTION LOG</div>
            {sessionHistory.map((h,i)=>(<div key={i} style={{ display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:9 }}>
              <span style={{ color:"#ffffffcc",fontFamily:"monospace" }}>{h.question}</span>
              <div style={{ display:"flex",gap:8 }}>
                <span style={{ color:mutedColor }}>{h.elapsed}s</span>
                <span style={{ color:h.correct?"#00ff88":"#ff4466" }}>{h.correct?"✓":"✗"}</span>
              </div>
            </div>))}
          </div>

          <button onClick={restart} style={{ marginTop:4,background:"transparent",border:"2px solid #00ff88",color:"#00ff88",padding:"18px 44px",fontSize:15,letterSpacing:4,cursor:"pointer",borderRadius:10,fontFamily:"inherit",boxShadow:"0 0 20px #00ff8844",transition:"all 0.2s",width:"100%",minHeight:58,touchAction:"manipulation" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00ff8818";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>[ RESTART ]</button>
        </div>
      )}
    </div>
  );
}

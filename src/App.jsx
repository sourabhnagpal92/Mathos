import { useState, useEffect, useCallback, useRef } from "react";

// ── Utilities ──
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── XP System ──
const XP_LEVELS = [
  { name: "NOVICE", xpNeeded: 0, color: "#4a6070" },
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


// ── Vocabulary Data v2 ──
const VOCAB_WORDS = [
  { word:"Amiable", phonetic:"am·ee·uh·bul", ipa:"/ˈeɪmiəbəl/", meaning:"friendly and pleasant", sentence:"She had an amiable personality that made everyone feel welcome.", diff:"easy", cats:["social","everyday"], synonyms:["cordial","affable","genial","warm"], antonyms:["hostile","cold","aloof","unfriendly"] },
  { word:"Benevolent", phonetic:"beh·nev·uh·lunt", ipa:"/bɪˈnevələnt/", meaning:"well-meaning and kindly; charitable", sentence:"The benevolent donor funded the entire school library.", diff:"easy", cats:["character","everyday"], synonyms:["charitable","kind","generous","compassionate"], antonyms:["cruel","selfish","malicious","stingy"] },
  { word:"Candid", phonetic:"kan·did", ipa:"/ˈkændɪd/", meaning:"truthful and straightforward; frank", sentence:"She gave a candid assessment of the project\'s flaws.", diff:"easy", cats:["communication","everyday"], synonyms:["frank","honest","open","direct"], antonyms:["deceptive","evasive","guarded","dishonest"] },
  { word:"Diligent", phonetic:"dil·ih·junt", ipa:"/ˈdɪlɪdʒənt/", meaning:"having or showing care and effort in one's work", sentence:"The diligent student reviewed her notes every evening.", diff:"easy", cats:["character","academic"], synonyms:["hardworking","assiduous","industrious","thorough"], antonyms:["lazy","careless","negligent","idle"] },
  { word:"Eloquent", phonetic:"el·uh·kwunt", ipa:"/ˈeləkwənt/", meaning:"fluent and persuasive in speaking or writing", sentence:"His eloquent speech moved the entire audience to tears.", diff:"easy", cats:["communication","literary"], synonyms:["articulate","expressive","persuasive","fluent"], antonyms:["inarticulate","mumbling","clumsy","halting"] },
  { word:"Frugal", phonetic:"froo·gul", ipa:"/ˈfruːɡəl/", meaning:"sparing or economical with money or food", sentence:"Living frugally allowed her to save enough to travel the world.", diff:"easy", cats:["lifestyle","everyday"], synonyms:["thrifty","economical","sparing","prudent"], antonyms:["wasteful","lavish","extravagant","spendthrift"] },
  { word:"Gregarious", phonetic:"greh·gair·ee·us", ipa:"/ɡrɪˈɡeəriəs/", meaning:"fond of company; sociable by nature", sentence:"The gregarious host made sure no guest felt left out.", diff:"easy", cats:["social","everyday"], synonyms:["sociable","outgoing","convivial","affable"], antonyms:["introverted","solitary","reclusive","antisocial"] },
  { word:"Humble", phonetic:"hum·bul", ipa:"/ˈhʌmbəl/", meaning:"having a modest opinion of oneself", sentence:"Despite his fame, he remained humble and approachable.", diff:"easy", cats:["character","everyday"], synonyms:["modest","meek","unassuming","deferential"], antonyms:["arrogant","conceited","boastful","pompous"] },
  { word:"Immense", phonetic:"ih·mens", ipa:"/ɪˈmens/", meaning:"extremely large or great in scale", sentence:"The library held an immense collection of rare manuscripts.", diff:"easy", cats:["everyday"], synonyms:["vast","enormous","colossal","tremendous"], antonyms:["tiny","minute","negligible","minuscule"] },
  { word:"Jubilant", phonetic:"joo·bih·lunt", ipa:"/ˈdʒuːbɪlənt/", meaning:"feeling or expressing great happiness and triumph", sentence:"The team was jubilant after winning the championship.", diff:"easy", cats:["emotion","everyday"], synonyms:["elated","exultant","overjoyed","ecstatic"], antonyms:["sorrowful","dejected","miserable","despondent"] },
  { word:"Lucid", phonetic:"loo·sid", ipa:"/ˈluːsɪd/", meaning:"expressed clearly; easy to understand", sentence:"The professor gave a lucid explanation of quantum physics.", diff:"easy", cats:["communication","academic"], synonyms:["clear","coherent","transparent","intelligible"], antonyms:["confusing","vague","murky","obscure"] },
  { word:"Meticulous", phonetic:"meh·tik·yoo·lus", ipa:"/məˈtɪkjʊləs/", meaning:"showing great attention to detail; very precise", sentence:"The meticulous editor caught every grammatical error.", diff:"easy", cats:["character","business"], synonyms:["precise","thorough","painstaking","scrupulous"], antonyms:["careless","sloppy","haphazard","negligent"] },
  { word:"Nurture", phonetic:"nur·cher", ipa:"/ˈnɜːtʃə/", meaning:"care for and encourage the growth or development of", sentence:"Good parents nurture both the mind and spirit of their children.", diff:"easy", cats:["action","everyday"], synonyms:["foster","cultivate","nourish","develop"], antonyms:["neglect","harm","ignore","stunt"] },
  { word:"Optimistic", phonetic:"op·tih·mis·tik", ipa:"/ˌɒptɪˈmɪstɪk/", meaning:"hopeful and confident about the future", sentence:"She remained optimistic even during the most difficult times.", diff:"easy", cats:["emotion","everyday"], synonyms:["hopeful","positive","sanguine","upbeat"], antonyms:["pessimistic","cynical","hopeless","despairing"] },
  { word:"Prudent", phonetic:"proo·dunt", ipa:"/ˈpruːdənt/", meaning:"acting with care and thought for the future", sentence:"It was prudent to save money before making the investment.", diff:"easy", cats:["character","business"], synonyms:["wise","judicious","sensible","circumspect"], antonyms:["reckless","impulsive","foolhardy","careless"] },
  { word:"Resilient", phonetic:"reh·zil·ee·unt", ipa:"/rɪˈzɪliənt/", meaning:"able to recover quickly from difficulties", sentence:"Children are often more resilient than adults give them credit for.", diff:"easy", cats:["character","everyday"], synonyms:["tough","hardy","adaptable","robust"], antonyms:["fragile","weak","vulnerable","delicate"] },
  { word:"Serene", phonetic:"suh·reen", ipa:"/səˈriːn/", meaning:"calm, peaceful, and untroubled; tranquil", sentence:"The lake at dawn was absolutely serene.", diff:"easy", cats:["emotion","everyday"], synonyms:["calm","tranquil","placid","peaceful"], antonyms:["agitated","turbulent","chaotic","restless"] },
  { word:"Tenacious", phonetic:"teh·nay·shus", ipa:"/tɪˈneɪʃəs/", meaning:"holding firmly to something; very persistent", sentence:"Her tenacious pursuit of justice inspired the entire community.", diff:"easy", cats:["character","business"], synonyms:["persistent","determined","resolute","steadfast"], antonyms:["yielding","irresolute","weak","spineless"] },
  { word:"Vibrant", phonetic:"vy·brunt", ipa:"/ˈvaɪbrənt/", meaning:"full of energy and enthusiasm; bright and striking", sentence:"The vibrant city never seemed to sleep.", diff:"easy", cats:["everyday"], synonyms:["lively","energetic","dynamic","vivid"], antonyms:["dull","lifeless","lethargic","bland"] },
  { word:"Zeal", phonetic:"zeel", ipa:"/ziːl/", meaning:"great energy or enthusiasm in pursuit of a cause", sentence:"She pursued her passion for medicine with remarkable zeal.", diff:"easy", cats:["character","everyday"], synonyms:["enthusiasm","fervour","passion","ardour"], antonyms:["apathy","indifference","lethargy","disinterest"] },
  { word:"Acrimony", phonetic:"ak·rih·moh·nee", ipa:"/ˈækrɪməni/", meaning:"bitterness or ill feeling, especially in speech", sentence:"The divorce proceedings were filled with acrimony.", diff:"medium", cats:["emotion","everyday"], synonyms:["bitterness","rancour","animosity","hostility"], antonyms:["goodwill","harmony","warmth","amity"] },
  { word:"Bellicose", phonetic:"bel·ih·kohs", ipa:"/ˈbelɪkəʊs/", meaning:"demonstrating aggression and willingness to fight", sentence:"His bellicose rhetoric alarmed neighbouring countries.", diff:"medium", cats:["character","business"], synonyms:["aggressive","combative","pugnacious","militant"], antonyms:["peaceful","pacifist","conciliatory","gentle"] },
  { word:"Capricious", phonetic:"kah·prish·us", ipa:"/kəˈprɪʃəs/", meaning:"given to sudden unpredictable changes of mood or behaviour", sentence:"The capricious weather ruined their outdoor wedding plans.", diff:"medium", cats:["character","everyday"], synonyms:["fickle","erratic","mercurial","whimsical"], antonyms:["consistent","reliable","stable","predictable"] },
  { word:"Dearth", phonetic:"durth", ipa:"/dɜːθ/", meaning:"a scarcity or lack of something", sentence:"There was a dearth of qualified candidates for the position.", diff:"medium", cats:["everyday","business"], synonyms:["scarcity","shortage","paucity","insufficiency"], antonyms:["abundance","surplus","plenty","excess"] },
  { word:"Ephemeral", phonetic:"eh·fem·er·ul", ipa:"/ɪˈfemərəl/", meaning:"lasting for a very short time; transitory", sentence:"Fame can be ephemeral; today\'s star is tomorrow\'s footnote.", diff:"medium", cats:["literary","everyday"], synonyms:["fleeting","transient","momentary","short-lived"], antonyms:["permanent","enduring","lasting","eternal"] },
  { word:"Facetious", phonetic:"fah·see·shus", ipa:"/fəˈsiːʃəs/", meaning:"treating serious issues with inappropriate humour", sentence:"His facetious remarks during the eulogy offended the family.", diff:"medium", cats:["communication","everyday"], synonyms:["flippant","frivolous","glib","jocular"], antonyms:["solemn","earnest","sincere","grave"] },
  { word:"Garrulous", phonetic:"gar·uh·lus", ipa:"/ˈɡærʊləs/", meaning:"excessively talkative, especially on trivial matters", sentence:"The garrulous neighbour made it impossible to leave quickly.", diff:"medium", cats:["communication","everyday"], synonyms:["verbose","loquacious","talkative","long-winded"], antonyms:["taciturn","reticent","quiet","reserved"] },
  { word:"Hegemony", phonetic:"heh·jem·oh·nee", ipa:"/hɪˈɡeməni/", meaning:"leadership or dominance, especially of one country over others", sentence:"The empire maintained its hegemony through military strength.", diff:"medium", cats:["business","academic"], synonyms:["dominance","supremacy","leadership","authority"], antonyms:["subservience","submission","dependence","weakness"] },
  { word:"Imperious", phonetic:"im·peer·ee·us", ipa:"/ɪmˈpɪəriəs/", meaning:"assuming power or authority without justification; arrogant", sentence:"The imperious manager alienated the entire team.", diff:"medium", cats:["character","business"], synonyms:["overbearing","domineering","autocratic","haughty"], antonyms:["humble","meek","deferential","modest"] },
  { word:"Laconic", phonetic:"lah·kon·ik", ipa:"/ləˈkɒnɪk/", meaning:"using very few words; brief and concise", sentence:"His laconic reply — just \'no\' — ended the discussion.", diff:"medium", cats:["communication","literary"], synonyms:["terse","concise","succinct","pithy"], antonyms:["verbose","garrulous","wordy","long-winded"] },
  { word:"Malleable", phonetic:"mal·ee·uh·bul", ipa:"/ˈmæliəbəl/", meaning:"easily influenced or shaped; adaptable to change", sentence:"Young minds are malleable and absorb new ideas quickly.", diff:"medium", cats:["character","scientific"], synonyms:["pliable","flexible","adaptable","yielding"], antonyms:["rigid","stubborn","inflexible","obstinate"] },
  { word:"Nefarious", phonetic:"neh·fair·ee·us", ipa:"/nɪˈfeəriəs/", meaning:"wicked, criminal, or extremely immoral", sentence:"The nefarious scheme defrauded thousands of investors.", diff:"medium", cats:["character","literary"], synonyms:["villainous","wicked","sinister","criminal"], antonyms:["virtuous","righteous","honourable","moral"] },
  { word:"Obfuscate", phonetic:"ob·fuh·skayt", ipa:"/ˈɒbfʌskeɪt/", meaning:"render obscure, unclear, or unintelligible; confuse", sentence:"The politician used jargon to obfuscate the real issue.", diff:"medium", cats:["communication","academic"], synonyms:["confuse","muddle","obscure","muddy"], antonyms:["clarify","illuminate","explain","elucidate"] },
  { word:"Perfidious", phonetic:"pur·fid·ee·us", ipa:"/pəˈfɪdiəs/", meaning:"deceitful and untrustworthy; guilty of betrayal", sentence:"The perfidious ally switched sides at the worst moment.", diff:"medium", cats:["character","literary"], synonyms:["treacherous","traitorous","faithless","disloyal"], antonyms:["loyal","faithful","trustworthy","steadfast"] },
  { word:"Querulous", phonetic:"kwer·uh·lus", ipa:"/ˈkwerʊləs/", meaning:"complaining in a petulant or whining manner", sentence:"The querulous passenger complained about every minor delay.", diff:"medium", cats:["character","everyday"], synonyms:["petulant","whiny","fretful","grumbling"], antonyms:["content","satisfied","cheerful","easygoing"] },
  { word:"Sycophant", phonetic:"sik·oh·fant", ipa:"/ˈsɪkəfænt/", meaning:"a person who flatters important people to gain personal advantage", sentence:"The CEO was surrounded by sycophants who never challenged him.", diff:"medium", cats:["social","business"], synonyms:["flatterer","toady","yes-man","fawner"], antonyms:["critic","adversary","challenger","detractor"] },
  { word:"Truculent", phonetic:"truk·yoo·lunt", ipa:"/ˈtrʌkjʊlənt/", meaning:"eager or quick to argue or fight; aggressively defiant", sentence:"The truculent defendant interrupted the judge repeatedly.", diff:"medium", cats:["character","literary"], synonyms:["combative","belligerent","aggressive","confrontational"], antonyms:["peaceful","docile","gentle","cooperative"] },
  { word:"Ubiquitous", phonetic:"yoo·bik·wih·tus", ipa:"/juːˈbɪkwɪtəs/", meaning:"present, appearing, or found everywhere simultaneously", sentence:"Smartphones have become ubiquitous in modern life.", diff:"medium", cats:["everyday","academic"], synonyms:["omnipresent","pervasive","universal","prevalent"], antonyms:["rare","scarce","uncommon","absent"] },
  { word:"Venal", phonetic:"vee·nul", ipa:"/ˈviːnəl/", meaning:"showing susceptibility to bribery; corrupt", sentence:"The venal official accepted payments to approve projects.", diff:"medium", cats:["character","business"], synonyms:["corrupt","bribable","mercenary","dishonest"], antonyms:["incorruptible","principled","honest","ethical"] },
  { word:"Wanton", phonetic:"won·tun", ipa:"/ˈwɒntən/", meaning:"deliberate and unprovoked; gratuitously cruel or harsh", sentence:"The wanton destruction of the forest shocked environmentalists.", diff:"medium", cats:["character","everyday"], synonyms:["deliberate","gratuitous","reckless","unprovoked"], antonyms:["justified","careful","restrained","measured"] },
  { word:"Abstruse", phonetic:"ab·stroos", ipa:"/æbˈstruːs/", meaning:"difficult to understand; obscure and esoteric", sentence:"The professor\'s abstruse theories baffled even his colleagues.", diff:"hard", cats:["academic","literary"], synonyms:["arcane","esoteric","recondite","cryptic"], antonyms:["simple","clear","obvious","accessible"] },
  { word:"Anathema", phonetic:"ah·nath·eh·mah", ipa:"/əˈnæθəmə/", meaning:"something or someone greatly detested or loathed", sentence:"Dishonesty was anathema to her principled nature.", diff:"hard", cats:["literary","everyday"], synonyms:["abomination","aversion","bane","bugbear"], antonyms:["blessing","treasure","darling","delight"] },
  { word:"Byzantine", phonetic:"biz·un·teen", ipa:"/ˈbɪzəntiːn/", meaning:"excessively complicated, detailed, and hard to understand", sentence:"The Byzantine tax code defeated even experienced accountants.", diff:"hard", cats:["academic","business"], synonyms:["labyrinthine","convoluted","intricate","tortuous"], antonyms:["simple","straightforward","direct","clear-cut"] },
  { word:"Denouement", phonetic:"day·noo·mahn", ipa:"/deɪˈnuːmɑ̃/", meaning:"the final resolution of a narrative in which strands are drawn together", sentence:"The denouement of the novel tied every loose thread together.", diff:"hard", cats:["literary"], synonyms:["resolution","climax","conclusion","culmination"], antonyms:["beginning","prelude","exposition","introduction"] },
  { word:"Ebullience", phonetic:"ih·bul·ee·ence", ipa:"/ɪˈbʌliəns/", meaning:"the quality of being cheerful, enthusiastic, and full of energy", sentence:"Her ebullience was infectious; the room lit up when she entered.", diff:"hard", cats:["emotion","everyday"], synonyms:["exuberance","vivacity","effervescence","buoyancy"], antonyms:["depression","torpor","gloom","despondency"] },
  { word:"Grandiloquent", phonetic:"gran·dil·oh·kwunt", ipa:"/ɡrænˈdɪləkwənt/", meaning:"pompous or extravagant in language, style, or manner", sentence:"His grandiloquent speech impressed no one who knew the facts.", diff:"hard", cats:["communication","literary"], synonyms:["bombastic","pompous","rhetorical","florid"], antonyms:["plain","simple","understated","modest"] },
  { word:"Hubris", phonetic:"hyoo·bris", ipa:"/ˈhjuːbrɪs/", meaning:"excessive pride or self-confidence, especially leading to downfall", sentence:"His hubris led him to underestimate every opponent.", diff:"hard", cats:["character","literary"], synonyms:["arrogance","pride","conceit","presumption"], antonyms:["humility","modesty","diffidence","meekness"] },
  { word:"Inimical", phonetic:"ih·nim·ih·kul", ipa:"/ɪˈnɪmɪkəl/", meaning:"tending to obstruct or harm; unfriendly; hostile", sentence:"The harsh climate was inimical to agriculture.", diff:"hard", cats:["academic","literary"], synonyms:["hostile","adverse","antagonistic","harmful"], antonyms:["beneficial","favourable","conducive","supportive"] },
  { word:"Lassitude", phonetic:"las·ih·tyood", ipa:"/ˈlæsɪtjuːd/", meaning:"physical or mental weariness; lack of energy", sentence:"After the gruelling expedition, lassitude overcame the team.", diff:"hard", cats:["emotion","everyday"], synonyms:["lethargy","languor","fatigue","torpor"], antonyms:["vigour","energy","vitality","vivacity"] },
  { word:"Machiavellian", phonetic:"mak·ee·uh·vel·ee·un", ipa:"/ˌmækiəˈveliən/", meaning:"cunning, scheming, and unscrupulous in pursuing goals", sentence:"His Machiavellian tactics secured power at any cost.", diff:"hard", cats:["character","business"], synonyms:["scheming","devious","cunning","calculating"], antonyms:["principled","honest","ethical","straightforward"] },
  { word:"Nadir", phonetic:"nay·deer", ipa:"/ˈneɪdɪə/", meaning:"the lowest or most unsuccessful point of something", sentence:"Losing the election was the nadir of his political career.", diff:"hard", cats:["literary","business"], synonyms:["low point","bottom","trough","rock bottom"], antonyms:["zenith","pinnacle","apex","peak"] },
  { word:"Obsequious", phonetic:"ob·see·kwee·us", ipa:"/əbˈsiːkwiəs/", meaning:"obedient or attentive to an excessive or servile degree", sentence:"The obsequious assistant agreed with everything the boss said.", diff:"hard", cats:["character","business"], synonyms:["servile","subservient","fawning","ingratiating"], antonyms:["assertive","independent","forthright","bold"] },
  { word:"Perspicacious", phonetic:"pur·spih·kay·shus", ipa:"/ˌpɜːspɪˈkeɪʃəs/", meaning:"having a ready insight into things; showing shrewd judgement", sentence:"A perspicacious investor spotted the opportunity before anyone else.", diff:"hard", cats:["character","business"], synonyms:["shrewd","astute","perceptive","discerning"], antonyms:["obtuse","imperceptive","unobservant","dense"] },
  { word:"Recondite", phonetic:"rek·un·dyt", ipa:"/ˈrekəndaɪt/", meaning:"not known by many people; abstruse and obscure", sentence:"He specialised in recondite areas of medieval philosophy.", diff:"hard", cats:["academic","literary"], synonyms:["obscure","esoteric","arcane","abstruse"], antonyms:["common","familiar","mainstream","well-known"] },
  { word:"Solipsistic", phonetic:"sol·ip·sis·tik", ipa:"/ˌsɒlɪpˈsɪstɪk/", meaning:"concerned solely with oneself; self-absorbed to an extreme", sentence:"His solipsistic worldview made genuine empathy impossible.", diff:"hard", cats:["academic","literary"], synonyms:["self-absorbed","narcissistic","egocentric","inward-looking"], antonyms:["altruistic","empathetic","communal","other-focused"] },
  { word:"Tendentious", phonetic:"ten·den·shus", ipa:"/tenˈdenʃəs/", meaning:"promoting a particular cause or point of view; biased", sentence:"The tendentious article ignored any evidence contradicting its thesis.", diff:"hard", cats:["communication","academic"], synonyms:["biased","slanted","partisan","one-sided"], antonyms:["balanced","impartial","objective","neutral"] },
  { word:"Verisimilitude", phonetic:"ver·ih·sih·mil·ih·tyood", ipa:"/ˌverɪsɪˈmɪlɪtjuːd/", meaning:"the appearance of being true or real in a story or account", sentence:"The novel\'s verisimilitude made readers forget it was fiction.", diff:"hard", cats:["literary","academic"], synonyms:["authenticity","realism","plausibility","credibility"], antonyms:["implausibility","fantasy","unreality","absurdity"] },
  { word:"Weltanschauung", phonetic:"velt·ahn·show·oong", ipa:"/ˈveltanʃaʊʊŋ/", meaning:"a particular philosophy or view of life; a worldview", sentence:"Her travels transformed her Weltanschauung entirely.", diff:"hard", cats:["academic","literary"], synonyms:["worldview","philosophy","outlook","perspective"], antonyms:["ignorance","narrowness","myopia","parochialism"] },
  { word:"Zeitgeist", phonetic:"tsyt·gyst", ipa:"/ˈzaɪtɡaɪst/", meaning:"the defining spirit or mood of a particular period of history", sentence:"The film perfectly captured the zeitgeist of the 1960s.", diff:"hard", cats:["academic","literary"], synonyms:["spirit of the age","ethos","climate","atmosphere"], antonyms:["anachronism","timelessness","irrelevance","obsolescence"] },
  { word:"Sanguine", phonetic:"sang·gwin", ipa:"/ˈsæŋɡwɪn/", meaning:"optimistic or positive, especially in difficult situations", sentence:"She remained sanguine about the company\'s chances of recovery.", diff:"hard", cats:["character","literary"], synonyms:["optimistic","hopeful","confident","upbeat"], antonyms:["pessimistic","despondent","gloomy","fearful"] },
];
// Total: 60 words


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
    if (cat !== "all" && !(w.cats||[w.cat||"everyday"]).includes(cat)) return false;
    return true;
  });
  // Prefer unseen words
  const unseen = pool.filter(w => !seenRecently.has(w.word));
  return unseen.length >= 4 ? unseen : pool;
}

function makeVocabQuestion(word, mode, pool) {
  if (mode === "word2meaning") {
    const wrongs = pool.filter(w => w.word !== word.word).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.meaning);
    const choices = [...wrongs, word.meaning].sort(() => Math.random() - 0.5);
    return { type:"word2meaning", prompt: word.word, answer: word.meaning, choices, word };
  }
  if (mode === "meaning2word") {
    const wrongs = pool.filter(w => w.word !== word.word).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.word);
    const choices = [...wrongs, word.word].sort(() => Math.random() - 0.5);
    return { type:"meaning2word", prompt: word.meaning, answer: word.word, choices, word };
  }
  if (mode === "antonym") {
    const correct = word.antonyms[0];
    // Wrong antonyms from other words
    const otherAntonyms = pool.filter(w => w.word !== word.word).flatMap(w => w.antonyms).filter(a => !word.antonyms.includes(a));
    const wrongs = otherAntonyms.sort(() => Math.random() - 0.5).slice(0, 3);
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
function buildDefaultVocabSave() { return { wrongWords: {}, masteredWords: [], seenWords: [], wordStats: {}, userName: null, onboarded: false, preferredDiff: "easy", preferredModules: ["math","vocab","sudoku"] }; }

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
  const [vocabScreen, setVocabScreen] = useState("intro"); // intro | game | summary
  const [vocabRecentSeen, setVocabRecentSeen] = useState(new Set());
  const [showSentence, setShowSentence] = useState(false);
  const [vocabQCount, setVocabQCount] = useState(10);
  const [vocabQIdx, setVocabQIdx] = useState(0);
  const [vocabSessionStart, setVocabSessionStart] = useState(null);
  const [vocabXpEarned, setVocabXpEarned] = useState(0);
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardName, setOnboardName] = useState("");
  const [showOnboard, setShowOnboard] = useState(!vocabSave.onboarded);
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
  const mutedColor = theme==="dark" ? "#4a6070" : "#8a9aaa";
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

  const loadVocabQuestion = useCallback((modeOverride, diffOverride, catOverride) => {
    const mode = modeOverride || vocabMode;
    const diff2 = diffOverride || vocabDiff;
    const cat2 = catOverride || vocabCat;
    let pool;
    if (mode === "review") {
      pool = getWrongWordsPool();
      if (pool.length === 0) { setVocabScreen("summary"); return; }
    } else {
      pool = getVocabPool(diff2, cat2, new Set());
      if (!pool || pool.length === 0) {
        pool = VOCAB_WORDS.filter(w => diff2 === "all" || w.diff === diff2);
      }
      if (!pool || pool.length === 0) pool = VOCAB_WORDS;
    }
    const word = pool[Math.floor(Math.random() * pool.length)];
    const effectiveMode = mode === "review"
      ? ["word2meaning","meaning2word","antonym"][Math.floor(Math.random()*3)]
      : mode;
    const q = makeVocabQuestion(word, effectiveMode, VOCAB_WORDS);
    if (!q) return;
    setVocabQ(q);
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
      const xpAward = vocabQ.word.diff==="easy"?5:vocabQ.word.diff==="medium"?12:20;
      setVocabXpEarned(e => e + xpAward + vocabStreak);
      setXp(x => { const nx = x + xpAward + vocabStreak; globalXP = nx; persistAll(); return nx; });
    } else {
      try{navigator.vibrate&&navigator.vibrate([80,30,80]);}catch(e){}
      setVocabStreak(0);
      recordVocabWrong(wordStr);
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
  useEffect(() => { if (screen==="game") loadQuestion(levelIdx); }, [screen,levelIdx]);

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

  function nextLevel() { const nl=levelIdx+1; setLevelIdx(nl); setQIdx(0); setScreen("game"); }

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
          new Notification("MATH_OS — Keep your streak!", {
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
  const adaptiveColor=adaptiveLevel>0?"#ff6b35":adaptiveLevel<0?"#00cfff":"#4a6070";

  const panelStyle = { background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"16px 20px", marginBottom:12 };


  // ── ONBOARDING ──
  if (showOnboard) {
    const vcol="#a78bfa";
    const steps = [
      { title:"Welcome!", sub:"Let's set you up", icon:"👋" },
      { title:"Your Name", sub:"What should we call you?", icon:"✏️" },
      { title:"Start Difficulty", sub:"You can change this anytime", icon:"🎯" },
    ];
    return (
      <div style={{ minHeight:"100vh", background:"#050a0f", fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px" }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ width:"100%", maxWidth:420, animation:"fadeIn 0.5s ease" }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:56, marginBottom:12 }}>{steps[onboardStep].icon}</div>
            <h2 style={{ fontSize:28, color:"#fff", margin:"0 0 6px", letterSpacing:2 }}>{steps[onboardStep].title}</h2>
            <div style={{ color:"#4a6070", fontSize:13, letterSpacing:2 }}>{steps[onboardStep].sub}</div>
          </div>

          {/* Step indicators */}
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:32 }}>
            {steps.map((_,i)=><div key={i} style={{ width:i===onboardStep?24:8, height:8, borderRadius:4, background:i===onboardStep?"#00ff88":i<onboardStep?"#00ff8844":"#1a3040", transition:"all 0.3s" }} />)}
          </div>

          {onboardStep===0&&(
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:24, color:"#00ff88", marginBottom:16, letterSpacing:3 }}>MATH_OS</div>
              <div style={{ color:"#4a6070", fontSize:13, lineHeight:1.8, marginBottom:24 }}>
                Your personal training system for<br/>
                <span style={{color:"#fff"}}>Math · Vocabulary · Logic</span><br/>
                with XP, streaks, and progress tracking.
              </div>
              <button onClick={()=>setOnboardStep(1)} style={{ width:"100%", background:"transparent", border:"2px solid #00ff88", color:"#00ff88", padding:"18px", fontSize:15, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:58 }}>GET STARTED →</button>
            </div>
          )}

          {onboardStep===1&&(
            <div>
              <input value={onboardName} onChange={e=>setOnboardName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onboardName.trim()&&setOnboardStep(2)} placeholder="Enter your name..." maxLength={20}
                style={{ width:"100%", boxSizing:"border-box", background:"#0a1520", border:"1px solid #1a3040", color:"#fff", padding:"18px 16px", fontSize:20, letterSpacing:2, borderRadius:10, fontFamily:"inherit", outline:"none", marginBottom:16, textAlign:"center" }} autoFocus />
              <button onClick={()=>onboardName.trim()&&setOnboardStep(2)} disabled={!onboardName.trim()} style={{ width:"100%", background:onboardName.trim()?"transparent":"#050a0f", border:`2px solid ${onboardName.trim()?"#00ff88":"#1a3040"}`, color:onboardName.trim()?"#00ff88":"#2a4050", padding:"18px", fontSize:15, letterSpacing:4, cursor:onboardName.trim()?"pointer":"default", borderRadius:10, fontFamily:"inherit", minHeight:58 }}>NEXT →</button>
            </div>
          )}

          {onboardStep===2&&(
            <div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
                {[{k:"easy",label:"EASY",desc:"Start simple — build confidence",col:"#00ff88"},{k:"medium",label:"MEDIUM",desc:"Balanced challenge — most popular",col:"#ffcc00"},{k:"hard",label:"HARD",desc:"Maximum challenge — expert level",col:"#ff4466"}].map(d=>(
                  <button key={d.k} onClick={()=>{setDifficulty(d.k);}} style={{ background:difficulty===d.k?`${d.col}18`:"transparent", border:`2px solid ${difficulty===d.k?d.col:"#1a3040"}`, borderRadius:10, padding:"16px 20px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:12, height:12, borderRadius:"50%", background:d.col, flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:13, color:difficulty===d.k?d.col:"#fff", letterSpacing:2 }}>{d.label}</div>
                      <div style={{ fontSize:11, color:"#4a6070", marginTop:2 }}>{d.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={()=>{
                vocabSave.onboarded=true; vocabSave.userName=onboardName.trim()||"Player"; vocabSave.preferredDiff=difficulty;
                writeVocabSave(vocabSave); setPlayerName(onboardName.trim()||"Player"); setShowOnboard(false);
              }} style={{ width:"100%", background:"transparent", border:"2px solid #00ff88", color:"#00ff88", padding:"18px", fontSize:15, letterSpacing:4, cursor:"pointer", borderRadius:10, fontFamily:"inherit", minHeight:58 }}>LET'S GO →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── HOME ──
  if (appMode==="home") return (
    <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 16px", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ position:"fixed",inset:0,opacity:theme==="dark"?0.04:0.02, backgroundImage:"linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />
      <style>{`@keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-2px)}} @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes pop{0%{transform:scale(0);opacity:1}100%{transform:scale(2.5) translateY(-50px);opacity:0}}`}</style>
      <div style={{ textAlign:"center", animation:"fadeIn 0.6s ease", maxWidth:480, width:"100%", paddingTop:"max(env(safe-area-inset-top), 40px)", paddingBottom:"max(env(safe-area-inset-bottom), 32px)" }}>
        <div style={{ fontSize:10, letterSpacing:6, color:"#00ff88", marginBottom:8, opacity:0.6 }}>{playerName ? `WELCOME BACK, ${playerName.toUpperCase()}` : "SELECT MODULE"}</div>
        <h1 style={{ fontSize:"clamp(44px,11vw,72px)", color:textColor, margin:"0 0 4px", textShadow:"0 0 30px #00ff88,0 0 60px #00ff8844", animation:"glitch 3s infinite", letterSpacing:3 }}>MATH<span style={{color:"#00ff88"}}>_</span>OS</h1>
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

        <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:24 }}>
          <button onClick={()=>{setAppMode("math");setScreen("intro");}} style={{ background:"transparent", border:"2px solid #00ff88", color:"#00ff88", padding:"28px 20px", fontSize:15, letterSpacing:3, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 20px #00ff8844", transition:"all 0.2s", minHeight:100 }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00ff8818";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:36, marginBottom:8 }}>🧮</div>
            <div>MATH TRAINING</div>
            <div style={{ fontSize:11, color:"#00ff8899", marginTop:4, letterSpacing:1 }}>Arithmetic · Algebra · Advanced · Audio · Drill · Review</div>
          </button>
          <button onClick={()=>startSudoku()} style={{ background:"transparent", border:"2px solid #00cfff", color:"#00cfff", padding:"24px 20px", fontSize:15, letterSpacing:3, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 20px #00cfff44", transition:"all 0.2s", minHeight:90 }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00cfff18";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔢</div>
            <div>SUDOKU</div>
            <div style={{ fontSize:11, color:"#00cfff99", marginTop:4, letterSpacing:1 }}>Logic · Pattern · Deduction</div>
          </button>
          <button onClick={()=>{setAppMode("vocab");setVocabScreen("intro");}} style={{ background:"transparent", border:"2px solid #a78bfa", color:"#a78bfa", padding:"24px 20px", fontSize:15, letterSpacing:3, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 20px #a78bfa44", transition:"all 0.2s", minHeight:90 }}
            onMouseEnter={e=>{e.currentTarget.style.background="#a78bfa18";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:32, marginBottom:8 }}>📚</div>
            <div>VOCABULARY</div>
            <div style={{ fontSize:11, color:"#a78bfa99", marginTop:4, letterSpacing:1 }}>Words · Meanings · Spelling · Antonyms</div>
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
      <div style={{ minHeight:"100vh", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 16px", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
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
        <div style={{ width:"100%", maxWidth:480, paddingTop:"max(env(safe-area-inset-top),16px)", paddingBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <button onClick={()=>setAppMode("home")} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"12px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:44 }}>← HOME</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:mutedColor, letterSpacing:4 }}>MODULE</div>
              <div style={{ fontSize:14, color:vcol, letterSpacing:3 }}>VOCABULARY</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setSoundOn(s=>!s)} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"10px 14px", fontSize:14, cursor:"pointer", borderRadius:8, minHeight:44 }}>{soundOn?"🔊":"🔇"}</button>
            </div>
          </div>
        </div>

        <div style={{ width:"100%", maxWidth:480, paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>

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
                {vocabQ.word.cat.toUpperCase()} · {vocabQ.word.diff.toUpperCase()}
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
              <div style={{ fontSize:"clamp(20px,5vw,36px)", color:"#fff", fontWeight:"bold", letterSpacing:2, lineHeight:1.3 }}>{vocabQ.prompt}</div>
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

  // ── SUDOKU ──
  if (appMode==="sudoku") {
    const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
    return (
      <div style={{ height:"100vh", height:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 12px", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <style>{`@keyframes pop{0%{transform:scale(0);opacity:1}100%{transform:scale(2.5) translateY(-50px);opacity:0}} @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
        {particles.map(p=>(<div key={p.id} style={{ position:"fixed",left:`${p.x}%`,top:`${p.y}%`,width:8,height:8,borderRadius:"50%",background:p.color,boxShadow:`0 0 10px ${p.color}`,pointerEvents:"none",zIndex:50,animation:"pop 1s ease-out forwards" }} />))}

        <div style={{ width:"100%", maxWidth:430, paddingTop:"max(env(safe-area-inset-top), 16px)", paddingBottom:"max(env(safe-area-inset-bottom), 20px)" }}>
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
              <button key={n} onClick={()=>handleSudokuInput(String(n))} style={{ background:cardBg, border:`1px solid ${borderColor}`, color:textColor, padding:"0", fontSize:18, cursor:"pointer", borderRadius:8, fontFamily:"inherit", transition:"all 0.15s", minHeight:44, display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}
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
    <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 16px", position:"relative", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ position:"fixed",inset:0,opacity:theme==="dark"?0.04:0.02,backgroundImage:"linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none" }} />
      <style>{`
        @keyframes pop{0%{transform:scale(0) translateY(0);opacity:1}100%{transform:scale(2.5) translateY(-60px);opacity:0}}
        @keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-2px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInFast{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        input[type=number]{-moz-appearance:textfield;} input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;} *{-webkit-tap-highlight-color:transparent;touch-action:manipulation;} body{overscroll-behavior:none;}
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
        <div style={{ textAlign:"center",animation:"fadeIn 0.5s ease",maxWidth:430,width:"100%", paddingTop:"max(env(safe-area-inset-top),50px)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>
          <div style={{ fontSize:10,letterSpacing:6,color:"#00ff88",marginBottom:6,opacity:0.6 }}>MATH TRAINING</div>
          <h1 style={{ fontSize:"clamp(42px,10vw,68px)",color:textColor,margin:"0 0 4px",textShadow:"0 0 30px #00ff88,0 0 60px #00ff8844",animation:"glitch 3s infinite",letterSpacing:3 }}>MATH<span style={{color:"#00ff88"}}>_</span>OS</h1>
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
          <button onClick={handleStart} style={{ background:"transparent",border:"2px solid #00ff88",color:"#00ff88",padding:"18px 48px",fontSize:16,letterSpacing:5,cursor:"pointer",borderRadius:8,fontFamily:"inherit",boxShadow:"0 0 20px #00ff8844",transition:"all 0.2s",width:"100%",minHeight:58,touchAction:"manipulation" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00ff8818";e.currentTarget.style.boxShadow="0 0 32px #00ff8877";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.boxShadow="0 0 20px #00ff8844";}}>[ INITIALIZE ]</button>
        </div>
      )}

      {/* ── GAME ── */}
      {screen==="game"&&current&&(
        <div style={{ width:"100%",maxWidth:430,animation:"fadeIn 0.3s ease", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),24px)" }}>
          {/* HUD */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div>
              <div style={{ fontSize:11,color:mutedColor,letterSpacing:3,marginBottom:2 }}>{isDrill?"DRILL":"LEVEL"}</div>
              <div style={{ fontSize:14,color:level.color,letterSpacing:3 }}>{isDrill?drillTopic.toUpperCase():level.name}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11,color:mutedColor,letterSpacing:3,marginBottom:2 }}>SCORE</div>
              <div style={{ fontSize:24,color:textColor,letterSpacing:2 }}>{score.toString().padStart(6,"0")}</div>
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
                <div style={{ fontSize:"clamp(32px,8vw,56px)",color:textColor,letterSpacing:3,textShadow:`0 0 20px ${level.color}55` }}>{current.question}</div>
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
                return (<button key={i} className="cbtn" onClick={()=>!hidden&&handleAnswer(i,c)} style={{ background:cbg,border:`1px solid ${cborder}`,color:hidden?"#1a3040":"#ffffff",fontWeight:"bold",padding:"20px 8px",fontSize:22,letterSpacing:2,borderRadius:12,cursor:feedback||hidden?"default":"pointer",boxShadow:feedback&&isCorrectAns?`0 0 16px ${level.color}44`:"none",fontFamily:"inherit",transition:"all 0.2s",opacity:hidden?0.2:1,minHeight:70,touchAction:"manipulation" }}>{hidden?"—":c}</button>);
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
                      style={{ background:cardBg,border:`1px solid ${borderColor}`,color:"#fff",fontSize:26,fontWeight:"bold",padding:"18px 0",borderRadius:12,cursor:"pointer",fontFamily:"inherit",minHeight:64,touchAction:"manipulation",transition:"all 0.1s" }}
                      onTouchStart={e=>e.currentTarget.style.background=level.color+"33"}
                      onTouchEnd={e=>e.currentTarget.style.background=cardBg}>
                      {n}
                    </button>
                  ))}
                  {/* Bottom row: ⌫ — 0 — GO */}
                  <button onClick={()=>setTypedAnswer(p=>p.slice(0,-1))}
                    style={{ background:cardBg,border:`1px solid ${borderColor}`,color:"#ff6b35",fontSize:22,padding:"18px 0",borderRadius:12,cursor:"pointer",fontFamily:"inherit",minHeight:64,touchAction:"manipulation" }}>⌫</button>
                  <button onClick={()=>setTypedAnswer(p=>p+"0")}
                    style={{ background:cardBg,border:`1px solid ${borderColor}`,color:"#fff",fontSize:26,fontWeight:"bold",padding:"18px 0",borderRadius:12,cursor:"pointer",fontFamily:"inherit",minHeight:64,touchAction:"manipulation" }}>0</button>
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
        <div style={{ textAlign:"center",animation:"fadeIn 0.5s ease",maxWidth:430,width:"100%", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>
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
        <div style={{ textAlign:"center",animation:"fadeIn 0.5s ease",maxWidth:430,width:"100%", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>
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

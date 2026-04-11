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
    if (op==="+") { a=rand(10,99);b=rand(10,99);answer=a+b;question=`${a} + ${b}`;steps=[`Add tens: ${Math.floor(a/10)*10}+${Math.floor(b/10)*10}=${Math.floor(a/10)*10+Math.floor(b/10)*10}`,`Add ones: ${a%10}+${b%10}=${a%10+b%10}`,`Total = ${answer}`];shortcut=`Round to nearest 10, adjust`; }
    else if (op==="-") { a=rand(20,99);b=rand(1,a);answer=a-b;question=`${a} − ${b}`;steps=[`${a} − ${b} = ${answer}`];shortcut=`Count up from ${b} to ${a}`; }
    else if (op==="×") { a=rand(2,12);b=rand(2,12);answer=a*b;question=`${a} × ${b}`;steps=[`${a} × ${b} = ${answer}`];shortcut=a>6?`${a} × ${b} = ${Math.floor(a/2)*2} × ${b} + ${a%2} × ${b}`:null; }
    else { a=rand(2,12);b=rand(2,12);answer=a;question=`${a*b} ÷ ${b}`;steps=[`Think: ${b} × ? = ${a*b}`,`Answer = ${a}`]; }
  } else {
    if (op==="+") { a=rand(100,999);b=rand(100,999);answer=a+b;question=`${a} + ${b}`;steps=[`Hundreds: ${Math.floor(a/100)+Math.floor(b/100)}00`,`Tens+ones: ${a%100}+${b%100}=${a%100+b%100}`,`= ${answer}`];shortcut=`Round ${a}→${Math.round(a/100)*100}, adjust by ${Math.round(a/100)*100-a}`; }
    else if (op==="-") { a=rand(200,999);b=rand(10,a);answer=a-b;question=`${a} − ${b}`;steps=[`${a} − ${b} = ${answer}`];shortcut=`Round ${b} to nearest 10, subtract, readjust`; }
    else if (op==="×") { a=rand(13,30);b=rand(13,30);answer=a*b;question=`${a} × ${b}`;steps=[`${a}×${Math.floor(b/10)*10}=${a*Math.floor(b/10)*10}`,`${a}×${b%10}=${a*(b%10)}`,`Sum=${answer}`];shortcut=`(${Math.ceil(a/10)*10}−${Math.ceil(a/10)*10-a})×${b}`; }
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
    if (type===0) { const a=rand(2,9),b=rand(1,20),x=rand(1,15); return { question:`${a}x + ${b} = ${a*x+b}`, answer:x, hint:"Solve for x", steps:[`${a}x = ${a*x+b}-${b} = ${a*x}`,`x = ${a*x}÷${a} = ${x}`], shortcut:"Subtract constant, then divide", topic:"algebra" }; }
    else if (type===1) { const p=rand(10,90),total=rand(100,500),ans=Math.round(p*total/100); return { question:`${p}% of ${total}`, answer:ans, hint:"Calculate %", steps:[`${p}/100 × ${total} = ${ans}`], shortcut:`10% = ${total/10}, scale to ${p}%`, topic:"percentages" }; }
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
    const t=rand(0,3);
    if (t===0) { const base=rand(2,5),exp=rand(2,4),ans=Math.pow(base,exp); return { question:`${base}^${exp}`, answer:ans, hint:`${base} to the power ${exp}`, steps:Array.from({length:exp},(_,i)=>`${base}^${i+1}=${Math.pow(base,i+1)}`), shortcut:null, topic:"powers" }; }
    else if (t===1) { const sq=[4,9,16,25,36,49,64,81,100,121,144,169,196,225],s=sq[rand(0,sq.length-1)],ans=Math.sqrt(s); return { question:`√${s}`, answer:ans, hint:"Square root", steps:[`${ans}²=${s}`,`√${s}=${ans}`], shortcut:null, topic:"roots" }; }
    else if (t===2) { const a=rand(2,8),b=rand(2,8),x=rand(2,8),y=rand(2,8),ans=a*x+b*y; return { question:`${a}(${x})+${b}(${y})`, answer:ans, hint:"Evaluate", steps:[`${a}×${x}=${a*x}`,`${b}×${y}=${b*y}`,`=${ans}`], shortcut:null, topic:"expressions" }; }
    else { const a=rand(10,50),b=rand(10,50),c=rand(10,50),ans=Math.round((a+b+c)/3); return { question:`avg(${a},${b},${c})`, answer:ans, hint:"Average (round)", steps:[`${a}+${b}+${c}=${a+b+c}`,`÷3=${ans}`], shortcut:null, topic:"averages" }; }
  } else {
    const t=rand(0,3);
    if (t===0) { const base=rand(3,12),exp=rand(2,5),ans=Math.pow(base,exp); return { question:`${base}^${exp}`, answer:ans, hint:`${base} to the power ${exp}`, steps:Array.from({length:exp},(_,i)=>`${base}^${i+1}=${Math.pow(base,i+1)}`), shortcut:`Use (${base}^${Math.floor(exp/2)})² pattern`, topic:"powers" }; }
    else if (t===1) { const sq=[4,9,16,25,36,49,64,81,100,121,144,169,196,225,256,289,324,361,400,441,484,529],s=sq[rand(0,sq.length-1)],ans=Math.sqrt(s); return { question:`√${s}`, answer:ans, hint:"Square root", steps:[`${ans}²=${s}`,`√${s}=${ans}`], shortcut:"Use nearby perfect squares", topic:"roots" }; }
    else if (t===2) { const a=rand(4,15),b=rand(4,15),c=rand(4,15),x=rand(4,12),y=rand(4,12),ans=a*x+b*y-c; return { question:`${a}(${x})+${b}(${y})−${c}`, answer:ans, hint:"Evaluate", steps:[`${a}×${x}=${a*x}`,`${b}×${y}=${b*y}`,`${a*x}+${b*y}-${c}=${ans}`], shortcut:null, topic:"expressions" }; }
    else { const nums=Array.from({length:5},()=>rand(20,300)),sum=nums.reduce((s,n)=>s+n,0),ans=Math.round(sum/5); return { question:`avg(${nums.join(",")})`, answer:ans, hint:"Average 5 nums (round)", steps:[`Sum=${sum}`,`÷5=${ans}`], shortcut:"Estimate middle, check balance", topic:"averages" }; }
  }
}

function generateEstimation(diff) {
  const pairs = diff==="easy"?[[47,6],[83,9],[124,7]]:diff==="medium"?[[847,19],[1253,31],[672,28]]:[[8472,193],[12530,310],[67200,280]];
  const [dividend,divisor]=pairs[rand(0,pairs.length-1)];
  const exact=dividend/divisor, rounded=Math.round(exact);
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

// ── Global persistent state ──
let globalXP = 0;
let globalStats = {};
let globalBests = {};
let dailyStreak = { lastDate: null, count: 0 };
let sessionHistory = [];
let globalPowerups = { fifty: 2, time: 2, skip: 2 };
let missedQuestions = [];
let spacedQueue = [];

function recordStat(topic, correct) {
  if (!globalStats[topic]) globalStats[topic]={correct:0,total:0};
  globalStats[topic].total++; if (correct) globalStats[topic].correct++;
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
  { key:"race",   label:"RACE MODE",       desc:"2 players, same screen" },
  { key:"sudoku", label:"SUDOKU",          desc:"Logic puzzle mode" },
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

export default function MathGame() {
  // ── App mode ──
  const [appMode, setAppMode] = useState("home"); // home | math | sudoku
  const [screen, setScreen] = useState("intro");
  const [difficulty, setDifficulty] = useState("medium");
  const [inputMode, setInputMode] = useState("mcq");
  const [drillTopic, setDrillTopic] = useState("multiplication");
  const [questionsPerLevel, setQuestionsPerLevel] = useState(5);
  const [inputVal, setInputVal] = useState("5");
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
  const [powerups, setPowerups] = useState({...globalPowerups});
  const [hiddenChoices, setHiddenChoices] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showStats, setShowStats] = useState(false);

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
    // Spaced repetition: 25% chance to revisit missed question
    if (spacedQueue.length>0 && Math.random()<0.25) {
      const q = spacedQueue.shift();
      return q;
    }
    const eff = getEffDiff();
    if (isDrill) {
      if (drillTopic==="estimation") return generateEstimation(eff);
      for (const gen of [generateBasic,generateAlgebra,generateAdvanced]) {
        for (let i=0;i<12;i++) { const q=gen(eff); if (q.topic===drillTopic) return q; }
      }
      return generateBasic(eff);
    }
    if (Math.random()<0.12) return generateEstimation(eff);
    return LEVELS[Math.min(lvlIdx2,LEVELS.length-1)].gen(eff);
  }, [getEffDiff,isDrill,drillTopic]);

  const loadQuestion = useCallback((lvlIdx2=levelIdx) => {
    const q = makeQuestion(lvlIdx2);
    setCurrent(q);
    setChoices(q.isEstimation?q.estimationOpts:generateWrongAnswers(q.answer));
    setFeedback(null); setSelectedIdx(null); setTypedAnswer("");
    setTimeLeft(TOTAL_TIME); setStartTime(Date.now());
    setHiddenChoices([]); setHintUsed(false); setShowHint(false);
    setTimeout(()=>{ if(typeInputRef.current) typeInputRef.current.focus(); },100);
  }, [levelIdx,makeQuestion]);

  function handleStart() {
    const n=parseInt(inputVal,10);
    if (!inputVal||isNaN(n)||n<1) { setInputError("Enter 1–25."); return; }
    if (n>25) { setInputError("Max 25."); return; }
    setQuestionsPerLevel(n); setInputError("");
    setLives(3); setAdaptiveLevel(0); setConsCorrect(0); setConsWrong(0);
    setScore(0); setStreak(0); setMaxStreak(0); setTotalCorrect(0); setTotalAnswered(0);
    sessionHistory=[];
    // Check daily streak
    const today=new Date().toDateString();
    if (dailyStreak.lastDate!==today) {
      const yesterday=new Date(Date.now()-86400000).toDateString();
      dailyStreak.count = dailyStreak.lastDate===yesterday ? dailyStreak.count+1 : 1;
      dailyStreak.lastDate=today;
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
      const earnedXP=pts+5;
      setScore(s=>s+pts);
      setXp(x=>{ const nx=x+earnedXP; globalXP=nx; return nx; });
      setStreak(s=>{ const ns=s+1; setMaxStreak(m=>Math.max(m,ns));
        if (ns%5===0) { setShowCelebration(true); setTimeout(()=>setShowCelebration(false),2000); spawnParticles(true,true); snd("streak"); }
        return ns;
      });
      setTotalCorrect(t=>t+1);
      setConsCorrect(c=>{ const nc=c+1; if(nc>=3){setAdaptiveLevel(l=>Math.min(1,l+1));return 0;} return nc; });
      setConsWrong(0);
      snd("correct");
    } else {
      setLives(l=>l-1);
      setStreak(0);
      // Add to spaced repetition queue
      if (!isTimeout) spacedQueue.push(current);
      setConsWrong(w=>{ const nw=w+1; if(nw>=2){setAdaptiveLevel(l=>Math.max(-1,l-1));return 0;} return nw; });
      setConsCorrect(0);
      snd("wrong");
    }
    spawnParticles(correct);

    const delay = correct ? 900 : null;
    if (correct) {
      setTimeout(()=>{
        const newLives = lives;
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
    const newLives = lives; // already decremented in handleAnswer
    if (newLives <= 0) { setWeakTopics(getWeakTopics()); setScreen("win"); return; }
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
      setHiddenChoices(toHide); setPowerups(p=>({...p,fifty:p.fifty-1})); globalPowerups.fifty--;
    } else if (type==="time"&&powerups.time>0) {
      setTimeLeft(t=>t+10); setPowerups(p=>({...p,time:p.time-1})); globalPowerups.time--;
    } else if (type==="skip"&&powerups.skip>0) {
      setPowerups(p=>({...p,skip:p.skip-1})); globalPowerups.skip--;
      setQIdx(q=>q+1); loadQuestion(levelIdx);
    }
  }

  function nextLevel() { const nl=levelIdx+1; setLevelIdx(nl); setQIdx(0); setScreen("game"); }

  function restart() {
    setLevelIdx(0);setQIdx(0);setScore(0);setStreak(0);setMaxStreak(0);
    setTotalCorrect(0);setTotalAnswered(0);setLives(3);setAdaptiveLevel(0);
    setConsCorrect(0);setConsWrong(0);setInputVal(String(questionsPerLevel));
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

  const timerPct=(timeLeft/TOTAL_TIME)*100;
  const timerColor=timeLeft>10?level.color:timeLeft>5?"#ffcc00":"#ff4466";
  const adaptiveLabel=adaptiveLevel>0?"↑ HARDER":adaptiveLevel<0?"↓ EASIER":"ADAPTIVE";
  const adaptiveColor=adaptiveLevel>0?"#ff6b35":adaptiveLevel<0?"#00cfff":"#4a6070";

  const panelStyle = { background:cardBg, border:`1px solid ${borderColor}`, borderRadius:10, padding:"16px 20px", marginBottom:12 };

  // ── HOME ──
  if (appMode==="home") return (
    <div style={{ minHeight:"100vh", minHeight:"-webkit-fill-available", background:bg, fontFamily:"'Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"0 16px", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ position:"fixed",inset:0,opacity:theme==="dark"?0.04:0.02, backgroundImage:"linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />
      <style>{`@keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-2px)}} @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes pop{0%{transform:scale(0);opacity:1}100%{transform:scale(2.5) translateY(-50px);opacity:0}}`}</style>
      <div style={{ textAlign:"center", animation:"fadeIn 0.6s ease", maxWidth:480, width:"100%", paddingTop:"max(env(safe-area-inset-top), 40px)", paddingBottom:"max(env(safe-area-inset-bottom), 32px)" }}>
        <div style={{ fontSize:10, letterSpacing:6, color:"#00ff88", marginBottom:8, opacity:0.6 }}>SELECT MODULE</div>
        <h1 style={{ fontSize:"clamp(44px,11vw,72px)", color:textColor, margin:"0 0 4px", textShadow:"0 0 30px #00ff88,0 0 60px #00ff8844", animation:"glitch 3s infinite", letterSpacing:3 }}>MATH<span style={{color:"#00ff88"}}>_</span>OS</h1>
        <div style={{ color:"#00ff88", fontSize:13, letterSpacing:5, marginBottom:24, opacity:0.7 }}>COGNITIVE TRAINING SYSTEM v3.0</div>

        {/* XP Bar */}
        <div style={{ ...panelStyle, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:14, color:xpRank.color, letterSpacing:3 }}>{xpRank.name}</span>
            <span style={{ fontSize:12, color:mutedColor }}>{xp} XP · {xpToNext(xp)} to next</span>
          </div>
          <div style={{ height:4, background:borderColor, borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${xpPct(xp)}%`, background:xpRank.color, boxShadow:`0 0 8px ${xpRank.color}`, transition:"width 0.5s" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <span style={{ fontSize:9, color:mutedColor }}>🔥 DAILY STREAK: {dailyStreak.count} days</span>
            <span style={{ fontSize:9, color:mutedColor }}>💡 HINTS: {powerups.fifty}×50/50 · {powerups.time}×+10s · {powerups.skip}×skip</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
          <button onClick={()=>{setAppMode("math");setScreen("intro");}} style={{ background:"transparent", border:"2px solid #00ff88", color:"#00ff88", padding:"28px 20px", fontSize:15, letterSpacing:3, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 20px #00ff8844", transition:"all 0.2s", minHeight:120 }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00ff8818";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:36, marginBottom:10 }}>🧮</div>
            <div>MATH TRAINING</div>
            <div style={{ fontSize:9, color:"#00ff8877", marginTop:4, letterSpacing:1 }}>Arithmetic · Algebra · Advanced</div>
          </button>
          <button onClick={()=>startSudoku()} style={{ background:"transparent", border:"2px solid #00cfff", color:"#00cfff", padding:"28px 20px", fontSize:15, letterSpacing:3, cursor:"pointer", borderRadius:12, fontFamily:"inherit", boxShadow:"0 0 20px #00cfff44", transition:"all 0.2s", minHeight:120 }}
            onMouseEnter={e=>{e.currentTarget.style.background="#00cfff18";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <div style={{ fontSize:36, marginBottom:10 }}>🔢</div>
            <div>SUDOKU</div>
            <div style={{ fontSize:9, color:"#00cfff77", marginTop:4, letterSpacing:1 }}>Logic · Pattern · Deduction</div>
          </button>
        </div>

        {/* Settings row */}
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={()=>setSoundOn(s=>!s)} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"14px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:48 }}>{soundOn?"🔊":"🔇"}</button>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"14px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:48 }}>{theme==="dark"?"☀️":"🌙"}</button>
          {Object.keys(globalStats).length>0&&<button onClick={()=>setShowStats(s=>!s)} style={{ background:"transparent", border:`1px solid ${borderColor}`, color:mutedColor, padding:"14px 18px", fontSize:13, cursor:"pointer", borderRadius:8, fontFamily:"inherit", minHeight:48 }}>📊</button>}
        </div>

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
              <div style={{ fontSize:9, color:mutedColor, letterSpacing:4 }}>SUDOKU</div>
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
              <div style={{ color:mutedColor, fontSize:11 }}>Time: {fmt(sudokuTime)} · Mistakes: {sudokuMistakes}</div>
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
                  <div style={{ fontSize:11,color:sel?"#00ff8866":borderColor,lineHeight:1.4 }}>{m.desc}</div>
                </button>);
              })}
            </div>
          </div>

          {inputMode==="drill"&&(
            <div style={{ ...panelStyle, animation:"fadeInFast 0.3s ease" }}>
              <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:8 }}>DRILL TOPIC</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {DRILL_TOPICS.map(t=>(<button key={t} onClick={()=>setDrillTopic(t)} style={{ background:drillTopic===t?"#00cfff15":cardBg,border:`1px solid ${drillTopic===t?"#00cfff":borderColor}`,borderRadius:20,padding:"10px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:12,letterSpacing:2,color:drillTopic===t?"#00cfff":mutedColor,transition:"all 0.15s",minHeight:44,touchAction:"manipulation" }}>{t.toUpperCase()}</button>))}
              </div>
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
              <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:8 }}>QUESTIONS/LEVEL</div>
              <input type="number" min="1" max="25" value={inputVal} onChange={e=>{setInputVal(e.target.value);setInputError("");}} onKeyDown={e=>{if(e.key==="Enter")handleStart();}}
                style={{ background:bg,border:`1px solid ${inputError?"#ff4466":borderColor}`,color:textColor,padding:"14px",fontSize:20,letterSpacing:2,borderRadius:8,fontFamily:"inherit",width:"100%",boxSizing:"border-box",outline:"none",textAlign:"center",minHeight:52 }} />
              {inputError&&<div style={{ color:"#ff4466",fontSize:9,marginTop:5 }}>⚠ {inputError}</div>}
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

      {/* ── RACE MODE ── */}
      {screen==="race"&&raceCurrent&&(
        <div style={{ width:"100%",maxWidth:430,animation:"fadeIn 0.3s ease", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),24px)" }}>
          <div style={{ textAlign:"center",marginBottom:20 }}>
            <div style={{ fontSize:13,color:mutedColor,letterSpacing:4 }}>RACE MODE · ROUND {raceRound+1}/{RACE_ROUNDS}</div>
            <div style={{ display:"flex",justifyContent:"center",gap:40,marginTop:10 }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:13,color:mutedColor }}>PLAYER 1</div><div style={{ fontSize:36,color:"#00ff88" }}>{raceScores[0]}</div></div>
              <div style={{ fontSize:20,color:mutedColor,alignSelf:"center" }}>VS</div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:13,color:mutedColor }}>PLAYER 2</div><div style={{ fontSize:36,color:"#00cfff" }}>{raceScores[1]}</div></div>
            </div>
          </div>

          <div style={{ background:cardBg,border:`1px solid ${borderColor}`,borderRadius:10,padding:"28px 24px",marginBottom:20,textAlign:"center" }}>
            <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:10 }}>{raceCurrent.hint.toUpperCase()}</div>
            <div style={{ fontSize:"clamp(24px,6vw,48px)",color:textColor,letterSpacing:4 }}>{raceCurrent.question}</div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
            {[0,1].map(p=>(
              <div key={p} style={{ background:cardBg,border:`2px solid ${p===0?"#00ff88":"#00cfff"}`,borderRadius:10,padding:"16px" }}>
                <div style={{ fontSize:10,color:p===0?"#00ff88":"#00cfff",letterSpacing:3,marginBottom:10,textAlign:"center" }}>PLAYER {p+1}</div>
                <input ref={raceInputRefs[p]} type="number" placeholder="Answer..." value={raceInput[p]}
                  onChange={e=>handleRaceInput(p,e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")handleRaceSubmit(p);}}
                  disabled={!!raceFeedback[p]}
                  style={{ width:"100%",boxSizing:"border-box",background:bg,border:`1px solid ${raceFeedback[p]==="correct"?"#00ff88":raceFeedback[p]==="wrong"?"#ff4466":borderColor}`,color:textColor,padding:"16px",fontSize:22,letterSpacing:2,borderRadius:10,fontFamily:"inherit",outline:"none",textAlign:"center",minHeight:56 }} />
                <button onClick={()=>handleRaceSubmit(p)} disabled={!!raceFeedback[p]} style={{ width:"100%",marginTop:10,background:p===0?"#00ff8815":"#00cfff15",border:`1px solid ${p===0?"#00ff88":"#00cfff"}`,color:p===0?"#00ff88":"#00cfff",padding:"16px",fontSize:14,letterSpacing:3,cursor:"pointer",borderRadius:10,fontFamily:"inherit",minHeight:52,touchAction:"manipulation" }}>SUBMIT</button>
                {raceFeedback[p]&&<div style={{ textAlign:"center",marginTop:8,fontSize:12,color:raceFeedback[p]==="correct"?"#00ff88":"#ff4466" }}>{raceFeedback[p]==="correct"?"✓ CORRECT!":"✗ WRONG"}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RACE WIN ── */}
      {screen==="racewin"&&(
        <div style={{ textAlign:"center",animation:"fadeIn 0.5s ease",maxWidth:430,width:"100%", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>
          <div style={{ fontSize:36,marginBottom:16 }}>🏆</div>
          <div style={{ fontSize:10,color:"#ffcc00",letterSpacing:6,marginBottom:10 }}>RACE COMPLETE</div>
          <h2 style={{ fontSize:40,color:textColor,margin:"0 0 24px" }}>{raceWinner===-1?"DRAW!":raceWinner===0?"P1 WINS!":"P2 WINS!"}</h2>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:28 }}>
            {[0,1].map(p=>(<div key={p} style={{ background:cardBg,border:`1px solid ${p===0?"#00ff88":"#00cfff"}`,borderRadius:8,padding:"16px" }}>
              <div style={{ fontSize:9,color:mutedColor,letterSpacing:3,marginBottom:6 }}>PLAYER {p+1}</div>
              <div style={{ fontSize:32,color:p===0?"#00ff88":"#00cfff" }}>{raceScores[p]}</div>
            </div>))}
          </div>
          <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
            <button onClick={()=>{setRaceScores([0,0]);setRaceRound(0);setRaceWinner(null);setRaceCurrent(null);setScreen("race");}} style={{ background:"transparent",border:"2px solid #00ff88",color:"#00ff88",padding:"12px 28px",fontSize:11,letterSpacing:4,cursor:"pointer",borderRadius:4,fontFamily:"inherit" }}>REMATCH</button>
            <button onClick={restart} style={{ background:"transparent",border:`1px solid ${borderColor}`,color:mutedColor,padding:"12px 28px",fontSize:11,letterSpacing:4,cursor:"pointer",borderRadius:4,fontFamily:"inherit" }}>MENU</button>
          </div>
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

          {/* Badges */}
          <div style={{ display:"flex",gap:6,justifyContent:"center",marginBottom:10,flexWrap:"wrap" }}>
            <div style={{ background:`${diff.color}12`,border:`1px solid ${diff.color}44`,borderRadius:20,padding:"2px 10px",fontSize:8,letterSpacing:2,color:diff.color }}>{diff.label}</div>
            <div style={{ background:"transparent",border:`1px solid ${adaptiveColor}44`,borderRadius:20,padding:"2px 10px",fontSize:8,letterSpacing:2,color:adaptiveColor }}>{adaptiveLabel}</div>
            <div style={{ background:"transparent",border:`1px solid ${borderColor}`,borderRadius:20,padding:"2px 10px",fontSize:8,letterSpacing:2,color:mutedColor }}>Q{qIdx+1}/{isDrill?questionsPerLevel*3:questionsPerLevel}</div>
            {streak>0&&<div style={{ background:"#ffcc0012",border:"1px solid #ffcc0044",borderRadius:20,padding:"2px 10px",fontSize:8,letterSpacing:2,color:"#ffcc00" }}>{streak>=3?"🔥 ":""}×{streak}</div>}
          </div>

          {/* XP bar mini */}
          <div style={{ height:2,background:borderColor,borderRadius:2,marginBottom:10,overflow:"hidden" }}>
            <div style={{ height:"100%",background:xpRank.color,width:`${xpPct(xp)}%`,transition:"width 0.5s" }} />
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
            <div style={{ fontSize:12,color:mutedColor,letterSpacing:3,marginBottom:12 }}>{current.hint.toUpperCase()}</div>
            <div style={{ fontSize:"clamp(32px,8vw,56px)",color:textColor,letterSpacing:3,textShadow:`0 0 20px ${level.color}55` }}>{current.question}</div>
            {showHint&&current.steps&&<div style={{ marginTop:12,fontSize:10,color:mutedColor,borderTop:`1px solid ${borderColor}`,paddingTop:10 }}>💡 {current.steps[0]}</div>}
          </div>

          {/* Solution on wrong */}
          {feedback&&feedback!=="correct"&&(
            <div style={{ background:bg,border:`1px solid ${borderColor}`,borderRadius:8,padding:"12px 16px",marginBottom:12,animation:"fadeInFast 0.3s ease" }}>
              <div style={{ fontSize:8,color:mutedColor,letterSpacing:3,marginBottom:6 }}>SOLUTION</div>
              {current.steps.map((s,i)=>(<div key={i} style={{ fontSize:10,color:i===current.steps.length-1?"#00ff88":"#5a8090",marginBottom:2 }}>{i===current.steps.length-1?"→ ":"  "}{s}</div>))}
              {current.shortcut&&(<div style={{ marginTop:8,paddingTop:6,borderTop:`1px solid ${borderColor}` }}><span style={{ fontSize:8,color:"#ffcc00",letterSpacing:2 }}>💡 </span><span style={{ fontSize:9,color:"#ffcc0099" }}>{current.shortcut}</span></div>)}
            </div>
          )}

          {/* MCQ */}
          {(inputMode==="mcq"||current.isEstimation)&&(
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
              {choices.map((c,i)=>{
                const isCorrectAns=Number(c)===Number(current.answer);
                const hidden=hiddenChoices.includes(c)&&!isCorrectAns;
                let cbg=cardBg,cborder=borderColor,cc=mutedColor;
                if (feedback) { if(isCorrectAns){cbg=`${level.color}18`;cborder=level.color;cc=level.color;} else if(selectedIdx===i){cbg="#ff446614";cborder="#ff4466";cc="#ff4466";} }
                return (<button key={i} className="cbtn" onClick={()=>!hidden&&handleAnswer(i,c)} style={{ background:cbg,border:`1px solid ${cborder}`,color:hidden?"#1a3040":cc,padding:"20px 8px",fontSize:22,letterSpacing:2,borderRadius:12,cursor:feedback||hidden?"default":"pointer",boxShadow:feedback&&isCorrectAns?`0 0 16px ${level.color}44`:"none",fontFamily:"inherit",transition:"all 0.2s",opacity:hidden?0.2:1,minHeight:70,touchAction:"manipulation" }}>{hidden?"—":c}</button>);
              })}
            </div>
          )}

          {/* Type input */}
          {(isType||isSpeed)&&!current.isEstimation&&(
            <div style={{ display:"flex",gap:8,marginBottom:12 }}>
              <input ref={typeInputRef} type="number" placeholder="Type answer..." value={typedAnswer} onChange={e=>setTypedAnswer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleTypedSubmit();}} disabled={!!feedback} className="type-input"
                style={{ flex:1,background:cardBg,border:`1px solid ${feedback==="correct"?level.color:feedback?"#ff4466":borderColor}`,color:textColor,padding:"18px 16px",fontSize:24,letterSpacing:2,borderRadius:12,fontFamily:"inherit",outline:"none",transition:"all 0.2s",minHeight:62 }} />
              <button onClick={handleTypedSubmit} disabled={!!feedback} style={{ background:feedback?"transparent":"#00ff8815",border:`1px solid ${feedback?borderColor:"#00ff88"}`,color:feedback?mutedColor:"#00ff88",padding:"0 20px",fontSize:14,letterSpacing:3,borderRadius:12,cursor:feedback?"default":"pointer",fontFamily:"inherit",minHeight:62,touchAction:"manipulation" }}>GO</button>
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
          <div style={{ color:level.color,fontSize:11,letterSpacing:4,marginBottom:20 }}>CLEARED</div>
          <div style={{ ...panelStyle,marginBottom:16 }}>
            <div style={{ fontSize:22,color:textColor,letterSpacing:2 }}>{score.toString().padStart(6,"0")}</div>
            <div style={{ color:mutedColor,fontSize:8,letterSpacing:3,marginTop:3 }}>CURRENT SCORE</div>
          </div>
          {getWeakTopics().length>0&&(<div style={{ ...panelStyle }}>
            <div style={{ fontSize:8,color:mutedColor,letterSpacing:3,marginBottom:8 }}>WEAK AREAS</div>
            {getWeakTopics().map(w=>(<div key={w.topic} style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
              <span style={{ fontSize:9,color:mutedColor }}>{w.topic.toUpperCase()}</span><span style={{ fontSize:9,color:w.pct<50?"#ff4466":"#ffcc00" }}>{w.pct}%</span>
            </div>))}
          </div>)}
          <div style={{ color:mutedColor,fontSize:9,letterSpacing:2,marginBottom:16 }}>NEXT: <span style={{color:LEVELS[levelIdx+1].color}}>{LEVELS[levelIdx+1].name}</span></div>
          <button onClick={nextLevel} style={{ background:"transparent",border:`2px solid ${LEVELS[levelIdx+1].color}`,color:LEVELS[levelIdx+1].color,padding:"18px 36px",fontSize:15,letterSpacing:4,cursor:"pointer",borderRadius:10,fontFamily:"inherit",transition:"all 0.2s",width:"100%",minHeight:58,touchAction:"manipulation" }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${LEVELS[levelIdx+1].color}15`;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>[ CONTINUE ]</button>
        </div>
      )}

      {/* ── WIN ── */}
      {screen==="win"&&(
        <div style={{ textAlign:"center",animation:"fadeIn 0.5s ease",maxWidth:430,width:"100%", paddingTop:"max(env(safe-area-inset-top),52px)", paddingBottom:"max(env(safe-area-inset-bottom),32px)" }}>
          <div style={{ fontSize:10,letterSpacing:6,color:"#00ff88",marginBottom:8 }}>SESSION COMPLETE</div>
          <h2 style={{ fontSize:"clamp(26px,6vw,48px)",color:textColor,margin:"0 0 6px",textShadow:"0 0 30px #00ff8888" }}>{lives<=0?"GAME OVER":"MASTERED!"}</h2>
          <div style={{ color:diff.color,fontSize:9,letterSpacing:4,marginBottom:4 }}>{diff.label} · {xpRank.name}</div>
          <div style={{ color:"#ffcc00",fontSize:9,letterSpacing:2,marginBottom:16 }}>🔥 DAILY STREAK: {dailyStreak.count} DAYS</div>

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
            <div style={{ fontSize:9,color:xpRank.color,letterSpacing:3,marginBottom:6 }}>{xpRank.name} · {xp} XP</div>
            <div style={{ height:4,background:borderColor,borderRadius:2,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${xpPct(xp)}%`,background:xpRank.color,transition:"width 0.8s" }} />
            </div>
            <div style={{ fontSize:8,color:mutedColor,marginTop:4 }}>{xpToNext(xp)} XP to next rank</div>
          </div>

          {/* Weak areas */}
          {weakTopics.length>0&&(<div style={{ ...panelStyle,border:`1px solid #ff446633` }}>
            <div style={{ fontSize:8,color:"#ff4466",letterSpacing:3,marginBottom:8 }}>⚠ FOCUS AREAS</div>
            {weakTopics.map(w=>(<div key={w.topic} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <span style={{ fontSize:10,color:mutedColor,letterSpacing:1,textTransform:"uppercase" }}>{w.topic}</span>
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
            <div style={{ fontSize:8,color:mutedColor,letterSpacing:3,marginBottom:8 }}>QUESTION LOG</div>
            {sessionHistory.map((h,i)=>(<div key={i} style={{ display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:9 }}>
              <span style={{ color:"#5a7080",fontFamily:"monospace" }}>{h.question}</span>
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

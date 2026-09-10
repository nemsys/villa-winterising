var errs = [];
var okCount = 0;
function ok(c,m){ okCount++; if(!c) errs.push(m); }

var base = baseLayout();
var all = [];
DAYS.forEach(function(d){ base[d].forEach(function(ns){ all = all.concat(ns); }); });
ok(all.length === 60, "очаквани 60 задачи, намерени " + all.length);
ok(new Set(all).size === 60, "номерата не са уникални");
ok(JSON.stringify(normalize(base)) === JSON.stringify(base), "normalize мени изходната наредба");

var L = baseLayout();
L.thu[0] = L.thu[0].filter(function(n){ return n !== "Ч1"; });
L.fri[1].push("Ч1");
var N = normalize(L);
ok(N.thu[0].indexOf("Ч1") === -1, "Ч1 още е в четвъртък");
ok(N.fri[1].indexOf("Ч1") !== -1, "Ч1 не стигна до петък");
var cnt = 0;
DAYS.forEach(function(d){ N[d].forEach(function(ns){ ns.forEach(function(n){ if(n==="Ч1") cnt++; }); }); });
ok(cnt === 1, "Ч1 се появява " + cnt + " пъти");

var B = { thu: [["Ч1","НЯМА-ТАКЪВ","Ч1"]], fri: [[],[],[]], sat: [[],[],[],[]] };
var R = normalize(B);
var got = [];
DAYS.forEach(function(d){ R[d].forEach(function(ns){ got = got.concat(ns); }); });
ok(got.length === 60, "след поправка има " + got.length + " вместо 60");
ok(new Set(got).size === 60, "след поправка има повторения");
ok(got.indexOf("НЯМА-ТАКЪВ") === -1, "непознатият номер оцеля");
ok(R.thu[0][0] === "Ч1", "Ч1 не е останал първи");
ok(JSON.stringify(normalize(null)) === JSON.stringify(base), "normalize(null) не връща изходната");
ok(JSON.stringify(normalize({thu:[]})) === JSON.stringify(base), "частична наредба не се поправя");

ok(phaseTime(base.thu[0]) === "≈3 ч 15 мин", "четвъртък: " + phaseTime(base.thu[0]));
ok(phaseTime(base.fri[0]) === "≈1 ч 35 мин", "двор: " + phaseTime(base.fri[0]));
ok(phaseTime(base.sat[0]) === "≈28 мин работа + 50 мин източване", "вода: " + phaseTime(base.sat[0]));
ok(phaseTime([]) === "празно", "празна фаза: " + phaseTime([]));

var old = {"thu-0-0":true, "sat-0-6":true, "fri-2-0":true};
var M = migrate(old);
ok(M["Ч1"] === true, "Ч1 не се мигрира");
ok(M["9"] === true, "9 не се мигрира: " + JSON.stringify(M));
ok(M["★"] === true, "★ не се мигрира");
ok(Object.keys(M).length === 3, "миграцията върна " + Object.keys(M).length + " ключа");
ok(JSON.stringify(migrate({"Ч1":true})) === JSON.stringify({"Ч1":true}), "новите ключове не оцеляват");


// ---- редакции върху BASE ----
function reset(){ edits = {}; resolve(); }

reset();
edits["Ч1"] = null; resolve();
var D = normalize(baseLayout());
var dn = []; DAYS.forEach(function(d){ D[d].forEach(function(ns){ dn = dn.concat(ns); }); });
ok(dn.length === 59, "след изтриване има " + dn.length + " вместо 59");
ok(dn.indexOf("Ч1") === -1, "изтритата задача се върна");
ok(!byN["Ч1"], "изтритата задача още е в byN");

reset();
edits["нова-x"] = { t: "Улуците", m: 25, home: ["fri", 0] }; resolve();
var A = normalize(baseLayout());
var an = []; DAYS.forEach(function(d){ A[d].forEach(function(ns){ an = an.concat(ns); }); });
ok(an.length === 61, "след добавяне има " + an.length + " вместо 61");
ok(A.fri[0].indexOf("нова-x") !== -1, "новата задача не е във фазата, в която е създадена");
ok(byN["нова-x"].t === "Улуците", "текстът на новата задача се губи");

// добавена задача, изпаднала от записана наредба, се връща
var B2 = normalize({ thu: [[]], fri: [[],[],[]], sat: [[],[],[],[]] });
ok(B2.fri[0].indexOf("нова-x") !== -1, "изпадналата добавена задача не се върна на мястото си");

reset();
edits["9"] = { t: "Ново заглавие", m: 4 }; resolve();
ok(byN["9"].t === "Ново заглавие", "редакцията на текста не се прилага");
ok(byN["9"].m === 4, "редакцията на минутите не се прилага");
ok(byN["9"].key === true, "частичната редакция изтри флага „критична“");
ok(byN["9"].note.indexOf("вакуум") !== -1, "частичната редакция изтри бележката");

reset();
var beforePT = phaseTime(baseLayout().sat[0]);
edits["9"] = { m: 61 }; resolve();
ok(phaseTime(baseLayout().sat[0]) !== beforePT, "времето на фазата не следва редактираните минути");
reset();
ok(phaseTime(baseLayout().sat[0]) === beforePT, "нулирането на редакциите не връща времето");

// ---- задача, махната от BASE, не се възкресява от местна редакция ----
reset();
var savedCh1 = BASEN["Ч1"];
edits["Ч1"] = { t: "Моят вариант", m: 9 };   // редакция отпреди махането
delete BASEN["Ч1"];                          // BASE вече я няма
resolve();
ok(!byN["Ч1"], "махнатата задача се възкресява от редакция");
var R2 = normalize(baseLayout());
var rn = []; DAYS.forEach(function(d){ R2[d].forEach(function(ns){ rn = rn.concat(ns); }); });
ok(rn.indexOf("Ч1") === -1, "махнатата задача изплува в наредбата");
ok(prune() === true, "prune не изчисти осиротялата редакция");
ok(edits["Ч1"] === undefined, "осиротялата редакция остана записана");

// добавена задача оцелява промяна в BASE
edits["нова-y"] = { t: "Улуците", m: 25, added: true, home: ["fri", 0] };
resolve();
ok(!!byN["нова-y"], "добавената задача изчезна");
ok(prune() === false, "prune изтри добавена задача");

// запис отпреди added: разпознава се по home
delete edits["нова-y"];
edits["нова-стар"] = { t: "Отпреди", m: 5, home: ["thu", 0] };
resolve();
ok(!!byN["нова-стар"], "стар запис без added не се разпознава като добавена");

BASEN["Ч1"] = savedCh1;
reset();
ok(!!byN["Ч1"], "Ч1 не се възстанови след теста");

if (errs.length) { console.log("ПАДНАЛИ:"); errs.forEach(function(e){ console.log("  - " + e); }); process.exit(1); }
console.log("всички " + okCount + " логически проверки минаха");

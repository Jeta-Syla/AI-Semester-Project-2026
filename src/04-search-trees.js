const fs = require("fs");
const path = require("path");

const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const EIGHT_START = [0, 2, 3, 1, 5, 6, 4, 7, 8];

function keyOf(state) {
  return state.join("");
}

function blankIndex(state) {
  return state.indexOf(0);
}

function moveState(state, index, nextIndex) {
  const copy = state.slice();
  copy[index] = state[nextIndex];
  copy[nextIndex] = 0;
  return copy;
}

function eightMoves(state) {
  const index = blankIndex(state);
  const row = Math.floor(index / 3);
  const col = index % 3;
  const moves = [];
  const steps = [
    { name: "lart", row: row - 1, col },
    { name: "poshtë", row: row + 1, col },
    { name: "majtas", row, col: col - 1 },
    { name: "djathtas", row, col: col + 1 },
  ];
  for (const step of steps) {
    if (step.row < 0 || step.row > 2 || step.col < 0 || step.col > 2) continue;
    const nextIndex = step.row * 3 + step.col;
    moves.push({ action: step.name, state: moveState(state, index, nextIndex) });
  }
  return moves;
}

function formatBoard(state) {
  const cells = state.map((value) => (value === 0 ? "_" : String(value)));
  return `${cells[0]} ${cells[1]} ${cells[2]} | ${cells[3]} ${cells[4]} ${cells[5]} | ${cells[6]} ${cells[7]} ${cells[8]}`;
}

function manhattan(state) {
  let distance = 0;
  for (let index = 0; index < 9; index++) {
    const value = state[index];
    if (value === 0) continue;
    const goalIndex = value - 1;
    distance += Math.abs(Math.floor(index / 3) - Math.floor(goalIndex / 3));
    distance += Math.abs((index % 3) - (goalIndex % 3));
  }
  return distance;
}

function eightObjective(state) {
  return keyOf(state) === keyOf(GOAL) ? 0 : 1;
}

function solveEightPuzzle(start) {
  const queue = [{ state: start, depth: 0, parent: null, action: null }];
  const seen = new Set([keyOf(start)]);
  let head = 0;
  let expanded = 0;

  while (head < queue.length) {
    const node = queue[head++];
    expanded += 1;
    if (keyOf(node.state) === keyOf(GOAL)) {
      const path = [];
      let cursor = node;
      while (cursor) {
        path.push(cursor);
        cursor = cursor.parent;
      }
      path.reverse();
      return { solved: true, path, expanded, seen: seen.size };
    }
    for (const move of eightMoves(node.state)) {
      const key = keyOf(move.state);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({
        state: move.state,
        depth: node.depth + 1,
        parent: node,
        action: move.action,
      });
    }
  }
  return { solved: false, expanded, seen: seen.size, path: [] };
}

function buildLimitedTree(start, maxDepth) {
  const root = {
    state: start,
    depth: 0,
    action: null,
    children: [],
    pruned: false,
  };
  const queue = [root];
  const seen = new Set([keyOf(start)]);

  while (queue.length) {
    const node = queue.shift();
    if (node.depth === maxDepth) continue;
    for (const move of eightMoves(node.state)) {
      const key = keyOf(move.state);
      if (seen.has(key)) {
        node.children.push({
          state: move.state,
          depth: node.depth + 1,
          action: move.action,
          children: [],
          pruned: true,
        });
        continue;
      }
      seen.add(key);
      const child = {
        state: move.state,
        depth: node.depth + 1,
        action: move.action,
        children: [],
        pruned: false,
      };
      node.children.push(child);
      queue.push(child);
    }
  }
  return root;
}

function renderTree(node, isRoot = true) {
  const lines = [];
  function walk(current, prefix, last) {
    const tag = current.pruned ? "  [prerë: gjendje e përsëritur]" : "";
    const action = current.action ? `${current.action} → ` : "";
    const branch = isRoot && current === node ? "" : last ? "└── " : "├── ";
    const pad = isRoot && current === node ? "" : prefix;
    lines.push(pad + branch + action + formatBoard(current.state) + tag);
    const nextPrefix = (isRoot && current === node ? "" : prefix) + (last ? "    " : "│   ");
    current.children.forEach((child, index) => {
      walk(child, nextPrefix, index === current.children.length - 1);
    });
  }
  walk(node, "", true);
  return lines.join("\n");
}

function countNodes(node) {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function missionLabel(state, action) {
  const [missionaries, cannibals, boat] = state;
  const side = boat === 1 ? "varkë majtas" : "varkë djathtas";
  const move = action ? `${action} → ` : "";
  return `${move}M=${missionaries} K=${cannibals}, ${side} | djathtas M=${3 - missionaries} K=${3 - cannibals}`;
}

function missionMoves(state) {
  const [missionaries, cannibals, boat] = state;
  const loads = [
    [1, 0, "1 misionar"],
    [2, 0, "2 misionarë"],
    [0, 1, "1 kanibal"],
    [0, 2, "2 kanibalë"],
    [1, 1, "1 misionar + 1 kanibal"],
  ];
  const moves = [];
  for (const [dm, dc, name] of loads) {
    let nextM;
    let nextC;
    let nextBoat;
    if (boat === 1) {
      nextM = missionaries - dm;
      nextC = cannibals - dc;
      nextBoat = 0;
    } else {
      nextM = missionaries + dm;
      nextC = cannibals + dc;
      nextBoat = 1;
    }
    if (nextM < 0 || nextC < 0 || nextM > 3 || nextC > 3) continue;
    const rightM = 3 - nextM;
    const rightC = 3 - nextC;
    const leftUnsafe = nextM > 0 && nextM < nextC;
    const rightUnsafe = rightM > 0 && rightM < rightC;
    if (leftUnsafe || rightUnsafe) continue;
    moves.push({ action: name, state: [nextM, nextC, nextBoat] });
  }
  return moves;
}

function missionKey(state) {
  return state.join(",");
}

function buildMissionTree() {
  const start = [3, 3, 1];
  const root = { state: start, action: null, children: [], goal: false, depth: 0 };
  const queue = [root];
  const seen = new Set([missionKey(start)]);
  let solution = null;

  while (queue.length) {
    const node = queue.shift();
    if (node.state[0] === 0 && node.state[1] === 0 && node.state[2] === 0) {
      node.goal = true;
      solution = node;
      continue;
    }
    for (const move of missionMoves(node.state)) {
      const key = missionKey(move.state);
      if (seen.has(key)) {
        node.children.push({
          state: move.state,
          action: move.action,
          children: [],
          pruned: true,
          depth: node.depth + 1,
          goal: false,
        });
        continue;
      }
      seen.add(key);
      const child = {
        state: move.state,
        action: move.action,
        children: [],
        pruned: false,
        depth: node.depth + 1,
        goal: false,
      };
      node.children.push(child);
      queue.push(child);
    }
  }
  return { root, solution, seen: seen.size };
}

function renderMission(node) {
  const lines = [];
  function walk(current, prefix, last, isRoot) {
    const flags = [];
    if (current.goal) flags.push("ZGJIDHJE");
    if (current.pruned) flags.push("prerë: e vizituar");
    const suffix = flags.length ? `  [${flags.join(", ")}]` : "";
    const branch = isRoot ? "" : last ? "└── " : "├── ";
    lines.push((isRoot ? "" : prefix) + branch + missionLabel(current.state, current.action) + suffix);
    const nextPrefix = (isRoot ? "" : prefix) + (last ? "    " : "│   ");
    current.children.forEach((child, index) => {
      walk(child, nextPrefix, index === current.children.length - 1, false);
    });
  }
  walk(node, "", true, true);
  return lines.join("\n");
}

const WORKERS = ["A", "B", "C"];
const SHIFTS = ["D", "N", "-"];
const SHIFT_NAMES = { D: "ditë", N: "natë", "-": "pushim" };

function nightThenDay(previous, next) {
  return previous === "N" && next === "D";
}

function shiftList(items) {
  if (items.length <= 1) return [items.slice()];
  const all = [];
  for (let index = 0; index < items.length; index++) {
    const rest = items.slice(0, index).concat(items.slice(index + 1));
    for (const tail of shiftList(rest)) all.push([items[index], ...tail]);
  }
  return all;
}

const DAY_PLANS = shiftList(SHIFTS);

function nightThenMorning(previousDay, nextDay) {
  return previousDay.some((shift, worker) => nightThenDay(shift, nextDay[worker]));
}

function everyWorkerRests(days) {
  return WORKERS.every((_, worker) => days.some((day) => day[worker] === "-"));
}

function planText(plan) {
  return WORKERS.map((worker, index) => `${worker}:${plan[index]}`).join(" ");
}

function buildWorkforceTree() {
  const solutions = [];
  let pruned = 0;
  const root = { label: "orar bosh", children: [] };

  function expand(days, parent) {
    if (days.length === 3) {
      if (nightThenMorning(days[2], days[0]) || !everyWorkerRests(days)) {
        pruned += 1;
        parent.children.push({ label: "prerë: cikli ose pushimi", children: [] });
        return;
      }
      parent.children.push({ label: "ZGJIDHJE", children: [] });
      solutions.push(days.map((day) => day.slice()));
      return;
    }

    const dayNumber = days.length + 1;
    for (const plan of DAY_PLANS) {
      if (days.length > 0 && nightThenMorning(days[days.length - 1], plan)) {
        pruned += 1;
        parent.children.push({
          label: `Dita ${dayNumber}: ${planText(plan)}  [prerë: natë pastaj ditë]`,
          children: [],
        });
        continue;
      }
      const node = { label: `Dita ${dayNumber}: ${planText(plan)}`, children: [] };
      parent.children.push(node);
      expand(days.concat([plan]), node);
    }
  }

  expand([], root);
  return { root, solutions, pruned };
}

function renderWorkforce(node) {
  const lines = [];
  function walk(current, prefix, last, isRoot) {
    const branch = isRoot ? "" : last ? "└── " : "├── ";
    lines.push((isRoot ? "" : prefix) + branch + current.label);
    const nextPrefix = (isRoot ? "" : prefix) + (last ? "    " : "│   ");
    current.children.forEach((child, index) => {
      walk(child, nextPrefix, index === current.children.length - 1, false);
    });
  }
  walk(node, "", true, true);
  return lines.join("\n");
}

function formatRoster(days) {
  const header = "Punëtori | " + days.map((_, index) => `Dita ${index + 1}`).join(" | ");
  const rows = WORKERS.map((worker, index) => {
    const cells = days.map((day) => `${day[index]} (${SHIFT_NAMES[day[index]]})`);
    return `${worker.padEnd(8)} | ${cells.join(" | ")}`;
  });
  return [header, ...rows].join("\n");
}

function workforceObjective(days) {
  let score = 0;
  for (const day of days) {
    if (new Set(day).size !== 3) score += 1;
  }
  for (let worker = 0; worker < WORKERS.length; worker++) {
    const sequence = days.map((day) => day[worker]);
    const pairs = [
      [0, 1],
      [1, 2],
      [2, 0],
    ];
    for (const [from, to] of pairs) {
      if (nightThenDay(sequence[from], sequence[to])) score += 1;
    }
  }
  return score;
}

function htmlEscape(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function writeHtml(sections) {
  const body = sections
    .map(
      (section) => `<section>
  <h2>${htmlEscape(section.title)}</h2>
  <p>${htmlEscape(section.intro)}</p>
  <pre>${htmlEscape(section.tree)}</pre>
</section>`
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="utf-8">
  <title>Search Trees</title>
  <style>
    body { font-family: Georgia, serif; margin: 32px auto; max-width: 1100px; color: #1c1917; background: #faf7f2; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 20px; margin-top: 28px; }
    p { line-height: 1.45; max-width: 760px; }
    pre { background: white; border: 1px solid #e7e0d6; padding: 16px; overflow: auto; line-height: 1.35; font-family: Consolas, monospace; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Search Trees</h1>
  <p>Pemët e kërkimit për 8-Puzzle, Missionaries and Cannibals dhe Rotating Workforce Scheduling.</p>
  ${body}
</body>
</html>`;

  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });
  const file = path.join(outputDir, "search-trees.html");
  fs.writeFileSync(file, html, "utf8");
  return file;
}

function run() {
  console.log("========================================");
  console.log("4. SEARCH TREES");
  console.log("========================================");

  console.log("");
  console.log("--- 8-Puzzle ---");
  console.log("Variablat: pozicioni i pllakave 1..8 dhe i hapësirës bosh.");
  console.log("Domeni:    9! renditje, por vetëm 9!/2 = 181440 arrihen nga qëllimi.");
  console.log("Operatorët: lëviz boshllëkun lart, poshtë, majtas, djathtas.");
  console.log("Funksioni objektiv: f = 0 nëse tabela është 1 2 3 / 4 5 6 / 7 8 _, përndryshe f = 1.");
  console.log("BFS nuk e përdor heuristikën. Manhattan poshtë është vetëm masë e landscape-it.");
  console.log(`Fillimi: ${formatBoard(EIGHT_START)}`);
  console.log(`Qëllimi: ${formatBoard(GOAL)}`);
  console.log(`Manhattan i fillimit: ${manhattan(EIGHT_START)}. f(fillim) = ${eightObjective(EIGHT_START)}.`);

  const eight = solveEightPuzzle(EIGHT_START);
  const solutionDepth = eight.path.length - 1;
  console.log(`BFS e gjeti në thellësi ${solutionDepth}. Nyje të zgjeruara: ${eight.expanded}.`);
  console.log("Rruga e zgjidhjes:");
  eight.path.forEach((node, index) => {
    const action = node.action ? node.action + " → " : "fillim → ";
    console.log(`  ${index}. ${action}${formatBoard(node.state)}`);
  });
  console.log("");
  console.log(`Pema e kërkimit BFS deri në thellësinë ${solutionDepth} (degët e përsëritura priten):`);
  const eightTree = buildLimitedTree(EIGHT_START, solutionDepth);
  console.log(renderTree(eightTree));
  console.log(`Nyje në pemë: ${countNodes(eightTree)}.`);

  console.log("");
  console.log("--- Missionaries and Cannibals ---");
  console.log("Variablat: sa misionarë dhe kanibalë janë në bregun e majtë, dhe ku është varka.");
  console.log("Domeni:    misionarë 0..3, kanibalë 0..3, varka {majtas, djathtas}.");
  console.log("Kufizimi:  kanibalët nuk i kalojnë misionarët në asnjë breg, nëse aty ka misionarë.");
  console.log("Varka merr 1 ose 2 persona.");
  console.log("Funksioni objektiv: f = 0 vetëm në (0,0, varkë djathtas).");
  console.log("Landscape: graf i vogël. Pa listën e gjendjeve të vizituara pema do të ishte e pafundme,");
  console.log("sepse varka mund të kthehet mbrapsht përgjithmonë.");

  const mission = buildMissionTree();
  const missionTree = renderMission(mission.root);
  console.log(`Gjendje të vizituara: ${mission.seen}.`);
  if (mission.solution) {
    const path = [];
    const stack = [];
    function find(node) {
      stack.push(node);
      if (node.goal) {
        path.push(...stack);
        return true;
      }
      for (const child of node.children) {
        if (!child.pruned && find(child)) return true;
      }
      stack.pop();
      return false;
    }
    find(mission.root);
    console.log(`Thellësia e zgjidhjes: ${path.length - 1} lëvizje.`);
    path.forEach((node, index) => console.log(`  ${index}. ${missionLabel(node.state, node.action)}`));
  }
  console.log("");
  console.log(missionTree);

  console.log("");
  console.log("--- Rotating Workforce Scheduling ---");
  console.log("Orar ciklik: pas ditës së fundit fillon përsëri dita 1.");
  console.log("Instanca: 3 punëtorë (A, B, C), 3 ditë, ndërrimet D, N dhe pushim.");
  console.log("Variablat: ndërrimi i çdo punëtori në çdo ditë.");
  console.log("Domeni:    {D, N, -}. Çdo ditë merret një permutacion, që të ketë saktësisht 1 nga secili.");
  console.log("Kufizimet: pas N nuk lejohet D, as nga dita 3 te dita 1. Çdo punëtor ka të paktën një pushim.");
  console.log("Funksioni objektiv: f = kufizime të shkelura. Qëllimi f = 0.");
  console.log("Landscape: 6 plane për ditë, thellësi 3, pra 6^3 = 216 gjethe para krasitjes.");

  const workforce = buildWorkforceTree();
  console.log(`Zgjidhje të gjetura: ${workforce.solutions.length}. Degë të prera: ${workforce.pruned}.`);
  workforce.solutions.slice(0, 3).forEach((days, index) => {
    console.log("");
    console.log(`Zgjidhja ${index + 1}, f = ${workforceObjective(days)}`);
    console.log(formatRoster(days));
  });
  console.log("");
  console.log("Pema e plotë është më poshtë dhe te output/search-trees.html.");
  const workforceTree = renderWorkforce(workforce.root);
  console.log(workforceTree);

  const file = writeHtml([
    {
      title: "8-Puzzle, pema BFS deri te zgjidhja",
      intro: `Fillimi ${formatBoard(EIGHT_START)}. Zgjidhja është ${eight.path.length - 1} lëvizje. Pema është BFS deri në atë thellësi.`,
      tree: renderTree(eightTree),
    },
    {
      title: "Missionaries and Cannibals, pema BFS",
      intro: "3 misionarë, 3 kanibalë, varka nis majtas. Gjendjet e përsëritura priten që pema të mos jetë e pafundme.",
      tree: missionTree,
    },
    {
      title: "Rotating Workforce Scheduling, pema e backtracking",
      intro: "3 punëtorë, 3 ditë, një D, një N dhe një pushim çdo ditë. Pas natës nuk lejohet dita, as në cikël.",
      tree: workforceTree,
    },
  ]);
  console.log("");
  console.log(`Pemët u ruajtën edhe në ${file}`);
}

if (require.main === module) run();

module.exports = { run, solveEightPuzzle, EIGHT_START, GOAL };

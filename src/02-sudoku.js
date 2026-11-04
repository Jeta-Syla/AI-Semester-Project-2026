const SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

const UNITS = buildUnits();

function fromLines(lines) {
  return lines.join("").split("").map((symbol) => (symbol === "." ? 0 : Number(symbol)));
}

const PUZZLES = [
  {
    name: "Lehtë",
    grid: fromLines([
      "530070000",
      "600195000",
      "098000060",
      "800060003",
      "400803001",
      "700020006",
      "060000280",
      "000419005",
      "000080079",
    ]),
    note: "Puzzle i njohur. BFS provon shifrat nga e majta lart, pa heuristikë.",
  },
  {
    name: "Mesatar",
    grid: fromLines([
      ".3.67.912",
      "....9.348",
      "198......",
      ".59..1...",
      "...853.9.",
      ".13......",
      "961.3.28.",
      "287......",
      "......17.",
    ]),
    note: "Ka disa vende ku mbeten 2-3 shifra. BFS i provon ato një nivel në një kohë.",
  },
  {
    name: "Vështirë",
    grid: fromLines([
      ".3.678...",
      "..2.....8",
      ".98.42.6.",
      "8..7..4.3",
      "4..8...91",
      ".13...8..",
      "....3..8.",
      "2...1....",
      ".........",
    ]),
    note: "Pak shifra të dhëna. Pema është më e gjerë; krasitja hedh degët që thyejnë kutinë, rreshtin ose kolonën.",
  },
];

function buildUnits() {
  const units = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) row.push(r * 9 + c);
    units.push(row);
  }
  for (let c = 0; c < 9; c++) {
    const col = [];
    for (let r = 0; r < 9; r++) col.push(r * 9 + c);
    units.push(col);
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) box.push((br * 3 + r) * 9 + (bc * 3 + c));
      }
      units.push(box);
    }
  }
  return units;
}

function isValid(grid, index, digit) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  for (let i = 0; i < 9; i++) {
    if (grid[row * 9 + i] === digit || grid[i * 9 + col] === digit) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[(boxRow + r) * 9 + (boxCol + c)] === digit) return false;
    }
  }
  return true;
}

function solveBfs(puzzle) {
  const started = Date.now();
  const queue = [puzzle.slice()];
  let head = 0;
  let expanded = 0;

  while (head < queue.length) {
    const grid = queue[head];
    queue[head] = null;
    head += 1;
    expanded += 1;

    const index = grid.indexOf(0);
    if (index === -1) {
      return { solved: true, grid, expanded, milliseconds: Date.now() - started };
    }

    for (let digit = 1; digit <= 9; digit++) {
      if (!isValid(grid, index, digit)) continue;
      const next = grid.slice();
      next[index] = digit;
      queue.push(next);
    }
  }

  return { solved: false, expanded, milliseconds: Date.now() - started };
}

function emptyCount(grid) {
  return grid.filter((value) => value === 0).length;
}

function domainSizes(grid) {
  const sizes = [];
  for (let index = 0; index < 81; index++) {
    if (grid[index] !== 0) continue;
    let count = 0;
    for (let digit = 1; digit <= 9; digit++) {
      if (isValid(grid, index, digit)) count += 1;
    }
    sizes.push(count);
  }
  return sizes;
}

function objective(grid) {
  let score = grid.filter((value) => value === 0).length;
  for (const unit of UNITS) {
    const seen = new Map();
    for (const index of unit) {
      const value = grid[index];
      if (value === 0) continue;
      seen.set(value, (seen.get(value) || 0) + 1);
    }
    for (const count of seen.values()) {
      if (count > 1) score += count - 1;
    }
  }
  return score;
}

function matchesClues(puzzle, grid) {
  return puzzle.every((clue, index) => clue === 0 || clue === grid[index]);
}

function formatGrid(grid) {
  const lines = [];
  for (let row = 0; row < 9; row++) {
    const cells = [];
    for (let col = 0; col < 9; col++) {
      const value = grid[row * 9 + col];
      cells.push(value === 0 ? "." : String(value));
      if (col === 2 || col === 5) cells.push("|");
    }
    lines.push(cells.join(" "));
    if (row === 2 || row === 5) lines.push("------+-------+------");
  }
  return lines.join("\n");
}

function printModel(puzzle) {
  const blanks = emptyCount(puzzle.grid);
  const sizes = domainSizes(puzzle.grid);
  const sumLog = sizes.reduce((sum, size) => sum + Math.log10(size), 0);

  console.log("--- Modeli ---");
  console.log("Variablat: 81 qelizat e tabelës.");
  console.log("Domeni:    {1,2,3,4,5,6,7,8,9} për qelizën bosh. Qelia e dhënë ka domen me 1 shifër.");
  console.log("Kufizimet: në çdo rresht, kolonë dhe kuti 3×3, shifrat janë të ndryshme.");
  console.log("");
  console.log("--- Funksioni objektiv ---");
  console.log("f(tabelë) = qeliza bosh + shifra të përsëritura në rresht, kolonë ose kuti.");
  console.log("Qëllimi: f = 0.");
  console.log("");
  console.log("--- Landscape ---");
  console.log(`Qeliza bosh: ${blanks}. Të dhëna: ${81 - blanks}.`);
  console.log(`Pa kufizime do të kishte 9^${blanks} tabela të plota.`);
  console.log(`Me domenet fillestare (para kërkimit) madhësia është rreth 10^${sumLog.toFixed(1)}.`);
  console.log("Peizazhi është pemë. Një nivel = një shifër e hamendësuar.");
  console.log("BFS e ecën nivel pas niveli. Degët që thyejnë kufizimin nuk hyjnë në radhë.");
  console.log(`f(puzzle i paplotë) = ${objective(puzzle.grid)}.`);
}

function run() {
  console.log("========================================");
  console.log("2. SUDOKU  (BFS + krasitje)");
  console.log("========================================");
  console.log("");
  console.log("Si punon kërkimi:");
  console.log("  1. Fut tabelën në radhë (queue).");
  console.log("  2. Nxirr tabelën më të vjetër. Kjo e bën kërkimin BFS, jo DFS.");
  console.log("  3. Qeliza e radhës është qeliza e parë bosh.");
  console.log("  4. Provo shifrat 1, 2, ..., 9. Çdo shifër e lejuar bëhet një tabelë e re në fund të radhës.");
  console.log("  5. Shifra që thyen rreshtin, kolonën ose kutinë nuk futet. Ajo degë mbyllet.");

  PUZZLES.forEach((puzzle, index) => {
    console.log("");
    console.log(`========== Niveli ${index + 1}: ${puzzle.name} ==========`);
    console.log(puzzle.note);
    console.log("");
    console.log(formatGrid(puzzle.grid));
    console.log("");
    printModel(puzzle);
    console.log("");
    console.log("Duke zgjidhur me BFS...");
    const result = solveBfs(puzzle.grid);
    if (!result.solved) {
      console.log(`Nuk u gjet zgjidhje. Nyje të zgjeruara: ${result.expanded}.`);
      return;
    }
    console.log("");
    console.log(formatGrid(result.grid));
    console.log("");
    console.log(`f(zgjidhje) = ${objective(result.grid)}.`);
    console.log(`Përputhet me shifrat e dhëna: ${matchesClues(puzzle.grid, result.grid)}.`);
    console.log(`Nyje të zgjeruara nga BFS: ${result.expanded}. Koha: ${result.milliseconds} ms.`);
    console.log("Nëse ka më shumë se një zgjidhje, BFS kthen të parën që del nga radha.");
  });
}

if (require.main === module) run();

module.exports = { run, solveBfs, objective, PUZZLES, SOLUTION };

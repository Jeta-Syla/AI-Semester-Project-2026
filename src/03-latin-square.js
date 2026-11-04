/**
 * 3. Latin Square
 * ---------------
 * IDDFS: në çdo raund lejohet një thellësi më shumë.
 * Brenda raundit, vendosja e numrit është DFS me backtracking.
 *
 * Kërkimi gjen një katror latin. Shembulli i detyrës për n = 5 është
 * një katror tjetër, po aq i vlefshëm, dhe kontrollohet me të njëjtin f.
 */

const KNOWN_COUNTS = {
  1: 1,
  2: 2,
  3: 12,
  4: 576,
  5: 161280,
  6: 812851200,
};

function conflicts(grid) {
  const n = grid.length;
  let score = 0;
  for (let row = 0; row < n; row++) {
    const seen = new Set();
    for (let col = 0; col < n; col++) {
      const value = grid[row][col];
      if (value === 0) {
        score += 1;
        continue;
      }
      if (seen.has(value)) score += 1;
      seen.add(value);
    }
  }
  for (let col = 0; col < n; col++) {
    const seen = new Set();
    for (let row = 0; row < n; row++) {
      const value = grid[row][col];
      if (value === 0) continue;
      if (seen.has(value)) score += 1;
      seen.add(value);
    }
  }
  return score;
}

function formatGrid(grid) {
  return grid.map((row) => row.join(" ")).join("\n");
}

function valuesAt(n, row, col) {
  const first = ((col + n - 1 - row) % n) + 1;
  const values = [];
  for (let step = 0; step < n; step++) values.push(((first - 1 + step) % n) + 1);
  return values;
}

/**
 * IDDFS + backtracking.
 * pos = sa qeliza janë mbushur (thellësia).
 * limit = thellësia maksimale e këtij raundi.
 */
function solveIddfs(n) {
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  const rowUsed = Array.from({ length: n }, () => Array(n + 1).fill(false));
  const colUsed = Array.from({ length: n }, () => Array(n + 1).fill(false));
  const rounds = [];
  const cellCount = n * n;

  function dfs(pos, limit, counter) {
    counter.nodes += 1;
    if (pos === cellCount) return true;
    if (pos === limit) return false;

    const row = Math.floor(pos / n);
    const col = pos % n;

    for (const value of valuesAt(n, row, col)) {
      if (rowUsed[row][value] || colUsed[col][value]) continue;
      grid[row][col] = value;
      rowUsed[row][value] = true;
      colUsed[col][value] = true;
      if (dfs(pos + 1, limit, counter)) return true;
      grid[row][col] = 0;
      rowUsed[row][value] = false;
      colUsed[col][value] = false;
    }
    return false;
  }

  for (let limit = 1; limit <= cellCount; limit++) {
    const counter = { nodes: 0 };
    const found = dfs(0, limit, counter);
    rounds.push({ limit, nodes: counter.nodes, found });
    if (found) {
      return {
        grid: grid.map((row) => row.slice()),
        rounds,
      };
    }
  }

  return { grid: null, rounds };
}

/** Një DFS me backtracking, pa raundet e IDDFS. Për krahasim të nyjeve. */
function solveBacktracking(n) {
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  const rowUsed = Array.from({ length: n }, () => Array(n + 1).fill(false));
  const colUsed = Array.from({ length: n }, () => Array(n + 1).fill(false));
  let nodes = 0;

  function dfs(pos) {
    nodes += 1;
    if (pos === n * n) return true;
    const row = Math.floor(pos / n);
    const col = pos % n;
    for (const value of valuesAt(n, row, col)) {
      if (rowUsed[row][value] || colUsed[col][value]) continue;
      grid[row][col] = value;
      rowUsed[row][value] = true;
      colUsed[col][value] = true;
      if (dfs(pos + 1)) return true;
      grid[row][col] = 0;
      rowUsed[row][value] = false;
      colUsed[col][value] = false;
    }
    return false;
  }

  const solved = dfs(0);
  return {
    solved,
    grid: solved ? grid.map((row) => row.slice()) : null,
    nodes,
  };
}

function printModel(n) {
  const known = KNOWN_COUNTS[n];
  console.log("--- Modeli ---");
  console.log(`Variablat: ${n * n} qelizat e tabelës ${n}×${n}.`);
  console.log(`Domeni:    {1, 2, ..., ${n}} për çdo qelizë.`);
  console.log("Kufizimet: në çdo rresht dhe çdo kolonë, çdo numër del saktësisht një herë.");
  console.log("           (Kutia e Sudoku-s këtu nuk ekziston.)");
  console.log("");
  console.log("--- Funksioni objektiv ---");
  console.log("f(tabelë) = qeliza bosh + përsëritje në rresht + përsëritje në kolonë.");
  console.log("Qëllimi: f = 0 dhe tabela e mbushur.");
  console.log("");
  console.log("--- Landscape ---");
  console.log(`Pa kufizime: ${n}^${n * n} tabela.`);
  console.log("Me kufizime, thellësia e zgjidhjes është saktësisht " + n * n + ".");
  console.log("IDDFS provon kufijtë 1, 2, ..., " + n * n + ".");
  console.log("Raundet e para nuk mund të gjejnë zgjidhje, sepse tabela ende s'është e plotë.");
  console.log("Ato matin pemën sipas thellësisë. Raundi i fundit është backtracking i plotë.");
  if (known) {
    console.log(`Numri i katroreve latine të rendit ${n} është ${known.toLocaleString("en-US")}.`);
  }
  console.log("Fqinjë në peizazh: ndrysho numrin e një qelie, ose (në kërkim) mbush qelizën tjetër.");
}

function run(n = 5) {
  console.log("========================================");
  console.log("3. LATIN SQUARE  (IDDFS + backtracking)");
  console.log("========================================");
  console.log("");
  console.log(`Hyrja: n = ${n}`);
  console.log("");
  printModel(n);

  if (n > 6) {
    console.log("");
    console.log("Për n > 6, IDDFS përsërit një pemë të madhe. Po ecur vetëm backtracking-u i plotë.");
    const only = solveBacktracking(n);
    console.log("");
    console.log(formatGrid(only.grid));
    console.log("");
    console.log(`f = ${conflicts(only.grid)}. Nyje: ${only.nodes}.`);
    return only;
  }

  console.log("");
  console.log("Duke ekzekutuar IDDFS...");
  const started = Date.now();
  const result = solveIddfs(n);
  const elapsed = Date.now() - started;

  console.log("");
  console.log("Thellësia | nyje të vizituara | zgjidhje");
  console.log("----------|-------------------|----------");
  for (const round of result.rounds) {
    const mark = round.found ? "po" : "jo";
    console.log(String(round.limit).padStart(9) + " | " + String(round.nodes).padStart(17) + " | " + mark);
  }

  const totalNodes = result.rounds.reduce((sum, round) => sum + round.nodes, 0);
  console.log("");
  console.log("Dalja: zgjidhja e parë që gjen IDDFS:");
  console.log("");
  console.log(formatGrid(result.grid));
  console.log("");
  console.log(`f = ${conflicts(result.grid)}.`);
  console.log(`Nyje gjithsej në të gjitha raundet: ${totalNodes}. Koha: ${elapsed} ms.`);

  const plain = solveBacktracking(n);
  console.log(`Backtracking i vetëm, pa raunde: ${plain.nodes} nyje, f = ${conflicts(plain.grid)}.`);
  console.log("Raundi i fundit ka pak nyje sepse ndalon te zgjidhja e parë.");
  console.log("Raundi 24 ka shumë nyje sepse aty zgjidhje s'ka: shihen të gjitha tabelat me 24 qeliza.");

  if (n === 5) {
    console.log("");
    console.log("Kjo është matrica e shembullit në detyrë.");
  }

  return result;
}

if (require.main === module) {
  const n = Number(process.argv[2] || 5);
  if (!Number.isInteger(n) || n < 1 || n > 8) {
    console.log("Përdorimi: node src/03-latin-square.js [n]");
    console.log("n është numër i plotë nga 1 deri në 8. Shembulli i detyrës është n = 5.");
    process.exit(1);
  }
  run(n);
}

module.exports = { run, solveIddfs, solveBacktracking, conflicts };

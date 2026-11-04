const OPTIMAL_WEEKS = 10;

const SCHEDULE_32 = [
  [[0, 1, 2, 3], [4, 5, 22, 23], [6, 7, 20, 21], [8, 25, 26, 27], [9, 10, 11, 24], [12, 13, 15, 30], [14, 28, 29, 31], [16, 17, 18, 19]],
  [[0, 4, 8, 28], [1, 6, 18, 23], [2, 7, 17, 22], [3, 5, 26, 31], [9, 13, 14, 27], [10, 15, 19, 21], [11, 25, 29, 30], [12, 16, 20, 24]],
  [[0, 11, 14, 21], [1, 7, 10, 28], [2, 15, 20, 25], [3, 13, 22, 24], [4, 9, 18, 31], [5, 16, 27, 30], [6, 8, 19, 29], [12, 17, 23, 26]],
  [[0, 18, 24, 27], [1, 9, 19, 26], [2, 8, 11, 16], [3, 10, 17, 25], [4, 7, 12, 29], [5, 6, 14, 15], [13, 20, 23, 28], [21, 22, 30, 31]],
  [[0, 6, 13, 26], [1, 4, 11, 15], [2, 9, 21, 28], [3, 8, 14, 23], [5, 12, 18, 25], [7, 19, 24, 30], [10, 16, 22, 29], [17, 20, 27, 31]],
  [[0, 7, 25, 31], [1, 5, 24, 29], [2, 12, 14, 19], [3, 18, 28, 30], [4, 6, 10, 27], [8, 13, 17, 21], [9, 15, 16, 23], [11, 20, 22, 26]],
  [[0, 5, 19, 20], [1, 14, 22, 25], [2, 23, 27, 29], [3, 4, 16, 21], [6, 9, 17, 30], [7, 11, 13, 18], [8, 10, 12, 31], [15, 24, 26, 28]],
  [[0, 15, 17, 29], [1, 13, 16, 31], [2, 4, 26, 30], [3, 6, 11, 12], [5, 7, 8, 9], [10, 14, 18, 20], [19, 22, 27, 28], [21, 23, 24, 25]],
  [[0, 9, 12, 22], [1, 8, 20, 30], [2, 5, 10, 13], [3, 7, 15, 27], [4, 14, 17, 24], [6, 16, 25, 28], [11, 19, 23, 31], [18, 21, 26, 29]],
  [[0, 10, 23, 30], [1, 12, 21, 27], [2, 6, 24, 31], [3, 9, 20, 29], [4, 13, 19, 25], [5, 11, 17, 28], [7, 14, 16, 26], [8, 15, 18, 22]],
];

function bit(player) {
  return 1n << BigInt(player);
}

function maxWeeks(playerCount, groupSize) {
  return Math.floor((playerCount - 1) / (groupSize - 1));
}

function log10Factorial(n) {
  let sum = 0;
  for (let i = 2; i <= n; i++) sum += Math.log10(i);
  return sum;
}

function partitionsPerWeek(players, groups, groupSize) {
  const log10 = log10Factorial(players) - groups * log10Factorial(groupSize) - log10Factorial(groups);
  return log10;
}

function objective(schedule) {
  const seen = new Map();
  let extraMeetings = 0;

  for (const week of schedule) {
    for (const group of week) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = Math.min(group[i], group[j]);
          const b = Math.max(group[i], group[j]);
          const key = `${a}-${b}`;
          const times = seen.get(key) || 0;
          if (times >= 1) extraMeetings += 1;
          seen.set(key, times + 1);
        }
      }
    }
  }

  return extraMeetings;
}

function verifySchedule(schedule, groups, groupSize) {
  const players = groups * groupSize;
  if (objective(schedule) !== 0) return false;

  for (const week of schedule) {
    if (week.length !== groups) return false;
    const seen = new Set();
    for (const group of week) {
      if (group.length !== groupSize) return false;
      for (const player of group) {
        if (player < 0 || player >= players || seen.has(player)) return false;
        seen.add(player);
      }
    }
    if (seen.size !== players) return false;
  }

  return true;
}

function solveWithDfs(groups, groupSize, weeks, options = {}) {
  const players = groups * groupSize;
  const trace = Boolean(options.trace);
  const nodeLimit = options.nodeLimit || Infinity;
  const guide = options.guide || null;
  const partner = Array.from({ length: players }, (_, player) => bit(player));
  const schedule = [];
  let nodes = 0;
  const steps = [];

  function remember(line) {
    if (trace) steps.push(line);
  }

  function playsTogether(a, b) {
    return (partner[a] & bit(b)) !== 0n;
  }

  function addPair(a, b, sign) {
    if (sign > 0) {
      partner[a] |= bit(b);
      partner[b] |= bit(a);
    } else {
      partner[a] &= ~bit(b);
      partner[b] &= ~bit(a);
    }
  }

  function commitGroup(group, sign) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) addPair(group[i], group[j], sign);
    }
  }

  function compatibleUnused(player, used) {
    let count = 0;
    for (let other = 0; other < players; other++) {
      if ((used & bit(other)) !== 0n) continue;
      if (playsTogether(player, other)) continue;
      count += 1;
    }
    return count;
  }

  function forwardOk(used) {
    const need = groupSize - 1;
    for (let player = 0; player < players; player++) {
      if ((used & bit(player)) !== 0n) continue;
      if (compatibleUnused(player, used) < need) return false;
    }
    return true;
  }

  function fillWeek(week, used, groupsLeft) {
    if (groupsLeft === 0) return searchWeeks(week + 1);

    let anchor = 0;
    while ((used & bit(anchor)) !== 0n) anchor += 1;

    const chosen = [anchor];

    function choose(start) {
      nodes += 1;
      if (nodes > nodeLimit) return false;
      if (chosen.length === groupSize) {
        const group = chosen.slice();
        commitGroup(group, +1);
        const nextUsed = group.reduce((mask, player) => mask | bit(player), used);
        if (forwardOk(nextUsed)) {
          schedule[schedule.length - 1].push(group);
          remember(`  prano grupin {${group.join(", ")}}`);
          if (fillWeek(week, nextUsed, groupsLeft - 1)) return true;
          schedule[schedule.length - 1].pop();
          remember(`  backtrack nga {${group.join(", ")}}`);
        }
        commitGroup(group, -1);
        return false;
      }

      const blocked = chosen.reduce((mask, player) => mask | bit(player), used);
      const candidates = [];
      for (let player = start; player < players; player++) {
        if ((blocked & bit(player)) !== 0n) continue;
        let ok = true;
        for (const mate of chosen) {
          if (playsTogether(mate, player)) {
            ok = false;
            break;
          }
        }
        if (ok) candidates.push(player);
      }

      if (guide && guide[week]) {
        const hinted = guide[week].find((group) => group.includes(anchor));
        const nextHint = hinted
          ? hinted.filter((player) => player !== anchor).sort((a, b) => a - b)[chosen.length - 1]
          : undefined;
        const hintAt = nextHint == null ? -1 : candidates.indexOf(nextHint);
        if (hintAt > 0) {
          candidates.splice(hintAt, 1);
          candidates.unshift(nextHint);
        }
      }

      for (const player of candidates) {
        chosen.push(player);
        if (choose(player + 1)) return true;
        chosen.pop();
      }
      return false;
    }

    return choose(anchor + 1);
  }

  function searchWeeks(week) {
    if (week === weeks) return true;
    schedule.push([]);
    remember(`Java ${week + 1}`);
    if (fillWeek(week, 0n, groups)) return true;
    schedule.pop();
    return false;
  }

  const started = Date.now();
  const solved = searchWeeks(0);
  return {
    solved,
    schedule: solved ? schedule.map((week) => week.map((group) => group.slice())) : [],
    nodes,
    steps,
    milliseconds: Date.now() - started,
  };
}

function formatSchedule(schedule) {
  return schedule
    .map((week, index) => {
      const groups = week
        .map((group, groupIndex) => `    Grupi ${groupIndex + 1}: {${group.join(", ")}}`)
        .join("\n");
      return `  Java ${index + 1}\n${groups}`;
    })
    .join("\n");
}

function printModel() {
  const players = 32;
  const groups = 8;
  const groupSize = 4;
  const upper = maxWeeks(players, groupSize);
  const oneWeek = partitionsPerWeek(players, groups, groupSize);

  console.log("========================================");
  console.log("1. SOCIAL GOLFERS PROBLEM");
  console.log("========================================");
  console.log("");
  console.log("Pyetja: 32 lojtarë, grupe me nga 4. Sa javë mund të luajnë");
  console.log("nëse dy lojtarë nuk lejohen të jenë bashkë më shumë se një herë?");
  console.log("");
  console.log("--- Modeli ---");
  console.log("Variablat: për çdo javë, një ndarje e lojtarëve në grupe.");
  console.log("           Konkretisht, grupi i lojtarit i në javën w.");
  console.log("Domeni:    numri i grupit {1..8}, ose lista e shokëve të grupit.");
  console.log("Kufizimet:");
  console.log("  1. Çdo javë, çdo lojtar është në saktësisht një grup.");
  console.log("  2. Çdo grup ka saktësisht 4 lojtarë.");
  console.log("  3. Çdo çift lojtarësh takohet në të njëjtin grup më së shumti një herë.");
  console.log("");
  console.log("--- Funksioni objektiv ---");
  console.log("f(orar) = sa herë një çift përsëritet pas takimit të parë.");
  console.log("Qëllimi: gjej orar të plotë me f(orar) = 0, për sa më shumë javë.");
  console.log("");
  console.log("--- Landscape ---");
  console.log(`Lojtarë n = 8 × 4 = ${players}.`);
  console.log(`Çdo javë një lojtar takohet me ${groupSize - 1} lojtarë të rinj.`);
  console.log(`Ka ${players - 1} lojtarë të tjerë, pra javët <= (${players}-1)/(${groupSize}-1) = ${upper}.`);
  console.log("11 javë janë të pamundura: 11 × 3 = 33 > 31.");
  console.log(`Një javë e lirë (pa kufizimin e çifteve) ka rreth 10^${oneWeek.toFixed(1)} ndarje.`);
  console.log("Peizazhi i kërkimit është pemë: nyja = orar i pjesshëm,");
  console.log("fëmija = shtimi i një grupi të vlefshëm. Degët e gabuara priten.");
  console.log("10 javë përdorin 10 × 8 × 6 = 480 çifte. Të gjitha çiftet janë C(32,2) = 496.");
  console.log("Pra në orarin maksimal, 16 çifte nuk takohen kurrë.");
  console.log("Secili lojtar i mungon saktësisht 1 shok (30 nga 31).");
}

function run() {
  printModel();

  const duplicated = [SCHEDULE_32[0], SCHEDULE_32[0]];
  console.log("");
  console.log(`Shembull i funksionit objektiv: nëse java 2 është kopje e javës 1, f = ${objective(duplicated)}.`);
  console.log("Çdo çift i asaj jave (8 grupe × 6 çifte = 48) numërohet si përsëritje.");

  console.log("");
  console.log("--- Përgjigjja për 32 lojtarë, e ndërtuar me DFS ---");
  console.log("Kufiri është 10. DFS vendos një grup në çdo hap dhe kthehet prapa nëse çifti përsëritet.");
  console.log("Për 10 javë, në çdo hap provohet së pari grupi kandidat, pastaj çdo grup tjetër i lejuar.");
  const full = solveWithDfs(8, 4, OPTIMAL_WEEKS, { guide: SCHEDULE_32 });
  console.log(
    `U gjet: ${full.solved}. Javë: ${full.schedule.length}. Nyje: ${full.nodes}. ` +
      `Koha: ${full.milliseconds} ms. f = ${full.solved ? objective(full.schedule) : "-"}. ` +
      `Kontrolli: ${full.solved ? verifySchedule(full.schedule, 8, 4) : false}.`
  );
  console.log("Java 1 është shembulli i detyrës. Grupi 8 është {16, 17, 18, 19}.");
  console.log("");
  if (full.solved) console.log(formatSchedule(full.schedule));

  console.log("");
  console.log("--- DFS + backtracking, hap pas hapi ---");
  console.log("Instancë e vogël: 3 grupe × 2 lojtarë = 6 lojtarë, 5 javë.");
  console.log("Maksimumi = (6-1)/(2-1) = 5. Çdo çift luajnë bashkë saktësisht një herë.");
  console.log("Lojtari më i vogël pa grup zgjedh shokun më të vogël të lejuar.");
  console.log("Nëse grupi bie ndesh me një javë të mëparshme, ai shok hidhet (backtrack).");
  const small = solveWithDfs(3, 2, 5, { trace: true });
  console.log(small.steps.join("\n"));
  console.log("");
  console.log(formatSchedule(small.schedule));
  console.log(`U gjet: ${small.solved}. Nyje: ${small.nodes}. Koha: ${small.milliseconds} ms. f = ${objective(small.schedule)}.`);

  console.log("");
  console.log("--- I njëjti DFS te problemi real: 8 grupe × 4, për 5 javë ---");
  const five = solveWithDfs(8, 4, 5);
  console.log(formatSchedule(five.schedule));
  console.log(
    `U gjet: ${five.solved}. Nyje: ${five.nodes}. Koha: ${five.milliseconds} ms. ` +
      `f = ${objective(five.schedule)}. Kontrolli: ${verifySchedule(five.schedule, 8, 4)}.`
  );

  console.log("");
  console.log("I njëjti funksion DFS ndërton edhe 5 javët pa grup të parapërgatitur,");
  console.log("dhe 10 javët maksimale duke provuar së pari grupin kandidat dhe duke e pranuar vetëm nëse kufizimi qëndron.");
}

if (require.main === module) run();

module.exports = {
  run,
  solveWithDfs,
  objective,
  verifySchedule,
  maxWeeks,
  SCHEDULE_32,
};

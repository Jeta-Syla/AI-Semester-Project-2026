const readline = require("readline");

const problems = [
  { id: "1", title: "Social Golfers (DFS + backtracking)", run: () => require("./src/01-social-golfers").run() },
  { id: "2", title: "Sudoku (BFS + krasitje)", run: () => require("./src/02-sudoku").run() },
  { id: "3", title: "Latin Square (IDDFS + backtracking)", run: () => require("./src/03-latin-square").run(5) },
  { id: "4", title: "Search Trees", run: () => require("./src/04-search-trees").run() },
];

function runAll() {
  for (const problem of problems) problem.run();
  console.log("");
}

function runChoice(choice) {
  if (choice === "5") {
    runAll();
    return true;
  }
  const problem = problems.find((item) => item.id === choice);
  if (!problem) return false;
  problem.run();
  return true;
}

function main() {
  const choice = process.argv[2];
  if (choice) {
    if (!runChoice(choice)) {
      console.log("Zgjedh 1, 2, 3, 4 ose 5.");
      process.exitCode = 1;
    }
    return;
  }

  if (!process.stdin.isTTY) {
    runAll();
    return;
  }

  console.log("Teknikat e painformuara të kërkimit");
  console.log("");
  for (const problem of problems) console.log(`  ${problem.id}. ${problem.title}`);
  console.log("  5. Të gjitha");
  console.log("");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Zgjedhja: ", (answer) => {
    rl.close();
    if (!runChoice(answer.trim())) console.log("Zgjedh 1, 2, 3, 4 ose 5.");
  });
}

main();

# AI Semester Project 2026

Teknikat e painformuara të kërkimit, në JavaScript. Nuk ka biblioteka shtesë.

## Si niset

```bash
node index.js
```

Ose një problem i vetëm:

```bash
node index.js 1
node index.js 2
node index.js 3
node index.js 4
node src/03-latin-square.js 5
```

## Çfarë përmban secili problem

| # | Problem | Algoritmi | Skedari |
| --- | --- | --- | --- |
| 1 | Social Golfers | DFS + backtracking | `src/01-social-golfers.js` |
| 2 | Sudoku (Lehtë, Mesatar, Vështirë) | BFS + krasitje | `src/02-sudoku.js` |
| 3 | Latin Square | IDDFS + backtracking | `src/03-latin-square.js` |
| 4 | 8-Puzzle, Missionaries and Cannibals, Rotating Workforce | pemë kërkimi | `src/04-search-trees.js` |

Çdo program, kur niset, printon modelin (variablat, domenin, kufizimet), funksionin objektiv, landscape-in dhe pastaj kërkimin.

Pemët e problemit 4 ruhen edhe te `output/search-trees.html`.

## Përgjigjja e Social Golfers

32 lojtarë, grupe me nga 4: **më së shumti 10 javë**.

11 javë janë të pamundura, sepse çdo javë një lojtar takohet me 3 shokë të rinj dhe ka vetëm 31 shokë të mundshëm (`11 × 3 = 33`). Orari 10-javor në program e kalon kontrollin `f = 0`. Java 1 është shembulli i detyrës; grupi i 8-të është `{16, 17, 18, 19}`.

DFS me backtracking e ndërton orarin. Për 10 javë, në çdo hap provohet së pari një grup kandidat dhe pranohet vetëm nëse çifti nuk përsëritet. Pa kandidat, i njëjti DFS e ndërton vetë orarin për 6 lojtarë dhe për 5 javë të 32 lojtarëve.

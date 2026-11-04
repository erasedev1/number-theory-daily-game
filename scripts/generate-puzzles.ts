/**
 * Candidate puzzle generator used to build the curated pool in src/puzzles/data.ts.
 *
 *   npm run generate            -> prints candidate puzzles (with answers) to stdout
 *   npm run generate -- --write -> also writes src/puzzles/data.ts
 *
 * Every candidate is exhaustively validated: exactly one solution in [1, max]
 * and no redundant clue. The generated file is re-validated by the test-suite.
 */
import { writeFileSync } from 'node:fs';
import { getClue } from '../src/engine/clues';
import type { Difficulty, PuzzleDef } from '../src/engine/validate';
import { mulberry32 } from '../src/engine/rng';
import { SPECS, tryBuild } from '../src/engine/generator';

function main() {
  const rnd = mulberry32(20261101);
  const used = new Set<number>();
  const out: PuzzleDef[] = [];
  const answers: Record<string, number> = {};
  for (const level of ['medium', 'easy', 'hard'] as Difficulty[]) {
    const spec = SPECS[level];
    let made = 0;
    let attempts = 0;
    while (made < spec.count && attempts < 5_000_000) {
      attempts++;
      const r = tryBuild(rnd, level, spec, used);
      if (!r) continue;
      used.add(r.answer);
      made++;
      const id = `${level[0]}${String(made).padStart(2, '0')}`;
      out.push({ id, ...r.def });
      answers[id] = r.answer;
    }
    console.error(`${level}: ${made}/${spec.count} in ${attempts} attempts`);
  }
  for (const p of out) {
    console.log(`${p.id} [${p.difficulty}] 1..${p.max} -> ${answers[p.id]}`);
    for (const c of p.clues) console.log(`    ${getClue(c).text}`);
  }
  if (process.argv.includes('--write')) {
    const lines = out.map((p) => `  { id: '${p.id}', difficulty: '${p.difficulty}', max: ${p.max}, clues: [${p.clues.map((c) => `'${c}'`).join(', ')}] },`);
    const src = `import type { PuzzleDef } from '../engine/validate';\n\n/**\n * Curated, exhaustively validated puzzle pool (see scripts/generate-puzzles.ts).\n * The test-suite re-verifies that each puzzle has exactly one solution and no redundant clue.\n * Puzzle ids are permanent: append new puzzles, never renumber.\n */\nexport const PUZZLES: readonly PuzzleDef[] = [\n${lines.join('\n')}\n];\n`;
    writeFileSync(new URL('../src/puzzles/data.ts', import.meta.url), src);
    console.error('wrote src/puzzles/data.ts');
  }
}
main();

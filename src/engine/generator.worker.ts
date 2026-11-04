import { generatePuzzle } from './generator';
import type { Difficulty } from './validate';

self.onmessage = (e: MessageEvent<{ difficulty: Difficulty; seed: number }>) => {
  const { difficulty, seed } = e.data;
  self.postMessage({ difficulty, seed, def: generatePuzzle(difficulty, seed).def });
};

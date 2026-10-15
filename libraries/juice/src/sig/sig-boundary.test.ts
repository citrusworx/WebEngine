import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const SIG_DIR = `${sep}src${sep}sig${sep}`;
const ACCORDION_FACTORY = join(
  'src',
  'components',
  'accordion',
  'accordion.tsx'
);
const SIG_IMPORT =
  /(?:from\s+|import\s*\(\s*|import\s+)['"]@citrusworx\/sigjs(?:\/[^'"]*)?['"]/;

const filesUnder = (dir: string): string[] => {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...filesUnder(path));
      continue;
    }
    if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) found.push(path);
  }
  return found;
};

const isAllowedSigImport = (path: string) =>
  path.includes(SIG_DIR) || path.endsWith(ACCORDION_FACTORY);

describe('Sig stays out of Juice core', () => {
  it('imports @citrusworx/sigjs only from the sig subpath and the existing Accordion factory', () => {
    const offenders = filesUnder(SRC).filter((path) => {
      if (isAllowedSigImport(path)) return false;
      return SIG_IMPORT.test(readFileSync(path, 'utf8'));
    });

    expect(offenders).toEqual([]);
  });

  it('keeps the main entry and runtimes from importing the sig adapter', () => {
    const entry = readFileSync(join(SRC, 'index.ts'), 'utf8');
    expect(entry).not.toMatch(/['"]\.\/sig(?:\/index)?\.js['"]/);
    expect(entry).not.toMatch(/@citrusworx\/sigjs/);

    const runtimeOffenders = filesUnder(join(SRC, 'js')).filter((path) => {
      const source = readFileSync(path, 'utf8');
      return (
        SIG_IMPORT.test(source) ||
        /['"][^'"]*\/sig(?:\/index)?\.js['"]/.test(source)
      );
    });

    expect(runtimeOffenders).toEqual([]);
  });

  it('imports Sig from the adapter entry', () => {
    const source = readFileSync(join(SRC, 'sig', 'index.ts'), 'utf8');
    expect(source).toContain("from '@citrusworx/sigjs'");
    expect(source).toContain("from '../index.js'");
  });
});

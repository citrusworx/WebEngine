import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test('Juice build produces CSS output', () => {
  const cssPath = join(__dirname, 'dist/index.css');
  const css = readFileSync(cssPath, 'utf-8');
  expect(css).toContain('[bgColor=');
  expect(css).toContain('[icon=');
  expect(css).toContain('[stack]');
  expect(css.length).toBeGreaterThan(1000);
});

test('Juice build produces JS output', () => {
  const jsPath = join(__dirname, 'dist/index.mjs');
  const js = readFileSync(jsPath, 'utf-8');
  expect(js).toContain('export');
});
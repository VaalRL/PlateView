import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve(__dirname, '../../src/index.css'), 'utf8');
const config = readFileSync(resolve(__dirname, '../../tailwind.config.ts'), 'utf8');

/** Every `--token: ...;` declaration in index.css */
const declarations = [...css.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => ({
  name,
  value: value.trim(),
}));

/**
 * Tailwind cannot derive an alpha value from a raw hex `var()` colour: it drops
 * the whole utility, so `bg-card/60` or `fill-team-primary/20` emit nothing. An
 * unset background merely looks transparent, but an unset SVG `fill` falls back
 * to black. Storing the tokens as RGB channels and reading them through
 * `<alpha-value>` is what keeps every opacity modifier real.
 */
describe('theme tokens', () => {
  it('stores every token as space-separated RGB channels, never hex', () => {
    expect(declarations.length).toBeGreaterThan(70);

    declarations.forEach(({ name, value }) => {
      expect(value, `--${name} must be "r g b", got "${value}"`).toMatch(
        /^\d{1,3} \d{1,3} \d{1,3}$/
      );
    });
  });

  it('keeps every channel inside 0-255', () => {
    declarations.forEach(({ name, value }) => {
      value.split(' ').forEach((channel) => {
        expect(Number(channel), `--${name}`).toBeLessThanOrEqual(255);
        expect(Number(channel), `--${name}`).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('reads every token through <alpha-value> in the Tailwind theme', () => {
    const mapped = [...config.matchAll(/rgb\(var\((--[a-z-]+)\) \/ <alpha-value>\)/g)].map(
      ([, token]) => token
    );

    expect(mapped.length).toBeGreaterThan(0);
    // No token may be wired up as a bare var(), which is the broken form
    expect(config).not.toMatch(/:\s*'var\(--[a-z-]+\)'/);

    mapped.forEach((token) => {
      expect(declarations.some((d) => `--${d.name}` === token), `${token} is not defined`).toBe(
        true
      );
    });
  });

  it('defines light and dark values for every non-team surface token', () => {
    const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('.dark,'));
    const darkBlock = css.slice(css.indexOf('.dark,'), css.indexOf('/* 30 Team Theme'));

    const surfaceTokens = [...lightBlock.matchAll(/--([a-z-]+):/g)]
      .map(([, name]) => name)
      .filter((name) => !name.startsWith('team-'));

    surfaceTokens.forEach((name) => {
      expect(darkBlock, `--${name} has no dark-mode value`).toContain(`--${name}:`);
    });
  });

  it('gives all 30 team themes both a primary and a secondary colour', () => {
    const themes = [...css.matchAll(/\[data-team="([a-z]+)"\]\s*{([^}]*)}/g)];

    expect(themes).toHaveLength(30);
    themes.forEach(([, team, body]) => {
      expect(body, `${team} primary`).toContain('--team-primary:');
      expect(body, `${team} secondary`).toContain('--team-secondary:');
    });
  });
});

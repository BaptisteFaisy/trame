/**
 * Layering guard (docs/CONTRACTS.md §1.3): the domain and the extraction never
 * import the Forge runtime, and `node:crypto` stays in the two files that need
 * a fingerprint or a secret detector. Without it, the whole decision path
 * would stop being testable in memory.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = new URL('../../', import.meta.url).pathname;

/** Pure layers: no runtime, no I/O beyond the injected ports. */
const PURE_ROOTS = ['src/domain', 'src/collect'];

const PURE_FILES = ['src/types.ts', 'src/ports.ts', 'src/defaults.ts'];

/** The only files allowed to hash content (§8.2 fingerprint, §5 secrets). */
const CRYPTO_ALLOWED = ['src/collect/fingerprint.ts', 'src/domain/secrets.ts'];

/** An actual import of the runtime, not a sentence that mentions it. */
const FORGE_IMPORT = /(^|\n)\s*(import|export)[^\n]*from\s*['"]@forge\/|import\(['"]@forge\//;

function walk(relative: string): string[] {
  const absolute = join(ROOT, relative);
  const out: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const path = join(absolute, entry);
    if (statSync(path).isDirectory()) out.push(...walk(join(relative, entry)));
    else if (entry.endsWith('.ts')) out.push(join(relative, entry));
  }
  return out;
}

function sources(): string[] {
  const files = [...PURE_FILES];
  for (const root of PURE_ROOTS) {
    try {
      files.push(...walk(root));
    } catch {
      // A layer that does not exist yet has nothing to check.
    }
  }
  return files;
}

describe('layering', () => {
  it('keeps @forge/* out of the domain and the extraction', () => {
    const offenders: string[] = [];
    for (const file of sources()) {
      const body = readFileSync(join(ROOT, file), 'utf8');
      if (FORGE_IMPORT.test(body)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('confines node:crypto to the fingerprint and the secret detector', () => {
    const offenders: string[] = [];
    for (const file of sources()) {
      if (CRYPTO_ALLOWED.includes(file)) continue;
      const body = readFileSync(join(ROOT, file), 'utf8');
      if (/from\s*['"]node:crypto['"]/.test(body)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('never reads the clock or the identifiers outside the injected ports', () => {
    const offenders: string[] = [];
    for (const file of sources()) {
      const body = readFileSync(join(ROOT, file), 'utf8');
      if (/new Date\(\)/.test(body) || /Date\.now\(\)/.test(body)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

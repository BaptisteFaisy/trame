/**
 * Barrel of the mapping layer: one import for the row conversions, so `repo.ts`
 * never reaches into a specific table file.
 */
export * from './mapping-common.js';
export * from './mapping-criteria.js';
export * from './mapping-verifications.js';
export * from './mapping-findings.js';
export * from './mapping-measures.js';

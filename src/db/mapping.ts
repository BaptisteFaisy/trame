/**
 * Barrel of the mapping layer: one import for the row conversions, so `repo.ts`
 * never reaches into a specific table file.
 */
export * from './mapping-common';
export * from './mapping-criteria';
export * from './mapping-verifications';
export * from './mapping-findings';
export * from './mapping-measures';

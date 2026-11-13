/**
 * Forge SQL schema — the fifteen tables of §19.
 *
 * Three platform facts shape this file:
 * 1. **No foreign keys and no cascade** in Forge SQL: referential integrity
 *    lives in `repo.ts`, and every `*_id` is an indexed `VARCHAR(64)`.
 * 2. **The schema IS DDL**, applied through `migrationRunner`: every step is
 *    idempotent (`CREATE TABLE IF NOT EXISTS`, indexes declared inline — the
 *    only idempotent form under TiDB, which has no `CREATE INDEX IF NOT EXISTS`).
 * 3. **The `JSON` type is on probation** and comes back as a string anyway:
 *    every payload is a `TEXT` column, serialised in the mapping layer.
 *
 * Column names avoid MySQL reserved words on purpose (`criterion_text` instead
 * of `text`, `klass` instead of `class`, `version_no` instead of `version`) so
 * no statement needs backticks. Nothing is ever deleted: a criterion keeps its
 * versions, a verification keeps its `disabled_at` (§18, §23).
 *
 * No column, index or query here can produce a per-person statistic: the
 * `*_ref` columns serve the audit trail of a criterion only (§5, §22).
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type { DdlMigration, DdlRunner } from './sql-client';
import { forgeDdlRunner } from './sql-client';

/** The fifteen tables of §19, in dependency order. */
export const TABLES = [
  'criterion',
  'criterion_version',
  'verification',
  'link',
  'coverage_snapshot',
  'perforation',
  'dangling',
  'hole',
  'proposal',
  'zone_risk',
  'metric_rule',
  'witness',
  'coverage_event',
  'cursor',
  'budget',
] as const;

export type TableName = (typeof TABLES)[number];

const DDL: Record<TableName, string> = {
  criterion: `CREATE TABLE IF NOT EXISTS criterion (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    issue_id VARCHAR(64) NOT NULL,
    ticket_key VARCHAR(32) NOT NULL,
    criterion_key VARCHAR(32) NOT NULL,
    criterion_text TEXT NOT NULL,
    text_hash VARCHAR(32) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    origin VARCHAR(32) NOT NULL,
    falsifiable TINYINT(1) NOT NULL DEFAULT 1,
    unfalsifiable_reason TEXT,
    secret_flag VARCHAR(64),
    version_no INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    author_ref VARCHAR(64),
    deleted_at TIMESTAMP NULL,
    scope_json TEXT NOT NULL,
    UNIQUE KEY uq_criterion (issue_id, criterion_key),
    KEY idx_criterion_ticket (ticket_key),
    KEY idx_criterion_changed (changed_at)
  )`,
  criterion_version: `CREATE TABLE IF NOT EXISTS criterion_version (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    criterion_id VARCHAR(64) NOT NULL,
    version_no INT NOT NULL,
    text_hash VARCHAR(32) NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    changed_by_ref VARCHAR(64),
    change_kind VARCHAR(16) NOT NULL,
    UNIQUE KEY uq_version (criterion_id, version_no)
  )`,
  verification: `CREATE TABLE IF NOT EXISTS verification (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    form VARCHAR(32) NOT NULL,
    source_system VARCHAR(32) NOT NULL,
    source_ref VARCHAR(255) NOT NULL,
    issue_id VARCHAR(64),
    ticket_key VARCHAR(32),
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    status VARCHAR(16) NOT NULL,
    strength VARCHAR(16) NOT NULL,
    artifact_ref VARCHAR(255),
    author_ref VARCHAR(64),
    disabled_at TIMESTAMP NULL,
    zone VARCHAR(128),
    KEY idx_verification_ticket (ticket_key),
    KEY idx_verification_executed (executed_at)
  )`,
  link: `CREATE TABLE IF NOT EXISTS link (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    criterion_id VARCHAR(64) NOT NULL,
    verification_id VARCHAR(64) NOT NULL,
    kind VARCHAR(16) NOT NULL,
    path VARCHAR(32) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 1,
    criterion_hash_at_link VARCHAR(32) NOT NULL,
    established_at TIMESTAMP NOT NULL,
    confirmed_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    reject_reason TEXT,
    weights_json TEXT,
    UNIQUE KEY uq_link (criterion_id, verification_id, kind),
    KEY idx_link_kind (kind, established_at)
  )`,
  coverage_snapshot: `CREATE TABLE IF NOT EXISTS coverage_snapshot (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    scope VARCHAR(128) NOT NULL,
    scope_type VARCHAR(16) NOT NULL,
    computed_at TIMESTAMP NOT NULL,
    criteria_n INT NOT NULL DEFAULT 0,
    criteria_falsifiable INT NOT NULL DEFAULT 0,
    unfalsifiable_n INT NOT NULL DEFAULT 0,
    covered_declared INT NOT NULL DEFAULT 0,
    covered_provisional INT NOT NULL DEFAULT 0,
    covered_machine INT NOT NULL DEFAULT 0,
    covered_attested INT NOT NULL DEFAULT 0,
    covered_stale INT NOT NULL DEFAULT 0,
    holes_n INT NOT NULL DEFAULT 0,
    dangling_n INT NOT NULL DEFAULT 0,
    perforations_n INT NOT NULL DEFAULT 0,
    proven_n INT NOT NULL DEFAULT 0,
    blind_json TEXT,
    UNIQUE KEY uq_coverage (scope, scope_type, computed_at),
    KEY idx_coverage_scope (scope, scope_type)
  )`,
  perforation: `CREATE TABLE IF NOT EXISTS perforation (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    criterion_id VARCHAR(64) NOT NULL,
    verification_id VARCHAR(64) NOT NULL,
    ticket_key VARCHAR(32) NOT NULL,
    criterion_key VARCHAR(32) NOT NULL,
    criterion_version_no INT NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NOT NULL,
    age_days INT NOT NULL,
    klass VARCHAR(16) NOT NULL,
    state VARCHAR(16) NOT NULL,
    UNIQUE KEY uq_perforation (criterion_id, verification_id, criterion_version_no),
    KEY idx_perforation_ticket (ticket_key, state)
  )`,
  dangling: `CREATE TABLE IF NOT EXISTS dangling (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    verification_id VARCHAR(64) NOT NULL,
    verification_name VARCHAR(255) NOT NULL,
    reason VARCHAR(32) NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    impact_n INT NOT NULL DEFAULT 0,
    state VARCHAR(16) NOT NULL,
    UNIQUE KEY uq_dangling (verification_id, reason)
  )`,
  hole: `CREATE TABLE IF NOT EXISTS hole (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    criterion_id VARCHAR(64) NOT NULL,
    ticket_key VARCHAR(32) NOT NULL,
    criterion_key VARCHAR(32) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    zone VARCHAR(128),
    priority_score DECIMAL(6,4) NOT NULL DEFAULT 0,
    priority_terms_json TEXT,
    scope VARCHAR(128) NOT NULL,
    state VARCHAR(16) NOT NULL,
    proposal_id VARCHAR(64),
    UNIQUE KEY uq_hole (criterion_id, scope),
    KEY idx_hole_priority (scope, priority_score)
  )`,
  proposal: `CREATE TABLE IF NOT EXISTS proposal (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    type VARCHAR(24) NOT NULL,
    criterion_id VARCHAR(64) NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    state VARCHAR(16) NOT NULL,
    decided_at TIMESTAMP NULL,
    decided_by_ref VARCHAR(64),
    KEY idx_proposal_state (state, created_at)
  )`,
  zone_risk: `CREATE TABLE IF NOT EXISTS zone_risk (
    id VARCHAR(192) NOT NULL PRIMARY KEY,
    scope VARCHAR(128) NOT NULL,
    zone VARCHAR(128) NOT NULL,
    defect_n INT NOT NULL DEFAULT 0,
    last_defect_at TIMESTAMP NULL,
    open_incident_n INT NOT NULL DEFAULT 0,
    score DECIMAL(6,4) NOT NULL DEFAULT 0,
    computed_at TIMESTAMP NOT NULL,
    UNIQUE KEY uq_zone (scope, zone)
  )`,
  metric_rule: `CREATE TABLE IF NOT EXISTS metric_rule (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    scope VARCHAR(128) NOT NULL,
    weight_json TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    updated_by_ref VARCHAR(64),
    UNIQUE KEY uq_metric (scope)
  )`,
  witness: `CREATE TABLE IF NOT EXISTS witness (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    scope VARCHAR(128) NOT NULL,
    scope_type VARCHAR(16) NOT NULL,
    period VARCHAR(64) NOT NULL,
    coverage_json TEXT NOT NULL,
    computed_at TIMESTAMP NOT NULL,
    bulletin_ref VARCHAR(255),
    UNIQUE KEY uq_witness (scope, scope_type, computed_at)
  )`,
  coverage_event: `CREATE TABLE IF NOT EXISTS coverage_event (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    scope VARCHAR(128) NOT NULL,
    event VARCHAR(32) NOT NULL,
    at TIMESTAMP NOT NULL,
    payload_json TEXT,
    KEY idx_event_scope (scope, at)
  )`,
  cursor: `CREATE TABLE IF NOT EXISTS cursor (
    id VARCHAR(192) NOT NULL PRIMARY KEY,
    scope VARCHAR(128) NOT NULL,
    mode VARCHAR(24) NOT NULL,
    last_issue_id VARCHAR(64),
    last_modified_at TIMESTAMP NULL,
    run_at TIMESTAMP NOT NULL,
    UNIQUE KEY uq_cursor (scope, mode)
  )`,
  budget: `CREATE TABLE IF NOT EXISTS budget (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    day VARCHAR(16) NOT NULL,
    llm_calls INT NOT NULL DEFAULT 0,
    tokens INT NOT NULL DEFAULT 0,
    cost_estimate DECIMAL(12,6) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_budget (day)
  )`,
};

/** One idempotent migration per table, in `TABLES` order. */
export function migrations(): DdlMigration[] {
  return TABLES.map((table) => ({ name: `trame-${table}`, ddl: DDL[table] }));
}

/** Applies the schema; Forge's `migrationRunner` in production, a stub in tests. */
export async function ensureSchema(runner: DdlRunner = forgeDdlRunner): Promise<string[]> {
  return runner.run(migrations());
}

/** DDL of one table — used by the schema tests and by the coverage screen. */
export function ddlOf(table: TableName): string {
  return DDL[table];
}

/**
 * A recording SQL client: it stores every statement and its bound parameters,
 * and returns the rows a test programmed for it. It is what lets the SQL layer
 * be tested without a database — bounded queries, replayable writes, parameter
 * counts — while the domain is tested against the in-memory store.
 */
import type { SqlClient, SqlParam } from '../../src/db/sql-client.js';
import type { Row } from '../../src/db/mapping-common.js';

export interface RecordedCall {
  statement: string;
  params: readonly SqlParam[];
}

export class RecordingSqlClient implements SqlClient {
  readonly calls: RecordedCall[] = [];

  private responses: Row[][] = [];

  /** Programs the rows the next `query` calls return, in order. */
  respondWith(...rows: Row[][]): this {
    this.responses = [...rows];
    return this;
  }

  async query<T = Row>(statement: string, params: readonly SqlParam[] = []): Promise<T[]> {
    this.calls.push({ statement: collapse(statement), params });
    const next = this.responses.shift();
    return (next ?? []) as T[];
  }

  async execute(statement: string, params: readonly SqlParam[] = []): Promise<number> {
    this.calls.push({ statement: collapse(statement), params });
    return 1;
  }

  /** Statements matching a fragment, in call order. */
  statementsIncluding(fragment: string): string[] {
    return this.calls
      .map((call) => call.statement)
      .filter((statement) => statement.includes(fragment));
  }

  last(): RecordedCall | undefined {
    return this.calls[this.calls.length - 1];
  }
}

/** Puts a statement on one line so assertions stay readable. */
function collapse(statement: string): string {
  return statement.replace(/\s+/g, ' ').trim();
}

export function createRecordingSqlClient(): RecordingSqlClient {
  return new RecordingSqlClient();
}

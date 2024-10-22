import { Kysely, PostgresDialect } from "kysely";
import type { SubmissionsTable } from "./models/Submissions";
import { Pool } from "pg";
export interface Database {
	submissions: SubmissionsTable;
}
export interface Database {
	submissions: SubmissionsTable;
}

export function createDB(connectionString: string) {
	return new Kysely<Database>({
		dialect: new PostgresDialect({
			pool: new Pool({
				connectionString,
			}),
		}),
	}).withSchema("playground");
}

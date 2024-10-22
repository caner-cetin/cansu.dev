import type { Kysely } from "kysely";
import type { Database } from "../db";
import dayjs from "dayjs";

export async function up(db: Kysely<Database>): Promise<void> {
	await db.schema
		.createTable("submissions")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("judgeToken", "text", (col) => col.notNull())
		.addColumn("sourceCode", "text", (col) => col.notNull())
		.addColumn("stdin", "text")
		.addColumn("sent", "boolean", (col) => col.notNull().defaultTo(false))
		.addColumn("createdAt", "timestamptz", (col) =>
			col.notNull().defaultTo(dayjs().toDate()),
		)
		.addColumn("updatedAt", "timestamptz", (col) =>
			col.notNull().defaultTo(dayjs().toDate()),
		)
		.addColumn("deletedAt", "timestamptz")
		.execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
	await db.schema.dropTable("submissions").execute();
}

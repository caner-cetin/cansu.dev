import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Judge0 } from "./judge0";
import dayjs from "dayjs";
import { HTTPException } from "hono/http-exception";
import { createDB } from "./db";
import { LanguagesResponse } from "./schemas";
import { rateLimiter } from "./middlewares/ratelimit";
export type Bindings = {
	DATABASE_URL: string;
	JWT_SECRET: string;
	JWT_REFRESH_SECRET: string;
	JUDGE0_BASE_API_URL: string;
	JUDGE0_AUTHZ_HEADER: string;
	JUDGE0_AUTHZ_TOKEN: string;
	JUDGE0_AUTHN_HEADER: string;
	JUDGE0_AUTHN_TOKEN: string;
	// @ts-ignore
	RATE_LIMIT_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", logger());
app.use(
	"*",
	cors({
		origin: [
			"https://code.cansu.dev",
			"http://localhost:5173",
			"http://localhost:4321",
		],
		credentials: false,
		maxAge: 600,
		allowMethods: ["POST", "GET", "OPTIONS", "PUT"],
		allowHeaders: ["Content-Type", "Authorization"],
		exposeHeaders: ["Content-Length"],
	}),
);
app.options("*", (c) => {
	c.header("Access-Control-Allow-Origin", c.req.header("Origin") || "*");
	c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT");
	c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	c.header("Access-Control-Max-Age", "600");
	return c.text("", 204);
});
app.get("/health", async (c) => {
	const health = await Judge0.Health.getWorkerQueues(c);
	return c.json(health);
});

app.get("/judge/languages", async (c) => {
	const languages = await Judge0.Language.getAll(c);
	return c.json(languages);
});

app.post("/judge/submit/code", async (c) => {
	const code = await c.req.text();

	if (!code) {
		throw new HTTPException(400, { message: "beep beep invalid input" });
	}
	const db = createDB(c.env.DATABASE_URL);

	const subId = await db
		.insertInto("submissions")
		.values({
			sourcecode: Buffer.from(code).toString("base64"),
			judgetoken: "",
			stdin: undefined,
			sent: false,
			createdat: dayjs(),
			updatedat: dayjs(),
			deletedat: undefined,
		})
		.returning("id")
		.execute();

	return c.json({ id: subId[0].id });
});

app.post("/judge/submit/stdin", async (c) => {
	const id = c.req.query("id");
	const stdin = await c.req.text();

	if (!stdin || !id) {
		throw new HTTPException(400, {
			message: "both stdin and id cannot be null",
		});
	}
	const db = createDB(c.env.DATABASE_URL);
	await db
		.updateTable("submissions")
		.set({
			stdin: Buffer.from(stdin).toString("base64"),
			updatedat: dayjs(),
		})
		.execute();

	return c.json({ success: true });
});
app.put("/judge/submit/:id", rateLimiter, async (c) => {
	const id = c.req.param("id");
	const language = Number(c.req.query("language"));
	const db = createDB(c.env.DATABASE_URL);
	const submission = await db
		.selectFrom("submissions")
		.select(["sourcecode", "stdin", "sent"])
		.where("id", "=", Number(id))
		.executeTakeFirst();
	if (submission?.sent === true) {
		throw new HTTPException(400, { message: "Submission already sent" });
	}
	if (!submission) {
		throw new HTTPException(400, { message: "Invalid submission ID" });
	}

	const result = await Judge0.Submission.create(
		submission.sourcecode,
		language,
		submission.stdin ?? btoa(""),
		true,
		false,
		c,
	);

	await db.updateTable("submissions").set({
		updatedat: dayjs(),
		sent: true,
		judgetoken: result.token,
	});

	return c.json(result);
});

app.get("/judge/:token", async (c) => {
	const token = c.req.param("token");
	const submission = await Judge0.Submission.get(token, c);
	return c.json(submission);
});

app.onError((err, c) => {
	console.error(err);
	const status = err instanceof HTTPException ? err.status : 500;
	const message =
		err instanceof HTTPException ? err.message : "Internal Server Error";

	return c.json(
		{
			status,
			message,
		},
		status,
	);
});
export type AppType = typeof app;

// Start the worker
export default app;

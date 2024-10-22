import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { Bindings } from ".";
async function IsOK(response: Response, message: string) {
	if (!response.ok) {
		console.error(
			`>> ${response.url} ${response.status} ${JSON.stringify(await response.json())}`,
		);
		throw new HTTPException(500, { message: message });
	}
}

interface HealthResponse {
	queue: string;
	size: number;
	available: number;
	idle: number;
	working: number;
	paused: number;
	failed: number;
}

interface LanguagesResponse {
	id: number;
	name: string;
}

interface CreateSubmissionResponse {
	token: string;
}

interface GetSubmissionResponse {
	source_code: string;
	language_id: number;
	stdin: string;
	stdout: string | null | undefined;
	status_id: number;
	created_at: string;
	finished_at: string;
	time: string;
	memory: number;
	stderr: string | null | undefined;
	token: string;
	number_of_runs: number;
	cpu_time_limit: string;
	cpu_extra_time: string;
	wall_time_limit: string;
	memory_limit: number;
	stack_limit: number;
	max_file_size: number;
	compile_output: string | null | undefined;
	message: string | null | undefined;
	exit_code: number;
	wall_time: string;
	status: {
		id: number;
		description: string;
	};
	language: {
		id: number;
		name: string;
	};
}

export interface Status {
	id: number;
	description: string;
}

export interface Language {
	id: number;
	name: string;
}

export interface Judge {
	Health: {
		getWorkerQueues(
			c: Context<{ Bindings: Bindings }>,
		): Promise<HealthResponse[]>;
		checkStatus(c: Context<{ Bindings: Bindings }>): Promise<boolean>;
	};
	Language: {
		getAll(c: Context<{ Bindings: Bindings }>): Promise<LanguagesResponse[]>;
	};
	Submission: {
		create(
			code: string,
			language: number,
			stdin: string | null | undefined,
			b64encoded: boolean | null | undefined,
			wait: boolean | null | undefined,
			c: Context<{ Bindings: Bindings }>,
		): Promise<CreateSubmissionResponse>;
		get(
			token: string,
			c: Context<{ Bindings: Bindings }>,
		): Promise<GetSubmissionResponse>;
	};
}

export const Judge0: Judge = {
	Health: {
		async getWorkerQueues(c: Context<{ Bindings: Bindings }>) {
			const workerQueues = await fetch(`${c.env.JUDGE0_BASE_API_URL}/workers`, {
				method: "GET",
				headers: {
					[c.env.JUDGE0_AUTHN_HEADER]: c.env.JUDGE0_AUTHN_TOKEN,
				},
			});
			await IsOK(workerQueues, "Judges are not alive");
			return (await workerQueues.json()) as HealthResponse[];
		},
		async checkStatus(c: Context<{ Bindings: Bindings }>) {
			try {
				await this.getWorkerQueues(c);
				return true;
			} catch {
				return false;
			}
		},
	},
	Language: {
		async getAll(c: Context<{ Bindings: Bindings }>) {
			const response = await fetch(`${c.env.JUDGE0_BASE_API_URL}/languages`, {
				method: "GET",
				headers: {
					[c.env.JUDGE0_AUTHN_HEADER]: c.env.JUDGE0_AUTHN_TOKEN,
				},
			});
			await IsOK(response, "Can't get languages from judges.");
			return (await response.json()) as LanguagesResponse[];
		},
	},
	Submission: {
		async create(
			code: string,
			language: number,
			stdin: string | null | undefined,
			b64encoded: boolean | null | undefined,
			wait: boolean | null | undefined,
			c: Context<{ Bindings: Bindings }>,
		) {
			const shouldWait = wait !== null && wait !== false && wait !== undefined;
			const isB64Enc =
				b64encoded !== null && b64encoded !== false && b64encoded !== undefined;
			let uri = `${c.env.JUDGE0_BASE_API_URL}/submissions/`;
			if (shouldWait && isB64Enc) {
				uri = `${uri}?base64_encoded=true&wait=true`;
			} else if (isB64Enc) {
				uri = `${uri}?base64_encoded=true`;
			} else if (shouldWait) {
				uri = `${uri}?wait=true`;
			}
			const body = JSON.stringify({
				source_code: code,
				language_id: language,
				stdin: stdin ?? null,
			});
			const response = await fetch(uri, {
				headers: {
					[c.env.JUDGE0_AUTHN_HEADER]: c.env.JUDGE0_AUTHN_TOKEN,
					"Content-Type": "application/json",
				},
				method: "POST",
				body: body,
			});
			await IsOK(response, "Could not submit the submission to the judges.");
			return (await response.json()) as CreateSubmissionResponse;
		},
		async get(token, c) {
			const req = await fetch(
				`${c.env.JUDGE0_BASE_API_URL}/submissions/${token}?base64_encoded=true&fields=*`,
				{
					headers: {
						[c.env.JUDGE0_AUTHN_HEADER]: c.env.JUDGE0_AUTHN_TOKEN,
					},
					method: "GET",
				},
			);
			await IsOK(req, "Judges refuses me to give an answer.");
			const response = (await req.json()) as GetSubmissionResponse;
			const decodeBase64 = (str: string | null | undefined) =>
				str
					? new TextDecoder().decode(
							Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
						)
					: str;

			response.stdout = decodeBase64(response.stdout);
			response.stderr = decodeBase64(response.stderr);
			response.compile_output = decodeBase64(response.compile_output);
			response.message = decodeBase64(response.message);
			return response;
		},
	},
};

import { z } from "zod";
export const HealthResponse = z.array(
	z.object({
		queue: z.string(),
		size: z.number(),
		available: z.number(),
		idle: z.number(),
		working: z.number(),
		paused: z.number(),
		failed: z.number(),
	}),
);

export const LanguagesResponse = z.array(
	z.object({
		id: z.number(),
		name: z.string(),
	}),
);

export const SubmitCodeResponse = z.object({ id: z.number() });

export const GetSubmissionResponse = z.object({
	source_code: z.string(),
	language_id: z.number(),
	stdin: z.string(),
	stdout: z.string().nullable().optional(),
	status_id: z.number(),
	created_at: z.string(),
	finished_at: z.string(),
	time: z.string(),
	memory: z.number(),
	stderr: z.string().nullable().optional(),
	token: z.string(),
	number_of_runs: z.number(),
	cpu_time_limit: z.string(),
	cpu_extra_time: z.string(),
	wall_time_limit: z.string(),
	memory_limit: z.number(),
	stack_limit: z.number(),
	max_file_size: z.number(),
	compile_output: z.string().nullable().optional(),
	message: z.string().nullable().optional(),
	exit_code: z.number(),
	wall_time: z.string(),
	status: z.object({
		id: z.number(),
		description: z.string(),
	}),
	language: z.object({
		id: z.number(),
		name: z.string(),
	}),
});

export const CreateSubmissionResponse = z.object({
	token: z.string(),
});

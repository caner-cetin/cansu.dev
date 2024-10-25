import {
	useMutation,
	useQuery,
	type UseQueryResult,
	type UseMutationResult,
} from "@tanstack/react-query";
import api from "src/services/api";

// Types based on your Zod schemas
type HealthResponse = Array<{
	queue: string;
	size: number;
	available: number;
	idle: number;
	working: number;
	paused: number;
	failed: number;
}>;

export type LanguagesResponse = Array<{
	id: number;
	name: string;
}>;

type SubmitCodeResponse = {
	id: number;
};

export type GetSubmissionResponse = {
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
};

const getHealth = () =>
	api.get<HealthResponse>("/judge/health").then((res) => res.data);
const getLanguages = () =>
	api.get<LanguagesResponse>("/judge/languages").then((res) => res.data);
const submitCode = (code: string) =>
	api
		.post<SubmitCodeResponse>("/judge/submit/code", code, {
			headers: { "Content-Type": "text/plain" },
		})
		.then((res) => res.data);

interface submitStdinOpts {
	id: number;
	stdin: string;
}
const submitStdin = (opts: submitStdinOpts) =>
	api
		.post(`/judge/submit/stdin?id=${opts.id}`, opts.stdin, {
			headers: { "Content-Type": "text/plain" },
		})
		.then((res) => res.data);

type SubmitSubmissionOpts = {
	id: number;
	languageId: number;
};
const submitSubmission = (opts: SubmitSubmissionOpts) =>
	api
		.put<GetSubmissionResponse>(
			`/judge/submit/${opts.id}?language=${opts.languageId}`,
		)
		.then((res) => res.data);

export interface JudgeAPISpec {
	health: UseMutationResult<HealthResponse, Error, void, unknown>;
	languages: UseQueryResult<LanguagesResponse, Error>;
	submitCode: UseMutationResult<SubmitCodeResponse, Error, string, unknown>;
	submitStdin: UseMutationResult<
		null,
		Error,
		{
			id: number;
			stdin: string;
		},
		unknown
	>;
	submitSubmission: UseMutationResult<
		GetSubmissionResponse,
		Error,
		SubmitSubmissionOpts,
		unknown
	>;
}
// Hook
export function useJudge(): JudgeAPISpec {
	const healthMutation = useMutation<HealthResponse, Error>({
		mutationFn: getHealth,
	});
	const languages = useQuery<LanguagesResponse, Error>({
		queryKey: ["languages"],
		queryFn: getLanguages,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const submitCodeMutation = useMutation<SubmitCodeResponse, Error, string>({
		mutationFn: submitCode,
	});
	const submitStdinMutation = useMutation<null, Error, submitStdinOpts>({
		mutationFn: submitStdin,
	});
	const submitSubmissionMutation = useMutation<
		GetSubmissionResponse,
		Error,
		SubmitSubmissionOpts
	>({
		mutationFn: submitSubmission,
	});

	return {
		health: healthMutation,
		languages: languages,
		submitCode: submitCodeMutation,
		submitStdin: submitStdinMutation,
		submitSubmission: submitSubmissionMutation,
	};
}

// Export this function separately
export const getSubmission = (token: string) =>
	api.get<GetSubmissionResponse>(`/judge/${token}`).then((res) => res.data);

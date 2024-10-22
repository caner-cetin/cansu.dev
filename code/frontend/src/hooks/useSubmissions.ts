import { toast } from "react-hot-toast";
import type { JudgeAPISpec } from "./useJudge";
import type ReactAce from "react-ace/lib/ace";
import { LANGUAGE_CONFIG } from "src/editor/languages";
import { LanguageId } from "src/services/settings";

export interface StoredSubmission {
	localId: number;
	globalId: number;
	token: string;
	iconClass: string;
}

export namespace Submissions {
	const SUBMISSION_COUNTER_KEY = "submissionCounter";
	const SUBMISSIONS_KEY = "submissions";
	export function getNextSubmissionId(): number {
		const currentCounter = localStorage.getItem(SUBMISSION_COUNTER_KEY);
		const nextId = currentCounter ? Number.parseInt(currentCounter, 10) + 1 : 1;
		localStorage.setItem(SUBMISSION_COUNTER_KEY, nextId.toString());
		return nextId;
	}

	export function saveSubmission(submission: StoredSubmission): void {
		const submissions = getStoredSubmissions();
		submissions.push(submission);
		localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
	}

	export function getStoredSubmissions(): StoredSubmission[] {
		const storedSubmissions = localStorage.getItem(SUBMISSIONS_KEY);
		return storedSubmissions ? JSON.parse(storedSubmissions) : [];
	}

	export function clearStoredSubmissions(): void {
		localStorage.removeItem(SUBMISSIONS_KEY);
		localStorage.removeItem(SUBMISSION_COUNTER_KEY);
	}

	export async function handleSubmitCode(
		editor: ReactAce | null,
		languageId: number,
		withStdin: boolean,
		setShowStdinModal: (show: boolean) => void,
		JudgeAPI: JudgeAPISpec,
		setSubmissions: React.Dispatch<React.SetStateAction<StoredSubmission[]>>,
	): Promise<void> {
		if (languageId === LanguageId.Markdown) {
			toast.error("what did you expect?");
			return;
		}
		if (editor === null) {
			return;
		}
		try {
			const result = await JudgeAPI.submitCode.mutateAsync(
				editor.editor.getValue(),
			);
			if (withStdin) {
				setShowStdinModal(true);
			} else {
				await finalizeSubmission(
					result.id,
					languageId,
					JudgeAPI,
					setSubmissions,
				);
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to submit code");
		}
	}

	export async function handleSubmitStdin(
		stdin: string,
		JudgeAPI: JudgeAPISpec,
		languageId: number,
		setSubmissions: React.Dispatch<React.SetStateAction<StoredSubmission[]>>,
	): Promise<void> {
		if (languageId === LanguageId.Markdown) {
			toast.error("what did you expect?");
			return;
		}
		if (!JudgeAPI.submitCode.data?.id) {
			toast.error("No submission available, submit code first");
			return;
		}
		try {
			if (stdin.trim() !== "") {
				await JudgeAPI.submitStdin.mutateAsync({
					id: JudgeAPI.submitCode.data.id,
					stdin,
				});
			}
			await finalizeSubmission(
				JudgeAPI.submitCode.data.id,
				languageId,
				JudgeAPI,
				setSubmissions,
			);
		} catch (error) {
			toast.error("Failed to process submission");
		}
	}

	async function finalizeSubmission(
		globalId: number,
		languageId: number,
		JudgeAPI: JudgeAPISpec,
		setSubmissions: React.Dispatch<React.SetStateAction<StoredSubmission[]>>,
	): Promise<void> {
		const result = await JudgeAPI.submitSubmission.mutateAsync({
			id: globalId,
			languageId: languageId,
		});
		const localId = getNextSubmissionId();
		const newSubmission = {
			localId,
			globalId,
			token: result.token,
			iconClass: LANGUAGE_CONFIG[languageId]?.iconClass || "",
		};
		saveSubmission(newSubmission);
		setSubmissions((prev) =>
			[newSubmission, ...prev].sort((a, b) => b.localId - a.localId),
		);
		toast.loading("Submission in progress...", {
			duration: 3000,
		});
	}

	export function handleClearSubmissions(
		setSubmissions: React.Dispatch<React.SetStateAction<StoredSubmission[]>>,
	): void {
		clearStoredSubmissions();
		setSubmissions([]);
		toast.success("Submissions cleared");
	}
}

export default Submissions;

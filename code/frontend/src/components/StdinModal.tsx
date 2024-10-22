import React from "react";
import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import type { JudgeAPISpec } from "src/hooks/useJudge";
import type { StoredSubmission } from "src/hooks/useSubmissions";

interface StdinModalProps {
	show: boolean;
	onHide: () => void;
	languageId: number;
	onSubmit: (
		stdin: string,
		JudgeAPI: JudgeAPISpec,
		languageId: number,
		setSubmissions: React.Dispatch<
			React.SetStateAction<StoredSubmission[]>
		>,
	) => Promise<void>;
	setSubmissions: React.Dispatch<
		React.SetStateAction<StoredSubmission[]>
	>;
	judgeApi: JudgeAPISpec;
}

const StdinModal: React.FC<StdinModalProps> = ({
	show,
	onHide,
	languageId,
	onSubmit,
	setSubmissions,
	judgeApi,
}) => {
	const [stdin, setStdin] = useState("");
	const handleSubmit = () => {
		onSubmit(stdin, judgeApi, languageId, setSubmissions);
		onHide();
		return;
	};

	const modalStyle = {
		content: {
			backgroundColor: '#1e1e1e',
			border: '1px solid #555568',
			borderRadius: '6px',
		},
		header: {
			backgroundColor: '#211e20',
			border: '1px solid #555568',
			color: '#e9efec',
		},
		body: {
			backgroundColor: '#3c3836',
			padding: '1rem',
		},
		textarea: {
			backgroundColor: '#3c3836',
			color: '#a0a08b',
			border: '1px solid #555568',
			'::placeholder': {
				color: 'rgba(160, 160, 139, 0.5)',
			},
		},
		footer: {
			backgroundColor: '#211e20',
			border: '1px solid #555568',
		},
		button: {
			backgroundColor: '#3c3836',
			color: '#e9efec',
			border: '1px solid #555568',
			'&:hover': {
				backgroundColor: '#211e20',
			},
		},
		cancelButton: {
			backgroundColor: '#211e20',
			color: '#e9efec',
			border: '1px solid #555568',
			'&:hover': {
				backgroundColor: '#3c3836',
			},
		},
	};

	return (
		<Modal show={show} onHide={onHide} contentClassName="bg-dark">
			<Modal.Header closeButton style={modalStyle.header}>
				<Modal.Title>Stdin</Modal.Title>
			</Modal.Header>
			<Modal.Body style={modalStyle.body}>
				<Form.Control
					as="textarea"
					rows={3}
					value={stdin}
					onChange={(e) => setStdin(e.target.value)}
					placeholder="can be submitted blank"
					style={modalStyle.textarea}
				/>
			</Modal.Body>
			<Modal.Footer style={modalStyle.footer}>
				<Button variant="secondary" onClick={onHide} style={modalStyle.cancelButton}>
					Cancel
				</Button>
				<Button variant="primary" onClick={handleSubmit} style={modalStyle.button}>
					Submit
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default StdinModal;
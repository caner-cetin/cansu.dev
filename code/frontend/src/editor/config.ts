import type AceEditor from "react-ace";

import { config } from "ace-builds";
import { type CodeStorage, Settings } from "src/services/settings";
import { LANGUAGE_CONFIG } from "./languages";

config.set(
	"basePath",
	"https://cdn.jsdelivr.net/npm/ace-builds@1.4.8/src-noconflict/",
);

export const initializeAce = (
	code: React.MutableRefObject<AceEditor | null>,
	colorTheme: string,
	languageID: number,
) => {
	code.current?.editor?.setTheme(`ace/theme/${colorTheme}`);
	code.current?.editor?.session.setMode(
		`ace/mode/${LANGUAGE_CONFIG[languageID]?.mode}`,
	);
	const codeStorage = localStorage.getItem(Settings.CODE_STORAGE);
	if (codeStorage) {
		const codeStorageCast = JSON.parse(codeStorage) as CodeStorage;
		const savedCode =
			codeStorageCast[
				// @ts-ignore
				code.current?.editor?.getSession().getMode().$id
			];
		if (savedCode) {
			code.current?.editor?.session.setValue(atob(savedCode));
		}
	}
	if (code.current?.editor?.session.getValue() === "") {
		code.current?.editor?.session.setValue(
			LANGUAGE_CONFIG[languageID]?.defaultText || "",
		);
	}
};

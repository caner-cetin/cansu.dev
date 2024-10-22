// i am going to pile up everything in file and you cannot stop me

import { useRef, useState } from "react";

export type CodeStorage = Record<string, string | undefined>;
export enum Settings {
	COLOR_THEME = "colorTheme",
	CODE_STORAGE = "codeStorage",
	DEFAULT_LANGUAGE_ID = "defaultLanguageID",
	RENDER_FIRST = "renderFirst",
}
export const getStoredSetting = <T>(
	key: string,
	defaultValue: T,
	parser: (value: string) => T,
	validator?: (value: T) => boolean,
): T => {
	try {
		const storedValue = localStorage.getItem(key);
		if (!storedValue) return defaultValue;

		const parsedValue = parser(storedValue);
		if (validator && !validator(parsedValue)) return defaultValue;

		return parsedValue;
	} catch {
		return defaultValue;
	}
};

export enum Themes {
	Chrome = "chrome",
	Clouds = "clouds",
	CrimsonEditor = "crimson_editor",
	Dawn = "dawn",
	Dreamweaver = "dreamweaver",
	Eclipse = "eclipse",
	GitHub = "github",
	IPlastic = "iplastic",
	KatzenMilch = "katzenmilch",
	Kuroir = "kuroir",
	SolarizedLight = "solarized_light",
	SQLServer = "sqlserver",
	TextMate = "textmate",
	Tomorrow = "tomorrow",
	XCode = "xcode",
	Ambiance = "ambiance",
	Chaos = "chaos",
	CloudsMidnight = "clouds_midnight",
	Cobalt = "cobalt",
	Dracula = "dracula",
	GreenOnBlack = "gob",
	Gruvbox = "gruvbox",
	IdleFingers = "idle_fingers",
	KrTheme = "kr_theme",
	Merbivore = "merbivore",
	MerbivoreSoft = "merbivore_soft",
	MonoIndustrial = "mono_industrial",
	Monokai = "monokai",
	PastelOnDark = "pastel_on_dark",
	SolarizedDark = "solarized_dark",
	Terminal = "terminal",
	TomorrowNight = "tomorrow_night",
	TomorrowNightBlue = "tomorrow_night_blue",
	TomorrowNightBright = "tomorrow_night_bright",
	TomorrowNightEighties = "tomorrow_night_eighties",
	Twilight = "twilight",
	VibrantInk = "vibrant_ink",
}

const isValidTheme = (value: string): value is Themes => {
	return Object.values(Themes).includes(value as Themes);
};
export const useColorTheme = () => {
	return useState(
		getStoredSetting(
			Settings.COLOR_THEME,
			Themes.TomorrowNightEighties,
			(value) => value,
			isValidTheme,
		),
	);
};

export enum RenderFirst {
	WelcomeMarkdown = 0,
	CodeEditor = 1,
}

export const isValidRenderFirst = (value: number): value is RenderFirst => {
	return Object.values(RenderFirst).includes(value);
};

export const useRenderFirst = () => {
	return useState(
		getStoredSetting(
			Settings.RENDER_FIRST,
			RenderFirst.WelcomeMarkdown,
			(value) => Number.parseInt(value, 10),
			isValidRenderFirst,
		),
	);
};

export enum LanguageId {
	Markdown = 0,
	AssemblyNASM = 45,
	Bash = 46,
	BasicFBC = 47,
	CClang = 75,
	CPPClang = 76,
	CGCC7 = 48,
	CPPGCC7 = 52,
	CGCC8 = 49,
	CPPGCC8 = 53,
	CGCC9 = 50,
	CPPGCC9 = 54,
	Clojure = 86,
	CSharpMono = 51,
	COBOL = 77,
	CommonLisp = 55,
	D = 56,
	Elixir = 57,
	Erlang = 58,
	Executable = 44,
	FSharp = 87,
	Fortran = 59,
	Go = 60,
	Groovy = 88,
	Haskell = 61,
	Java = 62,
	JavaScript = 63,
	Kotlin = 78,
	Lua = 64,
	MultiFileProgram = 89,
	ObjectiveC = 79,
	OCaml = 65,
	Octave = 66,
	Pascal = 67,
	Perl = 85,
	PHP = 68,
	PlainText = 43,
	Prolog = 69,
	Python2 = 70,
	Python3 = 71,
	R = 80,
	Ruby = 72,
	Rust = 73,
	Scala = 81,
	SQLite = 82,
	Swift = 83,
	TypeScript = 74,
	VisualBasicNet = 84,
}

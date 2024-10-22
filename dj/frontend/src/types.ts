export type VolumeSlider = {
	id: string;
	defaultValue: string;
	label: {
		down: string;
		up: string;
		downIcon: string;
		upIcon: string;
	};
};

export type VolumeControl = {
	player: React.RefObject<HTMLAudioElement>;
	sliderId: string;
};

// local storage keys
export enum StorageKeys {
	WARNING_SHOWN = "warningShown",
	INSTRUMENT_VOLUME = "instrumentVolume",
	VOCAL_VOLUME = "vocalVolume",
}

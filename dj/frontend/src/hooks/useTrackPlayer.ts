import { useMutation } from "@tanstack/react-query";
import WaveSurfer from "wavesurfer.js";
import Hls from "hls.js";
import { type Track, useRandomTrack, useTrack } from "./useApi";
import { AudioSynchronizer } from "../utils/AudioSynchronizer";

export interface LoadTrackProp {
	vocalPlayer: HTMLAudioElement;
	instrumentalPlayer: HTMLAudioElement;
	vocalSeekArea: HTMLElement;
	instrumentalSeekArea: HTMLElement;
	trackId?: string;
	setAudioSynchronizer: (audioSynchronizer: AudioSynchronizer) => void;
}
export interface SetupTrackProp extends LoadTrackProp {
	track: Track;
}
export interface CurrentlyPlaying {
	track: Track;
	instrumentalWaveSurfer: WaveSurfer;
	vocalWaveSurfer: WaveSurfer | null;
	instrumentalHls: Hls;
	vocalHls: Hls | null;
	duration: { minutes: number; seconds: string };
}
export const useTrackPlayer = () => {
	const getAnonymousId = (): string => {
		let anonymousId = localStorage.getItem("anonymousId");
		if (!anonymousId) {
			anonymousId = `user_${Math.random().toString(36).substring(2, 9)}`;
			localStorage.setItem("anonymousId", anonymousId);
		}
		return anonymousId;
	};
	const setupWaveSurfer = (
		container: HTMLElement,
		peaks: number[],
		duration: number,
	): WaveSurfer => {
		return WaveSurfer.create({
			container,
			backend: "WebAudio",
			peaks: [peaks],
			duration,
			progressColor: "rgba(255, 255, 255, 1)",
		});
	};

	const setupHls = (
		source: string,
		mediaElement: HTMLMediaElement,
	): Promise<Hls> => {
		return new Promise((resolve, reject) => {
			const hls = new Hls();

			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				resolve(hls);
			});

			hls.on(Hls.Events.ERROR, (_, data) => {
				if (data.fatal) {
					reject(new Error(`HLS Error: ${data.type} - ${data.details}`));
				}
			});

			hls.loadSource(source);
			hls.attachMedia(mediaElement);
		});
	};
	const loadTrackMutation = useMutation({
		mutationFn: async ({
			trackId,
			vocalPlayer,
			instrumentalPlayer,
			vocalSeekArea,
			instrumentalSeekArea,
			setAudioSynchronizer,
		}: LoadTrackProp) => {
			if (trackId) {
				const track = await useTrack(trackId);
				return await setupAudioPlayers({
					track: track.data,
					vocalPlayer,
					instrumentalPlayer,
					vocalSeekArea,
					instrumentalSeekArea,
					setAudioSynchronizer,
				});
			}
			const track = await useRandomTrack(getAnonymousId());
			return await setupAudioPlayers({
				track: track.data,
				vocalPlayer,
				instrumentalPlayer,
				vocalSeekArea,
				instrumentalSeekArea,
				setAudioSynchronizer,
			});
		},
	});
	const setupAudioPlayers = async ({
		track,
		vocalPlayer,
		instrumentalPlayer,
		vocalSeekArea,
		instrumentalSeekArea,
		setAudioSynchronizer,
	}: SetupTrackProp) => {
		const { info } = track;
		const minutes = Math.floor(info.length / 60);
		const seconds = ((info.length % 60) * 0.6).toFixed(0);
		const duration = minutes * 60 + Number.parseFloat(seconds);

		// Setup WaveSurfer instances
		instrumentalSeekArea.innerHTML = "";
		const instrumentalWaveSurfer = setupWaveSurfer(
			instrumentalSeekArea,
			info.instrumentalWaveform.data,
			duration,
		);
		let vocalWaveSurfer: WaveSurfer | undefined;
		if (!info.instrumental && info.vocalWaveform) {
			vocalSeekArea.innerHTML = "";
			vocalWaveSurfer = setupWaveSurfer(
				vocalSeekArea,
				info.vocalWaveform.data,
				duration,
			);
		}

		// Setup HLS streams
		const instrumentalHls = await setupHls(
			`${import.meta.env.VITE_STATIC_URL}/${track.savedInstrumentalFolderPath}/playlist.m3u8`,
			instrumentalPlayer,
		);

		let vocalHls: Hls | null = null;
		if (!info.instrumental && track.savedVocalFolderPath) {
			vocalHls = await setupHls(
				`${import.meta.env.VITE_STATIC_URL}/${track.savedVocalFolderPath}/playlist.m3u8`,
				vocalPlayer,
			);
		}
		const sync = new AudioSynchronizer(
			instrumentalPlayer,
			instrumentalWaveSurfer,
			track.info.instrumental,
			duration,
			vocalWaveSurfer,
			vocalPlayer,
		);
		setAudioSynchronizer(sync);

		instrumentalWaveSurfer.on("seeking", (currentTime) => {
			sync.syncPlayers(currentTime);
		});
		instrumentalPlayer.addEventListener("playing", () => {
			instrumentalWaveSurfer.play();
			if (vocalWaveSurfer) {
				vocalWaveSurfer.play();
			}
		});
		if (vocalWaveSurfer) {
			vocalWaveSurfer.on("seeking", (currentTime) => {
				sync.syncPlayers(currentTime);
			});
		}

		return {
			track,
			instrumentalWaveSurfer,
			vocalWaveSurfer,
			instrumentalHls,
			vocalHls,
			duration: { minutes, seconds },
		} as CurrentlyPlaying;
	};

	return {
		loadTrack: loadTrackMutation.mutate,
		isLoading: loadTrackMutation.isPending,
		currentTrack: loadTrackMutation.data,
		error: loadTrackMutation.error,
	};
};

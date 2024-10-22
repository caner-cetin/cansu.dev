import type WaveSurfer from "wavesurfer.js";

export class AudioSynchronizer {
	private isSeeking = false;
	private seekDebounceTimeout: number | null = null;
	private readonly syncThreshold: number = 0.1; // Adjust as needed

	constructor(
		private instrumentalAudioPlayer: HTMLAudioElement,
		private instrumentalWaveSurfer: WaveSurfer,
		private isInstrumental: boolean,
		private totalDurationSeconds: number,
		private vocalWaveSurfer?: WaveSurfer,
		private vocalAudioPlayer?: HTMLAudioElement,
	) {}

	syncPlayers(currentTime: number): void {
		if (this.isSeeking) return;
		this.isSeeking = true;

		if (this.seekDebounceTimeout) {
			clearTimeout(this.seekDebounceTimeout);
		}

		this.seekDebounceTimeout = setTimeout(() => {
			const normalizedTime = Number.parseFloat(currentTime.toFixed(2));
			const seekPercentage = normalizedTime / this.totalDurationSeconds;

			this.syncAudioPlayer(this.instrumentalAudioPlayer, normalizedTime);
			this.instrumentalWaveSurfer.seekTo(seekPercentage);

			if (
				!this.isInstrumental &&
				this.vocalAudioPlayer &&
				this.vocalWaveSurfer
			) {
				this.syncAudioPlayer(this.vocalAudioPlayer, normalizedTime);
				this.vocalWaveSurfer.seekTo(seekPercentage);
			}

			this.isSeeking = false;
		}, 50);
	}

	private syncAudioPlayer(player: HTMLAudioElement, targetTime: number): void {
		if (!player) return;
		if (Math.abs(player.currentTime - targetTime) > this.syncThreshold) {
			player.currentTime = targetTime;
		}
	}
}

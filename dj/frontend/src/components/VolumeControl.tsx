import type React from "react";
import { type ChangeEvent, useEffect } from "react";
import { StorageKeys } from "../types";
import type { CurrentlyPlaying } from "../hooks/useTrackPlayer";

export interface VolumeControlProps {
  instrumentalPlayerRef: React.RefObject<HTMLAudioElement>;
  vocalPlayerRef: React.RefObject<HTMLAudioElement>;
  currentTrack?: CurrentlyPlaying;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  instrumentalPlayerRef,
  vocalPlayerRef,
  currentTrack,
}) => {
  useEffect(() => {
    // Initialize both sliders on first load
    initializeVolume(
      instrumentalPlayerRef,
      StorageKeys.INSTRUMENT_VOLUME,
      "instrumentVolumeSlider",
    );
    initializeVolume(
      vocalPlayerRef,
      StorageKeys.VOCAL_VOLUME,
      "vocalVolumeSlider",
    );
  }, [instrumentalPlayerRef, vocalPlayerRef]);

  return (
    <>
      <div className="flex justify-center items-center space-x-2 mt-2">
        <img
          src="/images/mute-microphone.svg"
          height={22}
          width={22}
          id="vocalVolumeDownSVG"
          alt="Vocal Volume Down"
        />
        <input
          id="vocalVolumeSlider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          className="w-24 h-1"
          onInput={(e) => handleVolumeChange(e as React.ChangeEvent<HTMLInputElement>, undefined, vocalPlayerRef)}
          style={{
            display: currentTrack?.track.info.instrumental ? "none" : "block",
          }}
        />
        <img
          src="/images/unmute-microphone.svg"
          height={22}
          width={22}
          id="vocalVolumeUpSVG"
          alt="Vocal Volume Up"
        />
      </div>
      <div className="flex justify-center items-center space-x-2 mt-6">
        <img
          src="/images/piano-off.svg"
          height={24}
          width={24}
          alt="Instrument Volume Down"
        />
        <input
          id="instrumentVolumeSlider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          className="w-24 h-1"
          onInput={(e) => handleVolumeChange(e as React.ChangeEvent<HTMLInputElement>, instrumentalPlayerRef)}
        />
        <img
          src="/images/piano.svg"
          height={24}
          width={24}
          alt="Instrument Volume Up"
        />
      </div>
    </>
  );
};

// Helper function to load volume from local storage and initialize the slider
const initializeVolume = (
  playerRef: React.RefObject<HTMLAudioElement>,
  storageKey: string,
  sliderId: string,
) => {
  if (!playerRef?.current) return;

  const storedVolume = Number.parseFloat(
    localStorage.getItem(storageKey) || "1",
  );
  playerRef.current.volume = normalizeVolume(
    storedVolume,
    sliderId === "instrumentVolumeSlider",
  );

  const slider = document.getElementById(sliderId) as HTMLInputElement | null;
  if (slider) {
    slider.value = storedVolume.toString();
    updateSliderBackground(slider);
  }
};

/**
 * 
 * @param event If not set, volume is set to the value in local storage. If set, it must be anything that is castable to React.ChangeEvent<HTMLInputElement> such as `onInput={(e) => handleVolumeChange(e as  React.ChangeEvent<HTMLInputElement>, instrumentalPlayerRef)}
`
 * @param instrumentalPlayerRef Either vocal or instrumental player must be set
 * @param vocalPlayerRef 
 * @param muting Player volume will be set to 0 if true
 * @param fixedVolume If set, event is ignored and volume is set to this value
 * @returns 
 */
export const handleVolumeChange = (
  event?: React.ChangeEvent<HTMLInputElement>,
  instrumentalPlayerRef?: React.RefObject<HTMLAudioElement>,
  vocalPlayerRef?: React.RefObject<HTMLAudioElement>,
  muting = false,
  fixedVolume?: number,
): void => {
  const player = instrumentalPlayerRef?.current ?? vocalPlayerRef?.current;
  if (!player) return;
  const changingInstrumental = !!instrumentalPlayerRef;
  const sliderId = changingInstrumental
    ? "instrumentVolumeSlider"
    : "vocalVolumeSlider";
  const storageKey = changingInstrumental
    ? StorageKeys.INSTRUMENT_VOLUME
    : StorageKeys.VOCAL_VOLUME;
  let volume: number;
  if (!fixedVolume) {
    volume = event
      ? Number.parseFloat(
        (event as ChangeEvent<HTMLInputElement>).currentTarget.value,
      )
      : Number.parseFloat(localStorage.getItem(storageKey) || "1");
  } else {
    volume = fixedVolume
  }
  if (muting) {
    player.volume = 0;
  } else {
    player.volume = normalizeVolume(volume, changingInstrumental);
    localStorage.setItem(storageKey, volume.toString());

    const slider = document.getElementById(sliderId) as HTMLInputElement | null;
    if (slider) {
      slider.value = volume.toString();
      updateSliderBackground(slider);
    }
  }
};

// Helper function to update slider background based on value
const updateSliderBackground = (slider: HTMLInputElement) => {
  const value =
    ((Number.parseFloat(slider.value) - Number.parseFloat(slider.min)) /
      (Number.parseFloat(slider.max) - Number.parseFloat(slider.min))) *
    100;
  slider.style.background = `linear-gradient(to right, white 0%, white ${value}%, #4B5563 ${value}%, #4B5563 100%)`;
};

const VOLUME_ADJUSTMENT_FACTOR = 1.30;
export const normalizeVolume = (
  volume: number,
  isInstrumental: boolean,
): number => {
  return isInstrumental
    ? volume / VOLUME_ADJUSTMENT_FACTOR
    : Math.min(volume * VOLUME_ADJUSTMENT_FACTOR, 1);
};

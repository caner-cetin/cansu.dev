import { handleVolumeChange } from "./VolumeControl";

export interface PlaybackControlProps {
  instrumentalPlayerRef: React.RefObject<HTMLAudioElement>;
  vocalPlayerRef: React.RefObject<HTMLAudioElement>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  isPaused: boolean;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PlaybackControl: React.FC<PlaybackControlProps> = ({
  instrumentalPlayerRef,
  vocalPlayerRef,
  isPaused,
  setIsPaused,
  isMuted,
  setIsMuted
}) => {
  const handlePlayPause = () => {
    if (!vocalPlayerRef.current || !instrumentalPlayerRef.current) return;

    if (isPaused) {
      Promise.all([
        vocalPlayerRef.current.play(),
        instrumentalPlayerRef.current.play(),
      ])
        .then(() => {
          setIsPaused(false);
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    } else {
      vocalPlayerRef.current.pause();
      instrumentalPlayerRef.current.pause();
      setIsPaused(true);
    }
  };
  return (
    <div className="flex justify-center space-x-8 mt-2">
      <img
        src={isPaused ? "/images/play.svg" : "/images/pause-button.svg"}
        width={16}
        height={16}
        alt={isPaused ? "Play" : "Pause"}
        className="cursor-pointer"
        onClick={handlePlayPause}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handlePlayPause();
          }
        }}
      />
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <todo> */}
      <img
        src="/images/mute-button.svg"
        width={22}
        height={22}
        alt="Mute"
        className="cursor-pointer"
        onClick={() => {
          handleVolumeChange(
            undefined,
            instrumentalPlayerRef,
            undefined,
            !isMuted,
            0
          );
          handleVolumeChange(
            undefined,
            undefined,
            vocalPlayerRef,
            !isMuted,
            0
          );
          setIsMuted(!isMuted);
        }}
      />
    </div>
  );
};

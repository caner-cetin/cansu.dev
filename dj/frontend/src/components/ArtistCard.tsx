import type React from 'react';

interface Props {
  artist: string;
  genre: string;
  songCount: number;
}

const ArtistCard: React.FC<Props> = ({ artist, genre, songCount }) => {
  return (
    <div className="flex items-center space-x-4 p-2 border-b border-gray-700">
      <img
        src={`${import.meta.env.VITE_API_URL}/artist/photo?name=${encodeURIComponent(artist)}`}
        alt={artist}
        className="w-16 h-16 object-cover"
      />
      <div className="flex-grow">
        <h3 className="font-semibold">{artist}</h3>
        <p className="text-sm text-gray-400">{genre}</p>
        <p className="text-xs text-gray-500">
          {songCount} tracks
        </p>
      </div>
    </div>
  );
};

export default ArtistCard;
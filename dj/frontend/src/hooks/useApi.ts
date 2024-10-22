import { useQuery, type QueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export interface Album {
	id: string;
	name: string;
	cover_extension: string;
}

export interface Track {
	id: string;
	cover: string;
	info: {
		title: string;
		artist: string;
		album: string;
		length: number;
		genre: string;
		vocalWaveform?: { data: number[] };
		instrumentalWaveform: { data: number[] };
		tempo: number;
		instrumental: boolean;
		key: string;
	};
	savedAlbumName: string;
	coverExtension: string;
	savedVocalFolderPath: string;
	savedInstrumentalFolderPath: string;
}

export interface AlbumsResponse {
	albums: Album[];
	total: number;
}

export interface ArtistAlbum {
	artist: string;
	genre: string | null;
	album_id: string;
	album_name: string;
	track_count: number;
}

export const useAlbums = (page: number, limit: number) => {
	return useQuery<AlbumsResponse>({
		queryKey: ["albums", page, limit],
		queryFn: async () => {
			const { data } = await api.get(`/albums?page=${page}&limit=${limit}`);
			return data;
		},
	});
};

export const useAlbumTracks = (albumId: string) => {
	return useQuery({
		queryKey: ["albumTracks", albumId],
		queryFn: async () => {
			const { data } = await api.get(`/track/album/${albumId}`);
			return data;
		},
		enabled: !!albumId,
	});
};

export const useTrack = async (trackId: string) => {
	return await api.get(`/track/${trackId}`);
};

export const useArtistPhoto = (artistName: string) => {
	return useQuery({
		queryKey: ["artistPhoto", artistName],
		queryFn: async () => {
			const response = await api.get(`/artist/photo?name=${artistName}`, {
				responseType: "blob",
			});
			return URL.createObjectURL(response.data);
		},
		enabled: !!artistName,
	});
};

export const useArtistsAlbums = (options: {
	paged: boolean;
	page?: number;
	perPage?: number;
	albumIds?: string[];
}) => {
	return useQuery<ArtistAlbum[]>({
		queryKey: ["artistsAlbums", options],
		queryFn: async () => {
			if (options.paged) {
				const { data } = await api.post(
					`/artists-albums?paged=true&page=${options.page}&per_page=${options.perPage}`,
				);
				return data;
			}
			const { data } = await api.post(
				"/artists-albums?paged=false",
				options.albumIds,
			);
			return data;
		},
		staleTime: 3600 * 2,
		refetchInterval: 3600,
	});
};

export const useSearchAlbums = (query: string) => {
	return useQuery<string[]>({
		queryKey: ["searchAlbums", query],
		queryFn: async () => {
			const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
			return data;
		},
		enabled: !!query,
	});
};

export const useRandomTrack = async (anonId: string) => {
	return await api.post<Track>("/track/random", {
		anonId,
	});
};

export const prefetchAlbums = async (
	queryClient: QueryClient,
	page: number,
	limit: number,
) => {
	await queryClient.prefetchQuery({
		queryKey: ["albums", page, limit],
		queryFn: async () => {
			const { data } = await api.get(`/albums?page=${page}&limit=${limit}`);
			return data;
		},
	});
};

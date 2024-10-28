import axios, { type AxiosError } from "axios";
import toast from "react-hot-toast";
const api = axios.create({
	baseURL: `${import.meta.env.VITE_BACKEND_PROTOCOL ?? "http"}://${import.meta.env.VITE_BACKEND_URI}:${import.meta.env.VITE_BACKEND_PORT ?? ""}`,
});
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("accessToken");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error: Error | AxiosError) => {
		if (axios.isAxiosError(error)) {
			const response = error.response;
			if (!response) {
				return Promise.reject(error);
			}
			toast.error(response.data.message);
		}
		return Promise.reject(error);
	},
);

export default api;

import axios from "axios";
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
	async (error) => {
		return Promise.reject(error);
	},
);

export default api;

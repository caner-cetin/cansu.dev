// api.ts
import axios from "axios";

export const api = axios.create({
	baseURL: "https://api.cansu.dev",
});
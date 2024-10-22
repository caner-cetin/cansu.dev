/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_KINDE_CLIENT_ID: string;
	readonly VITE_KINDE_DOMAIN: string;
	readonly VITE_KINDE_REDIRECT_URI: string;
	readonly VITE_KINDE_LOGOUT_URI: string;
	readonly VITE_BACKEND_URI: string;
	readonly VITE_BACKEND_PORT: string | undefined;
	readonly VITE_BACKEND_PROTOCOL: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUTHN_TYPE?: string;
  readonly VITE_SSO_NO_AUTH_REDIRECT?: string;
  readonly VITE_SSO_LOGOUT_REDIRECT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

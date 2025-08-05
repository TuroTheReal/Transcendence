/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MAIN_PORT?: string;
      HTTP_REDIRECT_PORT?: string;
      HTTPS_PORT?: string;
      FRONTEND_URL?: string;
      JWT_SECRET?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      GOOGLE_REDIRECT_URI?: string;
      NODE_ENV?: string;
    }
  }
}

export {};
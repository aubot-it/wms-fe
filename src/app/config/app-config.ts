import { InjectionToken } from '@angular/core';

export interface OidcRuntimeConfig {
  issuer: string;
  clientId: string;
  requireHttps?: boolean;
  showDebugInformation?: boolean;
}

export interface AppRuntimeConfig {
  /**
   * Base URL prefix for backend APIs.
   * - Recommended: "/wcs" and use reverse-proxy in ingress/nginx.
   * - Can also be full URL, e.g. "https://api.example.com/wcs"
   */
  apiBaseUrl: string;

  /**
   * Optional Swagger UI URL shown in error messages.
   */
  swaggerUrl?: string;

  /**
   * OIDC config for login (public information, NOT secrets).
   */
  oidc: OidcRuntimeConfig;
}

declare global {
  // Loaded from `/app-config.js` at runtime (see `src/server.ts` + `src/index.html`)
  // eslint-disable-next-line no-var
  var __APP_CONFIG: AppRuntimeConfig | undefined;
}

const DEFAULT_CONFIG: AppRuntimeConfig = {
  apiBaseUrl: '/wcs',
  swaggerUrl: undefined,
  oidc: {
    issuer: '',
    clientId: 'angular-client',
    requireHttps: true,
    showDebugInformation: false
  }
};

export function readRuntimeConfig(): AppRuntimeConfig {
  const g = globalThis as any;
  const fromWindow = g.__APP_CONFIG as Partial<AppRuntimeConfig> | undefined;

  // SSR/Node fallback: allow env vars without `/app-config.js`
  const env = (typeof process !== 'undefined' ? (process.env as any) : {}) ?? {};

  const apiBaseUrl = (fromWindow?.apiBaseUrl ?? env.API_BASE_URL ?? DEFAULT_CONFIG.apiBaseUrl) as string;
  const swaggerUrl = (fromWindow?.swaggerUrl ?? env.SWAGGER_URL ?? DEFAULT_CONFIG.swaggerUrl) as
    | string
    | undefined;

  const issuer = (fromWindow?.oidc?.issuer ?? env.OIDC_ISSUER ?? DEFAULT_CONFIG.oidc.issuer) as string;
  const clientId = (fromWindow?.oidc?.clientId ?? env.OIDC_CLIENT_ID ?? DEFAULT_CONFIG.oidc.clientId) as string;

  const requireHttpsRaw =
    fromWindow?.oidc?.requireHttps ?? env.OIDC_REQUIRE_HTTPS ?? DEFAULT_CONFIG.oidc.requireHttps;
  const showDebugRaw =
    fromWindow?.oidc?.showDebugInformation ??
    env.OIDC_SHOW_DEBUG ??
    DEFAULT_CONFIG.oidc.showDebugInformation;

  const requireHttps =
    typeof requireHttpsRaw === 'boolean'
      ? requireHttpsRaw
      : String(requireHttpsRaw).toLowerCase() === 'true';

  const showDebugInformation =
    typeof showDebugRaw === 'boolean' ? showDebugRaw : String(showDebugRaw).toLowerCase() === 'true';

  return {
    apiBaseUrl,
    swaggerUrl,
    oidc: {
      issuer,
      clientId,
      requireHttps,
      showDebugInformation
    }
  };
}

export const APP_CONFIG = new InjectionToken<AppRuntimeConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: readRuntimeConfig
});


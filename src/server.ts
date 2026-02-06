import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Runtime config endpoint.
 * This allows changing config via ENV variables WITHOUT rebuilding the image.
 * NOTE: Do not put secrets here (this is served to browsers).
 */
app.get('/app-config.js', (_req, res) => {
  const config = {
    apiBaseUrl: process.env['API_BASE_URL'] || '/wcs',
    swaggerUrl: process.env['SWAGGER_URL'] || '',
    oidc: {
      issuer: process.env['OIDC_ISSUER'] || '',
      clientId: process.env['OIDC_CLIENT_ID'] || 'angular-client',
      requireHttps: (process.env['OIDC_REQUIRE_HTTPS'] || 'true').toLowerCase() === 'true',
      showDebugInformation: (process.env['OIDC_SHOW_DEBUG'] || 'false').toLowerCase() === 'true',
    },
  };

  // Normalize empty strings to undefined-like values in browser code.
  if (!config.swaggerUrl) delete (config as any).swaggerUrl;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.send(`window.__APP_CONFIG = ${JSON.stringify(config)};`);
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on port ${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Digital Menu - Swagger API Documentation</title>
  <link rel="icon" type="image/png" href="/favicon.ico" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-gold: #B89334;
      --primary-gold-hover: #D4AF37;
      --bg-dark: #0D0E12;
      --surface-dark: #16181F;
      --surface-border: #262933;
      --text-light: #F4F4F6;
      --text-muted: #9CA3AF;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-light);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header.api-header {
      background: linear-gradient(180deg, #1A1C24 0%, #12131A 100%);
      border-bottom: 1px solid var(--surface-border);
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .brand-logo {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, var(--primary-gold) 0%, #7E611D 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-size: 1.4rem;
      font-weight: 700;
      box-shadow: 0 2px 10px rgba(184, 147, 52, 0.3);
    }

    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 0.05em;
    }

    .brand-subtitle {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--primary-gold);
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .btn-gold {
      background: linear-gradient(135deg, var(--primary-gold) 0%, #9E7D28 100%);
      color: #000000;
    }
    .btn-gold:hover {
      background: linear-gradient(135deg, var(--primary-gold-hover) 0%, var(--primary-gold) 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(184, 147, 52, 0.3);
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--surface-border);
      color: var(--text-light);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--primary-gold);
    }

    /* Swagger Custom Dark & Gold Styling */
    #swagger-ui {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 1rem 4rem;
      width: 100%;
    }

    .swagger-ui {
      color: #E2E8F0;
    }

    .swagger-ui .info {
      margin: 2rem 0;
    }
    .swagger-ui .info .title {
      color: #FFFFFF;
      font-family: 'Cinzel', serif;
      font-size: 2.2rem;
    }
    .swagger-ui .info p, .swagger-ui .info li {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .swagger-ui .info a {
      color: var(--primary-gold);
    }

    .swagger-ui .scheme-container {
      background: var(--surface-dark);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      margin-bottom: 2rem;
    }

    .swagger-ui .btn.authorize {
      background-color: var(--primary-gold) !important;
      color: #000000 !important;
      border-color: var(--primary-gold) !important;
      font-weight: 700;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(184, 147, 52, 0.3);
    }
    .swagger-ui .btn.authorize svg {
      fill: #000000;
    }

    .swagger-ui .opblock-tag {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
      border-bottom: 1px solid var(--surface-border);
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
    }

    .swagger-ui .opblock {
      background: var(--surface-dark);
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .swagger-ui .opblock.opblock-post {
      border-color: rgba(73, 204, 144, 0.3);
      background: rgba(73, 204, 144, 0.05);
    }
    .swagger-ui .opblock.opblock-get {
      border-color: rgba(97, 175, 254, 0.3);
      background: rgba(97, 175, 254, 0.05);
    }
    .swagger-ui .opblock.opblock-put {
      border-color: rgba(252, 161, 48, 0.3);
      background: rgba(252, 161, 48, 0.05);
    }
    .swagger-ui .opblock.opblock-delete {
      border-color: rgba(249, 62, 62, 0.3);
      background: rgba(249, 62, 62, 0.05);
    }
    .swagger-ui .opblock.opblock-patch {
      border-color: rgba(80, 227, 194, 0.3);
      background: rgba(80, 227, 194, 0.05);
    }

    .swagger-ui .opblock .opblock-summary-operation-id,
    .swagger-ui .opblock .opblock-summary-path,
    .swagger-ui .opblock .opblock-summary-path__deprecated {
      color: #FFFFFF;
      font-weight: 600;
    }

    .swagger-ui .opblock .opblock-summary-description {
      color: var(--text-muted);
    }

    .swagger-ui table.parameters {
      color: #E2E8F0;
    }
    .swagger-ui table.parameters thead th {
      color: var(--text-muted);
      border-bottom: 1px solid var(--surface-border);
    }
    .swagger-ui table.parameters td {
      border-bottom: 1px solid var(--surface-border);
    }

    .swagger-ui input[type=text], .swagger-ui textarea {
      background: #0E1015 !important;
      color: #FFFFFF !important;
      border: 1px solid var(--surface-border) !important;
      border-radius: 6px;
    }

    .swagger-ui select {
      background: #0E1015 !important;
      color: #FFFFFF !important;
      border: 1px solid var(--surface-border) !important;
    }

    .swagger-ui .response-col_status {
      color: #FFFFFF;
      font-weight: 700;
    }

    .swagger-ui .model-box, .swagger-ui section.models {
      background: var(--surface-dark);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
    }
    .swagger-ui section.models h4 {
      color: #FFFFFF;
    }

    .swagger-ui .model {
      color: #E2E8F0;
    }

    .swagger-ui .topbar {
      display: none;
    }
  </style>
</head>
<body>
  <header class="api-header">
    <div class="brand-section">
      <div class="brand-logo">H</div>
      <div>
        <div class="brand-title">Hotel Digital Menu</div>
        <div class="brand-subtitle">Management & Guest Operations API</div>
      </div>
    </div>
    <div class="header-actions">
      <a href="/api/openapi.json" target="_blank" class="btn btn-outline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Download OpenAPI Spec (JSON)
      </a>
      <a href="/" class="btn btn-gold">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        Back to App
      </a>
    </div>
  </header>

  <main id="swagger-ui"></main>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        persistAuthorization: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

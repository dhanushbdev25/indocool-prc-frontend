export default {
    async fetch(request, env, ctx) {
      try {
        // Let Cloudflare serve static files first
        const asset = await env.ASSETS.fetch(request);
        if (asset.status !== 404) return asset;
  
        // SPA fallback: if no static file, serve index.html
        const url = new URL(request.url);
        if (!url.pathname.startsWith("/api")) {
          return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
        }
  
        // Optionally: handle APIs or return custom 404
        return new Response("Not found", { status: 404 });
      } catch (err) {
        return new Response(`Error: ${err.message}`, { status: 500 });
      }
    },
  };
  
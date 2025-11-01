export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      // Try to serve a static asset first
      let response = await env.ASSETS.fetch(request);
  
      // If 404 and no file extension (likely an SPA route), fallback to index.html
      if (response.status === 404 && !url.pathname.includes('.')) {
        response = await env.ASSETS.fetch('index.html');
      }
  
      return response;
    }
  };
  
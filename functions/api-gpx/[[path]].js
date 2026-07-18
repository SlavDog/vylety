export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Reconstruct the target URL on the WEDOS host
  const targetUrl = request.url.replace(url.origin + '/api-gpx', 'https://mudr-alena-hamplova.cz');
  
  // Clone incoming headers and remove Host header to let fetch handle it
  const headers = new Headers(request.headers);
  headers.delete('host');
  
  // Construct the proxied request
  const newRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
  });
  
  try {
    const response = await fetch(newRequest);
    
    // Copy response headers and append permissive CORS headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', '*');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  } catch (error) {
    return new Response('Proxy Error: ' + error.message, { status: 500 });
  }
}

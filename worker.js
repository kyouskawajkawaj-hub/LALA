// Cloudflare Worker that proxies the Google Cloud Vision API
const VISION_API_KEY = 'AIzaSyCgIfvP2uPr_n0g_Q2v8Gy8RNFfivnYlvI'; // Keep secret!

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === '/ocr' && request.method === 'POST') {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    if (!imageFile) return new Response('Missing image', { status: 400 });

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }
    );

    const visionData = await visionResponse.json();
    const text = visionData.responses?.[0]?.fullTextAnnotation?.text || '';
    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not found', { status: 404 });
}

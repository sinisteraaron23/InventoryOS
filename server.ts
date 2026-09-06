import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
  width?: number;
  height?: number;
}

async function searchGoogleCSE(query: string, apiKey: string, cx: string): Promise<ImageResult[]> {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&searchType=image&num=10&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: Array<{
        title?: string;
        link?: string;
        image?: {
          thumbnailLink?: string;
          width?: number;
          height?: number;
          contextLink?: string;
        };
      }>;
    };

    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map((item) => ({
      title: item.title || query,
      url: item.link || '',
      thumbnail: item.image?.thumbnailLink || item.link || '',
      source: 'Google Images',
      width: item.image?.width,
      height: item.image?.height
    })).filter((item) => Boolean(item.url));
  } catch (err) {
    console.warn('Google Custom Search API error:', err);
    return [];
  }
}

async function searchWebImages(query: string): Promise<ImageResult[]> {
  try {
    // 1. Fetch token
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const tokenText = await tokenRes.text();
    const vqdMatch = tokenText.match(/vqd=([0-9-_]+)/) || tokenText.match(/vqd="([0-9-_]+)"/);
    const vqd = vqdMatch?.[1];

    if (!vqd) {
      return searchWikimedia(query);
    }

    // 2. Fetch images
    const imgRes = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    if (!imgRes.ok) {
      return searchWikimedia(query);
    }

    const data = (await imgRes.json()) as {
      results?: Array<{
        title?: string;
        image?: string;
        thumbnail?: string;
        source?: string;
        width?: number;
        height?: number;
      }>;
    };

    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return searchWikimedia(query);
    }

    return data.results.slice(0, 30).map((item) => ({
      title: item.title || query,
      url: item.image || '',
      thumbnail: item.thumbnail || item.image || '',
      source: item.source || 'Web Image',
      width: item.width,
      height: item.height
    })).filter((item) => Boolean(item.url));
  } catch (err) {
    console.warn('Web image search fallback error:', err);
    return searchWikimedia(query);
  }
}

async function searchWikimedia(query: string): Promise<ImageResult[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=16&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: {
        pages?: Record<string, {
          title?: string;
          imageinfo?: Array<{
            url?: string;
            thumburl?: string;
            width?: number;
            height?: number;
          }>;
        }>;
      };
    };

    const pages = data.query?.pages;
    if (!pages) return [];

    const results: ImageResult[] = [];
    for (const key of Object.keys(pages)) {
      const page = pages[key];
      const info = page.imageinfo?.[0];
      if (info?.url) {
        results.push({
          title: page.title?.replace(/^File:/i, '') || query,
          url: info.url,
          thumbnail: info.thumburl || info.url,
          source: 'Wikimedia Commons',
          width: info.width,
          height: info.height
        });
      }
    }
    return results;
  } catch (err) {
    console.warn('Wikimedia search error:', err);
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Image search endpoint
  app.get('/api/search-images', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      res.status(400).json({ error: 'Search query parameter "q" is required' });
      return;
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID;

    let results: ImageResult[] = [];
    let engine = 'web';

    if (apiKey && cx) {
      results = await searchGoogleCSE(query, apiKey, cx);
      if (results.length > 0) {
        engine = 'google_cse';
      }
    }

    // If Google CSE wasn't configured or returned 0 results, use web image search
    if (results.length === 0) {
      results = await searchWebImages(query);
      engine = 'web_images';
    }

    res.json({
      success: true,
      query,
      engine,
      total: results.length,
      results
    });
  });

  // Image proxy endpoint to handle hotlink-protected or CORS-blocked images
  app.get('/api/proxy-image', async (req, res) => {
    const targetUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      res.status(400).json({ error: 'Valid "url" query parameter required' });
      return;
    }

    try {
      const urlObj = new URL(targetUrl);
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': `${urlObj.origin}/`
        }
      });

      if (!response.ok) {
        res.status(response.status).json({ error: `Upstream returned status ${response.status}` });
        return;
      }

      let contentType = response.headers.get('content-type') || 'image/jpeg';

      // If upstream returned HTML (e.g. user pasted product page URL), try to extract og:image or twitter:image
      if (contentType.includes('text/html')) {
        const html = await response.text();
        const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
        if (ogMatch && ogMatch[1]) {
          let ogUrl = ogMatch[1];
          if (ogUrl.startsWith('/')) {
            ogUrl = new URL(ogUrl, urlObj.origin).toString();
          }
          const ogRes = await fetch(ogUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'image/*,*/*',
              'Referer': `${urlObj.origin}/`
            }
          });
          if (ogRes.ok) {
            const ogContentType = ogRes.headers.get('content-type') || 'image/jpeg';
            res.setHeader('Content-Type', ogContentType);
            res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
            const ogBuf = await ogRes.arrayBuffer();
            res.send(Buffer.from(ogBuf));
            return;
          }
        }
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to proxy image', details: errorMsg });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

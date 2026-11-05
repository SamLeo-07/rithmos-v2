import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'node:fs';
import { handle } from './netlify/functions/cms-core.mjs';

// Local stand-in for the Netlify content function: same handler, files in .cms-data/ instead of Netlify Blobs.
function cmsDevApi() {
  const root = resolve(__dirname, '.cms-data');
  const file = (key) => resolve(root, key.replace(/[^\w./-]/g, '_'));
  const store = {
    async getJSON(key) {
      try { return JSON.parse(fs.readFileSync(file(key) + '.json', 'utf8')); } catch (e) { return null; }
    },
    async setJSON(key, value) {
      fs.mkdirSync(resolve(file(key), '..'), { recursive: true });
      fs.writeFileSync(file(key) + '.json', JSON.stringify(value));
    },
    async getBin(key) {
      try {
        return { data: fs.readFileSync(file(key)), type: fs.readFileSync(file(key) + '.type', 'utf8') };
      } catch (e) { return null; }
    },
    async setBin(key, buf, type) {
      fs.mkdirSync(resolve(file(key), '..'), { recursive: true });
      fs.writeFileSync(file(key), buf);
      fs.writeFileSync(file(key) + '.type', type);
    },
    async list(prefix) {
      try {
        return fs.readdirSync(file(prefix)).filter((f) => f.endsWith('.json')).map((f) => prefix + f.slice(0, -5));
      } catch (e) { return []; }
    },
    async del(key) {
      try { fs.unlinkSync(file(key) + '.json'); } catch (e) { /* already gone */ }
    }
  };
  return {
    name: 'cms-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const media = url.pathname.match(/^\/cms-media\/([^/]+)$/);
        if (url.pathname !== '/.netlify/functions/cms' && !media) return next();
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          try {
            const query = Object.fromEntries(url.searchParams);
            if (media) query.media = media[1];
            const out = await handle(
              { method: req.method, query, headers: req.headers, body: Buffer.concat(chunks) },
              store,
              { ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123' }
            );
            res.statusCode = out.status;
            Object.entries(out.headers).forEach(([k, v]) => res.setHeader(k, v));
            res.end(out.body);
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err && err.message) }));
          }
        });
      });
    }
  };
}

function multiPageMiddleware() {
  return {
    name: 'multi-page-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0];
        if (url === '/about' || url === '/about/') {
          req.url = '/about/index.html';
        } else if (url === '/competition' || url === '/competition/') {
          req.url = '/competition/index.html';
        } else if (url === '/contact' || url === '/contact/') {
          req.url = '/contact/index.html';
        } else if (url === '/register' || url === '/register/') {
          res.statusCode = 301;
          res.setHeader('Location', '/contact/#register-band');
          return res.end();
        } else if (url === '/sponsors' || url === '/sponsors/') {
          req.url = '/sponsors/index.html';
        } else if (url === '/admin' || url === '/admin/') {
          req.url = '/admin/index.html';
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [cmsDevApi(), multiPageMiddleware()],
  server: {
    port: 5045,
    open: false,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about/index.html'),
        competition: resolve(__dirname, 'competition/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        sponsors: resolve(__dirname, 'sponsors/index.html'),
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  }
});

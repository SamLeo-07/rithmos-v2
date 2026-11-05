// Netlify function: /.netlify/functions/cms (also reached as /cms-media/<id>, see netlify.toml)
import { getStore } from '@netlify/blobs';
import { handle } from './cms-core.mjs';

function blobStore() {
  const s = getStore({ name: 'rithmos-cms', consistency: 'strong' });
  return {
    getJSON: (key) => s.get(key, { type: 'json' }),
    setJSON: (key, value) => s.setJSON(key, value),
    async getBin(key) {
      const entry = await s.getWithMetadata(key, { type: 'arrayBuffer' });
      if (!entry) return null;
      return { data: Buffer.from(entry.data), type: (entry.metadata && entry.metadata.type) || 'application/octet-stream' };
    },
    setBin: (key, buf, type) => s.set(key, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), { metadata: { type } }),
    async list(prefix) {
      const { blobs } = await s.list({ prefix });
      return blobs.map((b) => b.key);
    },
    del: (key) => s.delete(key)
  };
}

export default async (request) => {
  const url = new URL(request.url);
  const body = request.method === 'POST' ? Buffer.from(await request.arrayBuffer()) : null;
  const res = await handle(
    { method: request.method, query: Object.fromEntries(url.searchParams), headers: Object.fromEntries(request.headers), body },
    blobStore(),
    process.env
  );
  return new Response(res.body, { status: res.status, headers: res.headers });
};

const CACHE_NAME = 'contas-mensais-v2';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Nunca intercepta chamadas de API (Supabase, BACEN, etc) - sempre direto na rede,
  // já que os dados do app têm que vir sempre atualizados.
  if(url.origin !== self.location.origin) return;
  if(event.request.method !== 'GET') return;

  // Rede primeiro: o app muda com frequência e o usuário precisa sempre da versão mais nova logo
  // após cada deploy (cache-first deixava ele rodando a versão antiga). O cache só serve offline.
  // "no-cache" força revalidar com o servidor em vez de usar a cópia do cache HTTP (GitHub Pages: 10 min).
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' }).then(resp => {
      if(resp.ok){
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return resp;
    }).catch(() => caches.match(event.request))
  );
});

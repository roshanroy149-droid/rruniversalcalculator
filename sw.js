const CACHE_NAME = 'tallybench-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/icons.svg',
  '/favicon.svg',
  '/percentage-calculator.html',
  '/age-calculator.html',
  '/currency-converter.html',
  '/bmi-calculator.html',
  '/loan-calculator.html',
  '/mortgage-calculator.html',
  '/tax-calculator.html',
  '/gst-vat-calculator.html',
  '/days-calculator.html',
  '/calorie-calculator.html',
  '/unit-converter.html',
  '/discount-calculator.html',
  '/investment-calculator.html',
  '/gpa-calculator.html',
  '/scientific-calculator.html',
  '/tip-calculator.html',
  '/password-generator.html',
  '/word-counter.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin pages/assets, network-first fallback for everything else
// (leaves ads, the live currency API, and other third-party calls untouched)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});

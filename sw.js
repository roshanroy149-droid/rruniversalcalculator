const CACHE_NAME = 'tallybench-v3';
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
  '/word-counter.html',
  '/fd-calculator.html',
  '/rd-calculator.html',
  '/ppf-calculator.html',
  '/hra-calculator.html',
  '/break-even-calculator.html',
  '/week-number-calculator.html',
  '/cm-to-inches.html',
  '/kg-to-pounds.html',
  '/celsius-to-fahrenheit.html'
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

// Network-first for same-origin requests: always try the network first so a
// deploy shows up immediately, only falling back to the cached copy when
// offline (leaves ads, the live currency API, and other third-party calls
// untouched). Previously this was cache-first-forever, which meant a
// returning visitor could keep seeing a stale page indefinitely regardless
// of how many times the site was redeployed, unless CACHE_NAME was bumped.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
  );
});

/* Service worker mínimo: só existe para o navegador oferecer "Instalar app".
   Não guarda nada em cache: tudo continua vindo da rede, então o site sempre mostra a versão mais nova. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* sem cache: o navegador busca na rede normalmente */ });

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Configuração do Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBTcB8_-W7ZY0wkNplxXSNuPKceGlfzHdQ",
  authDomain: "desapego-piaui-app.firebaseapp.com",
  projectId: "desapego-piaui-app",
  storageBucket: "desapego-piaui-app.firebasestorage.app",
  messagingSenderId: "956750146757",
  appId: "1:956750146757:web:f74641720fc2d5d8f614ac",
  measurementId: "G-998KLBW15Q"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[App DesapegoPI] Nova notificação em segundo plano:', payload);
  
  const notificationTitle = payload.notification.title || 'Desapego Piauí';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-512x512.png',
    badge: '/icon-512x512.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 👇 REGRAS OBRIGATÓRIAS DO PWA (Para passar no PWABuilder) 👇

self.addEventListener('install', (event) => {
  console.log('[App DesapegoPI] Service Worker Instalado!');
  self.skipWaiting(); // Força a atualização imediata
});

self.addEventListener('activate', (event) => {
  console.log('[App DesapegoPI] Service Worker Ativado!');
  event.waitUntil(self.clients.claim()); // Assume o controlo das páginas imediatamente
});

self.addEventListener('fetch', (event) => {
  // Uma resposta básica para rede que o PWABuilder reconhece e aprova
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("Você está offline. Verifique a sua ligação à internet.");
    })
  );
});
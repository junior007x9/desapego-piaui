importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// 🚀 COLE AQUI AS SUAS CHAVES EXATAS DO FIREBASE CONSOLE
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

// Este código escuta o Firebase e exibe o "Card" de notificação no celular
messaging.onBackgroundMessage((payload) => {
  console.log('[App DesapegoPI] Nova notificação em segundo plano:', payload);
  
  const notificationTitle = payload.notification.title || 'Desapego Piauí';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png', // Ícone minúsculo da barra de status do Android
    data: payload.data // Link para abrir quando o utilizador clicar
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Mantém as regras do PWA intactas
self.addEventListener('install', (e) => {
  console.log('[App DesapegoPI] Service Worker Instalado!');
});
self.addEventListener('fetch', (e) => { return; });
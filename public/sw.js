self.addEventListener('install', (e) => {
  console.log('[App DesapegoPI] Instalado com sucesso!');
});

self.addEventListener('fetch', (e) => {
  // Mantém a navegação normal da internet
  return;
});
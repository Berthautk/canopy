// Clic sur une notification de rappel : ouvre (ou remet au premier plan) Yeshaya sur la bonne page.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const lien = (e.notification.data && e.notification.data.lien) || '';
  const url = self.location.origin + '/' + lien;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) { c.navigate?.(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});

let webNotificationsEnabled = false;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[Notif] Navegador no soporta notificaciones web.');
    return;
  }
  if (Notification.permission === 'granted') {
    webNotificationsEnabled = true;
    return;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    webNotificationsEnabled = (permission === 'granted');
  }
}

export function sendWebNotification(pillName) {
  if (!webNotificationsEnabled) return;
  try {
    const notif = new Notification('Hora de tu medicación', {
      body: `Es hora de tomar ${pillName}`,
      icon: './icon-512.png',
      badge: './icon-512.png',
      tag: 'pill-reminder', // Evita duplicados
      renotify: true,
      requireInteraction: true
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (e) {
    console.log('[Notif] Error al enviar notificación web:', e);
  }
}

// Capacitor Local Notifications 
let CapacitorNotifications = null;

export async function initCapacitorNotifications() {
  try {
    // Importar dinámicamente para que no falle en web
    const module = await import('@capacitor/local-notifications');
    CapacitorNotifications = module.LocalNotifications;
    
    // Solicitar permisos
    const permResult = await CapacitorNotifications.requestPermissions();
    if (permResult.display !== 'granted') {
      console.log('[Capacitor] Permisos de notificación denegados.');
      CapacitorNotifications = null;
      return;
    }
    console.log('[Capacitor] Notificaciones locales disponibles.');
  } catch (e) {
    console.log('[Capacitor] No disponible (entorno web). Usando Web Notifications.');
    CapacitorNotifications = null;
  }
}

export async function scheduleCapacitorNotification(pill) {
  if (!CapacitorNotifications) return;
  try {
    await CapacitorNotifications.schedule({
      notifications: [{
        title: 'Hora de tu medicación',
        body: `Es hora de tomar ${pill.name}`,
        id: parseInt(pill.id) % 2147483647, // ID numérico positivo
        schedule: { at: new Date(pill.nextTime) },
        sound: 'default',
        actionTypeId: 'PILL_REMINDER',
        extra: { pillId: pill.id }
      }]
    });
    console.log(`[Capacitor] Notificación programada para ${pill.name} a las ${new Date(pill.nextTime).toLocaleTimeString()}`);
  } catch (e) {
    console.log('[Capacitor] Error programando notificación:', e);
  }
}

export async function cancelCapacitorNotification(pill) {
  if (!CapacitorNotifications) return;
  try {
    await CapacitorNotifications.cancel({
      notifications: [{ id: parseInt(pill.id) % 2147483647 }]
    });
  } catch (e) {
    console.log('[Capacitor] Error cancelando notificación:', e);
  }
}

export async function scheduleAllCapacitorNotifications(pills) {
  if (!CapacitorNotifications) return;
  for (const pill of pills) {
    await scheduleCapacitorNotification(pill);
  }
}

export function sendTelegramNotification(pillName, tgUser) {
  if (tgUser) {
    const textMsg = encodeURIComponent(`Confirmación: Me he tomado mi medicamento *${pillName}* correctamente a esta hora.`);
    const url = `https://api.callmebot.com/text.php?user=${tgUser}&text=${textMsg}`;
    
    fetch(url, { method: 'GET', mode: 'no-cors' })
      .then(() => console.log('Aviso de Telegram enviado.'))
      .catch(err => console.error('Fallo de conexión al enviar Telegram. El usuario podría estar sin cobertura.', err));
  }
}

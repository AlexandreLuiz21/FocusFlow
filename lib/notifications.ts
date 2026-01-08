export const NotificationManager = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações desktop.');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  getPermissionStatus: (): NotificationPermission => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  send: (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2097/2097276.png' // Placeholder for a focus icon
      });
    }
  }
};
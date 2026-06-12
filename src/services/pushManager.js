import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export async function initializePushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.warn('Push Notifications only work on physical Android/iOS devices.');
    return;
  }

  try {
    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive === 'granted') {
      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();
    } else {
      console.warn('User denied push notifications permission');
    }

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Here you would usually send this token to your backend if you had one.
      // Firebase console can send messages to "all users" without knowing tokens.
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      // Optionally show a toast alert if the user is using the app
      showInAppToast(notification.title, notification.body);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });

  } catch (err) {
    console.error('Error configuring push notifications', err);
  }
}

function showInAppToast(title, body) {
  // Simple custom toast
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'var(--clr-primary-dark)';
  toast.style.color = '#fff';
  toast.style.padding = '16px';
  toast.style.borderRadius = '12px';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
  toast.style.zIndex = '9999';
  toast.style.display = 'flex';
  toast.style.flexDirection = 'column';
  toast.style.gap = '4px';
  toast.style.minWidth = '300px';

  toast.innerHTML = `
    <div style="font-weight: bold; font-size: 14px;">🔔 ${title}</div>
    <div style="font-size: 12px; color: rgba(255,255,255,0.8);">${body}</div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

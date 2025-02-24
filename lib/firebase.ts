"use client";

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCxSbDgoAxML39Wxz2-j2EICUT3kz0YBjA",
  authDomain: "quipitmessaging.firebaseapp.com",
  projectId: "quipitmessaging",
  storageBucket: "quipitmessaging.firebasestorage.app",
  messagingSenderId: "316419716231",
  appId: "1:316419716231:web:4bad6a3741efea2f357422",
  measurementId: "G-SWZNM7770J"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const initNotifications = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        vapidKey: 'BIkM3XrQg4rlgzCh6-xNhiYWFZedp81vgayGy4bixlSDTp_1GNDrvcI1864xfR5ioiPHdi__NkoCS1rm-BSiNu4' // Get this from Firebase Console > Cloud Messaging > Web Push certificates
      });
      
      console.log('FCM Token:', currentToken);

      // Subscribe to the topic
      fetch(`https://iid.googleapis.com/iid/v1/${currentToken}/rel/topics/all_users`, {
        method: 'POST',
        headers: {
          Authorization: `key=your-server-key`  // Get from Firebase Console > Project Settings > Cloud Messaging > Server key
        }
      });
    }
  } catch (error) {
    console.error('Error getting permission:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      resolve(payload);
    });
  });
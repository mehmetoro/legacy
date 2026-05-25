import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Anonim oturum başlat ve bekle
export const initAnonymousSession = async () => {
  try {
    // Önce mevcut oturumu kontrol et
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("✅ Mevcut anonim kullanıcı:", user.uid);
          resolve(user.uid);
        } else {
          try {
            const result = await signInAnonymously(auth);
            console.log("✅ Yeni anonim kullanıcı:", result.user.uid);
            resolve(result.user.uid);
          } catch (error) {
            console.error("❌ Anonim giriş hatası:", error);
            resolve(null);
          }
        }
      });
    });
  } catch (error) {
    console.error("❌ Auth hatası:", error);
    return null;
  }
};
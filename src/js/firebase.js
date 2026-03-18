import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAFjSpQDJu5u83Fm_gCPp2IZbSWx4qZ6o0",
  authDomain: "dxn-jefe.firebaseapp.com",
  projectId: "dxn-jefe",
  storageBucket: "dxn-jefe.firebasestorage.app",
  messagingSenderId: "568818610144",
  appId: "1:568818610144:web:1db4ccb8241847b69c8585",
  measurementId: "G-VTVK29NJ5Q"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

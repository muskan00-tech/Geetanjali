import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBg3g5eKXpZ4L5y91nTs6F8nWkn4wCDFpc",
  authDomain: "geetanjali-707cc.firebaseapp.com",
  projectId: "geetanjali-707cc",
  storageBucket: "geetanjali-707cc.firebasestorage.app",
  messagingSenderId: "1029593440676",
  appId: "1:1029593440676:web:b5d07a0b64a92c03e7e131",
  measurementId: "G-VLW2SNHJM8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { signInWithEmailAndPassword, firebaseSignOut, onAuthStateChanged };

// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZfdXlFxjpGoKqp26S2BHCkiBoL7_xU2Q",
  authDomain: "teachingresources-8b2d4.firebaseapp.com",
  projectId: "teachingresources-8b2d4",
  storageBucket: "teachingresources-8b2d4.firebasestorage.app",
  messagingSenderId: "5331318811",
  appId: "1:5331318811:web:a9d8b0f6026d255404a0be",
  measurementId: "G-F62FK54JYJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged };
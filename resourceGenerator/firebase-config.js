/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   TeacherKit — Firebase Configuration               ║
 * ║   Edit THIS file only. All pages import from here.  ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * HOW TO SET UP:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a project (or open an existing one)
 * 3. Project Settings → Your apps → Add web app
 * 4. Copy the firebaseConfig values into the object below
 * 5. Enable Authentication → Google sign-in
 * 6. Enable Firestore Database (start in production mode)
 * 7. Set Firestore rules (see SETUP.md)
 * 8. Add your GitHub Pages domain to Auth → Authorized domains
 */

export const firebaseConfig = {
  apiKey: "AIzaSyBZfdXlFxjpGoKqp26S2BHCkiBoL7_xU2Q",
  authDomain: "teachingresources-8b2d4.firebaseapp.com",
  projectId: "teachingresources-8b2d4",
  storageBucket: "teachingresources-8b2d4.firebasestorage.app",
  messagingSenderId: "5331318811",
  appId: "1:5331318811:web:a9d8b0f6026d255404a0be",
  measurementId: "G-F62FK54JYJ"
};

export const COLLECTIONS = {
  quiz:     "quiz",
  bingo:    "bingo",
  dragSort: "drag_sort",
  spotter:  "spotter",
  board:    "board_game",
  blackout: "blackout",
};
 
/*
  ── FIRESTORE RULES ────────────────────────────────────
  Paste into Firebase Console → Firestore → Rules tab:
 
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Teachers: full CRUD on their own docs
      match /{collection}/{docId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == resource.data.uid;
        allow create: if request.auth != null;
      }
      // Students can read public spotter quizzes without login
      match /spotter/{docId} {
        allow read: if resource.data.isPublic == true;
      }
    }
  }
*/
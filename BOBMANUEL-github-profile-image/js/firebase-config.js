import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyBkkS3tqU4uybyCALugAcBrkFLHIOhj38Q',
    authDomain: 'portfolio-ccdf3.firebaseapp.com',
    projectId: 'portfolio-ccdf3',
    storageBucket: 'portfolio-ccdf3.firebasestorage.app',
    messagingSenderId: '117120354299',
    appId: '1:117120354299:web:dd76c2ce19179c1f8f2d5e'
};

// This is the only Firebase initialization in the project.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
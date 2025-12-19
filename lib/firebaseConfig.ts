import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCr6q6xI1dRl7LmCKv3DUfzooYWK3ZscV8",
    authDomain: "my-notepad-371c5.firebaseapp.com",
    databaseURL: "https://my-notepad-371c5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "my-notepad-371c5",
    storageBucket: "my-notepad-371c5.firebasestorage.app",
    messagingSenderId: "162076642320",
    appId: "1:162076642320:web:a7f332c577109d1890ce95",
    measurementId: "G-SY55FMYX8F"
};

// Initialize Firebase (Singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };

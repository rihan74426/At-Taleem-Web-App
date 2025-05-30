// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAhVsdjGLMHyXaWSbreOnso0n0BdR514BM",
  authDomain: "taleembd-d570e.firebaseapp.com",
  projectId: "taleembd-d570e",
  storageBucket: "taleembd-d570e.firebasestorage.app",
  messagingSenderId: "743585171100",
  appId: "1:743585171100:web:c59e893b24033b4c458f59",
  measurementId: "G-4JTBF9SFD0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { app, storage };

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABZ0voaJe44Bc6RuChsE7Gof_bB7mwV-Y",
  authDomain: "gogaze-813e0.firebaseapp.com",
  projectId: "gogaze-813e0",
  storageBucket: "gogaze-813e0.firebasestorage.app",
  messagingSenderId: "334220011299",
  appId: "1:334220011299:web:43d3cd87d178b36b00ce96",
  measurementId: "G-1V8HGE7PNN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
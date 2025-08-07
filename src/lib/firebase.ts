// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJ3mB5PQOQddIGIaOXTIGCQKQ4VXw8SWo",
  authDomain: "netsense-6dw2l.firebaseapp.com",
  projectId: "netsense-6dw2l",
  storageBucket: "netsense-6dw2l.appspot.com",
  messagingSenderId: "745056914052",
  appId: "1:745056914052:web:7714c9ded8ab28593550d1"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);


export { app, auth, db };

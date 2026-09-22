import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase web configuration is intentionally public; access belongs in rules.
const firebaseConfig = {
  apiKey: "AIzaSyCyPxPmvnc3PMWar_ot6eEDx9Af_-oXFxo",
  authDomain: "apeex-bb87d.firebaseapp.com",
  projectId: "apeex-bb87d",
  storageBucket: "apeex-bb87d.firebasestorage.app",
  messagingSenderId: "521739162241",
  appId: "1:521739162241:web:5a86214dd799adcd68b380",
  measurementId: "G-TB7VEWBRLJ",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);

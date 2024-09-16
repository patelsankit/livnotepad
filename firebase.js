import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJm-P0lRie7DT7nreD2sxG8Nrp9Cx22l4",
  authDomain: "notepadliv.firebaseapp.com",
  projectId: "notepadliv",
  storageBucket: "notepadliv.appspot.com",
  messagingSenderId: "538717168707",
  appId: "1:538717168707:web:b3e4910cf785732e1960f6",
  measurementId: "G-DTPEX0SLHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

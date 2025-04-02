// app/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCMvjNSiTmmrCW8Y1bwtaJFx9CXIJ8jvHA",
    authDomain: "iscf-44f40.firebaseapp.com",
    databaseURL: "https://iscf-44f40-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "iscf-44f40",
    storageBucket: "iscf-44f40.firebasestorage.app",
    messagingSenderId: "875137847747",
    appId: "1:875137847747:web:3baa107ed17a7ec520ad76",
    measurementId: "G-3D3QY9SSGR"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue };

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Update this import
import { getStorage } from 'firebase/storage';
import firebase from 'firebase/compat/app'; // Use 'compat' to enable compatibility mode
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// import 'firebase/compat/storage'; // Import storage directly
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "SECRET",
  authDomain: "SECRET",
  databaseURL: "SECRET", 
  projectId: "SECRET",
  storageBucket: "SECRET",
  messagingSenderId: "SECRET",
  appId: "SECRET"
};

let app;

if (firebase.apps.length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}


let auth;

if (Platform.OS == 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

const db = getFirestore(app);
const storage = getStorage(app); // Initialize storage directly
const rtdb = getDatabase(app);
export { db, auth, storage, rtdb ,app};
  
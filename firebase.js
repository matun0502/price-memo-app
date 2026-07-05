// Firebase 初期化と Firestore 接続 (npm モジュール版 SDK を使用)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjnZAVLTIVu3i9K5VztcAcvGZL_2yvUL8",
  authDomain: "price-memo-app.firebaseapp.com",
  projectId: "price-memo-app",
  storageBucket: "price-memo-app.firebasestorage.app",
  messagingSenderId: "324062382367",
  appId: "1:324062382367:web:6e18cb44926fff7b8e082a"
};

// Firebase アプリを初期化
export const app = initializeApp(firebaseConfig);

// Firestore データベース
export const db = getFirestore(app);
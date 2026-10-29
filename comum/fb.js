// Conexão com o Firebase (usada por todas as páginas). A configuração abaixo NÃO é secreta;
// a segurança vem das regras do Firestore (arquivo firestore.rules).
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqqUQ02RO0MgMatMY_eT1O8Pn36Q0hJVI",
  authDomain: "didaque-digital1.firebaseapp.com",
  projectId: "didaque-digital1",
  storageBucket: "didaque-digital1.firebasestorage.app",
  messagingSenderId: "651234583099",
  appId: "1:651234583099:web:490c77181d430b4a08721e"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

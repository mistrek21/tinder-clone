import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyDChJjRZD8gR1ED5s4vXkYx8veYumnMBQ0",
    authDomain: "tinder-clone-8f1c8.firebaseapp.com",
    projectId: "tinder-clone-8f1c8",
    storageBucket: "tinder-clone-8f1c8.appspot.com",
    messagingSenderId: "475945304366",
    appId: "1:475945304366:web:83f103c3fb19e58c4f7abf"
};

const app = initializeApp(firebaseConfig)
const auth = getAuth()
const db = getFirestore()

export { auth, db}
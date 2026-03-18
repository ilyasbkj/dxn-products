import '../css/style.css';
import { auth, db, provider } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const loginError = document.getElementById('login-error');
const regError = document.getElementById('reg-error');
const btnGoogleLogin = document.getElementById('btn-google-login');
const btnGoogleRegister = document.getElementById('btn-google-register');

onAuthStateChanged(auth, (user) => { if (user) window.location.href = '/'; });

function switchTab(showLogin) {
  if(showLogin) {
    tabLogin.style.color = "var(--accent-primary)";
    tabLogin.style.borderBottom = "2px solid var(--accent-primary)";
    tabRegister.style.color = "var(--text-secondary)";
    tabRegister.style.borderBottom = "none";
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
  } else {
    tabRegister.style.color = "var(--accent-primary)";
    tabRegister.style.borderBottom = "2px solid var(--accent-primary)";
    tabLogin.style.color = "var(--text-secondary)";
    tabLogin.style.borderBottom = "none";
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
  }
  loginError.style.display = 'none';
  regError.style.display = 'none';
}

tabLogin.addEventListener('click', () => switchTab(true));
tabRegister.addEventListener('click', () => switchTab(false));

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = formLogin.querySelector('button[type="submit"]');
  try {
    btn.disabled = true;
    await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
  } catch (err) {
    loginError.textContent = getSpanishError(err.code);
    loginError.style.display = 'block';
    btn.disabled = false;
  }
});

formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = formRegister.querySelector('button[type="submit"]');
  try {
    btn.disabled = true;
    const cred = await createUserWithEmailAndPassword(auth, document.getElementById('reg-email').value, document.getElementById('reg-password').value);
    await setDoc(doc(db, 'users', cred.user.uid), { uid: cred.user.uid, email: cred.user.email, role: "user" }, { merge: true });
  } catch (err) {
    regError.textContent = getSpanishError(err.code);
    regError.style.display = 'block';
    btn.disabled = false;
  }
});

async function handleGoogleAuth(errorElement) {
  try {
    const result = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, { uid: result.user.uid, email: result.user.email, role: "user" });
    }
  } catch (err) {
    errorElement.textContent = "Error al conectar con Google.";
    errorElement.style.display = 'block';
  }
}

btnGoogleLogin.addEventListener('click', () => handleGoogleAuth(loginError));
btnGoogleRegister.addEventListener('click', () => handleGoogleAuth(regError));

function getSpanishError(code) {
  if (code.includes('invalid-credential') || code.includes('user-not-found')) return 'Credenciales incorrectas.';
  if (code.includes('email-already-in-use')) return 'Este correo ya tiene una cuenta activa.';
  if (code.includes('weak-password')) return 'Contraseña demasiado corta (mínimo 6 caracteres).';
  return 'Ocurrió un error (revisa opciones de Firebase Auth y habilitar Sign-in de correo/Google).';
}

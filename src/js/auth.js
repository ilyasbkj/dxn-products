import '../css/style.css';
import { auth, db } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Referencias DOM
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const loginError = document.getElementById('login-error');
const regError = document.getElementById('reg-error');

// Redirect si ya hay sesión iniciada
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = '/';
  }
});

// Pestañas
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  formLogin.classList.remove('hidden');
  formRegister.classList.add('hidden');
  loginError.style.display = 'none';
  regError.style.display = 'none';
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  formRegister.classList.remove('hidden');
  formLogin.classList.add('hidden');
  loginError.style.display = 'none';
  regError.style.display = 'none';
});

// Submit de Login
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = formLogin.querySelector('button');
  
  try {
    btn.textContent = 'Verificando...';
    btn.disabled = true;
    
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = '/'; 
  } catch (error) {
    console.error(error);
    loginError.textContent = "Error: " + getSpanishError(error.code);
    loginError.style.display = 'block';
    btn.textContent = 'Entrar';
    btn.disabled = false;
  }
});

// Submit de Registro
formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const btn = formRegister.querySelector('button');
  
  try {
    btn.textContent = 'Creando cuenta...';
    btn.disabled = true;
    
    // Crear usuario Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Guardar rol en Firestore (por defecto user)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        role: "user" 
      });
    } catch(dbError) {
      console.warn("No se pudo escribir en 'users' (faltan reglas Firestore en el backend):", dbError);
    }
    
    window.location.href = '/';
  } catch (error) {
    console.error(error);
    regError.textContent = "Error: " + getSpanishError(error.code);
    regError.style.display = 'block';
    btn.textContent = 'Registrarme';
    btn.disabled = false;
  }
});

function getSpanishError(code) {
  switch(code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Credenciales inválidas. Verifica tu correo y contraseña.';
    case 'auth/email-already-in-use':
      return 'El correo ya está registrado.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Error de red o de configuración de Firebase.';
    default:
      return code;
  }
}

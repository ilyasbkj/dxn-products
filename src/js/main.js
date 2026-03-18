import '../css/style.css';
import { db, auth } from './firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { initI18n, setLanguage } from './i18n.js';

initI18n();

const productsContainer = document.getElementById('products-container');
const loginBtn = document.getElementById('nav-login-btn');
const adminBtn = document.getElementById('nav-admin-btn');
const logoutBtn = document.getElementById('nav-logout-btn');

// Manejo del estado de Autenticación
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    
    // Verificar si es administrador REAL en la base de datos
    try {
      const docRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(docRef);
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        adminBtn.classList.remove('hidden');
      } else {
        adminBtn.classList.add('hidden');
      }
    } catch (e) {
      console.error("Error verificando rol:", e);
      adminBtn.classList.add('hidden');
    }
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    adminBtn.classList.add('hidden');
  }
});

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  });
}

// Carga de productos
async function loadProducts() {
  productsContainer.innerHTML = '<div class="text-center" style="grid-column: 1 / -1;"><p>Cargando catálogo brillante...</p></div>';
  
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    if (products.length === 0) {
      // Show fallback mock products if database is empty
      renderMockProducts();
      return;
    }

    renderProducts(products);
  } catch (error) {
    console.warn("Fallo en la conexión de Firebase (posiblemente falta configuración). Mostrando datos de prueba.");
    renderMockProducts();
  }
}

function renderProducts(products) {
  productsContainer.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('a');
    card.href = product.link || '#';
    card.target = "_blank";
    card.className = 'glass-card product-card';
    card.rel = "noopener noreferrer";
    
    const imageUrl = product.imageUrl || 'https://via.placeholder.com/600x400?text=DXN+Product';
    
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${imageUrl}" alt="${product.name}" class="product-image" loading="lazy" />
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <span class="btn btn-outline" style="align-self: flex-start; margin-top: auto;" data-i18n="btn_learn_more">Saber más</span>
      </div>
    `;
    productsContainer.appendChild(card);
  });
  
  setLanguage(localStorage.getItem('dxn_lang') || 'es');
}

function renderMockProducts() {
  const mockProducts = [
    {
      id: "1",
      name: "Café Lingzhi 3 en 1",
      description: "Delicioso café con extracto de Ganoderma, perfecto para empezar tu mañana con energía y bienestar duradero.",
      imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop",
      link: "#"
    },
    {
      id: "2",
      name: "Spirulina Cereal",
      description: "Nutrición completa en un cereal crujiente, ideal para toda la familia y para mantener un estilo de vida saludable.",
      imageUrl: "https://images.unsplash.com/photo-1490474504059-1f1e10269f41?q=80&w=800&auto=format&fit=crop",
      link: "#"
    },
    {
      id: "3",
      name: "DXN Ganozhi Jabón",
      description: "Cuidado de la piel premium con extracto de Ganoderma que limpia, hidrata y protege tu piel, dejándola suave y radiante.",
      imageUrl: "https://images.unsplash.com/photo-1600857062241-987114b03658?q=80&w=800&auto=format&fit=crop",
      link: "#"
    }
  ];
  renderProducts(mockProducts);
}

async function loadContactInfo() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'contact'));
    if (snap.exists()) {
      const data = snap.data();
      const emailBtn = document.getElementById('footer-email-btn');
      const waBtn = document.getElementById('footer-wa-btn');
      if(emailBtn && data.email) {
        emailBtn.href = `mailto:${data.email}`;
        emailBtn.innerHTML = `✉ ${data.email}`;
      }
      if(waBtn && data.whatsapp) {
        const cleanWa = data.whatsapp.replace(/\\D/g, '');
        waBtn.href = `https://wa.me/${cleanWa}`;
      }
    }
  } catch(e) {
    console.warn("Módulo contacto usa valores default");
  }
}

loadProducts();
loadContactInfo();

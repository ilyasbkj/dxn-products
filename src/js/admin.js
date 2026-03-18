import '../css/style.css';
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, getDocs, addDoc, updateDoc, doc, deleteDoc 
} from 'firebase/firestore';

const adminContent = document.getElementById('admin-content');
const unauthorizedMsg = document.getElementById('unauthorized-msg');
const logoutBtn = document.getElementById('admin-logout-btn');

const productsTbody = document.getElementById('products-tbody');
const formContainer = document.getElementById('form-container');
const productForm = document.getElementById('product-form');
const btnShowForm = document.getElementById('btn-show-form');
const btnCancel = document.getElementById('btn-cancel');
const formTitle = document.getElementById('form-title');

let productsList = [];

// Rutas Integradas - Protegidas para usuarios logueados.
onAuthStateChanged(auth, (user) => {
  if (user) {
    unauthorizedMsg.style.display = 'none';
    adminContent.style.display = 'block';
    loadAdminProducts();
  } else {
    // No logueado, redirigir
    window.location.href = '/login.html';
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '/';
});

// UI Eventos
btnShowForm.addEventListener('click', () => {
  formContainer.classList.remove('hidden');
  productForm.reset();
  document.getElementById('prod-id').value = '';
  formTitle.textContent = 'Agregar Producto';
  window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth'});
});

btnCancel.addEventListener('click', () => {
  formContainer.classList.add('hidden');
  productForm.reset();
});

// Cargar catálogo DB
async function loadAdminProducts() {
  productsTbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando productos de la base de datos...</td></tr>';
  
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    productsList = [];
    querySnapshot.forEach((docSnap) => {
      productsList.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    renderTable();
  } catch (error) {
    console.error("Error conectando a DB:", error);
    productsTbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--danger)">Error al obtener productos. Verifica los permisos de Firestore y la configuración del SDK.</td></tr>`;
  }
}

// Renderizado Dom de la tabla
function renderTable() {
  if (productsList.length === 0) {
    productsTbody.innerHTML = '<tr><td colspan="5" class="text-center">El catálogo está vacío. Agrega el primer producto.</td></tr>';
    return;
  }
  
  productsTbody.innerHTML = '';
  productsList.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 80px"><img src="${prod.imageUrl || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover; border-radius:4px" /></td>
      <td><strong>${prod.name}</strong></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.description}</td>
      <td><a href="${prod.link}" target="_blank" style="color: var(--accent-primary)">Enlace Afiliado/Compra</a></td>
      <td style="width: 180px">
        <button class="btn action-btn bg-gold" style="padding: 6px 12px; font-size: 0.8em; margin-right: 5px; background:var(--accent-gold); color:black; border-radius: 4px;" onclick="editProduct('${prod.id}')">Editar</button>
        <button class="btn action-btn bg-danger" style="padding: 6px 12px; font-size: 0.8em; border-radius: 4px; border:none; background:var(--danger); color:white;" onclick="deleteProduct('${prod.id}')">Eliminar</button>
      </td>
    `;
    productsTbody.appendChild(tr);
  });
}

// Exponer funciones al scope global para los atributos onclick de los elementos inyectados
window.editProduct = (id) => {
  const product = productsList.find(p => p.id === id);
  if (!product) return;
  
  formTitle.textContent = 'Editar Producto';
  document.getElementById('prod-id').value = product.id;
  document.getElementById('prod-name').value = product.name;
  document.getElementById('prod-desc').value = product.description;
  document.getElementById('prod-img').value = product.imageUrl || '';
  document.getElementById('prod-link').value = product.link || '';
  
  formContainer.classList.remove('hidden');
  window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth'});
};

window.deleteProduct = async (id) => {
  if (!confirm('¿Estás SEGURO de que quieres eliminar este producto del catálogo permanentemente?')) return;
  
  try {
    await deleteDoc(doc(db, 'products', id));
    await loadAdminProducts();
  } catch (error) {
    console.error("Error borrando:", error);
    alert("Error al borrar el producto. Verifica los permisos de Firestore.");
  }
};

// Insertar o Actualizar DB 
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = productForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando datos...';
  
  const id = document.getElementById('prod-id').value;
  const productData = {
    name: document.getElementById('prod-name').value,
    description: document.getElementById('prod-desc').value,
    imageUrl: document.getElementById('prod-img').value,
    link: document.getElementById('prod-link').value
  };
  
  try {
    if (id) {
      // Actualizar 
      await updateDoc(doc(db, 'products', id), productData);
    } else {
      // Nuevo
      await addDoc(collection(db, 'products'), productData);
    }
    
    formContainer.classList.add('hidden');
    productForm.reset();
    await loadAdminProducts();
  } catch (error) {
    console.error("Error guardando:", error);
    alert("Hubo un error al guardar los cambios en la Base de Datos. Detalles en consola.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Guardar Producto';
  }
});

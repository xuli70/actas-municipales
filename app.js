// app.js - Aplicación Actas Municipales
// Configuración y lógica principal

// ============================================
// Configuración desde config.js (generado por Docker)
// ============================================
const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://supmcp.axcsol.com';
const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || '';

// Verificar configuración
if (!SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_ANON_KEY no está configurada');
}
// Estado global de la aplicación
let currentView = 'menu';
let actasCache = [];

// ============================================
// Inicialización
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página correcta
    if (document.getElementById('mainMenu')) {
        initializeApp();
    }
});

function initializeApp() {
    console.log('Aplicación inicializada');
    
    // Configurar manejadores de eventos
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    // Mostrar menú principal
    showMenu();
}

// ============================================
// Navegación
// ============================================
function showMenu() {
    hideAllSections();
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('backButton').style.display = 'none';
    currentView = 'menu';
}

function showActas() {
    hideAllSections();
    document.getElementById('actasSection').style.display = 'block';
    document.getElementById('backButton').style.display = 'block';
    currentView = 'actas';
    loadActas();
}

function showAdmin() {
    hideAllSections();
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('backButton').style.display = 'block';
    currentView = 'admin';
}

function goBack() {
    showMenu();
}

function hideAllSections() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('actasSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'none';
}

// ============================================
// Funciones de Supabase
// ============================================
async function loadActas() {
    const actasList = document.getElementById('actasList');
    actasList.innerHTML = '<div class="loading">Cargando actas...</div>';
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?order=fecha.desc&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const actas = await response.json();
        actasCache = actas;
        
        if (actas.length === 0) {
            actasList.innerHTML = '<p class="no-results">No hay actas disponibles</p>';
            return;
        }
        
        // Renderizar lista de actas
        let html = '<div class="actas-list">';
        actas.forEach(acta => {
            html += `
                <div class="acta-item" onclick="viewActa(${acta.id})">
                    <div class="acta-fecha">${formatDate(acta.fecha)}</div>
                    <div class="acta-tipo">${acta.tipo_pleno || 'Ordinario'}</div>
                    <div class="acta-numero">Sesión: ${acta.numero_sesion}</div>
                    ${acta.estado === 'procesado' ? '<span class="badge">✓ Procesado</span>' : ''}
                </div>
            `;
        });
        html += '</div>';
        
        actasList.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar actas:', error);
        actasList.innerHTML = '<div class="error">Error al cargar las actas. Por favor, intente más tarde.</div>';
    }
}

// Ver detalles de un acta
function viewActa(actaId) {
    const acta = actasCache.find(a => a.id === actaId);
    if (!acta) return;
    
    // Si hay PDF, abrirlo
    if (acta.pdf_url) {
        window.open(acta.pdf_url, '_blank');
    } else {
        alert('El PDF de esta acta no está disponible');
    }
}

// ============================================
// Manejo de carga de archivos
// ============================================
async function handleUpload(event) {
    event.preventDefault();
    
    const messageDiv = document.getElementById('uploadMessage');
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    // Deshabilitar botón durante la carga
    submitButton.disabled = true;
    messageDiv.innerHTML = '<div class="loading">Subiendo acta...</div>';
    
    try {
        // Obtener datos del formulario
        const numero = document.getElementById('numero').value;
        const fecha = document.getElementById('fecha').value;
        const tipo = document.getElementById('tipo').value;
        const pdfFile = document.getElementById('pdfFile').files[0];
        
        if (!pdfFile) {
            throw new Error('Por favor seleccione un archivo PDF');
        }
        
        // Validar que sea PDF
        if (pdfFile.type !== 'application/pdf') {
            throw new Error('El archivo debe ser un PDF');
        }
        
        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (pdfFile.size > maxSize) {
            throw new Error('El archivo es demasiado grande. Máximo 10MB');
        }
        
        // Subir archivo a Supabase Storage
        const fileName = `acta_${fecha}_${numero.replace('/', '-')}.pdf`;
        const { data: uploadData, error: uploadError } = await uploadToStorage(pdfFile, fileName);
        
        if (uploadError) throw uploadError;
        
        // Crear registro en la base de datos
        const actaData = {
            numero_sesion: numero,
            fecha: fecha,
            tipo_pleno: tipo,
            pdf_url: uploadData.publicUrl,
            estado: 'pendiente'
        };
        
        const { data: dbData, error: dbError } = await createActaRecord(actaData);
        
        if (dbError) throw dbError;
        
        // Éxito
        messageDiv.innerHTML = '<div class="success">¡Acta subida correctamente!</div>';
        document.getElementById('uploadForm').reset();
        
        // Volver al menú después de 3 segundos
        setTimeout(() => {
            showMenu();
            messageDiv.innerHTML = '';
        }, 3000);
        
    } catch (error) {
        console.error('Error:', error);
        messageDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
        submitButton.disabled = false;
    }
}

// Subir archivo a Supabase Storage
async function uploadToStorage(file, fileName) {
    // Nota: Esta función necesita configuración adicional de Supabase Storage
    // Por ahora retornamos una URL simulada
    console.log('Subiendo archivo:', fileName);
    
    // Simulación de carga exitosa
    return {
        data: {
            publicUrl: `${SUPABASE_URL}/storage/v1/object/public/actas/${fileName}`
        },
        error: null
    };
}

// Crear registro en la base de datos
async function createActaRecord(actaData) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/actas`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(actaData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear registro');
        }
        
        const data = await response.json();
        return { data, error: null };
        
    } catch (error) {
        return { data: null, error };
    }
}

// ============================================
// Utilidades
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} de ${month} de ${year}`;
}

// ============================================
// Exportar funciones globales
// ============================================
window.showMenu = showMenu;
window.showActas = showActas;
window.showAdmin = showAdmin;
window.goBack = goBack;
window.viewActa = viewActa;

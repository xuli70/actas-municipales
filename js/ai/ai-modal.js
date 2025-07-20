/**
 * ai-modal.js - Gestión del modal de consultas IA
 * Sistema de Actas Municipales
 */

window.AIModal = {
    currentActaId: null,
    currentActaUrl: null,
    
    /**
     * Inicialización del módulo
     */
    initialize() {
        this.setupEventListeners();
        console.log('✅ AIModal inicializado');
    },
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Los event listeners se configuran inline en el HTML
    },
    
    /**
     * Abre el modal de consulta IA
     */
    open(actaId, title, url, summary) {
        this.currentActaId = actaId;
        this.currentActaUrl = url;
        
        document.getElementById('modalActaTitle').textContent = `Consultar IA: ${title}`;
        document.getElementById('actaSummary').innerHTML = summary ? 
            `<div class="summary-content"><strong>Resumen:</strong> ${summary}</div>` : 
            '<div class="summary-content"><em>Resumen no disponible aún</em></div>';
        
        document.getElementById('aiQuery').value = '';
        document.getElementById('aiResponse').style.display = 'none';
        document.getElementById('aiQueryModal').style.display = 'flex';
        
        // Cargar historial usando AIHistory
        if (window.AIHistory) {
            window.AIHistory.load(actaId);
        }
    },
    
    /**
     * Cierra el modal
     */
    close() {
        document.getElementById('aiQueryModal').style.display = 'none';
        this.currentActaId = null;
        this.currentActaUrl = null;
    },
    
    /**
     * Obtiene el ID del acta actual
     */
    getCurrentActaId() {
        return this.currentActaId;
    },
    
    /**
     * Obtiene la URL del acta actual
     */
    getCurrentActaUrl() {
        return this.currentActaUrl;
    },
    
    /**
     * Actualiza la respuesta en el modal
     */
    updateResponse(html) {
        const responseDiv = document.getElementById('aiResponse');
        const responseText = document.getElementById('aiResponseText');
        
        responseDiv.style.display = 'block';
        responseText.innerHTML = html;
    },
    
    /**
     * Actualiza el botón de preguntar
     */
    updateAskButton(text, disabled = false) {
        const askBtn = document.getElementById('askAIBtn');
        askBtn.innerHTML = text;
        askBtn.disabled = disabled;
    },
    
    /**
     * Limpia el campo de pregunta
     */
    clearQuery() {
        document.getElementById('aiQuery').value = '';
    }
};

// Funciones globales para compatibilidad
window.openAIModal = function(actaId, title, url, summary) {
    if (window.AIModal) {
        window.AIModal.open(actaId, title, url, summary);
    }
};

window.closeAIModal = function() {
    if (window.AIModal) {
        window.AIModal.close();
    }
};

// Variables globales para compatibilidad
Object.defineProperty(window, 'currentActaId', {
    get() { return window.AIModal ? window.AIModal.currentActaId : null; },
    set(value) { if (window.AIModal) window.AIModal.currentActaId = value; }
});

Object.defineProperty(window, 'currentActaUrl', {
    get() { return window.AIModal ? window.AIModal.currentActaUrl : null; },
    set(value) { if (window.AIModal) window.AIModal.currentActaUrl = value; }
});

console.log('✅ ai-modal.js cargado');
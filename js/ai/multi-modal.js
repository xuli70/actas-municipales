/**
 * multi-modal.js - Modal para consultas IA múltiples
 * Sistema de Actas Municipales
 */

window.MultiAIModal = {
    isOpen: false,
    
    /**
     * Inicialización
     */
    initialize() {
        console.log('✅ MultiAIModal inicializado');
    },
    
    /**
     * Abrir modal con actas seleccionadas
     */
    open() {
        const selectedActas = window.MultiSelector.getSelectedActas();
        
        if (selectedActas.length === 0) {
            alert('Por favor seleccione al menos una acta antes de consultar a la IA');
            return;
        }
        
        console.log(`🤖 Abriendo modal de consulta múltiple con ${selectedActas.length} actas`);
        
        this.isOpen = true;
        this.renderSelectedActas(selectedActas);
        
        // Mostrar modal
        const modal = document.getElementById('multiActasAIModal');
        if (modal) {
            modal.style.display = 'flex';
        }
        
        // Cargar historial
        if (window.MultiHistory) {
            window.MultiHistory.load();
        }
        
        // Focus en textarea
        setTimeout(() => {
            const queryInput = document.getElementById('multiAIQuery');
            if (queryInput) queryInput.focus();
        }, 100);
    },
    
    /**
     * Cerrar modal
     */
    close() {
        console.log('❌ Cerrando modal de consulta múltiple');
        this.isOpen = false;
        
        const modal = document.getElementById('multiActasAIModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Limpiar formulario
        const queryInput = document.getElementById('multiAIQuery');
        if (queryInput) queryInput.value = '';
        
        this.hideResponse();
    },
    
    /**
     * Renderizar lista de actas seleccionadas
     */
    renderSelectedActas(selectedActas) {
        const container = document.getElementById('selectedActasList');
        if (!container) return;
        
        const html = selectedActas.map((acta, index) => `
            <div class="selected-acta-item">
                <div class="acta-number">${index + 1}.</div>
                <div class="acta-info">
                    <div class="acta-title">📄 ${acta.titulo}</div>
                    <div class="acta-summary">${acta.resumen}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    },
    
    /**
     * Establecer sugerencia de consulta
     */
    setSuggestion(suggestion) {
        const queryInput = document.getElementById('multiAIQuery');
        if (queryInput) {
            queryInput.value = suggestion;
            queryInput.focus();
        }
    },
    
    /**
     * Actualizar botón de consulta
     */
    updateAskButton(text, disabled = false) {
        const btn = document.getElementById('askMultiAIBtn');
        if (btn) {
            btn.innerHTML = text;
            btn.disabled = disabled;
        }
    },
    
    /**
     * Mostrar respuesta
     */
    showResponse(html) {
        const responseDiv = document.getElementById('multiAIResponse');
        const responseText = document.getElementById('multiAIResponseText');
        
        if (responseDiv) responseDiv.style.display = 'block';
        if (responseText) responseText.innerHTML = html;
        
        // Scroll hacia la respuesta
        setTimeout(() => {
            if (responseDiv) {
                responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    },
    
    /**
     * Ocultar respuesta
     */
    hideResponse() {
        const responseDiv = document.getElementById('multiAIResponse');
        if (responseDiv) responseDiv.style.display = 'none';
    },
    
    /**
     * Limpiar consulta
     */
    clearQuery() {
        const queryInput = document.getElementById('multiAIQuery');
        if (queryInput) queryInput.value = '';
    }
};

console.log('✅ multi-modal.js cargado');
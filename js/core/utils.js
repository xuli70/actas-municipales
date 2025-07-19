/**
 * utils.js - Funciones utilitarias compartidas
 * Sistema de Actas Municipales
 */

// Namespace global para utilidades
window.Utils = {
    
    /**
     * Formatea el tamaño de archivo en una cadena legible
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Genera badge HTML para el estado de procesamiento
     */
    getStatusBadge(status) {
        const badges = {
            'pendiente': '<span class="status-badge pending">⏳ Pendiente</span>',
            'procesando': '<span class="status-badge processing">🔄 Procesando</span>',
            'completado': '<span class="status-badge completed">✅ Completado</span>',
            'error': '<span class="status-badge error">❌ Error</span>'
        };
        return badges[status] || badges['pendiente'];
    },

    /**
     * Muestra un mensaje en el elemento especificado
     */
    showMessage(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const cssClass = type === 'success' ? 'success' : type === 'error' ? 'error' : 'loading';
        element.innerHTML = `<div class="${cssClass}">${message}</div>`;
    },

    /**
     * Escapa caracteres HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Compatibilidad: mantener funciones globales existentes
window.formatFileSize = window.Utils.formatFileSize;
window.getStatusBadge = window.Utils.getStatusBadge;

console.log('✅ Utils.js cargado correctamente');
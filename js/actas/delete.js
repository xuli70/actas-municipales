/**
 * Delete Manager - Gestión de eliminación de actas
 * Parte del sistema modular de Actas Municipales
 */

window.DeleteManager = {
    /**
     * Eliminar acta con confirmación
     * @param {string} actaId - ID del acta a eliminar
     * @param {string} actaNombre - Nombre del acta para confirmación
     */
    async deleteActa(actaId, actaNombre) {
        // Confirmación antes de eliminar
        if (!confirm(`¿Está seguro de que desea eliminar el acta "${actaNombre}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }
        
        try {
            // Eliminar de la base de datos
            const headers = window.getApiHeaders ? window.getApiHeaders() : {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            };
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}`, {
                method: 'DELETE',
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error('Error al eliminar el acta');
            }
            
            // Mostrar mensaje de éxito
            alert('Acta eliminada correctamente');
            
            // Recargar la lista de actas
            if (window.ActasManager && window.ActasManager.loadActas) {
                window.ActasManager.loadActas();
            } else {
                // Fallback
                loadActas();
            }
            
        } catch (error) {
            alert(`Error al eliminar el acta: ${error.message}`);
            console.error('Error:', error);
        }
    },

    /**
     * Verificar permisos de eliminación
     * @returns {boolean} True si el usuario puede eliminar actas
     */
    canDelete() {
        return userRole === 'admin';
    },

    /**
     * Inicializar el módulo
     */
    initialize() {
        console.log('✅ DeleteManager inicializado');
    }
};

// Mantener compatibilidad con funciones globales
window.deleteActa = (actaId, actaNombre) => window.DeleteManager.deleteActa(actaId, actaNombre);
/**
 * Actas Manager - Gestión de carga y renderizado de actas
 * Parte del sistema modular de Actas Municipales
 */

window.ActasManager = {
    /**
     * Cargar actas desde Supabase y renderizar la lista
     */
    async loadActas() {
        const actasList = document.getElementById('actasList');
        actasList.innerHTML = '<div class="loading">Cargando actas...</div>';
        
        try {
            const headers = window.getApiHeaders();
            const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://supmcp.axcsol.com';
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?order=fecha.desc`, {
                headers: headers
            });
            
            if (!response.ok) throw new Error('Error al cargar actas');
            
            const actas = await response.json();
            
            if (actas.length === 0) {
                actasList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No hay actas disponibles</p>';
                return;
            }
            
            actasList.innerHTML = this.renderActasList(actas);
                
        } catch (error) {
            actasList.innerHTML = '<div class="error">Error al cargar las actas. Por favor, intente más tarde.</div>';
            console.error('Error:', error);
        }
    },

    /**
     * Cargar actas con orden personalizado (para reordenamiento)
     */
    async loadActasWithCustomOrder() {
        const actasList = document.getElementById('actasList');
        actasList.innerHTML = '<div class="loading">Cargando actas...</div>';
        
        try {
            // Usar orden manual con fallback a fecha - Solo para modo reordenamiento
            const headers = window.getApiHeaders();
            const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://supmcp.axcsol.com';
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?order=orden_manual.asc.nullslast,fecha.desc`, {
                headers: headers
            });
            
            if (!response.ok) throw new Error('Error al cargar actas con orden personalizado');
            
            const actas = await response.json();
            
            if (actas.length === 0) {
                actasList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No hay actas disponibles</p>';
                return;
            }
            
            actasList.innerHTML = this.renderActasList(actas);
                
        } catch (error) {
            actasList.innerHTML = '<div class="error">Error al cargar las actas. Por favor, intente más tarde.</div>';
            console.error('Error:', error);
        }
    },

    /**
     * Renderizar la lista de actas en HTML
     * @param {Array} actas - Array de actas desde Supabase
     * @returns {string} HTML renderizado
     */
    renderActasList(actas) {
        return '<div class="actas-list">' + 
            actas.map(acta => `
                <div class="acta-item" data-acta-id="${acta.id}">
                    <div class="acta-main" onclick="openPDF('${acta.archivo_url}')">
                        <div class="acta-filename">${acta.archivo_nombre || 'Documento sin nombre'}</div>
                        <div class="acta-summary">${acta.resumen_automatico || 'Resumen no disponible aún'}</div>
                        <div class="acta-status">${this.getStatusBadge(acta.estado_procesamiento || 'pendiente')}</div>
                    </div>
                    <div class="acta-actions">
                        <button class="btn-ai-query" onclick="openAIModal('${acta.id}', '${acta.titulo || acta.archivo_nombre}', '${acta.archivo_url}', '${acta.resumen_automatico || ''}')">
                            &#129302; Consultar IA
                        </button>
                        ${userRole === 'admin' ? `
                            <button class="btn-delete" onclick="deleteActa('${acta.id}', '${acta.archivo_nombre || 'esta acta'}')" title="Eliminar acta">
                                &#128465; Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('') + 
            '</div>';
    },

    /**
     * Obtener badge de estado para el procesamiento
     * @param {string} status - Estado del procesamiento
     * @returns {string} HTML del badge
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
     * Inicializar el módulo
     */
    initialize() {
        console.log('✅ ActasManager inicializado');
    }
};

// Mantener compatibilidad con funciones globales
window.loadActas = () => window.ActasManager.loadActas();
window.loadActasWithCustomOrder = () => window.ActasManager.loadActasWithCustomOrder();
window.getStatusBadge = (status) => window.ActasManager.getStatusBadge(status);
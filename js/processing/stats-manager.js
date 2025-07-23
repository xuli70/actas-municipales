/**
 * stats-manager.js - Gestión de estadísticas de procesamiento
 * Sistema de Actas Municipales
 */

window.StatsManager = {
    /**
     * Inicialización del módulo
     */
    initialize() {
        console.log('✅ StatsManager inicializado');
    },
    
    /**
     * Carga y muestra las estadísticas de procesamiento
     */
    async loadStats() {
        const statsDiv = document.getElementById('processingStats');
        
        try {
            // Obtener configuración de las variables globales que se cargan en index.html
            const SUPABASE_URL = window.SUPABASE_URL;
            const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
            
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Configuración de Supabase no disponible');
            }
            
            // Obtener estadísticas directamente de la tabla
            const headers = window.getApiHeaders ? window.getApiHeaders() : {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            };
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?select=estado_procesamiento`, {
                headers: headers
            });
            
            if (response.ok) {
                const actas = await response.json();
                
                // Calcular estadísticas
                const stats = this.calculateStats(actas);
                
                // Renderizar estadísticas
                this.renderStats(statsDiv, stats);
            } else {
                statsDiv.innerHTML = '<p style="color: #e74c3c;">Error al cargar estadísticas</p>';
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            statsDiv.innerHTML = '<p style="color: #e74c3c;">Error al cargar estadísticas</p>';
        }
    },
    
    /**
     * Calcula las estadísticas a partir de los datos
     */
    calculateStats(actas) {
        const stats = {
            completados: actas.filter(a => a.estado_procesamiento === 'completado').length,
            pendientes: actas.filter(a => a.estado_procesamiento === 'pendiente').length,
            procesando: actas.filter(a => a.estado_procesamiento === 'procesando').length,
            con_error: actas.filter(a => a.estado_procesamiento === 'error').length,
            total: actas.length
        };
        
        stats.porcentaje_completado = stats.total > 0 ? 
            Math.round((stats.completados / stats.total) * 100) : 0;
            
        return stats;
    },
    
    /**
     * Renderiza las estadísticas en el DOM
     */
    renderStats(container, stats) {
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div><strong>Total de actas:</strong> ${stats.total}</div>
                <div><strong>Completados:</strong> <span style="color: #27ae60;">${stats.completados}</span></div>
                <div><strong>Pendientes:</strong> <span style="color: #e67e22;">${stats.pendientes}</span></div>
                <div><strong>Con error:</strong> <span style="color: #e74c3c;">${stats.con_error}</span></div>
            </div>
            <div style="margin-top: 15px;">
                <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div style="background: #27ae60; height: 100%; width: ${stats.porcentaje_completado}%; transition: width 0.3s;"></div>
                </div>
                <div style="text-align: center; margin-top: 5px; font-weight: bold;">
                    ${stats.porcentaje_completado}% Completado
                </div>
            </div>
        `;
    }
};

// Función global para compatibilidad
window.loadProcessingStats = async function() {
    if (window.StatsManager) {
        return await window.StatsManager.loadStats();
    }
};

console.log('✅ stats-manager.js cargado');
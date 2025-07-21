/**
 * multi-history.js - Historial de consultas múltiples
 * Sistema de Actas Municipales - Usando sessionStorage para privacidad
 */

window.MultiHistory = {
    /**
     * Inicialización
     */
    initialize() {
        console.log('✅ MultiHistory inicializado (modo sessionStorage)');
    },
    
    /**
     * Guardar consulta múltiple en sessionStorage
     */
    async save(selectedActas, question, answer) {
        try {
            // Preparar datos para la consulta múltiple
            const actasIds = selectedActas.map(acta => acta.id);
            const actasTitulos = selectedActas.map(acta => acta.titulo);
            
            const queryData = {
                id: `multi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                actas_ids: actasIds,
                actas_titulos: actasTitulos,
                pregunta: question,
                respuesta: answer,
                created_at: new Date().toISOString(),
                created_by: window.userRole || 'usuario',
                actas_count: actasIds.length
            };
            
            // Obtener historial existente o crear uno nuevo
            const existingHistory = this.getSessionHistory();
            
            // Agregar nueva consulta múltiple al principio
            existingHistory.multiple.unshift(queryData);
            
            // Mantener solo las últimas 5 consultas múltiples
            if (existingHistory.multiple.length > 5) {
                existingHistory.multiple = existingHistory.multiple.slice(0, 5);
            }
            
            // Guardar en sessionStorage
            sessionStorage.setItem('ai_queries_history', JSON.stringify(existingHistory));
            
            console.log(`💾 Consulta múltiple guardada en sessionStorage sobre ${actasIds.length} actas`);
            
        } catch (error) {
            console.error('❌ Error al guardar consulta múltiple en sessionStorage:', error);
        }
    },
    
    /**
     * Cargar historial de consultas múltiples desde sessionStorage
     */
    async load() {
        try {
            const history = this.getSessionHistory();
            
            console.log(`📚 Cargadas ${history.multiple.length} consultas múltiples del historial`);
            
            this.render(history.multiple);
            
        } catch (error) {
            console.error('❌ Error al cargar historial múltiple desde sessionStorage:', error);
        }
    },
    
    /**
     * Obtiene el historial completo desde sessionStorage
     */
    getSessionHistory() {
        try {
            const stored = sessionStorage.getItem('ai_queries_history');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error al leer sessionStorage:', error);
        }
        
        // Estructura por defecto
        return {
            single: [],
            multiple: []
        };
    },
    
    /**
     * Limpia el historial de consultas múltiples de la sesión
     */
    clearSession() {
        const history = this.getSessionHistory();
        history.multiple = [];
        sessionStorage.setItem('ai_queries_history', JSON.stringify(history));
        console.log('🧹 Historial de consultas múltiples limpiado');
    },
    
    /**
     * Renderizar historial
     */
    render(history) {
        const historyDiv = document.getElementById('multiQueryHistory');
        const historyList = document.getElementById('multiHistoryList');
        
        if (!historyDiv || !historyList) {
            console.warn('⚠️ Elementos de historial múltiple no encontrados en DOM');
            return;
        }
        
        if (history.length > 0) {
            historyDiv.style.display = 'block';
            
            const historyHTML = history.map(item => {
                // Truncar respuesta para el historial
                const shortAnswer = item.respuesta.length > 200 
                    ? item.respuesta.substring(0, 200) + '...' 
                    : item.respuesta;
                
                // Crear resumen de actas consultadas
                const actasResumen = item.actas_titulos && item.actas_titulos.length > 0
                    ? item.actas_titulos.slice(0, 3).join(', ') + (item.actas_titulos.length > 3 ? '...' : '')
                    : 'Actas no especificadas';
                
                return `
                    <div class="history-item multi-history-item">
                        <div class="history-question">
                            <strong>🤖 Consulta Múltiple:</strong> ${item.pregunta}
                            <span class="actas-count badge">${item.actas_count || '?'} actas</span>
                        </div>
                        <div class="history-answer">
                            <strong>Respuesta:</strong> ${shortAnswer}
                        </div>
                        <div class="history-actas">
                            <small><strong>Actas:</strong> ${actasResumen}</small>
                        </div>
                        <div class="history-date">
                            📅 ${new Date(item.created_at).toLocaleString('es-ES')}
                        </div>
                        <div class="history-actions">
                            <button class="btn-small" onclick="window.MultiHistory.expandAnswer('${item.id}')">
                                📖 Ver Completa
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            historyList.innerHTML = historyHTML;
        } else {
            historyDiv.style.display = 'none';
        }
    },
    
    /**
     * Expandir respuesta completa
     */
    expandAnswer(itemId) {
        try {
            const history = this.getSessionHistory();
            const item = history.multiple.find(q => q.id === itemId);
            
            if (item) {
                const actasList = item.actas_titulos 
                    ? item.actas_titulos.map((titulo, i) => `${i+1}. ${titulo}`).join('\n')
                    : 'Lista de actas no disponible';
                
                const fullContent = `PREGUNTA:\n${item.pregunta}\n\nRESPUESTA COMPLETA:\n${item.respuesta}\n\nACTAS CONSULTADAS (${item.actas_count || 0}):\n${actasList}`;
                
                // Mostrar en modal o alert (por simplicidad usamos alert)
                alert(fullContent);
            } else {
                console.log('📖 Item no encontrado:', itemId);
                alert('No se pudo encontrar la consulta solicitada');
            }
        } catch (error) {
            console.error('Error al expandir respuesta:', error);
            alert('Error al mostrar la respuesta completa');
        }
    }
};

console.log('✅ multi-history.js cargado');
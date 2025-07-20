/**
 * multi-history.js - Historial de consultas múltiples
 * Sistema de Actas Municipales
 */

window.MultiHistory = {
    /**
     * Inicialización
     */
    initialize() {
        console.log('✅ MultiHistory inicializado');
    },
    
    /**
     * Guardar consulta múltiple
     */
    async save(selectedActas, question, answer) {
        try {
            const SUPABASE_URL = window.SUPABASE_URL;
            const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
            
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                console.error('❌ Configuración de Supabase no disponible para historial múltiple');
                return;
            }
            
            // Preparar datos para la consulta múltiple
            const actasIds = selectedActas.map(acta => acta.id);
            const actasTitulos = selectedActas.map(acta => acta.titulo);
            
            console.log(`💾 Guardando consulta múltiple sobre ${actasIds.length} actas`);
            
            // Crear un identificador único para la pregunta
            const questionId = `multi_${Date.now()}_${actasIds.length}actas`;
            
            // Guardar usando el campo 'pregunta' con metadatos de múltiples actas
            const extendedQuestion = `[CONSULTA MÚLTIPLE - ${actasIds.length} actas] ${question}`;
            const extendedAnswer = `${answer}\n\n--- ACTAS CONSULTADAS ---\n${actasTitulos.map((titulo, i) => `${i+1}. ${titulo}`).join('\n')}`;
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/consultas_ia`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acta_id: null, // NULL para consultas múltiples
                    pregunta: extendedQuestion,
                    respuesta: extendedAnswer,
                    created_by: window.userRole || 'usuario',
                    // Agregar metadatos en el modelo_ia field para identificar consultas múltiples
                    modelo_ia: `multi-query-${actasIds.length}-actas`
                })
            });
            
            if (response.ok) {
                console.log('✅ Consulta múltiple guardada exitosamente');
            } else {
                console.error('❌ Error al guardar consulta múltiple:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Error al guardar consulta múltiple:', error);
        }
    },
    
    /**
     * Cargar historial de consultas múltiples
     */
    async load() {
        try {
            const SUPABASE_URL = window.SUPABASE_URL;
            const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
            
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                console.error('❌ Configuración de Supabase no disponible para cargar historial múltiple');
                return;
            }
            
            console.log('📚 Cargando historial de consultas múltiples...');
            
            // Buscar consultas que sean múltiples (modelo_ia contiene 'multi-query')
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/consultas_ia?modelo_ia=like.multi-query*&order=created_at.desc&limit=5`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );
            
            if (response.ok) {
                const history = await response.json();
                console.log(`📊 Cargadas ${history.length} consultas múltiples del historial`);
                this.render(history);
            } else {
                console.error('❌ Error al cargar historial múltiple:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Error al cargar historial múltiple:', error);
        }
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
                // Extraer información de consulta múltiple
                const originalQuestion = item.pregunta.replace(/^\[CONSULTA MÚLTIPLE - \d+ actas\] /, '');
                const modeloInfo = item.modelo_ia || '';
                const actasCount = modeloInfo.match(/multi-query-(\d+)-actas/)?.[1] || '?';
                
                // Truncar respuesta para el historial
                const shortAnswer = item.respuesta.length > 200 
                    ? item.respuesta.substring(0, 200) + '...' 
                    : item.respuesta;
                
                return `
                    <div class="history-item multi-history-item">
                        <div class="history-question">
                            <strong>🤖 Consulta Múltiple:</strong> ${originalQuestion}
                            <span class="actas-count badge">${actasCount} actas</span>
                        </div>
                        <div class="history-answer">
                            <strong>Respuesta:</strong> ${shortAnswer}
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
     * Expandir respuesta completa (funcionalidad futura)
     */
    expandAnswer(itemId) {
        // Por ahora, simplemente log
        console.log('📖 Expandir respuesta completa para:', itemId);
        alert('Funcionalidad de expandir respuesta completa - próximamente');
    }
};

console.log('✅ multi-history.js cargado');
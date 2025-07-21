/**
 * ai-history.js - Gestión del historial de consultas IA
 * Sistema de Actas Municipales - Usando sessionStorage para privacidad
 */

window.AIHistory = {
    /**
     * Inicialización del módulo
     */
    initialize() {
        console.log('✅ AIHistory inicializado (modo sessionStorage)');
    },
    
    /**
     * Guarda una consulta en sessionStorage (privado por sesión)
     */
    async save(actaId, question, answer) {
        try {
            const queryData = {
                id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                acta_id: actaId,
                pregunta: question,
                respuesta: answer,
                created_at: new Date().toISOString(),
                created_by: window.userRole || 'usuario'
            };
            
            // Obtener historial existente o crear uno nuevo
            const existingHistory = this.getSessionHistory();
            
            // Agregar nueva consulta al principio
            existingHistory.single.unshift(queryData);
            
            // Mantener solo las últimas 10 consultas
            if (existingHistory.single.length > 10) {
                existingHistory.single = existingHistory.single.slice(0, 10);
            }
            
            // Guardar en sessionStorage
            sessionStorage.setItem('ai_queries_history', JSON.stringify(existingHistory));
            
            console.log('💾 Consulta guardada en sessionStorage:', {
                actaId,
                questionLength: question.length,
                answerLength: answer.length
            });
            
        } catch (error) {
            console.error('Error al guardar consulta en sessionStorage:', error);
        }
    },
    
    /**
     * Carga el historial de consultas de un acta desde sessionStorage
     */
    async load(actaId) {
        try {
            const history = this.getSessionHistory();
            
            // Filtrar consultas por acta específica
            const actaHistory = history.single.filter(item => item.acta_id === actaId);
            
            console.log(`📚 Cargadas ${actaHistory.length} consultas del historial para acta: ${actaId}`);
            
            this.render(actaHistory);
            
        } catch (error) {
            console.error('Error al cargar historial desde sessionStorage:', error);
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
     * Limpia todo el historial de la sesión
     */
    clearSession() {
        sessionStorage.removeItem('ai_queries_history');
        console.log('🧹 Historial de consultas limpiado');
    },
    
    /**
     * Renderiza el historial en el DOM
     */
    render(history) {
        const historyDiv = document.getElementById('queryHistory');
        const historyList = document.getElementById('historyList');
        
        if (history.length > 0) {
            historyDiv.style.display = 'block';
            historyList.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-question"><strong>P:</strong> ${item.pregunta}</div>
                    <div class="history-answer"><strong>R:</strong> ${item.respuesta}</div>
                    <div class="history-date">${new Date(item.created_at).toLocaleString('es-ES')}</div>
                </div>
            `).join('');
        } else {
            historyDiv.style.display = 'none';
        }
    }
};

// Funciones globales para compatibilidad
window.saveQuery = async function(actaId, question, answer) {
    if (window.AIHistory) {
        return await window.AIHistory.save(actaId, question, answer);
    }
};

window.loadQueryHistory = async function(actaId) {
    if (window.AIHistory) {
        return await window.AIHistory.load(actaId);
    }
};

console.log('✅ ai-history.js cargado');
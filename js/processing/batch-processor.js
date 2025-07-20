/**
 * batch-processor.js - Procesamiento por lotes de PDFs
 * Sistema de Actas Municipales
 */

window.BatchProcessor = {
    /**
     * Inicialización del módulo
     */
    initialize() {
        console.log('✅ BatchProcessor inicializado');
    },
    
    /**
     * Procesa todos los PDFs pendientes
     */
    async processPendingPDFs() {
        const processBtn = document.getElementById('processBtn');
        const messageDiv = document.getElementById('processingMessage');
        
        if (!window.PDFTextExtractor || !window.PDFTextExtractor.isPdfJsLoaded()) {
            messageDiv.innerHTML = '<div class="error">Error: PDF.js no está cargado correctamente</div>';
            return;
        }
        
        if (!window.PDFBatchProcessor) {
            messageDiv.innerHTML = '<div class="error">Error: Módulo de procesamiento no disponible</div>';
            return;
        }
        
        // Configurar PDF.js
        window.PDFTextExtractor.configurePdfJs();
        
        // Deshabilitar botón
        processBtn.disabled = true;
        processBtn.innerHTML = '⌛ Procesando...';
        messageDiv.innerHTML = '<div class="loading">Iniciando procesamiento de PDFs pendientes...</div>';
        
        try {
            const resultado = await window.PDFBatchProcessor.processAllPending();
            
            messageDiv.innerHTML = `
                <div class="success">
                    ✅ Procesamiento completado<br>
                    Procesados: ${resultado.procesados}<br>
                    Errores: ${resultado.errores}<br>
                    Total: ${resultado.total}
                </div>
            `;
            
            // Recargar estadísticas
            if (window.StatsManager) {
                await window.StatsManager.loadStats();
            } else if (window.loadProcessingStats) {
                await window.loadProcessingStats();
            }
            
        } catch (error) {
            messageDiv.innerHTML = `<div class="error">Error durante el procesamiento: ${error.message}</div>`;
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = '🤖 Procesar PDFs Pendientes';
        }
    },
    
    /**
     * Actualiza el estado del botón de procesamiento
     */
    updateProcessButton(text, disabled = false) {
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.innerHTML = text;
            processBtn.disabled = disabled;
        }
    },
    
    /**
     * Actualiza el mensaje de procesamiento
     */
    updateProcessingMessage(html) {
        const messageDiv = document.getElementById('processingMessage');
        if (messageDiv) {
            messageDiv.innerHTML = html;
        }
    }
};

// Función global para compatibilidad
window.processPendingPDFs = async function() {
    if (window.BatchProcessor) {
        return await window.BatchProcessor.processPendingPDFs();
    }
};

console.log('✅ batch-processor.js cargado');
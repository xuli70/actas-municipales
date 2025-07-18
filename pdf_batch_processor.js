// Módulo para procesar PDFs pendientes en lote
// Este módulo procesa automáticamente los PDFs que no tienen texto extraído

window.PDFBatchProcessor = {
    isProcessing: false,
    
    // Procesar todos los PDFs pendientes
    async processAllPending() {
        if (this.isProcessing) {
            console.log('Ya hay un proceso en ejecución');
            return;
        }
        
        this.isProcessing = true;
        console.log('Iniciando procesamiento de PDFs pendientes...');
        
        try {
            // Obtener lista de PDFs pendientes
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?estado_procesamiento=eq.pendiente&archivo_url=not.is.null&select=id,titulo,archivo_url,archivo_nombre`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al obtener PDFs pendientes');
            }
            
            const pendientes = await response.json();
            console.log(`Encontrados ${pendientes.length} PDFs pendientes`);
            
            let procesados = 0;
            let errores = 0;
            
            // Procesar cada PDF
            for (const acta of pendientes) {
                try {
                    console.log(`Procesando: ${acta.titulo}`);
                    
                    // Marcar como procesando
                    await this.updateStatus(acta.id, 'procesando');
                    
                    // Extraer texto
                    const texto = await window.PDFTextExtractor.extractTextFromUrl(acta.archivo_url);
                    const resumen = window.PDFTextExtractor.generateSummary(texto, 500);
                    
                    // Actualizar en base de datos
                    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${acta.id}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            texto_extraido: texto,
                            resumen_automatico: resumen,
                            estado_procesamiento: 'completado',
                            fecha_ultimo_procesamiento: new Date().toISOString()
                        })
                    });
                    
                    if (updateResponse.ok) {
                        procesados++;
                        console.log(`✓ Procesado exitosamente: ${acta.titulo}`);
                    } else {
                        throw new Error('Error al actualizar base de datos');
                    }
                    
                } catch (error) {
                    errores++;
                    console.error(`✗ Error procesando ${acta.titulo}:`, error);
                    
                    // Marcar como error
                    await this.updateStatus(acta.id, 'error', error.message);
                }
                
                // Pequeña pausa entre procesamiento para no sobrecargar
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log(`Procesamiento completado: ${procesados} exitosos, ${errores} errores`);
            return { procesados, errores, total: pendientes.length };
            
        } catch (error) {
            console.error('Error en procesamiento batch:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    },
    
    // Actualizar estado de procesamiento
    async updateStatus(actaId, estado, mensajeError = null) {
        const data = {
            estado_procesamiento: estado,
            fecha_ultimo_procesamiento: new Date().toISOString()
        };
        
        if (mensajeError && estado === 'error') {
            data.descripcion = `Error de procesamiento: ${mensajeError}`;
        }
        
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error actualizando estado:', error);
        }
    },
    
    // Obtener estadísticas de procesamiento
    async getStats() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/v_estado_procesamiento_pdfs`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                return stats[0] || {
                    completados: 0,
                    pendientes: 0,
                    procesando: 0,
                    con_error: 0,
                    total: 0,
                    porcentaje_completado: 0
                };
            }
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
        }
        
        return null;
    },
    
    // Procesar un solo PDF
    async processSingle(actaId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}&select=*`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al obtener acta');
            }
            
            const data = await response.json();
            if (data.length === 0) {
                throw new Error('Acta no encontrada');
            }
            
            const acta = data[0];
            
            // Extraer texto
            const texto = await window.PDFTextExtractor.extractTextFromUrl(acta.archivo_url);
            const resumen = window.PDFTextExtractor.generateSummary(texto, 500);
            
            // Actualizar
            const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    texto_extraido: texto,
                    resumen_automatico: resumen,
                    estado_procesamiento: 'completado',
                    fecha_ultimo_procesamiento: new Date().toISOString()
                })
            });
            
            if (!updateResponse.ok) {
                throw new Error('Error al actualizar acta');
            }
            
            return { texto, resumen };
            
        } catch (error) {
            console.error('Error procesando PDF individual:', error);
            throw error;
        }
    }
};

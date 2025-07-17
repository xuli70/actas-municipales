// Integración real con OpenAI para consultas de IA
// Este archivo contiene la lógica para reemplazar simulateAIResponse con llamadas reales

// Reemplazar la función simulateAIResponse en index.html con esta implementación:

async function callOpenAI(query, actaContent) {
    const OPENAI_API_KEY = window.APP_CONFIG?.OPENAI_API_KEY;
    const AI_MODEL = window.APP_CONFIG?.AI_MODEL || 'gpt-4o-mini';
    
    if (!OPENAI_API_KEY) {
        throw new Error('Clave de API de OpenAI no configurada');
    }
    
    const systemPrompt = `Eres un asistente especializado en análisis de actas municipales españolas. 
Tu trabajo es responder preguntas específicas sobre el contenido de las actas de manera precisa y concisa.

Contexto del acta:
- Esta es un acta de pleno municipal español
- Contiene información sobre sesiones ordinarias/extraordinarias
- Incluye asistentes, acuerdos, votaciones, debates

Instrucciones:
- Responde SOLO basándote en la información del acta proporcionada
- Si no tienes información específica, dilo claramente
- Usa un lenguaje formal pero accesible
- Máximo 300 palabras por respuesta
- Incluye datos específicos cuando estén disponibles (fechas, cantidades, nombres)`;

    const userPrompt = `Acta municipal:
${actaContent}

Pregunta del usuario: ${query}

Por favor analiza el acta y responde a la pregunta de manera específica y precisa.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Error de OpenAI: ${error.error?.message || 'Error desconocido'}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No se pudo generar una respuesta';
        
    } catch (error) {
        console.error('Error llamando a OpenAI:', error);
        throw error;
    }
}

// Función para generar resumen automático
async function generateAutoSummary(actaContent, title) {
    const OPENAI_API_KEY = window.APP_CONFIG?.OPENAI_API_KEY;
    const AI_MODEL = window.APP_CONFIG?.AI_MODEL || 'gpt-4o-mini';
    
    if (!OPENAI_API_KEY) {
        console.warn('No se puede generar resumen: API key no configurada');
        return null;
    }
    
    const systemPrompt = `Eres un especialista en crear resúmenes ejecutivos de actas municipales españolas.
Tu tarea es crear un resumen conciso y útil de máximo 400 caracteres.

El resumen debe incluir:
1. Tipo de sesión y fecha
2. Principales acuerdos o decisiones
3. Votaciones importantes
4. Presupuestos o cantidades relevantes
5. Participantes clave (si es relevante)

Formato del resumen:
- Máximo 400 caracteres
- Información más importante primero
- Usar números específicos cuando estén disponibles
- Lenguaje claro y directo`;

    const userPrompt = `Título del acta: ${title}

Contenido del acta:
${actaContent}

Genera un resumen ejecutivo de máximo 400 caracteres con la información más relevante.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.2
            })
        });

        if (!response.ok) {
            throw new Error('Error generando resumen automático');
        }

        const data = await response.json();
        let summary = data.choices[0]?.message?.content || '';
        
        // Truncar a 400 caracteres si es necesario
        if (summary.length > 400) {
            summary = summary.substring(0, 397) + '...';
        }
        
        return summary;
        
    } catch (error) {
        console.error('Error generando resumen:', error);
        return null;
    }
}

// Función para extraer texto de PDF (placeholder - requiere implementación adicional)
async function extractTextFromPDF(pdfFile) {
    // Esta función requeriría una biblioteca como PDF.js o un servicio externo
    // Por ahora retorna un placeholder
    console.warn('Extracción de texto de PDF no implementada aún');
    return `Texto extraído del archivo: ${pdfFile.name}. 
    (Nota: La extracción real de texto requiere implementación adicional con PDF.js o servicio externo)`;
}

// Función para procesar un acta completa (resumen + indexación)
async function processActaWithAI(actaId, title, pdfFile) {
    try {
        // 1. Extraer texto del PDF
        const extractedText = await extractTextFromPDF(pdfFile);
        
        // 2. Generar resumen automático
        const autoSummary = await generateAutoSummary(extractedText, title);
        
        // 3. Actualizar la base de datos
        const updateData = {
            texto_extraido: extractedText,
            estado_procesamiento: 'completado',
            fecha_ultimo_procesamiento: new Date().toISOString()
        };
        
        if (autoSummary) {
            updateData.resumen_automatico = autoSummary;
        }
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error('Error actualizando acta procesada');
        }
        
        return {
            success: true,
            summary: autoSummary,
            extractedText: extractedText
        };
        
    } catch (error) {
        // Marcar como error en la base de datos
        await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${actaId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado_procesamiento: 'error',
                fecha_ultimo_procesamiento: new Date().toISOString()
            })
        });
        
        console.error('Error procesando acta con IA:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exportar funciones para uso en index.html
window.AI_FUNCTIONS = {
    callOpenAI,
    generateAutoSummary,
    extractTextFromPDF,
    processActaWithAI
};

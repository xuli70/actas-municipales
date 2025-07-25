/**
 * Upload Manager - Gestión de subida de archivos PDF
 * Parte del sistema modular de Actas Municipales
 */

window.UploadManager = {
    /**
     * Subir un archivo individual a Supabase
     * @param {File} pdfFile - Archivo PDF a subir
     * @returns {Promise} Promesa con el resultado de la subida
     */
    async uploadSingleFile(pdfFile) {
        // Validar tamaño del archivo (50MB max)
        if (pdfFile.size > 50 * 1024 * 1024) {
            throw new Error('Archivo demasiado grande. Máximo 50MB');
        }
        
        // Validar tipo de archivo
        if (pdfFile.type !== 'application/pdf') {
            throw new Error('Solo se permiten archivos PDF');
        }
        
        // Generar nombre único para el archivo
        const timestamp = new Date().getTime();
        const fileName = `acta_${timestamp}_${pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        
        // Subir archivo a Supabase Storage
        const headers = window.getApiHeaders();
        headers['x-upsert'] = 'true';
        delete headers['Content-Type']; // Dejar que el navegador establezca el Content-Type para archivos
        
        const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/actas-pdfs/${fileName}`, {
            method: 'POST',
            headers: headers,
            body: pdfFile
        });
        
        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.text();
            console.error('Error de upload:', errorData);
            throw new Error('Error al subir el archivo');
        }
        
        // Construir URL pública del archivo
        const archivoUrl = `${SUPABASE_URL}/storage/v1/object/public/actas-pdfs/${fileName}`;
        
        // Extraer fecha del nombre si es posible
        const fechaActual = new Date().toISOString().split('T')[0];
        
        // Configurar PDF.js si no está configurado
        if (window.PDFTextExtractor && window.PDFTextExtractor.isPdfJsLoaded()) {
            window.PDFTextExtractor.configurePdfJs();
        }
        
        // Extraer texto del PDF
        let textoExtraido = '';
        let resumenAutomatico = '';
        
        try {
            if (window.PDFTextExtractor && window.PDFTextExtractor.isPdfJsLoaded()) {
                textoExtraido = await window.PDFTextExtractor.extractTextFromFile(pdfFile);
                resumenAutomatico = window.PDFTextExtractor.generateSummary(textoExtraido, 500);
                console.log('Texto extraído exitosamente:', textoExtraido.length, 'caracteres');
            } else {
                console.warn('PDF.js no está disponible, subiendo sin extracción de texto');
            }
        } catch (extractError) {
            console.error('Error al extraer texto del PDF:', extractError);
            // Continuar sin texto extraído
        }
        
        // Verificar si ya existe un acta con el mismo nombre
        const dbHeaders = window.getApiHeaders();
        
        // Buscar acta existente por título/nombre de archivo
        const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/actas?titulo=eq.${encodeURIComponent(pdfFile.name)}`, {
            method: 'GET',
            headers: dbHeaders
        });
        
        if (!checkResponse.ok) {
            throw new Error('Error al verificar actas existentes');
        }
        
        const existingActas = await checkResponse.json();
        const actaExists = existingActas.length > 0;
        
        // Preparar datos del acta
        const actaData = {
            titulo: pdfFile.name,
            fecha: fechaActual,
            numero_acta: `AUTO-${timestamp}`,
            descripcion: null,
            archivo_url: archivoUrl,
            archivo_nombre: pdfFile.name,
            archivo_tamano: pdfFile.size,
            tipo_sesion: 'ordinaria',
            estado: 'borrador',
            texto_extraido: textoExtraido || null,
            resumen_automatico: resumenAutomatico || null,
            estado_procesamiento: textoExtraido ? 'completado' : 'pendiente'
        };
        
        let insertResponse;
        let operationType;
        
        if (actaExists) {
            // UPDATE: Actualizar acta existente
            const existingActa = existingActas[0];
            operationType = 'actualizada';
            
            dbHeaders['Prefer'] = 'return=representation';
            insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/actas?id=eq.${existingActa.id}`, {
                method: 'PATCH',
                headers: dbHeaders,
                body: JSON.stringify(actaData)
            });
        } else {
            // INSERT: Crear nueva acta
            operationType = 'creada';
            
            dbHeaders['Prefer'] = 'return=representation';
            insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/actas`, {
                method: 'POST',
                headers: dbHeaders,
                body: JSON.stringify(actaData)
            });
        }
        
        if (!insertResponse.ok) {
            const errorData = await insertResponse.text();
            console.error(`Error al ${operationType === 'creada' ? 'insertar' : 'actualizar'} acta:`, errorData);
            throw new Error(`Error al ${operationType === 'creada' ? 'guardar' : 'actualizar'} el acta`);
        }
        
        // Éxito - retornar datos del acta con información de la operación
        const actaResult = await insertResponse.json();
        return {
            ...actaResult,
            _operationType: operationType // Información adicional sobre la operación realizada
        };
    },

    /**
     * Procesar formulario de upload con múltiples archivos
     * @param {Event} event - Evento del formulario
     */
    async processUploadForm(event) {
        event.preventDefault();
        
        const messageDiv = document.getElementById('uploadMessage');
        
        if (window.FileManager.getFileCount() === 0) {
            messageDiv.innerHTML = '<div class="error">Por favor seleccione al menos un archivo PDF</div>';
            return;
        }
        
        // Deshabilitar el botón de subida durante el proceso
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Subiendo...';
        
        // Mostrar progreso general
        const selectedFiles = window.FileManager.getAllFiles();
        messageDiv.innerHTML = `
            <div class="upload-progress">
                <h4>Subiendo archivos...</h4>
                <div class="progress-bar">
                    <div class="progress-fill" id="mainProgressBar" style="width: 0%"></div>
                </div>
                <div id="progressText">0 de ${selectedFiles.length} archivos</div>
            </div>
        `;
        
        let successCount = 0;
        let errorCount = 0;
        const results = [];
        
        // Procesar cada archivo secuencialmente
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            
            // Actualizar progreso
            const progress = Math.round((i / selectedFiles.length) * 100);
            document.getElementById('mainProgressBar').style.width = `${progress}%`;
            document.getElementById('progressText').textContent = `${i} de ${selectedFiles.length} archivos`;
            
            // Marcar archivo como procesando
            window.FileManager.updateFileStatus(i, '<span style="color: #3498db;">🔄 Subiendo...</span>');
            
            try {
                const result = await this.uploadSingleFile(file);
                successCount++;
                
                // Mostrar mensaje específico según la operación realizada
                const operationType = result._operationType || 'subida';
                const statusMessage = operationType === 'actualizada' 
                    ? '<span style="color: #f39c12;">🔄 Actualizada correctamente</span>'
                    : '<span style="color: #27ae60;">✅ Subida correctamente</span>';
                
                window.FileManager.updateFileStatus(i, statusMessage);
                results.push({ file: file.name, status: 'success', operation: operationType });
            } catch (error) {
                errorCount++;
                window.FileManager.updateFileStatus(i, `<span style="color: #e74c3c;">❌ Error: ${error.message}</span>`);
                results.push({ file: file.name, status: 'error', error: error.message });
            }
        }
        
        // Actualizar progreso final
        document.getElementById('mainProgressBar').style.width = '100%';
        document.getElementById('progressText').textContent = `${selectedFiles.length} de ${selectedFiles.length} archivos`;
        
        // Mostrar resumen
        messageDiv.innerHTML = `
            <div class="${successCount > 0 ? 'success' : 'error'}">
                <h4>Proceso completado</h4>
                <p>✅ Exitosos: ${successCount}</p>
                <p>❌ Errores: ${errorCount}</p>
            </div>
        `;
        
        // Habilitar el botón nuevamente
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">📄</span> Subir Acta';
        
        // Limpiar la selección si todos fueron exitosos
        if (errorCount === 0) {
            window.FileManager.clearFiles();
            
            // Volver al menú después de 3 segundos
            setTimeout(() => {
                if (window.goBack) goBack();
            }, 3000);
        }
    },

    /**
     * Inicializar event listeners del formulario
     */
    initializeEventListeners() {
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.processUploadForm(e));
        }
    },

    /**
     * Inicializar el módulo
     */
    initialize() {
        this.initializeEventListeners();
        console.log('✅ UploadManager inicializado correctamente');
    }
};

// Mantener compatibilidad con funciones globales
window.uploadSingleFile = (file) => window.UploadManager.uploadSingleFile(file);
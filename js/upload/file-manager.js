/**
 * File Manager - Gestión de archivos seleccionados para upload
 * Parte del sistema modular de Actas Municipales
 */

window.FileManager = {
    // Array para archivos seleccionados
    selectedFiles: [],

    /**
     * Actualizar la lista de archivos seleccionados
     * @param {FileList} files - Lista de archivos del input
     */
    updateSelectedFiles(files) {
        this.selectedFiles = Array.from(files);
        this.displaySelectedFiles();
    },

    /**
     * Mostrar archivos seleccionados en la interfaz
     */
    displaySelectedFiles() {
        const filesList = document.getElementById('selectedFilesList');
        const filesContainer = document.getElementById('filesContainer');
        
        if (this.selectedFiles.length === 0) {
            filesList.style.display = 'none';
            return;
        }
        
        filesList.style.display = 'block';
        filesContainer.innerHTML = this.selectedFiles.map((file, index) => `
            <div class="file-item" id="file-${index}">
                <span class="file-name">📄 ${file.name}</span>
                <span class="file-size">(${this.formatFileSize(file.size)})</span>
                <button type="button" class="btn-remove-file" onclick="window.FileManager.removeFile(${index})" title="Eliminar archivo">
                    ❌
                </button>
                <div class="file-status" id="status-${index}"></div>
            </div>
        `).join('');
    },

    /**
     * Formatear tamaño de archivo en formato legible
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} Tamaño formateado
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Eliminar archivo de la lista por índice
     * @param {number} index - Índice del archivo a eliminar
     */
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displaySelectedFiles();
        
        // Si no quedan archivos, limpiar el input
        if (this.selectedFiles.length === 0) {
            const fileInput = document.getElementById('pdfFile');
            if (fileInput) {
                fileInput.value = '';
            }
        }
    },

    /**
     * Obtener archivo por índice
     * @param {number} index - Índice del archivo
     * @returns {File|null} Archivo seleccionado
     */
    getFile(index) {
        return this.selectedFiles[index] || null;
    },

    /**
     * Obtener todos los archivos seleccionados
     * @returns {Array} Array de archivos
     */
    getAllFiles() {
        return [...this.selectedFiles];
    },

    /**
     * Limpiar lista de archivos
     */
    clearFiles() {
        this.selectedFiles = [];
        this.displaySelectedFiles();
        
        const fileInput = document.getElementById('pdfFile');
        if (fileInput) {
            fileInput.value = '';
        }
    },

    /**
     * Obtener cantidad de archivos seleccionados
     * @returns {number} Número de archivos
     */
    getFileCount() {
        return this.selectedFiles.length;
    },

    /**
     * Actualizar estado de un archivo específico
     * @param {number} index - Índice del archivo
     * @param {string} status - Estado a mostrar (HTML)
     */
    updateFileStatus(index, status) {
        const statusDiv = document.getElementById(`status-${index}`);
        if (statusDiv) {
            statusDiv.innerHTML = status;
        }
    },

    /**
     * Inicializar event listeners
     */
    initializeEventListeners() {
        const fileInput = document.getElementById('pdfFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.updateSelectedFiles(e.target.files);
            });
        }
    },

    /**
     * Inicializar el módulo
     */
    initialize() {
        this.initializeEventListeners();
        console.log('✅ FileManager inicializado');
    }
};

// Mantener compatibilidad con funciones globales
window.selectedFiles = window.FileManager.selectedFiles;
window.displaySelectedFiles = () => window.FileManager.displaySelectedFiles();
window.removeFile = (index) => window.FileManager.removeFile(index);
window.formatFileSize = (bytes) => window.FileManager.formatFileSize(bytes);
// Importar módulos necesarios
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const {PDFDocument} = require('pdf-lib'); // Librería pdf-lib para manipulación de PDFs

// Cargar configuraciones desde un archivo separado
const {config} = require('./Config_prod.js');  // Contendrá las rutas, certificados, etc.



// Función para crear directorios si no existen
function validarCrearDirectorio(directorio) {
    if (!fs.existsSync(directorio)) {
        fs.mkdirSync(directorio, { recursive: true });
    }
}

// Función para firmar y estampar archivos en un directorio
async function firmaryEstamparDirectorio(directorioDestino, directorioProcesado, directorioNoProcesado, enPruebas = false) {
    const directorioPrincipal = "C:/Users/DavidOrlandoRodrigue/Desktop/pdf_firmar/parafirmar";
    const directorioTemporalFirmas = path.join(__dirname, 'firma_temp'); // Directorio temporal para almacenar las firmas individuales
    validarCrearDirectorio(directorioTemporalFirmas); // Crear la carpeta firma_temp si no existe

      if (!fs.existsSync(directorioPrincipal)) {
        console.log("La carpeta principal 'Para Firmar' no existe.");
        return;
    }

    const subCarpetas = fs.readdirSync(directorioPrincipal, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const subCarpeta of subCarpetas) {
        const directorioOrigen = path.join(directorioPrincipal, subCarpeta);
        const directorioProcesadosSubcarpeta = path.join(directorioProcesado, subCarpeta);
        const directorioNoProcesadosSubcarpeta = path.join(directorioNoProcesado, subCarpeta);

        validarCrearDirectorio(directorioProcesadosSubcarpeta);
        validarCrearDirectorio(directorioNoProcesadosSubcarpeta);

        const archivosEncontrados = fs.readdirSync(directorioOrigen).filter(file => file.endsWith('.pdf')).length;
        let archivosProcesados = 0;

        // Procesar cada archivo PDF
        for (const file of fs.readdirSync(directorioOrigen)) {
            if (file.endsWith('.pdf')) {
                archivosProcesados++;
                const pdfOrigen = path.join(directorioOrigen, file);
                const nombreLote = subCarpeta;
                const directorioLote = path.join(directorioDestino, nombreLote);
                validarCrearDirectorio(directorioLote);
                const archivoLog = path.join(directorioLote, `${nombreLote}.txt`);

                const pdfDestino = generarDestino(directorioLote, file);
                const numeroDePaginas = await obtenerNumeroDeHojasDelPDF(pdfOrigen);

                const pdfFinal = await PDFDocument.create(); // Documento PDF final firmado

                for (let i = 1; i <= numeroDePaginas; i++) {
                    const pdfHojaTemporal = await extraerHojaPDF(pdfOrigen, i);
                    const pdfHojaFirmada = await firmarHojaTemporal(pdfHojaTemporal, enPruebas);
                    // Modificamos el nombre del archivo firmado para que coincida con el nombre original y tenga el número de página
                    const baseName = path.basename(file, path.extname(file)); // Obtener el nombre base del archivo original
                    const pdfFirmadoConNombre = path.join(directorioLote, `${baseName}_pagina_${i}_firmada.pdf`); // Añadir el número de página al nombre
    
                    fs.writeFileSync(pdfFirmadoConNombre, fs.readFileSync(pdfHojaFirmada));
                    console.log(`Página ${i} firmada y guardada como PDF en: ${pdfFirmadoConNombre}`);
                    // Generar un nombre único para cada PDF firmado en firma_temp
                    /*const pdfFirmadoTempPath = path.join(directorioTemporalFirmas, `pagina_${i}_firmada.pdf`);
                    fs.writeFileSync(pdfFirmadoTempPath, fs.readFileSync(pdfHojaFirmada));
                    console.log(`Página ${i} firmada y guardada como PDF independiente en: ${pdfFirmadoTempPath}`);
                    */
                  
                }
                logEntrada(archivoLog, "Firmado y Estampado", pdfOrigen);
                moverArchivo(pdfOrigen, directorioProcesadosSubcarpeta);
                  /*
                    // esto se encarga de guardar el PDF final firmado de manera independiente en un archivo final el problema que al modificar el pdf pierder la firma
                    const pdf_firmado_buffer =fs.readFileSync(pdfHojaFirmada);    
                    const arrayBuffer = pdf_firmado_buffer.buffer.slice(pdf_firmado_buffer.byteOffset, pdf_firmado_buffer.byteOffset + pdf_firmado_buffer.byteLength);
                    const firstDonorPdfDoc_firm  = await PDFDocument.load(arrayBuffer,{ ignoreEncryption: true });  
                    Copiar las páginas antes de añadirlas al PDF final
                    const [paginaFirmada] = await pdfFinal.copyPages(firstDonorPdfDoc_firm, [0]);
                    pdfFinal.addPage(paginaFirmada); // Añadir la página firmada
                    Guardar el PDF final firmado
                    const pdfBytes = await pdfFinal.save();
                    fs.writeFileSync(pdfDestino, pdfBytes);

                    if (fs.existsSync(pdfDestino)) {
                        logEntrada(archivoLog, "Firmado y Estampado", pdfDestino);
                        moverArchivo(pdfOrigen, directorioProcesadosSubcarpeta);
                    } else {
                        logEntrada(archivoLog, "NO PROCESADO", pdfOrigen);
                        moverArchivo(pdfOrigen, directorioNoProcesadosSubcarpeta);
                    }
                */
            }
        }
    }
}


// Función para firmar una hoja temporal (simulando el firmado usando Java)
async function firmarHojaTemporal(pdfHojaTemporal, enPruebas) {
    const pdfTemporalPath = path.join(__dirname, 'pdf_hoja_temporal.pdf'); // Ruta donde se guardará el PDF temporal
    const pdfDestinoTemporal = path.join(__dirname, 'pdf_hoja_firmada_temporal.pdf'); // Ruta del PDF firmado
     // Ruta del archivo jar
     let componentejar ='./01-ComponenteJar/AndesSCDFirmador.jar';
     let certificadoRuta_1= './02-Certificado/Certificado.pfx';
    // 1. Guardar el PDF temporal en un archivo antes de firmarlo
    const pdfBytes = await pdfHojaTemporal.save();
    fs.writeFileSync(pdfTemporalPath, pdfBytes);  // Guarda el archivo temporal en la ruta especificada

    return new Promise((resolve, reject) => {
        // 2. Crear el comando con la ruta del PDF temporal
        const argumentos = [
            '-jar', `${componentejar}`,
            '--metodofirma estampa',
            '--formatofirma pdf',
            `--p12 ${certificadoRuta_1}`,
            `--passp12 ${config.certificadoContrasena}`,
            `--entrada "${pdfTemporalPath}"`,  // Aquí pasamos la ruta del PDF temporal
            `--salida "${pdfDestinoTemporal}"`,
            '--formatoentrada archivo',
            '--formatosalida archivo',
            `--visible true`,
            //`--ubicación 0,0,0,0`,
            '--aplicatsa true',
            `--tsausuario ${config.tsaUsuario}`,
            `--tsapass ${config.tsaContrasena}`,
            '--tsaurl https://tsa.andesscd.com.co/',
            `--test ${enPruebas}`,
        ].join(' ');

        // Ejecutar el firmador de Java
        exec(`java ${argumentos}`, (error, stdout, stderr) => {
            const lines = stdout.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('{') && line.endsWith('}'));
            
            if (jsonLine) {
                const parsedData = JSON.parse(jsonLine);
                const estado = parsedData.estado;
        
                if (estado === '0') {
                    console.log('Archivo firmado correctamente.');
                    resolve(pdfDestinoTemporal);  // Resuelve con el PDF firmado
                } else {
                    reject(new Error(`Firma fallida con estado: ${estado}`));
                }
            } else {
                console.error('No se pudo encontrar la respuesta JSON del applet.');
                reject(new Error('Error al firmar el documento.'));
            }
        
            // Si el proceso devuelve errores adicionales, solo muestra los logs, sin detener el flujo
            if (error) {
                console.warn(`Advertencia: ${error.message}`);
            }
            if (stderr) {
                console.warn(`Advertencia de salida: ${stderr}`);
            }
        });
    });
}


// Función para obtener el número de hojas del PDF usando pdf-lib
async function obtenerNumeroDeHojasDelPDF(ruta) {
    const pdfDoc = await PDFDocument.load(fs.readFileSync(ruta),{ignoreEncryption:true});
    return pdfDoc.getPageCount();
}

async function extraerHojaPDF(pdfOrigen, numeroHoja) {
     // Leer el PDF como un Buffer desde el sistema de archivos
     const buffer = fs.readFileSync(pdfOrigen);    
     // Convertir el Buffer en un ArrayBuffer
     const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);     
     // Cargar el PDF utilizando el ArrayBuffer
     const firstDonorPdfDoc  = await PDFDocument.load(arrayBuffer,{ ignoreEncryption: true });     
    // Crear un nuevo PDF temporal para contener la página extraída
    const pdfDoc  = await PDFDocument.create();   
    // Copiar la página específica desde el PDF de origen
    const [firstDonorPage] = await pdfDoc.copyPages(firstDonorPdfDoc, [numeroHoja - 1]);    
    // Añadir la página copiada al PDF temporal
    pdfDoc.addPage(firstDonorPage);   
    // Devolver el PDF temporal que contiene solo esa hoja
    return pdfDoc; 
   
}
// Función para adicionar una hoja firmada al PDF final
async function adicionarHojaAlPDFFinal(pdfFinal, hojaFirmada) {
    // Usar copyPages desde el pdfFinal y no desde hojaFirmada directamente
    const [paginaFirmada] = await pdfFinal.copyPages(hojaFirmada, [0]);
    pdfFinal.addPage(paginaFirmada);
}

// Función para generar un nombre de destino sin sobrescribir
function generarDestino(directorioLote, nombreArchivo) {
    let destino = path.join(directorioLote, nombreArchivo);
    if (fs.existsSync(destino)) {
        const baseName = path.basename(nombreArchivo, path.extname(nombreArchivo));
        const numeroDiferenciador = Math.floor(Math.random() * 100);
        destino = path.join(directorioLote, `${baseName}-${numeroDiferenciador}.pdf`);
    }
    return destino;
}

// Función para registrar entradas en un archivo de log
function logEntrada(archivoLog, tipoEntrada, mensaje) {
    fs.appendFileSync(archivoLog, `${new Date().toISOString()} - ${tipoEntrada}: ${mensaje}\n`);
}

// Función para mover archivo a una carpeta
function moverArchivo(archivoOrigen, directorioDestino) {
    fs.renameSync(archivoOrigen, path.join(directorioDestino, path.basename(archivoOrigen)));
}

// Ejemplo de ejecución
firmaryEstamparDirectorio(
    "C:/Users/DavidOrlandoRodrigue/Desktop/pdf_firmar/firmado",
    "C:/Users/DavidOrlandoRodrigue/Desktop/pdf_firmar/correcto",
    "C:/Users/DavidOrlandoRodrigue/Desktop/pdf_firmar/rechazado"
);

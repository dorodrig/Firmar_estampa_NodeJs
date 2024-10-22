// Importar módulos necesarios
const { exec } = require('child_process');
const path = require('path');
const config = require('./Config_prod.js');  // Asegúrate de tener las configuraciones cargadas

// Función para invocar el applet AndesSCDFirmador
function llamarAppletAndesSCDFirmador(PDF_Origen = "V:/HL Produccion INACTIVOS/01-ParaFirmar/429715_ALBEROLA JAVIER/429715_ALBEROLA JAVIER.pdf", 
                                      PDF_Destino = "V:/HL Produccion INACTIVOS/20-Firmado/429715_ALBEROLA JAVIERtest.pdf", 
                                      EnPruebas = "true") {
    
    // Argumentos del applet    
    const Argument_JarPath = `"./01-ComponenteJar/AndesSCDFirmador.jar"`;
    const Argument_Metodofirma = `--metodofirma P12`;
    const Argument_Formatofirma = `--formatofirma pdf`;
    const Argument_P12 = `--p12 ${config.certificadoRuta}`;
    const Argument_Passp12 = `--passp12 ${config.certificadoContrasena}`;
    const Argument_Entrada = `--entrada "${PDF_Origen}"`;
    const Argument_Salida = `--salida "${PDF_Destino}"`;
    const Argument_FormatoEntrada = `--formatoentrada archivo`;
    const Argument_FormatoSalida = `--formatosalida archivo`;
    const Argument_Aplicatsa = `--aplicatsa true`;
    const Argument_tsa_usuario = `--tsausuario ${config.tsaUsuario}`;
    const Argument_tsa_pass = `--tsapass ${config.tsaContrasena}`;
    const Argument_tsa_url = `--tsaurl https://tsa.andesscd.com.co/`;
    const Argument_test = `--test ${EnPruebas}`;

    // Crear la lista de argumentos completa
    const Java_Argument_List = [
        '-jar',
        Argument_JarPath,
        Argument_Metodofirma,
        Argument_Formatofirma,
        Argument_P12,
        Argument_Passp12,
        Argument_Entrada,
        Argument_Salida,
        Argument_FormatoEntrada,
        Argument_FormatoSalida,
        Argument_Aplicatsa,
        Argument_tsa_usuario,
        Argument_tsa_pass,
        Argument_tsa_url,
        Argument_test
    ].join(' ');

    // Invocar el applet con el comando java
    exec(`java ${Java_Argument_List}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error ejecutando el applet: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`Error en la ejecución: ${stderr}`);
            return;
        }

        console.log(`Salida: ${stdout}`);
    });
}

// Prueba de la función
llamarAppletAndesSCDFirmador();  // Puedes ajustar los parámetros de entrada como desees

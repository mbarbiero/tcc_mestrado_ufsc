const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// IMPORTANTE: Note o uso de barras duplas e a remoção de espaços extras
const inputDir = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\TCC_,v01\\osm_logradouros';
const outputFile = 'importar_logradouros.csv';

console.log('--- Iniciando Script ---');
console.log('Verificando diretório:', inputDir);

async function processarArquivos() {
    // 1. Verificar se o diretório existe
    if (!fs.existsSync(inputDir)) {
        console.error('ERRO: O diretório não foi encontrado! Verifique o caminho.');
        return;
    }

    const files = fs.readdirSync(inputDir);
    console.log(`Arquivos encontrados no total: ${files.length}`);

    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    console.log(`Arquivos .json identificados: ${jsonFiles.length}`);

    if (jsonFiles.length === 0) {
        console.log('Aviso: Nenhum arquivo .json para processar.');
        return;
    }

    const csvWriter = createCsvWriter({
        path: outputFile,
        header: [
            {id: 'OSM_ID', title: 'OSM_ID'},
            {id: 'SC_ID_LOGRADOURO', title: 'SC_ID_LOGRADOURO'},
            {id: 'NOM_LOGRADOURO', title: 'NOM_LOGRADOURO'},
            {id: 'OSM_NOM_LOGRADOURO', title: 'OSM_NOM_LOGRADOURO'},
            {id: 'WKT', title: 'WKT'}
        ],
        fieldDelimiter: ';'
    });

    let listaDados = [];

    jsonFiles.forEach(file => {
        const filePath = path.join(inputDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);
            
            listaDados.push({
                OSM_ID: json.OSM_ID || '',
                SC_ID_LOGRADOURO: json.SC_ID_LOGRADOURO || '',
                NOM_LOGRADOURO: json.NOM_LOGRADOURO || '',
                OSM_NOM_LOGRADOURO: json.OSM_NOM_LOGRADOURO || '',
                WKT: json.WKT || ''
            });
        } catch (e) {
            console.error(`Erro no arquivo ${file}:`, e.message);
        }
    });

    if (listaDados.length > 0) {
        await csvWriter.writeRecords(listaDados);
        console.log(`--- SUCESSO ---`);
        console.log(`Arquivo CSV gerado: ${path.resolve(outputFile)}`);
        console.log(`Total de linhas: ${listaDados.length}`);
    } else {
        console.log('Nenhum dado válido foi extraído dos JSONs.');
    }
}

// Execução com captura de erro global
processarArquivos().catch(err => {
    console.error('ERRO FATAL NA EXECUÇÃO:', err);
});
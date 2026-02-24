const fs = require('fs');
const path = require('path');

// Caminho absoluto - Verifique se não há espaços extras no final da string
const inputDir = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\TCC_,v01\\osm_logradouros';
const outputFile = path.join(__dirname, 'importar_logradouros.sql');

console.log('--- DIAGNÓSTICO DE EXECUÇÃO ---');
console.log('1. Verificando diretório de entrada:', inputDir);

async function gerarSql() {
    // Verificação de existência da pasta
    if (!fs.existsSync(inputDir)) {
        console.error('ERRO: A pasta informada NÃO existe no sistema.');
        return;
    }

    const allFiles = fs.readdirSync(inputDir);
    console.log(`2. Total de arquivos encontrados na pasta: ${allFiles.length}`);

    // Filtro ignorando maiúsculas/minúsculas na extensão
    const jsonFiles = allFiles.filter(file => file.toLowerCase().endsWith('.json'));
    console.log(`3. Total de arquivos .json identificados: ${jsonFiles.length}`);

    if (jsonFiles.length === 0) {
        console.log('AVISO: Nenhum arquivo JSON foi encontrado. O script irá encerrar.');
        return;
    }

    console.log(`4. Criando arquivo de saída em: ${outputFile}`);
    const stream = fs.createWriteStream(outputFile);

    stream.write('-- Script de Importação\nSET NAMES utf8mb4;\n\n');

    let count = 0;
    jsonFiles.forEach(file => {
        const filePath = path.join(inputDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);

            if (json.WKT) {
                const nomeLog = (json.NOM_LOGRADOURO || '').replace(/'/g, "''");
                const osmNomeLog = (json.OSM_NOM_LOGRADOURO || '').replace(/'/g, "''");
                const sql = `INSERT INTO OSM_LOGRADOUROS (OSM_ID, SC_ID_LOGRADOURO, NOM_LOGRADOURO, OSM_NOM_LOGRADOURO, GEOMETRIA) VALUES (${json.OSM_ID || 0}, '${json.SC_ID_LOGRADOURO || ''}', '${nomeLog}', '${osmNomeLog}', ST_GeomFromText('${json.WKT}'));\n`;
                console.log(`Gerando SQL para: ${json.NOM_LOGRADOURO}`);
                stream.write(sql);
                count++;
            }
        } catch (e) {
            console.error(`Erro ao ler ${file}:`, e.message);
        }
    });

    stream.end();
    console.log(`--- PROCESSO CONCLUÍDO ---`);
    console.log(`Linhas de INSERT geradas: ${count}`);
}

gerarSql().catch(err => console.error('ERRO FATAL:', err));
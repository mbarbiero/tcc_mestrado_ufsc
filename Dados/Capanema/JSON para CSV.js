const fs = require('fs');

const inputFile = 'dados_normalizados.json';
const outputFile = 'importacao_ci_lotes.csv';

// 1. Carregar o arquivo JSON
const rawData = fs.readFileSync(inputFile, 'utf-8');
const imoveis = JSON.parse(rawData);

// 2. Cabeçalho do CSV
let csvLines = ['COD_MUNICIPIO;COD_UNICO_ENDERECO;ID_LOTE;ID_QUADRA;NOM_LOGRADOURO;NUM_ENDERECO;NOM_LOGRADOURO_ADJACENTE;DIM_TESTADA;DIM_PROFUNDIDADE'];

// 3. Processamento
imoveis.forEach(imovel => {
    const dg = imovel.dadosGeraisImovel || {};
    const end = imovel.enderecoImovel || {};

    // Mapeamento de campos
    const codMunicipio = "4104501";
    const codUnicoEndereco = dg.inscricaoMunicipal || '';
    
    // REGRA NOVA: idLoteUrbano menos os últimos 5 caracteres
    let idLoteRaw = dg.idLoteUrbano || '';
    const idQuadra = idLoteRaw.length > 5 ? idLoteRaw.slice(0, -5) : idLoteRaw;

    const idLote = idLoteRaw;

    const numEndereco = end.numeroImovel || '';
    const nomLogradouroAdjacente = "";
    const dimTestada = 10;

    // Cálculo da Profundidade
    const area = (dg.areaTerreno && dg.areaTerreno.areaTerreno) ? parseFloat(dg.areaTerreno.areaTerreno) : 0;
    const dimProfundidade = area > 0 ? (area / 10).toFixed(2) : 0;

    // Limpeza Bilateral do Logradouro
    let logradouroRaw = end.nomeLogradouro || '';
    let logradouroLimpo = logradouroRaw
        .replace(/^\d+\s*-\s*/, '') // Remove o início (ex: "1104 - ")
        .split('-')[0]              // Remove tudo após o próximo hífen
        .trim();

    // Montagem da linha
    csvLines.push([
        codMunicipio,
        codUnicoEndereco,
        idLote,
        idQuadra,
        logradouroLimpo,
        numEndereco,
        nomLogradouroAdjacente,
        dimTestada,
        dimProfundidade
    ].join(';'));
});

// 4. Gravação
fs.writeFileSync(outputFile, csvLines.join('\n'), 'utf-8');

console.log(`Sucesso! ID_QUADRA processado e ${imoveis.length} registros exportados.`);
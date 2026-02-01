const fs = require('fs');

const inputFile = 'Cadurb - Capanema.csv';
const outputFile = 'dados_normalizados.json';

// Lendo o arquivo
const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split(/\r?\n/);

const finalData = lines.slice(1).map((line, index) => {
    // 1. Localiza o início e fim do campo ui_json
    // Procuramos o padrão que começa com "{" e termina com "}"
    const match = line.match(/"({.*})"/);

    if (match && match[1]) {
        let rawContent = match[1];

        // 2. NORMALIZAÇÃO ESSENCIAL:
        // Substitui todas as aspas duplas duplicadas por aspas simples.
        // Isso resolve:
        // ""chave"" -> "chave"
        // """" (vazio no CSV) -> "" (vazio no JSON)
        let normalized = rawContent.replace(/""/g, '"');

        try {
            // 3. Validação: Transforma em objeto JS para garantir que está íntegro
            return JSON.parse(normalized);
        } catch (e) {
            console.error(`Erro de parsing na linha ${index + 1}. Verifique se há caracteres especiais não escapados.`);
            return null;
        }
    }
    return null;
}).filter(item => item !== null);

// 4. Salva o arquivo final como um JSON legítimo (Array de Objetos)
fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2), 'utf-8');

console.log(`Sucesso! ${finalData.length} objetos normalizados salvos em ${outputFile}`);
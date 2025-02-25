USE geo;

# TABELA DE LOTES 
/* 
Create table ciata_lotes (
	cadastro VARCHAR(10) PRIMARY KEY,
	logradouro VARCHAR(100),
	numero int,
    bairro VARCHAR(100),
    infComplementar VARCHAR(100),
    quadra VARCHAR(10),
    lote VARCHAR(10),
    area FLOAT,
    testada FLOAT
);
*/
# Fazer a importação dos dados do arquivo CSV

# TABELA RETANGOPOLIS
CREATE TABLE retangopolis AS
	SELECT * FROM ciata_lotes 
	WHERE logradouro IN('SAO PAULO',
		'AMAZONAS',
		'PERNAMBUCO',
		'MINAS GERAIS',
		'ESPÍRITO SANTO',
		'SERGIPE',
		'ALAGOAS',
		'CEARÁ'
	);
# Eliminando o termo "SETOR " de infComplementar 
UPDATE retangopolis
	SET	infComplementar = right(infComplementar, 4)
	WHERE cadastro <> "";

SELECT * FROM retangopolis;

SELECT * FROM geo.retangopolis_quadras;

# Ordena os nomes de logradouros de acordo com a sequencia geográfica em sentido horário 
# A escolha da quadra foi arbitrária
UPDATE retangopolis_quadras 
	SET nmLogradouros = '["SAO PAULO","MINAS GERAIS","AMAZONAS","ESPIRITO SANTO"]',
		snLogrOrdenados = 1
	WHERE idQuadra = "0027";
    

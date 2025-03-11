USE geo;

# TABELA DE LOTES 

Create table lotes (
	InscricaoCadastral 	VARCHAR(20) PRIMARY KEY,
	nmLogradouro 	VARCHAR(100),
	nrEndereco  	VARCHAR(10),
	complementoEndereco 	VARCHAR(100),
	idQuadra  	VARCHAR(10),
	dimTestada 	FLOAT,
	dimProfundidade 	FLOAT
);

/*
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
    

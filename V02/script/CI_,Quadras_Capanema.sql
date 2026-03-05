SELECT distinct * FROM smuu.`CI_,Quadras_Capanema`;

SELECT 
    cap.`quadras.id`,
    cap.`quadras.codigo_cartografico`,
    cap.`quadras.geometria`,
    -- Remove colchetes e aspas para o CSV não quebrar
    REPLACE(REPLACE(REPLACE(q.SC_ID_QUADRA, '[', ''), ']', ''), '"', '') AS sc_id_limpo,
    CASE 
        WHEN q.SC_ID_QUADRA IS NULL OR LENGTH(q.SC_ID_QUADRA) < 40 THEN 'red' 
        ELSE 'green' 
    END AS status_cor
FROM `CI_,Quadras_Capanema` cap
LEFT JOIN smuu.CI_QUADRAS q 
    ON TRIM(cap.`quadras.codigo_cartografico`) = TRIM(q.ID_QUADRA)
WHERE cap.`quadras.codigo_ibge_municipio` = 4104501;

-- SC_QUADRAS-- Quadras válidas no SuperCIATA
SELECT * FROM smuu.SC_QUADRAS
where length(SC_ID_QUADRA) > 40
;

SELECT 
    cap.`quadras.id`,
    cap.`quadras.codigo_cartografico`,
    cap.`quadras.geometria`,
    -- Limpa colchetes, aspas e troca vírgulas por traços para não quebrar o CSV
    REPLACE(REPLACE(REPLACE(REPLACE(sc.SC_ID_QUADRA, '[', ''), ']', ''), '"', ''), ',', '-') AS sc_id_limpo,
    CASE 
        -- 1. AZUL: Prioridade para o que está no SuperCIATA
        WHEN sc.SC_ID_QUADRA IS NOT NULL AND LENGTH(TRIM(sc.SC_ID_QUADRA)) > 40 THEN 'blue'
        -- 2. VERDE: Presente na CI_QUADRAS e longo
        WHEN q.SC_ID_QUADRA IS NOT NULL AND LENGTH(TRIM(q.SC_ID_QUADRA)) > 40 THEN 'green'
        -- 3. VERMELHO: Curto ou inexistente
        ELSE 'red' 
    END AS status_cor
FROM `CI_,Quadras_Capanema` cap
LEFT JOIN smuu.CI_QUADRAS q 
    ON TRIM(cap.`quadras.codigo_cartografico`) = TRIM(q.ID_QUADRA)
LEFT JOIN smuu.SC_QUADRAS sc 
    ON TRIM(cap.`quadras.codigo_cartografico`) = TRIM(sc.CI_ID_QUADRA)
WHERE cap.`quadras.codigo_ibge_municipio` = 4104501;
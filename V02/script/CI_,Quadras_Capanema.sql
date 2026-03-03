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
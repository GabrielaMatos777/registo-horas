-- Executa isto no SQL Editor do teu Supabase Dashboard

CREATE TABLE registos_diarios (
    data DATE PRIMARY KEY,
    horas_trabalhadas NUMERIC NOT NULL DEFAULT 0,
    despesas NUMERIC NOT NULL DEFAULT 0,
    descritivo_despesas TEXT,
    mes_fechado BOOLEAN NOT NULL DEFAULT FALSE,
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    data_pagamento DATE
);

-- Opcional: Row Level Security (RLS)
-- Como a app é de uso único, podes desativar o RLS ou criar políticas que permitem leitura e escrita públicas.
ALTER TABLE registos_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total a registos_diarios"
ON registos_diarios
FOR ALL
TO public
USING (true)
WITH CHECK (true);

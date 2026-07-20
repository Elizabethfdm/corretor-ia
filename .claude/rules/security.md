# Regra rápida — Segurança

Referência operacional resumida. Detalhamento completo em
`../../SECURITY.md` e `../../docs/security/threat-model.md`.

- Nunca confiar em ID enviado pelo cliente sem validar posse no servidor
  (RN-026).
- Nunca versionar segredo real (`.env*` está no `.gitignore`).
- Toda escrita revalida com Zod no servidor, mesmo já validada no
  cliente.
- Upload: validar MIME real, tamanho máximo, nome aleatório, nunca
  aceitar executável.
- Logs nunca contêm senha, token, chave de API ou dado pessoal sensível.
- Erros de autenticação: mensagem sempre genérica.

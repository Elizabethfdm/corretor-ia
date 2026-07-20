# Regra rápida — Estilo e qualidade de código

Referência operacional resumida. Detalhamento completo em `../../CLAUDE.md`
e `../../CONTRIBUTING.md`.

- TypeScript estrito, sem `any` não justificado.
- Sem `catch` vazio.
- Sem `TODO` em fluxo crítico sem dívida técnica registrada.
- Idioma: português do Brasil em UI, documentação e commits;
  identificadores de código em inglês seguindo o padrão já definido no
  projeto.
- Antes de instalar uma dependência nova: verificar manutenção,
  compatibilidade e registrar justificativa em ADR
  (`docs/architecture/decisions/`).
- Não presumir API de biblioteca — consultar documentação oficial atual.

# Regra rápida — Testes

Referência operacional resumida. Detalhamento completo em
`../../docs/quality/test-strategy.md` e
`../../docs/quality/definition-of-done.md`.

- Nenhuma funcionalidade é "concluída" sem teste correspondente.
- Nunca desabilitar, comentar ou apagar teste para destravar o pipeline.
- Nunca alterar a expectativa de um teste só para fazê-lo passar sem
  justificar por que a expectativa anterior estava errada.
- E2E: usar `getByRole`/`getByLabel`/`getByText`; `data-testid` só quando
  não houver alternativa semântica.
- E2E: nunca depender de `waitForTimeout` como sincronização principal.
- Rodar lint + typecheck + testes relacionados após toda alteração antes
  de reportar a tarefa como concluída.

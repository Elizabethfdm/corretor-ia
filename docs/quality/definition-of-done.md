# Definition of Done (DoD) — Corretor IA

Uma fase ou funcionalidade só é considerada concluída quando **todos** os
itens abaixo forem verdadeiros. Nenhum item pode ser contornado para
"fazer o pipeline passar".

1. Requisitos funcionais previstos foram implementados.
2. Critérios de aceite (Given/When/Then) foram atendidos e verificados
   por teste.
3. TypeScript compila sem erros (modo estrito).
4. Lint executa sem erros.
5. Formatação (Prettier) validada.
6. Testes unitários relacionados passam.
7. Testes de integração relacionados passam.
8. Testes E2E críticos relacionados passam.
9. Build de produção passa.
10. Nenhum segredo foi versionado (verificado antes do commit).
11. Nenhum erro crítico de segurança conhecido permanece em aberto.
12. Nenhum erro crítico de acessibilidade conhecido permanece em aberto.
13. Responsividade foi revisada nas resoluções de referência
    (`docs/requirements/non-functional-requirements.md`).
14. Documentação impactada foi atualizada no mesmo commit/PR (regras de
    negócio, requisitos, arquitetura, ADRs quando aplicável).
15. Migração de banco de dados foi revisada (quando aplicável).
16. Evidências de execução foram registradas em `docs/evidence/`.
17. Revisão de código (checklist de `docs/quality/test-strategy.md`,
    seção 10) foi concluída, com tabela `Item | Resultado | Evidência |
Ação` preenchida.
18. Dívida técnica introduzida (se houver) foi documentada explicitamente,
    nunca deixada como `TODO` silencioso em fluxo crítico.
19. `docs/quality/traceability-matrix.md` foi atualizada.
20. `CHANGELOG.md` foi atualizado.

## Proibições absolutas para considerar algo "pronto"

- Desabilitar teste para o pipeline passar.
- Substituir teste real por comentário.
- Usar `any` em TypeScript sem justificativa documentada.
- Ignorar erro com `catch` vazio.
- Deixar `TODO` em fluxo crítico sem dívida técnica registrada.
- Silenciar warning relevante sem justificativa.

## Classificação de bugs e bloqueio de entrega

| Severidade | Exemplos                                                                                                                                                                                     | Bloqueia entrega?                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Crítico    | vazamento de dados, perda de dados, acesso indevido, aplicação indisponível, publicação de dados privados, falha de autenticação, upload malicioso executável                                | Sim                                                              |
| Alto       | fluxo principal indisponível, imóvel não publica, catálogo não abre, usuário acessa informação de outro corretor, anúncio de IA com dado inventado, relatório vazando dado de outro corretor | Sim                                                              |
| Médio      | funcionalidade secundária falha, layout relevante quebrado, informação não crítica incorreta, incompatibilidade limitada                                                                     | Corrigir antes da versão, salvo decisão documentada em contrário |
| Baixo      | ajuste visual, texto, espaçamento, melhoria sem impacto funcional                                                                                                                            | Pode ser documentado para correção posterior                     |

Nenhum bug crítico ou alto pode permanecer aberto em uma entrega.

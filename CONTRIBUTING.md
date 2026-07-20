# Guia de Contribuição — Corretor IA

Este documento define como o código do Corretor IA deve ser alterado,
revisado e integrado. Válido para qualquer colaborador humano ou agente de
IA (incluindo o Claude Code — ver também [`CLAUDE.md`](CLAUDE.md)).

## 1. Fluxo de trabalho

O projeto é desenvolvido em fases pequenas, testáveis e revisáveis (ver
[`docs/planning/phases-plan.md`](docs/planning/phases-plan.md)). Nenhuma
funcionalidade deve ser implementada sem:

1. Critérios de aceite definidos.
2. Testes correspondentes (unitário, integração e/ou E2E, conforme o caso).
3. Avaliação de impacto em funcionalidades já existentes.

## 2. Antes de alterar código

1. Leia os arquivos relacionados à mudança.
2. Entenda o padrão já existente no módulo.
3. Avalie o impacto da alteração.
4. Verifique os testes existentes.
5. Verifique as regras de negócio envolvidas em
   [`docs/business-rules/business-rules.md`](docs/business-rules/business-rules.md).

## 3. Depois de alterar código

1. Formate o código (Prettier).
2. Execute o lint (ESLint).
3. Execute a verificação de tipos (TypeScript estrito).
4. Execute os testes relacionados.
5. Execute os testes de regressão aplicáveis.
6. Revise o diff completo antes de propor a mudança.
7. Atualize a documentação impactada (incluindo a matriz de
   rastreabilidade, quando aplicável).

## 4. Proibições

- Não sobrescrever configuração sem antes lê-la.
- Não apagar código sem verificar se ainda está em uso.
- Não alterar contrato de API sem avaliar quem consome.
- Não alterar o banco de dados sem migração versionada.
- Não alterar uma regra de negócio sem atualizar os testes correspondentes.
- Não instalar pacotes sem justificativa registrada em ADR.
- Não expor segredos em código, log ou mensagem de erro.
- Não ignorar erros silenciosamente (`catch` vazio é proibido).
- Não forçar um teste a passar alterando uma expectativa incorreta.
- Não desabilitar teste para "destravar" o pipeline.
- Não usar `any` em TypeScript sem justificativa documentada.
- Não fazer commit de arquivos gerados desnecessários.

## 5. Commits

Utilizar [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```text
feat(auth): adiciona cadastro e login de corretor
fix(catalog): impede exibição de imóvel despublicado
test(properties): adiciona testes de isolamento entre corretores
docs(readme): documenta execução local
refactor(analytics): separa agregação de eventos
chore(ci): adiciona pipeline de qualidade
```

Cada commit deve:

- ter escopo pequeno e coerente;
- deixar o projeto em estado funcional;
- incluir os testes relacionados à mudança;
- não incluir segredos;
- não misturar mudanças sem relação entre si.

`git push` só deve ocorrer mediante solicitação explícita.

## 6. Definition of Ready / Definition of Done

Ver [`docs/quality/definition-of-ready.md`](docs/quality/definition-of-ready.md)
e [`docs/quality/definition-of-done.md`](docs/quality/definition-of-done.md).
Nenhuma fase é considerada concluída sem atender à Definition of Done.

## 7. Revisão de código

Após cada módulo, aplicar o checklist de revisão descrito em
[`docs/quality/test-strategy.md`](docs/quality/test-strategy.md) (seção de
revisão de código), reportando resultado em formato de tabela
`Item | Resultado | Evidência | Ação`.

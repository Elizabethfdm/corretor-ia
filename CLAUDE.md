# CLAUDE.md — Instruções permanentes do projeto Corretor IA

Este arquivo contém instruções permanentes para qualquer trabalho realizado
pelo Claude Code neste repositório. Ele complementa (não substitui) o
Prompt Mestre do projeto e os documentos em `/docs`. Em caso de conflito
entre este arquivo e o Prompt Mestre original, o Prompt Mestre prevalece
para decisões de produto; este arquivo prevalece para convenções técnicas
do dia a dia.

## 1. Idioma

- Todo o conteúdo do projeto — código, comentários (quando estritamente
  necessários), documentação, commits, mensagens de UI e nomes de
  entidades de domínio (quando fizer sentido) — deve ser produzido em
  **português do Brasil**, exceto identificadores de código que sigam
  convenções técnicas em inglês (nomes de variáveis, funções, tipos,
  campos de banco), que devem seguir o padrão já definido em
  `docs/architecture/data-model.md`.
- Interface do usuário: português do Brasil (`lang="pt-BR"`).

## 2. Forma de trabalho

- O projeto é construído em fases pequenas, testáveis e revisáveis. Ver
  `docs/planning/phases-plan.md`.
- Antes de iniciar uma fase, apresentar: objetivo, arquivos previstos,
  regras de negócio envolvidas, testes previstos e impacto em
  funcionalidades existentes.
- Só implementar uma funcionalidade com critérios de aceite e testes
  correspondentes definidos.
- Aguardar autorização explícita apenas para decisões de produto
  realmente indispensáveis. Para decisões técnicas comuns, adotar a opção
  mais simples, segura e bem documentada, registrando a justificativa em
  `docs/architecture/decisions/` (ADR).
- Ao final de cada fase, reportar: funcionalidades implementadas, arquivos
  criados/alterados, decisões técnicas, testes executados e resultado,
  bugs encontrados/corrigidos, pendências, evidências, comandos de
  validação manual e próxima fase recomendada.

## 3. Arquitetura e convenções técnicas

- Next.js com App Router; TypeScript em **modo estrito** (`strict: true`),
  sem exceções não justificadas.
- PostgreSQL como banco de dados; Prisma (ou ORM equivalente maduro,
  registrado em ADR) para acesso a dados.
- Zod para validação, compartilhada entre cliente e servidor.
- React Hook Form para formulários, quando adequado.
- Tailwind CSS + componentes acessíveis para UI.
- Armazenamento de mídia em serviço compatível com S3.
- Camada de abstração própria para IA (`AiContentProvider`) — nunca
  acoplar lógica de negócio diretamente a um SDK de um único fornecedor.
- Seguir a estrutura de pastas definida em
  `docs/architecture/architecture.md` (`src/app`, `src/components`,
  `src/features`, `src/lib`, `src/server`, `src/types`, `prisma/`,
  `tests/`).
- Antes de instalar qualquer biblioteca nova: verificar se é mantida,
  checar compatibilidade com as versões em uso, evitar dependência
  desnecessária, preferir documentação oficial atual e registrar a
  justificativa em um ADR. Nunca presumir uma API de biblioteca sem
  consultar a documentação vigente — não inventar métodos ou parâmetros.

## 4. Regras de negócio e isolamento de dados

- Toda consulta, alteração ou exclusão envolvendo imóveis, mídia,
  relatórios ou perfil deve isolar os dados por corretor autenticado no
  **servidor**. Nunca confiar em identificadores enviados pelo cliente
  sem revalidar a posse do recurso (ver RN-001 em
  `docs/business-rules/business-rules.md`).
- Nenhuma alteração de regra de negócio deve ser feita sem atualizar a
  documentação correspondente em `docs/business-rules/business-rules.md`
  e os testes relacionados.
- Consultar sempre `docs/business-rules/business-rules.md` e
  `docs/requirements/functional-requirements.md` antes de implementar ou
  alterar uma funcionalidade.

## 5. Segurança (obrigatório desde a primeira linha de código)

- Nunca versionar segredos: chaves de IA, credenciais de banco, tokens de
  autenticação, credenciais de nuvem ou dados reais de usuários. Usar
  apenas `.env.example` (sem valores) como referência.
- Validar toda entrada no servidor, mesmo quando já validada no cliente.
- Prevenir IDOR, CSRF, XSS e SQL Injection (via ORM parametrizado, nunca
  concatenação de SQL).
- Aplicar rate limiting em rotas de autenticação e endpoints sensíveis.
- Validar upload por tipo MIME real e tamanho máximo; nunca aceitar
  arquivos executáveis; gerar nomes de arquivo aleatórios.
- Cookies de sessão: `HttpOnly`, `Secure` em produção, `SameSite`
  apropriado.
- Logs nunca devem conter senhas, tokens, chaves de API ou dados pessoais
  sensíveis.
- Mensagens de erro de autenticação devem ser genéricas (nunca revelar se
  um e-mail existe na base).
- Ver detalhamento completo em `SECURITY.md` e
  `docs/security/threat-model.md`.

## 6. Testes — obrigatório, nunca opcional

- Nenhuma funcionalidade é considerada concluída sem os testes
  correspondentes (unitário, integração e/ou E2E, conforme o tipo de
  mudança). Ver `docs/quality/test-strategy.md`.
- Após qualquer alteração de código, executar: formatação, lint,
  verificação de tipos, testes relacionados e testes de regressão
  aplicáveis antes de considerar a tarefa concluída.
- **Nunca** remover, comentar ou desabilitar um teste para "destravar" o
  pipeline ou ocultar uma falha. Corrigir a causa raiz.
- **Nunca** alterar a expectativa de um teste apenas para fazê-lo passar,
  a menos que a expectativa anterior estivesse comprovadamente incorreta
  — e, nesse caso, documentar o motivo no commit.
- Usar localizadores semânticos em testes E2E (`getByRole`, `getByLabel`,
  `getByText`); usar `data-testid` apenas quando estritamente necessário.
- Não usar esperas fixas (`sleep`/`waitForTimeout`) como estratégia
  principal de sincronização em testes E2E.

## 7. Qualidade de código

- Não usar `any` em TypeScript sem justificativa documentada em comentário
  ou ADR.
- Não deixar blocos `catch` vazios — todo erro deve ser tratado ou
  relançado com contexto.
- Não deixar `TODO` em fluxo crítico sem registrar a dívida técnica
  correspondente na documentação.
- Não silenciar warnings relevantes de lint ou de build.
- Evitar duplicação, acoplamento excessivo, funções grandes e componentes
  com responsabilidades múltiplas — preferir extrair quando o padrão já
  aparece 3+ vezes, sem criar abstração especulativa antes disso.

## 8. Documentação viva

- Sempre que uma fase alterar escopo, regra de negócio, modelo de dados ou
  arquitetura, atualizar o documento correspondente em `/docs` na mesma
  entrega.
- Atualizar `docs/quality/traceability-matrix.md` a cada fase concluída.
- Atualizar `CHANGELOG.md` a cada fase entregue.

## 9. Commits e versionamento

- Conventional Commits, em português, com escopo pequeno (ver exemplos em
  `CONTRIBUTING.md`).
- Nunca fazer `git push` sem solicitação explícita do usuário.
- Nunca usar `--no-verify`, `--no-gpg-sign` ou pular hooks sem pedido
  explícito.

## 10. Comandos do projeto

```bash
npm run dev              # servidor de desenvolvimento (http://localhost:3000)
npm run build             # build de produção
npm run start              # serve o build de produção
npm run lint                 # ESLint
npm run typecheck             # TypeScript em modo estrito (tsc --noEmit)
npm run format                 # Prettier --write
npm run format:check            # Prettier --check
npm run test                     # Vitest — unitário + integração (exige Postgres local no ar)
npm run test:coverage             # idem, com cobertura
npm run test:e2e                   # Playwright — E2E + acessibilidade (builda e sobe a app sozinho)
npm run db:migrate                  # prisma migrate dev (local)
npm run db:migrate:deploy            # prisma migrate deploy (CI/produção, não interativo)
npm run db:generate                   # prisma generate
npm run db:studio                      # Prisma Studio
npm run db:seed                         # executa prisma/seed.ts
docker compose up -d                     # sobe o PostgreSQL local
```

Sempre rodar `lint`, `typecheck`, `test` e `build` antes de reportar uma
tarefa como concluída (ver seção 6). O Postgres local (via
`docker compose up -d`) precisa estar no ar para os testes de integração
e para `npm run dev`/`db:migrate`. No Windows com Docker Desktop, use
`127.0.0.1` em vez de `localhost` em `DATABASE_URL` — evita um travamento
de conexão conhecido por resolução IPv6.

O cliente Prisma é gerado em `src/generated/prisma` (gitignored,
regenerado por `prepare`/`db:generate` — nunca editar manualmente nem
importar diretamente fora de `src/lib/database/prisma.ts`).

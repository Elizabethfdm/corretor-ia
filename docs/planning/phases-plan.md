# Plano de Implementação por Fases — Corretor IA

Cada fase segue o formato definido em `CONTRIBUTING.md`/`CLAUDE.md`: ao
iniciar, apresentar objetivo, arquivos previstos, regras de negócio
envolvidas, testes previstos e impacto em funcionalidades existentes; ao
concluir, reportar conforme `docs/quality/definition-of-done.md`.

## Fase 0 — Descoberta e Planejamento (esta fase)

**Status: concluída.**

Entregas: visão do produto, personas, jornadas, mapa de funcionalidades,
escopo e fora de escopo, regras de negócio numeradas, requisitos
funcionais e não funcionais numerados, modelo de dados inicial,
arquitetura proposta, plano de testes, backlog priorizado, critérios de
aceite, estrutura de documentação. Nenhum código funcional, dependência,
banco de dados ou infraestrutura foi criado.

## Fase 1 — Fundação do Projeto

**Status: concluída.**

Objetivo: preparar a base técnica para todas as fases seguintes.

Entregas previstas: projeto Next.js com TypeScript estrito; configuração
do Prisma e conexão com PostgreSQL local via Docker; ESLint e Prettier;
estrutura de pastas definida em `docs/architecture/architecture.md`;
configuração de variáveis de ambiente; logging estruturado inicial;
pipeline de CI (GitHub Actions) com formatação, lint, verificação de
tipos, testes e build; endpoint de health check; documentação inicial de
como rodar o projeto localmente (a preencher no `README.md`).

Regras de negócio envolvidas: nenhuma regra de domínio ainda — foco em
infraestrutura de suporte às regras futuras (RNF-042 a RNF-045).

## Fase 2 — Autenticação

**Status: concluída.**

Entregas: cadastro, login, logout, recuperação e redefinição de senha,
proteção de rotas privadas, autorização básica, auditoria de eventos de
autenticação relevantes, testes. Biblioteca escolhida: Better Auth (ver
ADR-0002).

Regras: RN-001 a RN-014.

## Fase 3 — Perfil do Corretor

Entregas: formulário de perfil profissional, upload de foto/logotipo,
identidade visual (cores), slug do catálogo com validação, visualização
pública mínima do perfil, testes.

Regras: RN-015 a RN-025.

## Fase 4 — Cadastro de Imóveis

Entregas: fluxo em etapas, rascunho, validações por etapa, gestão de
características, endereço com regra de privacidade, upload/gestão de
fotos, publicação e transições de status, testes.

Regras: RN-026 a RN-045.

## Fase 5 — Catálogo Digital

Entregas: página pública do corretor, listagem, busca, filtros,
ordenação, responsividade, SEO básico, testes.

Regras: RN-046 a RN-050.

## Fase 6 — Página Individual do Imóvel

Entregas: galeria, informações públicas, endereço seguro, contato via
WhatsApp, imóveis semelhantes, compartilhamento (imóvel, catálogo,
resultado filtrado), testes.

Regras: RN-051 a RN-060.

## Fase 7 — IA para Anúncios

Entregas: interface `AiContentProvider`, primeiro adaptador de provedor,
prompts seguros (sem invenção de dados), geração, edição, histórico,
limites de uso, testes com provedor simulado (fake), tratamento de
falhas e timeout.

Regras: RN-061 a RN-074.

## Fase 8 — Artes

Entregas: modelos predefinidos, pré-visualização, personalização de
texto, exportação/download, testes.

Regras: RN-075 a RN-081.

## Fase 9 — Relatórios

Entregas: registro dos eventos de analytics (`catalog_view`,
`property_view`, `whatsapp_click`, `share_click`, `copy_link`,
`ad_generated`, `art_generated`), agregações, cartões de indicadores,
filtros por período, garantias de privacidade, testes.

Regras: RN-082 a RN-090.

## Fase 10 — Hardening

Entregas: revisão completa de segurança, acessibilidade e performance;
testes exploratórios guiados pelos charters de
`docs/quality/test-strategy.md`; correções de bugs críticos/altos
pendentes; atualização final de toda a documentação; evidências
consolidadas; checklist de produção conferido contra
`docs/product/mvp-scope.md` (critérios gerais de aceite do MVP).

## Observação sobre o painel administrativo

O escopo mínimo de administração (RN-091 a RN-095, RF-072 a RF-075) é
propositalmente pequeno e deve ser incorporado dentro da Fase 1
(estrutura básica de papéis) e da Fase 2/10 (telas mínimas), sem
justificar uma fase dedicada — conforme instrução explícita de não criar
uma área administrativa excessivamente complexa nesta primeira versão.

## Regra de avanço entre fases

Nenhuma fase avança para a seguinte sem atender à
`docs/quality/definition-of-done.md`. Decisões de produto realmente
indispensáveis identificadas durante uma fase são levantadas
explicitamente para validação antes de prosseguir; decisões técnicas
comuns seguem a opção mais simples, segura e documentada (registrada em
ADR quando relevante).

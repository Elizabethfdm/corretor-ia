# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue as recomendações do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/) a
partir da primeira versão publicada.

## [Não lançado]

### Adicionado — Refatoração de UX/UI, Fase 2 (Shell/navegação do painel)

- Layout compartilhado para todas as rotas do painel
  (`src/app/(dashboard)/layout.tsx`): sidebar com ícones (Radix/
  `lucide-react`, item "Administração" condicional ao papel do
  usuário) e cabeçalho fixo com nome/e-mail/badge de admin e botão
  "Sair" — elimina a duplicação de cabeçalho que cada página do
  painel desenhava à mão.
- Menu de navegação em drawer para telas pequenas (RNF-002), usando o
  primitivo `@radix-ui/react-dialog` diretamente.
- `/painel-admin` movido para dentro do grupo de rotas `(dashboard)`
  (mesma URL — grupos de rotas não afetam o caminho) para compartilhar
  o novo shell; `requireAdmin()` continua validando no servidor
  independentemente da UI (RN-095).
- `PropertyEditor` ("Etapas do cadastro") migrado do padrão manual
  `<nav><button aria-current="step">` para o componente `Tabs`
  (Radix) da Fase 1 — passa a usar os papéis ARIA padrão de abas
  (`tablist`/`tab`/`tabpanel`).
- 10 arquivos de teste E2E/acessibilidade atualizados para os novos
  papéis de aba (`getByRole("tablist"/"tab")` em vez de
  `"navigation"/"button"`).
- Novos testes de componente para `NavLinks` e `MobileNav` (item
  "Administração" condicional, estado ativo, fechamento do drawer ao
  navegar).

Corrigido durante o desenvolvimento (não chegou a ser entregue): a
página `/painel` exibia o e-mail do usuário tanto no cabeçalho
compartilhado quanto no próprio conteúdo da página — a suíte E2E
completa (5 navegadores) capturou a ambiguidade (`getByText(email)`
resolvendo para 2 elementos), quebrando `auth-login-logout.spec.ts` e
`auth-register.spec.ts` de forma determinística nos 5 navegadores.
Corrigido removendo a duplicação do conteúdo da página.

### Adicionado — Refatoração de UX/UI, Fase 1 (Fundação do design system)

- ADR-0009: `class-variance-authority` + `clsx` + `tailwind-merge`
  (padrão shadcn/ui) para composição de classes/variantes, e primitivos
  **Radix UI** (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`,
  `@radix-ui/react-dropdown-menu`) para os componentes que exigem
  gestão de foco/teclado complexa (RNF-019). Ícones via `lucide-react`.
- Paleta de marca (`primary`/`success`/`danger`/`warning`/`neutral`) e
  tipografia Geist ativada de fato em `src/app/globals.css` — antes
  carregada via `next/font/google` mas sobrescrita por uma regra
  `font-family: Arial, Helvetica, sans-serif` que a tornava inerte.
- Novo helper `cn()` (`src/lib/utils/cn.ts`) e 10 novos componentes em
  `src/components/ui/`: `button`, `card`, `badge`, `dialog`, `tabs`,
  `dropdown-menu`, `table`, `pagination`, `skeleton`, `spinner`.
  Nenhuma página os consome ainda — fundação para as próximas fases da
  refatoração de UX/UI (shell/navegação, dashboard, cadastro de
  imóveis, catálogo, página do imóvel, relatórios/admin).
- Componentes já existentes (`input`, `select`, `submit-button`,
  `form-message`, `form-field`) migrados para `cn()` internamente,
  mantendo a aparência visual e a API de props idênticas às de antes
  (paleta `neutral`/`success`/`danger` alinhada byte a byte às cores
  Tailwind já em uso — nenhuma página muda de aparência nesta fase).
- Primeiros testes de renderização de componente React do projeto
  (`@testing-library/react`, já instalado mas nunca usado para isso):
  `cn()`, `Button` (variantes), `Dialog` (abre/fecha com Esc, devolve
  foco ao gatilho — RNF-019), `Tabs` (navegação por teclado).

### Adicionado — Fase 10 (Hardening)

- Painel administrativo mínimo (`/painel-admin`, RF-072 a RF-075): lista
  de corretores com contagem de imóveis, bloqueio/desbloqueio de conta
  (via `auth.api.banUser`/`unbanUser` do Better Auth — já revoga
  sessões ativas imediatamente, RN-092), indicadores gerais da
  plataforma e auditoria básica recente. Protegido no servidor por
  `requireAdmin()` (RN-095), já existente desde a Fase 2.
- **RN-093 decidida**: catálogo público de conta bloqueada é ocultado
  imediatamente (mesmo comportamento de catálogo despublicado).
- Cabeçalhos de segurança HTTP (RNF-034), ausentes até esta fase: CSP,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: origin-when-cross-origin` (ADR-0008).
- Revisão de segurança dirigida pela seção 6 de
  `docs/quality/test-strategy.md`, `npm audit` (sem vulnerabilidades
  altas/críticas), charters exploratórios (seção 8) documentados com
  gaps de baixa severidade registrados como dívida técnica, e checklist
  final dos 25 critérios de aceite do MVP (`docs/product/mvp-scope.md`)
  conferido.
- 6 novos testes de integração e 3 novos cenários E2E/acessibilidade.

Corrigidos durante o desenvolvimento (nenhum chegou a ser entregue):
asserção de teste frágil sob execução concorrente contra indicadores
globais; requisição de teste sem cabeçalho `Origin` mascarando o
resultado esperado; contextos de navegador Playwright compartilhando
sessão indevidamente entre corretor e administrador nos testes E2E.

### Adicionado — Fase 9 (Relatórios)

- Registro dos 7 eventos de analytics do MVP: `catalog_view`,
  `property_view`, `whatsapp_click`, `share_click`, `copy_link`,
  `ad_generated`, `art_generated` (RN-089).
- Relatório em `/painel/relatorios`: cartões de indicadores por tipo de
  evento, imóvel mais acessado no período (RF-069) e filtro por período
  (hoje/7 dias/30 dias/personalizado, RF-068), com estado vazio claro
  quando não há dados (RN-088).
- Isolamento por corretor em toda consulta de relatório (RN-082,
  RF-070).
- Mitigação de duplicidade (RN-084) via hash de sessão calculado por
  requisição (IP + User-Agent + dia-calendário, não reversível —
  RN-087), sem cookie de visitante nem `middleware.ts` novo (ADR-0007).
- Classificador de dispositivo por regras próprias (Mobile/Tablet/
  Desktop/Desconhecido), sem dependência nova.
- Eventos de clique (`whatsapp_click`, `share_click`, `copy_link`)
  registrados via Server Actions públicas, chamadas a partir do
  catálogo e da página do imóvel; `PropertyContactCard` e o botão de
  WhatsApp do catálogo passaram a ser client components para isso.
- `ad_generated`/`art_generated` registrados nas Server Actions de
  geração de anúncio (Fase 7) e arte (Fase 8) já existentes.
- 29 novos testes unitários/integração e 3 novos cenários E2E/
  acessibilidade.

Corrigido durante o desenvolvimento: um teste de outra fase
(`tests/unit/lib/validation/artwork.test.ts`) tinha um warning de lint
não percebido antes (variável desestruturada e descartada via
`_subtitle`, não coberta pelo padrão de ignorar variáveis não usadas do
projeto) — corrigido para não depender desse padrão.

### Adicionado — Fase 8 (Artes)

- Geração de artes para redes sociais: corretor escolhe formato (feed
  quadrado, feed vertical, Story, Status do WhatsApp, capa de Reel) e
  tipo de anúncio (novo imóvel, destaque, oportunidade, venda, aluguel,
  redução de preço, reservado, vendido, visita aberta), escolhe a foto
  do imóvel e edita título, subtítulo e chamada para ação antes de
  gerar.
- Composição via `sharp` (ADR-0006), sem nenhuma dependência nova: foto
  recortada sem distorção (`fit: cover`, RN-078) e textos renderizados
  via Pango (`sharp({ text: ... })`), que ajusta automaticamente o
  tamanho da fonte para nunca cortar texto (RN-077) — dispensa um
  algoritmo próprio de quebra/redução de fonte.
- Modelos são constantes definidas no código, não uma tabela
  configurável (RN-081 — sem editor gráfico livre); só o resultado de
  cada geração (`GeneratedArtwork`) é persistido.
- Identidade visual do corretor (cor principal, logotipo) aplicada
  quando configurada; modelo padrão da plataforma por tipo de anúncio
  quando ausente (RN-076).
- Pré-visualização sempre exibida antes do download; download via rota
  autenticada (`/api/artwork/[artworkId]/download`) com posse verificada
  no servidor (RN-026, RF-065).
- Histórico de artes por imóvel, isolado por corretor.
- 35 novos testes unitários/integração e 2 novos cenários E2E/
  acessibilidade.

Corrigido durante o desenvolvimento: o primeiro seletor de foto (radio
button visualmente oculto, `sr-only`) não tinha nome acessível quando a
foto não tinha texto alternativo próprio — detectado pelo teste de
acessibilidade automatizado (axe-core), corrigido com `aria-label`
explícito por foto.

### Adicionado — Fase 7 (IA para Anúncios)

- Geração de anúncios de imóveis com IA: corretor escolhe imóvel, canal
  (Instagram, Facebook, WhatsApp, Story, genérico), tom, tamanho,
  objetivo, público-alvo e aspectos a destacar; sistema gera título,
  texto, chamada para ação e hashtags.
- Abstração `AiContentProvider` (`lib/ai`), independente de fornecedor
  (ADR-0004): `FakeAiProvider` determinístico (padrão em dev/testes,
  sem rede nem custo) e `AnthropicAiProvider` real via
  `@anthropic-ai/sdk` (Claude), selecionados por `AI_PROVIDER`.
- Prompt construído exclusivamente a partir de dados do imóvel do
  corretor autenticado, com instruções explícitas contra invenção de
  dados, promessas indevidas e linguagem discriminatória (RN-061 a
  RN-065) — título nunca usa `internalTitle` bruto (mesma síntese já
  usada no catálogo público, Fase 5).
- Conteúdo sempre sinalizado como "Gerado por IA", editável antes de
  copiar, nunca publicado automaticamente (RN-066 a RN-068).
- Histórico de anúncios por imóvel; limite mensal de gerações por
  corretor, configurável (`AI_MONTHLY_GENERATION_LIMIT` — simplificação
  documentada, produto ainda não tem sistema de planos); timeout e
  tratamento de falha do provedor com mensagem clara (RN-070 a RN-072).
- 31 novos testes unitários/integração e 2 novos cenários E2E/
  acessibilidade.

Corrigida também uma inconsistência descoberta ao implementar: a
síntese de título público (`buildPublicTitle`, criada na Fase 5) foi
extraída de `catalog-service.ts` para `lib/property/build-public-title.ts`
e reaproveitada aqui — a geração de anúncio usava anteriormente
`publicTitle || internalTitle`, o que teria enviado o título interno do
corretor para a IA quando `publicTitle` estivesse vazio (RN-065).

### Adicionado — Fase 6 (Página Individual do Imóvel)

- Página pública do imóvel (`/catalogo/[slug]/[propertySlug]`) com
  galeria de fotos, capa, título, valor, finalidade, tipo,
  características, condições (mobiliado, aceita animais/financiamento/
  permuta), descrição, diferenciais, proximidades, condições comerciais
  e código de referência.
- Endereço completo exibido apenas quando o corretor marcou
  visibilidade `FULL_ADDRESS` (RN-039, RN-040) — antes só persistido,
  agora com um consumidor público de verdade.
- Cartões do catálogo (Fase 5) passam a ser links reais para a página
  do imóvel.
- Botão de contato via WhatsApp com mensagem padrão (nome do corretor,
  título, código de referência, URL do imóvel), fixo no rodapé em
  telas mobile (RN-051, RN-052).
- Seção de imóveis semelhantes, restrita ao mesmo corretor e a imóveis
  disponíveis (RN-053).
- Compartilhamento de imóvel, catálogo completo ou resultado filtrado
  via WhatsApp, copiar link, copiar mensagem e compartilhamento nativo
  do dispositivo quando suportado (RF-050 a RF-052) — mensagem nunca
  omite campos preenchidos nem afirma envio (RN-055, RN-058).
- 26 novos testes unitários/integração e 6 novos cenários E2E/
  acessibilidade.

Corrigida também uma referência cruzada incorreta em
`business-rules.md` (RN-057 apontava para RN-064 por engano — regra
sem relação, sobre linguagem em anúncios de IA). O registro do evento
de compartilhamento (RN-057) depende de `AnalyticsEvent`, criado
somente na Fase 9 — os botões funcionam, o evento ainda não é gravado.

### Adicionado — Fase 5 (Catálogo Digital)

- Catálogo público (`/catalogo/[slug]`) com listagem paginada (12 por
  página) dos imóveis disponíveis do corretor — RN-046 restrito a
  status "Disponível" (decisão registrada em `business-rules.md`).
- Busca por termo livre (título público, descrição, cidade, bairro) e
  filtros por finalidade, tipo, cidade, bairro, faixa de preço, quartos
  mínimos, vagas mínimas, características (todas as selecionadas,
  E lógico) e aceite de financiamento.
- Ordenação por mais recentes, menor preço, maior preço, maior área e
  destaques.
- Filtros/ordenação/página refletidos na URL via formulário GET simples
  (sem JavaScript), tornando qualquer resultado filtrado compartilhável
  (RN-047).
- Serializer público dedicado (`catalog-service.ts`) com lista de
  permissão explícita de campos — nunca expõe `internalTitle`,
  `internalNotes`, `referenceCode` ou chaves de storage (RN-049); título
  público sintetizado a partir de tipo/finalidade/localização quando o
  corretor não define um `publicTitle` distinto.
- SEO básico: `generateMetadata` dinâmica conforme os filtros aplicados.
- 15 novos testes unitários, 12 novos testes de integração e 4 novos
  cenários E2E/acessibilidade.

### Adicionado — Fase 4 (Cadastro de Imóveis)

- Models `Property`, `PropertyAddress`, `PropertyFeature` e
  `PropertyMedia` (com `@relation` formal e `onDelete: Cascade` a partir
  de `BrokerProfile`) e migração real.
- Cadastro de imóvel em etapas (informações básicas, características,
  localização, fotos, descrição, revisão e publicação) via Server
  Actions, com salvamento de rascunho independente por etapa (RN-044).
- Upload múltiplo de fotos com validação de conteúdo real, compressão e
  remoção de metadados (reaproveitando o pipeline da Fase 3), primeira
  foto definida como capa automaticamente, reordenação e exclusão com
  promoção automática de nova capa (RN-033 a RN-037, RN-045).
- Publicação bloqueada até que título, valor (ou "consulte o valor"),
  cidade, bairro, descrição e ao menos uma foto estejam preenchidos
  (RN-043), com aviso de pendências reaproveitado no cliente e no
  servidor.
- Transições de status validadas por um mapa único de estados permitidos
  (rascunho → disponível → reservado/vendido/alugado/inativo — RN-027),
  cobrindo também despublicar (RN-032) e republicar.
- Duplicação de imóvel como novo rascunho, sem métricas nem slug público
  (RN-029); exclusão lógica reversível com restauração acessível pela
  lista de imóveis (RN-028).
- Slug do imóvel regenerado a partir do título enquanto não publicado, e
  congelado após a primeira publicação, para não quebrar links já
  compartilhados (RN-031).
- Isolamento entre corretores (RN-026): todo acesso é resolvido a partir
  do corretor autenticado, nunca de um identificador vindo do cliente.
- Autopreenchimento de endereço por CEP via ViaCEP.
- 42 novos testes unitários, 22 novos testes de integração (contra
  Postgres e MinIO reais) e 7 novos cenários E2E/acessibilidade cobrindo
  o fluxo completo de cadastro, publicação, mudança de status,
  exclusão/restauração e isolamento entre corretores.

### Adicionado — Fase 3 (Perfil do Corretor)

- Model `BrokerProfile` (1:1 com `user`) e migração real.
- Camada de armazenamento de mídia (`StorageProvider`) compatível com
  S3, com adapter via `@aws-sdk/client-s3` e MinIO local no
  `docker-compose.yml` (ADR-0003 atualizado com a implementação real).
- Processamento de imagem (`sharp`): validação por conteúdo real
  (rejeita SVG e arquivos disfarçados), compressão/redimensionamento e
  remoção automática de metadados EXIF (RN-024, RN-035, RN-037).
- Formulário de perfil profissional completo (Server Actions + Zod),
  incluindo campos de identidade profissional, contato, localização,
  redes sociais e identidade visual (cores).
- Verificação de disponibilidade de slug em tempo real, com lista de
  palavras reservadas (RN-019, RN-020).
- Upload de foto de perfil e logotipo, com substituição segura do
  arquivo anterior.
- Ativação/desativação do catálogo, com validação dos campos mínimos de
  publicação (CRECI, WhatsApp, cidade — RN-016 a RN-018).
- Página pública `/catalogo/[slug]`, inacessível quando o catálogo está
  desativado (RN-022 — retorna 404).
- Onboarding no painel: CTA para completar o perfil quando ainda não
  existe.
- 25 testes unitários, 20 testes de integração (contra Postgres e MinIO
  reais) e testes E2E/acessibilidade cobrindo edição de perfil, upload,
  publicação de catálogo e isolamento entre corretores.

### Adicionado — Fase 2 (Autenticação)

- Autenticação com Better Auth (e-mail/senha): cadastro, login, logout,
  recuperação e redefinição de senha — RN-001 a RN-014.
- Primeira migração real de banco de dados: `user`, `session`,
  `account`, `verification`, `rateLimit` (Better Auth) e `audit_log`
  (próprio).
- Plugin `admin` do Better Auth para papel (`broker`/`admin`) e bloqueio
  de conta (`banned`/`banReason`/`banExpires`), com login
  automaticamente negado para conta bloqueada (RN-006).
- Rate limiting de rotas de autenticação (RN-008), habilitado em
  produção.
- Camada abstrata de e-mail transacional (`EmailProvider`, ADR-0005) com
  implementação de log para desenvolvimento/teste.
- Trilha de auditoria (`AuditLog`) para cadastro, login, logout e
  redefinição de senha.
- Proteção de rotas privadas (`requireUser`/`requireAdmin` em
  `server/policies/auth-policy.ts`) e redirecionamento de usuário já
  autenticado para fora das páginas de login/cadastro.
- Páginas: cadastro, login, recuperar senha, redefinir senha, painel
  (placeholder protegido), acesso negado, Termos de Uso e Política de
  Privacidade (modelos iniciais).
- Componentes de formulário acessíveis reutilizáveis (`FormField`,
  `FormMessage`, `SubmitButton`) com foco em erro, `aria-live` e
  `aria-describedby`.
- 29 testes unitários, 24 testes de integração (contra PostgreSQL real)
  e 80 execuções E2E/acessibilidade (5 navegadores/viewports).
- ADR-0002 atualizado com a biblioteca escolhida; novo ADR-0005 (envio
  de e-mail transacional).

### Adicionado — Fase 1 (Fundação do Projeto)

- Projeto Next.js 16 (App Router) com TypeScript em modo estrito e
  Tailwind CSS 4.
- Estrutura de pastas de domínio (`src/app`, `components`, `features`,
  `lib`, `server`, `types`) e de testes (`tests/{unit,integration,e2e,accessibility,fixtures,factories}`).
- Prisma 7 configurado com driver adapter PostgreSQL
  (`@prisma/adapter-pg`) e `docker-compose.yml` para banco local.
- ESLint + `eslint-config-prettier` e Prettier (com plugin Tailwind).
- Vitest (unitário + integração via `test.projects`) e Playwright (E2E +
  acessibilidade com `@axe-core/playwright`), cobrindo Chromium, Firefox,
  WebKit, mobile e tablet.
- Logger estruturado com redação de campos sensíveis
  (`src/lib/observability/logger.ts`) e identificador de correlação
  (`src/lib/observability/correlation-id.ts`).
- Endpoint de health check (`/api/health`), incluindo verificação de
  conexão com o banco.
- Pipeline de CI (`.github/workflows/ci.yml`): instalação determinística,
  auditoria de dependências, geração do Prisma Client, formatação, lint,
  verificação de tipos, migrações, testes com cobertura, build e E2E.
- `README.md` e `CLAUDE.md` atualizados com comandos reais de instalação,
  configuração, banco de dados, execução e testes.
- ADR-0001 atualizado com as versões efetivamente instaladas e duas
  descobertas de implementação (driver adapter obrigatório no Prisma 7;
  uso de `127.0.0.1` em vez de `localhost` no Windows com Docker
  Desktop).

Nenhuma funcionalidade de negócio (autenticação, perfil, imóveis etc.) foi
implementada nesta fase — `prisma/schema.prisma` permanece sem modelos de
domínio, que chegam na Fase 2.

### Adicionado — Fase 0 (Descoberta e Planejamento)

- Estrutura inicial de documentação do projeto (`/docs`).
- Visão de produto, personas, jornadas e mapa de funcionalidades.
- Escopo e fora de escopo da primeira versão (MVP).
- Regras de negócio numeradas (RN-xxx).
- Requisitos funcionais (RF-xxx) e não funcionais (RNF-xxx) numerados.
- Modelo de dados inicial e proposta de arquitetura técnica.
- Registros de decisão de arquitetura (ADRs) para autenticação, storage de
  imagens e abstração do provedor de IA.
- Estratégia de testes, Definition of Ready, Definition of Done e matriz de
  rastreabilidade inicial.
- Modelo de ameaças e estratégia de segurança preliminar.
- Backlog inicial priorizado com histórias de usuário em Given/When/Then.
- Plano de implementação por fases (Fase 0 a Fase 10).
- Arquivos de governança do repositório: `README.md`, `CLAUDE.md`,
  `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, `.gitignore`, `.env.example`.

Nenhum código funcional, dependência, banco de dados ou infraestrutura foi
criado nesta fase, conforme definição do escopo da Fase 0.

# Requisitos Não Funcionais — Corretor IA

Numeração única (RNF-XXX).

## Usabilidade e responsividade

- **RNF-001** A aplicação deve ser mobile-first e funcionar sem rolagem
  horizontal em nenhuma resolução suportada.
- **RNF-002** A aplicação deve ser validada nas resoluções: 320×568,
  360×800, 375×812, 390×844, 412×915, 768×1024, 820×1180, 1024×768,
  1280×720, 1366×768, 1440×900 e 1920×1080.
- **RNF-003** Formulários longos (cadastro de imóvel) devem ser divididos
  em etapas no celular e no tablet.
- **RNF-004** Toda ação destrutiva (excluir, despublicar) deve exigir
  confirmação explícita do usuário.
- **RNF-005** A aplicação deve prevenir envio duplicado por duplo clique
  em qualquer ação de submissão.
- **RNF-006** A aplicação deve exibir estados de carregamento visíveis
  (skeleton ou spinner) em operações que não sejam instantâneas.
- **RNF-007** A aplicação deve exibir estado vazio em todas as listagens
  sem dados.
- **RNF-008** Mensagens de erro devem ser específicas o suficiente para
  orientar a correção, sem expor detalhes técnicos internos.
- **RNF-009** O foco do teclado deve ser movido para a mensagem de erro
  relevante após uma falha de submissão.
- **RNF-010** A aplicação deve funcionar de forma aceitável em conexões
  móveis lentas (simulação 3G/4G limitado nos testes).

## Acessibilidade

- **RNF-011** A aplicação deve atender, sempre que possível, ao nível AA
  das WCAG.
- **RNF-012** Todo campo de formulário deve possuir label associado.
- **RNF-013** Toda a aplicação deve ser navegável por teclado, com foco
  visível e ordem lógica.
- **RNF-014** Elementos interativos devem possuir nomes acessíveis
  (`aria-label` quando necessário).
- **RNF-015** Mensagens dinâmicas relevantes devem usar `aria-live`.
- **RNF-016** A aplicação não deve depender exclusivamente de cor para
  transmitir informação (ex.: status do imóvel).
- **RNF-017** A aplicação deve suportar zoom do navegador sem quebra de
  layout.
- **RNF-018** Áreas de toque devem respeitar tamanho mínimo adequado para
  uso em celular.
- **RNF-019** Modais devem ser acessíveis (foco preso, fechamento por
  Esc, retorno de foco ao elemento de origem).
- **RNF-020** A aplicação deve respeitar a preferência de redução de
  movimento do usuário (`prefers-reduced-motion`).
- **RNF-021** O idioma da página deve estar configurado como português do
  Brasil (`lang="pt-BR"`).

## Performance

- **RNF-022** Páginas públicas do catálogo devem priorizar carregamento
  rápido, com componentes de servidor quando apropriado.
- **RNF-023** Imagens devem ser otimizadas, com miniaturas geradas para
  listagens e carregamento progressivo/lazy loading na galeria.
- **RNF-024** Consultas ao banco de dados devem ser paginadas, evitando
  o problema de consultas N+1.
- **RNF-025** O catálogo deve ser validado com 20, 100 e 500 imóveis por
  corretor, com múltiplas imagens por imóvel, sem degradação inaceitável
  de tempo de carregamento.
- **RNF-026** A aplicação deve reduzir o volume de JavaScript enviado ao
  cliente ao mínimo necessário.
- **RNF-027** A aplicação deve prevenir layout shift perceptível durante o
  carregamento (ex.: reservar espaço de imagens).
- **RNF-028** Cache deve ser aplicado apenas quando seguro (nunca cache
  de dados privados de outro corretor).

## Segurança

- **RNF-029** Toda validação de autorização deve ocorrer no servidor,
  independentemente de validações no cliente.
- **RNF-030** A aplicação deve mitigar IDOR, CSRF, XSS e SQL Injection
  como parte do desenvolvimento de cada funcionalidade, não como etapa
  posterior.
- **RNF-031** Rotas de autenticação e endpoints sensíveis devem ter rate
  limiting.
- **RNF-032** Uploads devem ser validados por tipo MIME real e tamanho
  máximo, com nomes de arquivo gerados aleatoriamente.
- **RNF-033** Segredos (chaves de API, credenciais) devem existir apenas
  em variáveis de ambiente no servidor.
- **RNF-034** A aplicação deve definir cabeçalhos de segurança HTTP
  (Content Security Policy quando viável, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`).
- **RNF-035** Cookies de sessão devem ser `HttpOnly`, `Secure` em
  produção e com `SameSite` apropriado.
- **RNF-036** Logs não devem conter senhas, tokens, chaves de API ou
  dados pessoais sensíveis.
- **RNF-037** Dependências do projeto devem ser auditadas periodicamente
  (ex.: `npm audit` no pipeline de CI).

## Confiabilidade e observabilidade

- **RNF-038** A aplicação deve expor um endpoint de health check.
- **RNF-039** A aplicação deve registrar logs estruturados com
  identificador de correlação por requisição.
- **RNF-040** Falhas de serviços externos (IA, storage, banco) devem ser
  tratadas com mensagens claras ao usuário, sem expor stack trace.
- **RNF-041** A aplicação deve definir níveis de log (debug, info, warn,
  error) de forma consistente.

## Testabilidade e qualidade de código

- **RNF-042** O projeto deve manter TypeScript em modo estrito sem erros.
- **RNF-043** O projeto deve manter lint e formatação sem erros como
  critério de conclusão de fase.
- **RNF-044** Toda funcionalidade deve possuir testes automatizados
  correspondentes (unitário, integração e/ou E2E, conforme aplicável).
- **RNF-045** Os testes E2E críticos devem ser executados em Chromium,
  Firefox e, quando viável, WebKit, além de viewports de celular, tablet
  e desktop.

## Privacidade (LGPD)

- **RNF-046** A coleta de dados deve ser mínima e proporcional à
  finalidade de cada funcionalidade.
- **RNF-047** Consentimentos relevantes (Termos de Uso, Política de
  Privacidade) devem ser registrados com data e hora.
- **RNF-048** Dados de localização exata do imóvel não devem ser expostos
  publicamente por padrão.

## Custo e infraestrutura

- **RNF-049** A arquitetura deve favorecer baixo custo previsível de
  infraestrutura na fase inicial (evitar serviços com custo elevado por
  padrão antes de haver tração de usuários).
- **RNF-050** O ambiente de desenvolvimento local deve ser reproduzível
  via Docker, sem dependência de serviços pagos para o fluxo básico de
  desenvolvimento.

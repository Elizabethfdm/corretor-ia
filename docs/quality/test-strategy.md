# Estratégia de Testes — Corretor IA

## 1. Princípio geral

Pirâmide de testes: muitos testes unitários rápidos, uma camada
intermediária de testes de integração, e um conjunto enxuto de testes E2E
cobrindo os fluxos críticos. Nenhuma funcionalidade é considerada
concluída sem os testes correspondentes (ver
[Definition of Done](definition-of-done.md)).

## 2. Testes unitários

Alvo: lógica pura, sem I/O.

- validações (Zod schemas);
- formatação monetária (RN-030);
- geração de slug (RN-019, RN-020, RN-031);
- montagem da mensagem do WhatsApp (RN-051, RN-055, RN-056);
- filtros do catálogo;
- políticas de publicação (RN-043);
- transições de status do imóvel (RN-027);
- permissões/isolamento (RN-026);
- mapeamento de dados de entrada/saída da IA (`AiContentProvider`);
- sanitização de entrada;
- utilitários gerais;
- cálculos de relatório (agregações).

Ferramenta: Vitest (ou Jest, conforme confirmado em ADR-0001).

## 3. Testes de integração

Alvo: interação entre camadas (serviço + repositório + banco real ou
banco de teste isolado).

- repositórios (Prisma) contra banco de dados de teste;
- autenticação e autorização ponta a ponta na camada de serviço;
- criação, atualização, publicação, despublicação e exclusão lógica de
  imóvel;
- upload (com storage simulado/fake);
- registro de eventos de métricas;
- geração de anúncio com provedor de IA **simulado** (fake determinístico,
  nunca chamada real em CI);
- isolamento de dados entre corretores (teste obrigatório: corretor A
  nunca acessa dado de corretor B).

## 4. Testes E2E (Playwright)

### 4.1 Fluxos críticos obrigatórios

1. Criar conta.
2. Efetuar login.
3. Completar perfil.
4. Cadastrar imóvel.
5. Salvar rascunho.
6. Continuar cadastro a partir do rascunho.
7. Adicionar fotos.
8. Publicar imóvel.
9. Visualizar catálogo público.
10. Abrir página do imóvel.
11. Compartilhar pelo WhatsApp.
12. Gerar anúncio com IA.
13. Criar arte.
14. Consultar relatório.
15. Editar imóvel.
16. Marcar como reservado.
17. Marcar como vendido.
18. Despublicar.
19. Impedir acesso de outro corretor a um imóvel/perfil que não é seu.
20. Recuperar senha.

### 4.2 Matriz de execução

Executar os fluxos críticos em:

- motores: Chromium, Firefox e WebKit (quando viável no ambiente de CI);
- viewports: celular, tablet e desktop (ver resoluções em
  `docs/requirements/non-functional-requirements.md`, RNF-002).

### 4.3 Convenções

- Priorizar localizadores semânticos: `getByRole`, `getByLabel`,
  `getByText`.
- Usar `data-testid` apenas quando não houver alternativa semântica
  viável.
- Não usar esperas fixas (`waitForTimeout`) como estratégia principal de
  sincronização — preferir asserções que aguardam estado (`expect(...).toBeVisible()`,
  etc.).

## 5. Testes de acessibilidade

Executados (automatizados + revisão manual básica) nas telas:

- login;
- cadastro;
- painel;
- cadastro de imóvel (cada etapa);
- catálogo;
- página do imóvel;
- relatório;
- modais;
- formulário com erro.

Critério: sem violações de nível A/AA identificadas por ferramenta
automatizada de auditoria, complementado por checagem manual de navegação
por teclado.

## 6. Testes de segurança

Verificações obrigatórias, executadas manualmente e/ou automatizadas
conforme a fase:

- acesso cruzado entre usuários (IDOR);
- manipulação de identificadores na URL/payload;
- upload de arquivo inválido ou disfarçado (extensão trocada,
  polyglot);
- campos com payloads de script (XSS);
- tentativas de injeção (SQL/NoSQL, quando aplicável);
- rate limiting em rotas de autenticação;
- proteção de rota administrativa;
- fluxo de recuperação de senha (sem enumeração de e-mail);
- comportamento com token/sessão expirada ou revogada;
- exposição de dados em respostas de API (campos internos vazando);
- enumeração de e-mails cadastrados.

## 7. Testes de responsividade

Validar, nas resoluções de RNF-002:

- ausência de rolagem horizontal;
- menus (mobile/tablet/desktop);
- modais;
- formulários em etapas;
- upload de fotos;
- galeria de imagens;
- botão de contato fixo no mobile;
- comportamento com teclado virtual aberto;
- orientação retrato/paisagem no tablet;
- textos, preços e nomes extensos (overflow controlado);
- catálogo sem imóveis (estado vazio);
- catálogo com muitos imóveis (paginação/scroll).

## 8. Testes exploratórios

Charters de exploração (sessões guiadas, sem script fixo) para cenários
como:

- cadastro interrompido no meio do fluxo;
- internet instável durante upload;
- upload interrompido;
- múltiplos cliques em ações de submissão;
- uso do botão "voltar" do navegador durante o cadastro em etapas;
- atualização (F5) no meio de uma etapa;
- sessão expirada durante uso ativo;
- duas abas abertas simultaneamente na mesma conta;
- arquivos de foto muito grandes;
- dados incompletos submetidos propositalmente;
- caracteres especiais/acentuação em todos os campos de texto;
- corretor alterando o slug do catálogo com imóveis já publicados;
- imóvel removido enquanto um visitante está acessando sua página
  pública;
- falha simulada da IA;
- falha simulada do armazenamento de mídia;
- falha simulada do banco de dados.

## 9. Dados de teste

Ver [`docs/planning` (seção de dados de teste no plano de fases)] e regra
geral: nunca usar dados pessoais reais. Utilizar factories, builders,
fixtures e seed determinístico, cobrindo: corretor A, corretor B,
administrador, imóveis de venda e de aluguel, imóvel rascunho, disponível,
reservado, vendido, sem imagem, e catálogo vazio. Testes devem isolar ou
limpar seus próprios dados.

## 10. Revisão de código (checklist por módulo)

Após cada módulo implementado, aplicar a checklist abaixo e reportar em
tabela `Item | Resultado | Evidência | Ação`:

1. Regressões introduzidas.
2. Duplicação de código.
3. Acoplamento excessivo.
4. Validações existentes somente no cliente (sem revalidação no servidor).
5. Falhas de autorização.
6. Consultas inseguras (concatenação de SQL, falta de filtro por
   `brokerId`).
7. Exposição de dados internos/privados.
8. Problemas de acessibilidade.
9. Problemas de responsividade.
10. Testes frágeis (dependentes de ordem, tempo fixo, dados não
    determinísticos).
11. Nomes pouco claros.
12. Funções grandes demais.
13. Componentes com responsabilidades excessivas.
14. Dependências desnecessárias adicionadas sem ADR.
15. Erros silenciosos (`catch` vazio).
16. Código morto.
17. Segredos no código ou em configuração versionada.
18. Logs com dados sensíveis.
19. Estados não tratados (loading, erro, vazio).

## 11. Critério de conclusão de fase relacionado a testes

Uma fase só é considerada concluída com: testes unitários passando,
testes de integração passando, testes E2E críticos da fase passando, e
nenhum teste desabilitado ou substituído por comentário para "destravar"
o pipeline. Ver [Definition of Done](definition-of-done.md).

## 12. Dívidas técnicas de teste registradas

- **Rate limiting de autenticação (RN-008) — Fase 2.** O rate limiting do
  Better Auth (`src/lib/auth/auth.ts`) só é habilitado quando
  `NODE_ENV === "production"`; em desenvolvimento/teste ele permanece no
  padrão da própria biblioteca (desabilitado), pois testes de integração
  e E2E concorrentes contra o mesmo servidor esgotavam os limites reais
  (5 tentativas/60s) e derrubavam a suíte com respostas 429 legítimas —
  o comportamento foi observado e confirmado funcionando durante o
  desenvolvimento da Fase 2. Falta um teste automatizado dedicado (com
  uma instância `betterAuth` isolada, configurada com `rateLimit.enabled:
true`) que caia no pipeline de CI regular; até lá, a verificação desse
  comportamento específico é manual/observacional. Prioridade: baixa
  (mecanismo de terceiro já maduro; não é lógica própria da aplicação).

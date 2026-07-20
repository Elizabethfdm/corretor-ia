# Backlog Inicial — Corretor IA

> Este backlog cobre os 6 épicos definidos no Prompt Mestre. Para manter
> o documento navegável, as histórias mais críticas de cada épico (as que
> definem o caminho principal do MVP) recebem o detalhamento completo
> exigido (descrição, benefício, pré-condições, fluxo principal, fluxos
> alternativos, regras, critérios de aceite em Given/When/Then, cenários
> negativos, RNFs, dependências, risco, prioridade). As demais histórias
> do épico aparecem na tabela resumida correspondente e recebem o mesmo
> nível de detalhamento no início da fase em que forem implementadas,
> conforme o processo definido em `CONTRIBUTING.md` e
> `docs/quality/definition-of-ready.md`.
>
> Prioridade: **P0** (bloqueia o MVP) / **P1** (importante, não bloqueia)
> / **P2** (desejável, pode ficar para depois do MVP).

---

## Épico 1 — Conta

### História: Criar conta

- **Descrição:** Como visitante, quero criar uma conta com e-mail e senha
  para começar a usar o Corretor IA.
- **Benefício:** Permite acesso ao painel e início do uso do produto.
- **Pré-condições:** Não possuir conta com o e-mail informado.
- **Fluxo principal:** usuário preenche nome, e-mail, senha, confirmação,
  aceita Termos de Uso e Política de Privacidade, envia o formulário e é
  autenticado automaticamente, sendo redirecionado ao onboarding de
  perfil.
- **Fluxos alternativos:** e-mail já cadastrado → mensagem de erro
  genérica orientando login ou recuperação de senha, sem confirmar
  existência da conta (RN-014 aplicada de forma equivalente aqui).
- **Regras:** RN-001 a RN-005, RN-011.
- **Critérios de aceite:**
  - _Given_ um visitante na página de cadastro, _When_ preenche todos os
    campos corretamente e aceita os termos, _Then_ a conta é criada, a
    sessão é iniciada e o usuário é redirecionado ao painel.
  - _Given_ um e-mail já cadastrado, _When_ o visitante tenta criar conta
    com esse e-mail, _Then_ o sistema exibe erro genérico sem confirmar
    que o e-mail existe.
  - _Given_ uma senha com menos de 8 caracteres, _When_ o formulário é
    submetido, _Then_ o sistema impede o envio e indica o requisito de
    senha.
  - _Given_ confirmação de senha diferente da senha, _When_ o formulário
    é submetido, _Then_ o sistema impede o envio.
  - _Given_ aceite dos termos não marcado, _When_ o formulário é
    submetido, _Then_ o sistema impede o envio.
- **Cenários negativos:** e-mail malformado; espaços em branco em campos
  obrigatórios; envio duplicado por duplo clique (RNF-005).
- **RNFs:** RNF-001, RNF-005, RNF-008, RNF-029, RNF-035, RNF-042.
- **Dependências:** nenhuma (primeira história do produto).
- **Risco:** baixo (fluxo padrão de autenticação).
- **Prioridade:** P0.

### História: Login

- **Descrição:** Como corretor com conta, quero fazer login para acessar
  meu painel.
- **Benefício:** Acesso seguro aos meus dados e imóveis.
- **Pré-condições:** Conta ativa (não bloqueada).
- **Fluxo principal:** usuário informa e-mail e senha corretos e é
  redirecionado ao painel.
- **Fluxos alternativos:** credenciais inválidas → mensagem genérica de
  erro; conta bloqueada → mensagem informando bloqueio, sem detalhar
  motivo sensível.
- **Regras:** RN-006, RN-007, RN-008, RN-009, RN-012.
- **Critérios de aceite:**
  - _Given_ credenciais válidas de uma conta ativa, _When_ o usuário
    envia o formulário de login, _Then_ é autenticado e redirecionado ao
    painel.
  - _Given_ credenciais inválidas, _When_ o usuário tenta logar, _Then_
    recebe mensagem genérica de erro, sem indicar se o e-mail existe.
  - _Given_ uma conta bloqueada, _When_ o usuário tenta logar com
    credenciais corretas, _Then_ o acesso é negado com mensagem
    apropriada.
  - _Given_ múltiplas tentativas malsucedidas em curto intervalo, _When_
    o limite é atingido, _Then_ novas tentativas são temporariamente
    bloqueadas (rate limiting).
- **Cenários negativos:** sessão expirada durante uso; login em duas
  abas simultâneas.
- **RNFs:** RNF-029, RNF-031, RNF-035.
- **Dependências:** Criar conta.
- **Risco:** baixo.
- **Prioridade:** P0.

### Demais histórias do épico Conta

| História                           | Regras principais      | Prioridade |
| ---------------------------------- | ---------------------- | ---------- |
| Encerrar sessão (logout)           | RN-012                 | P0         |
| Recuperar senha (solicitar link)   | RN-014                 | P0         |
| Redefinir senha (a partir do link) | RN-003, RN-004, RN-014 | P0         |
| Editar perfil (dados de conta)     | RN-023                 | P0         |
| Solicitar exclusão de conta        | RN-099                 | P1         |

---

## Épico 2 — Imóveis

### História: Cadastrar imóvel (fluxo completo em etapas)

- **Descrição:** Como corretor, quero cadastrar um imóvel em etapas para
  publicá-lo no meu catálogo sem perder o progresso caso seja
  interrompido.
- **Benefício:** Reduz o tempo e o esforço de divulgação de um imóvel.
- **Pré-condições:** Corretor autenticado.
- **Fluxo principal:** corretor percorre as 6 etapas (informações
  básicas, características, localização, fotos, descrição, revisão) e
  publica o imóvel ao final.
- **Fluxos alternativos:** corretor sai no meio do fluxo → progresso é
  mantido como rascunho e pode ser retomado depois; corretor tenta
  publicar sem atender aos critérios de RN-043 → sistema bloqueia e
  indica exatamente o que falta.
- **Regras:** RN-026 a RN-045.
- **Critérios de aceite:**
  - _Given_ um corretor autenticado preenchendo a etapa 1, _When_ ele
    avança sem preencher um campo obrigatório da etapa, _Then_ o sistema
    impede o avanço e indica o campo pendente.
  - _Given_ um corretor no meio do cadastro, _When_ ele sai e retorna
    mais tarde, _Then_ encontra o rascunho salvo com os dados já
    informados.
  - _Given_ um imóvel sem nenhuma foto, _When_ o corretor tenta publicar,
    _Then_ o sistema bloqueia a publicação e indica a exigência de ao
    menos uma foto.
  - _Given_ um imóvel que atende a todos os critérios de RN-043, _When_ o
    corretor confirma a publicação, _Then_ o imóvel passa a aparecer no
    catálogo público do corretor.
- **Cenários negativos:** conexão perdida durante upload de foto; caractere
  especial em campos de texto; valor negativo em preço; CEP inválido.
- **RNFs:** RNF-001, RNF-003, RNF-005, RNF-006, RNF-023.
- **Dependências:** Perfil do corretor minimamente preenchido para
  publicação (CRECI, WhatsApp) — RN-043.
- **Risco:** médio (fluxo mais longo e complexo do MVP; maior superfície
  para bugs de estado).
- **Prioridade:** P0.

### História: Publicar/despublicar imóvel

- **Descrição:** Como corretor, quero publicar ou despublicar um imóvel
  para controlar sua visibilidade no catálogo.
- **Benefício:** Controle total sobre o que está visível publicamente.
- **Pré-condições:** Imóvel existente pertencente ao corretor autenticado.
- **Fluxo principal:** corretor aciona "publicar" (se critérios
  atendidos) ou "despublicar" a partir do painel.
- **Regras:** RN-027, RN-032, RN-043.
- **Critérios de aceite:**
  - _Given_ um imóvel válido para publicação, _When_ o corretor publica,
    _Then_ o imóvel aparece imediatamente no catálogo.
  - _Given_ um imóvel publicado, _When_ o corretor despublica, _Then_ o
    imóvel deixa de aparecer no catálogo, na busca e em "semelhantes" de
    forma imediata.
- **Cenários negativos:** tentar despublicar um imóvel de outro corretor
  (deve ser bloqueado — RN-026).
- **RNFs:** RNF-004, RNF-029.
- **Dependências:** Cadastrar imóvel.
- **Risco:** baixo.
- **Prioridade:** P0.

### Demais histórias do épico Imóveis

| História                                             | Regras principais       | Prioridade |
| ---------------------------------------------------- | ----------------------- | ---------- |
| Editar imóvel                                        | RN-026                  | P0         |
| Salvar rascunho                                      | RN-044                  | P0         |
| Duplicar imóvel                                      | RN-029                  | P1         |
| Alterar status (reservado/vendido/alugado/inativo)   | RN-027                  | P0         |
| Excluir imóvel (lógico)                              | RN-028                  | P0         |
| Restaurar imóvel excluído                            | RN-028                  | P1         |
| Gerenciar fotos (reordenar, capa, excluir, alt text) | RN-034 a RN-038, RN-045 | P0         |

---

## Épico 3 — Catálogo

### História: Visitante acessa e filtra o catálogo público

- **Descrição:** Como visitante, quero pesquisar e filtrar imóveis no
  catálogo de um corretor para encontrar rapidamente o que me interessa.
- **Benefício:** Encontrar imóveis relevantes sem precisar falar com o
  corretor antes.
- **Pré-condições:** Corretor com catálogo ativo e ao menos um imóvel
  publicado.
- **Fluxo principal:** visitante acessa `/catalogo/{slug}`, aplica
  filtros (finalidade, tipo, cidade, bairro, preço, quartos, vagas,
  características, financiamento) e ordena os resultados.
- **Fluxos alternativos:** nenhum imóvel disponível → estado vazio claro;
  catálogo desativado → página de indisponibilidade sem detalhes
  sensíveis.
- **Regras:** RN-046 a RN-050.
- **Critérios de aceite:**
  - _Given_ um catálogo ativo com imóveis publicados, _When_ um visitante
    acessa a URL do catálogo, _Then_ vê a lista de imóveis publicáveis,
    sem autenticação.
  - _Given_ um filtro de cidade e faixa de preço aplicado, _When_ o
    visitante compartilha a URL resultante, _Then_ outra pessoa que abrir
    o link vê o mesmo resultado filtrado.
  - _Given_ um catálogo com `catalogEnabled = false`, _When_ qualquer
    visitante tenta acessar, _Then_ recebe uma página de indisponibilidade,
    sem expor dados do corretor ou de imóveis.
- **Cenários negativos:** filtro combinando critérios sem nenhum
  resultado; parâmetros de URL manipulados manualmente com valores
  inválidos.
- **RNFs:** RNF-001, RNF-002, RNF-022, RNF-023, RNF-025.
- **Dependências:** Cadastrar/publicar imóvel; Perfil do corretor.
- **Risco:** médio (performance com muitos imóveis — RNF-025).
- **Prioridade:** P0.

### Demais histórias do épico Catálogo

| História                                        | Regras principais              | Prioridade |
| ----------------------------------------------- | ------------------------------ | ---------- |
| Visualizar página do imóvel                     | RN-051 a RN-054                | P0         |
| Entrar em contato via WhatsApp                  | RN-051, RN-055, RN-056, RN-058 | P0         |
| Compartilhar imóvel/catálogo/resultado filtrado | RN-057, RN-059, RN-060         | P0         |

---

## Épico 4 — IA

### História: Gerar anúncio com IA

- **Descrição:** Como corretor, quero gerar um anúncio a partir dos dados
  do meu imóvel para divulgá-lo sem precisar escrever o texto do zero.
- **Benefício:** Economiza tempo e melhora a qualidade da divulgação.
- **Pré-condições:** Imóvel cadastrado pertencente ao corretor
  autenticado; limite de geração do plano não atingido.
- **Fluxo principal:** corretor escolhe imóvel, canal, tom, objetivo e
  aspectos a destacar; sistema gera título, texto, CTA e hashtags;
  corretor revisa, edita se quiser, e copia/compartilha.
- **Fluxos alternativos:** provedor de IA indisponível → mensagem de erro
  com opção de tentar novamente; limite do plano atingido → mensagem
  clara, sem gerar conteúdo.
- **Regras:** RN-061 a RN-074.
- **Critérios de aceite:**
  - _Given_ um imóvel com dados completos, _When_ o corretor solicita a
    geração de um anúncio, _Then_ o conteúdo gerado usa exclusivamente
    dados reais do imóvel, sem inventar características, localização,
    preço ou condições.
  - _Given_ um imóvel com poucos dados preenchidos, _When_ o corretor
    solicita a geração, _Then_ o sistema sinaliza quais informações estão
    ausentes em vez de inventá-las.
  - _Given_ um conteúdo gerado, _When_ exibido ao corretor, _Then_ a
    interface indica claramente que foi gerado por IA e permite edição
    antes de copiar.
  - _Given_ o limite de gerações do plano atingido, _When_ o corretor
    tenta gerar novamente, _Then_ o sistema impede a geração e explica o
    motivo.
  - _Given_ falha do provedor de IA, _When_ a geração é solicitada,
    _Then_ o sistema exibe erro amigável e permite nova tentativa, sem
    travar a interface.
- **Cenários negativos:** duplo clique gerando duas requisições
  simultâneas; timeout do provedor.
- **RNFs:** RNF-005, RNF-040.
- **Dependências:** Cadastrar imóvel; camada `AiContentProvider`
  (ADR-0004).
- **Risco:** alto (é a funcionalidade com maior risco de dependência
  externa e de geração de conteúdo incorreto — exige testes com mock
  cobrindo os cenários de invenção de dados).
- **Prioridade:** P0.

### Demais histórias do épico IA

| História                                     | Regras principais | Prioridade |
| -------------------------------------------- | ----------------- | ---------- |
| Selecionar canal/tom/objetivo antes de gerar | RN-061            | P0         |
| Editar conteúdo gerado                       | RN-067            | P0         |
| Copiar conteúdo gerado                       | RN-067, RN-068    | P0         |
| Consultar histórico de anúncios gerados      | RN-069            | P1         |

---

## Épico 5 — Artes

### História: Criar arte para rede social a partir de um modelo

- **Descrição:** Como corretor, quero gerar uma arte pronta com os dados
  do imóvel para publicar nas minhas redes sociais.
- **Benefício:** Peça gráfica profissional sem precisar de ferramentas de
  design.
- **Pré-condições:** Imóvel publicado com ao menos uma foto.
- **Fluxo principal:** corretor escolhe formato e tipo de arte, escolhe a
  foto, ajusta textos, visualiza o preview e baixa o arquivo.
- **Fluxos alternativos:** corretor sem logotipo/cores configuradas →
  sistema aplica modelo visual padrão da plataforma.
- **Regras:** RN-075 a RN-081.
- **Critérios de aceite:**
  - _Given_ um imóvel com foto e dados públicos completos, _When_ o
    corretor gera uma arte, _Then_ o resultado usa apenas dados públicos
    (nunca observações internas) e reflete a identidade visual
    configurada.
  - _Given_ um texto de destaque muito longo, _When_ a arte é gerada,
    _Then_ o layout evita corte de texto (trunca com bom senso ou ajusta
    o layout, nunca corta de forma ilegível).
  - _Given_ o preview gerado, _When_ o corretor confirma, _Then_ o
    download é disponibilizado em resolução adequada para a rede social
    escolhida.
- **Cenários negativos:** foto em proporção muito diferente do modelo
  (deve ser ajustada sem distorcer); nome ou bairro muito longos.
- **RNFs:** RNF-023, RNF-026.
- **Dependências:** Cadastrar/publicar imóvel; identidade visual do
  perfil (opcional).
- **Risco:** médio (qualidade visual é subjetiva; exige testes de
  layout específicos por modelo).
- **Prioridade:** P0.

### Demais histórias do épico Artes

| História                         | Regras principais | Prioridade |
| -------------------------------- | ----------------- | ---------- |
| Selecionar modelo/formato        | RN-081            | P0         |
| Personalizar textos              | RN-077            | P0         |
| Pré-visualizar antes de exportar | RN-079            | P0         |

---

## Épico 6 — Relatórios

### História: Consultar indicadores de acesso do catálogo

- **Descrição:** Como corretor, quero ver quantas pessoas visualizaram
  meus imóveis e clicaram em WhatsApp para entender o que está
  funcionando.
- **Benefício:** Decisão orientada a dados sobre quais imóveis destacar.
- **Pré-condições:** Corretor autenticado com ao menos um imóvel
  publicado (para haver dados).
- **Fluxo principal:** corretor acessa "Relatórios", filtra por período e
  visualiza indicadores agregados.
- **Fluxos alternativos:** nenhum dado no período → estado vazio.
- **Regras:** RN-082 a RN-090.
- **Critérios de aceite:**
  - _Given_ eventos registrados para o corretor autenticado, _When_ ele
    consulta o relatório, _Then_ vê apenas os próprios dados, nunca de
    outro corretor.
  - _Given_ nenhum evento no período selecionado, _When_ o relatório é
    exibido, _Then_ mostra um estado vazio claro, não um erro.
  - _Given_ múltiplos imóveis com acessos distintos, _When_ o corretor
    consulta o relatório, _Then_ consegue identificar o imóvel mais
    acessado do período.
- **Cenários negativos:** múltiplos reloads da mesma página gerando
  eventos duplicados (deve ser mitigado — RN-084).
- **RNFs:** RNF-024.
- **Dependências:** Eventos de analytics já sendo registrados pelos
  módulos de Catálogo, Página do imóvel, IA e Artes.
- **Risco:** baixo.
- **Prioridade:** P0.

### Demais histórias do épico Relatórios

| História                                                | Regras principais | Prioridade |
| ------------------------------------------------------- | ----------------- | ---------- |
| Filtrar por período (hoje/7 dias/30 dias/personalizado) | RN-089            | P0         |
| Identificar imóvel mais acessado                        | RN-082            | P1         |
| Visualizar cliques de WhatsApp por imóvel               | RN-089            | P0         |

---

## Resumo de priorização (visão de fases)

A ordem de implementação segue o plano de fases
(`docs/planning/phases-plan.md`), que já reflete a priorização P0 acima:
Conta → Perfil → Imóveis → Catálogo → Página do imóvel → IA → Artes →
Relatórios → Hardening. Histórias P1/P2 dentro de cada épico podem ser
adiadas para depois do MVP sem bloquear a validação da hipótese principal
do produto.

# Requisitos Funcionais — Corretor IA

Numeração única (RF-XXX), referenciada na matriz de rastreabilidade. Cada
requisito indica o módulo/fase correspondente e a regra de negócio
relacionada (RN-XXX), quando aplicável.

## Autenticação (Fase 2)

- **RF-001** O sistema deve permitir criar uma conta com nome completo,
  e-mail, senha, confirmação de senha, aceite dos Termos de Uso e da
  Política de Privacidade. (RN-001 a RN-005, RN-011)
- **RF-002** O sistema deve permitir login com e-mail e senha.
- **RF-003** O sistema deve permitir logout, encerrando a sessão ativa.
- **RF-004** O sistema deve permitir solicitar recuperação de senha por
  e-mail. (RN-014)
- **RF-005** O sistema deve permitir redefinir a senha a partir de um link
  de recuperação válido e não expirado.
- **RF-006** O sistema deve validar e-mail do usuário quando a solução de
  autenticação escolhida suportar essa verificação.
- **RF-007** O sistema deve proteger rotas privadas, redirecionando
  usuários não autenticados ao login. (RN-010)
- **RF-008** O sistema deve impedir que uma conta acesse dados de outra
  conta por qualquer rota. (RN-013)
- **RF-009** O sistema deve bloquear o acesso ao painel de contas
  marcadas como bloqueadas. (RN-006)
- **RF-010** O sistema deve limitar tentativas de autenticação
  malsucedidas. (RN-008)

## Perfil do corretor (Fase 3)

- **RF-011** O corretor deve poder cadastrar e editar seu perfil
  profissional (todos os campos definidos em
  `docs/architecture/data-model.md#brokerprofile`).
- **RF-012** O sistema deve validar unicidade e formato do slug do
  catálogo em tempo real. (RN-019, RN-020)
- **RF-013** O sistema deve impedir a publicação do catálogo sem CRECI,
  estado do CRECI, WhatsApp e cidade de atuação preenchidos. (RN-016 a
  RN-018)
- **RF-014** O corretor deve poder enviar foto de perfil e logotipo, com
  validação de formato e tamanho. (RN-021)
- **RF-015** O corretor deve poder configurar cor principal e secundária
  da sua identidade visual.
- **RF-016** O corretor deve poder ativar/desativar publicamente o
  catálogo (`catalogEnabled`). (RN-022)
- **RF-017** O sistema deve impedir que um corretor visualize ou altere o
  perfil de outro. (RN-023)

## Cadastro e gestão de imóveis (Fase 4)

- **RF-018** O corretor deve poder cadastrar um imóvel em etapas
  (informações básicas, características, localização, fotos, descrição,
  revisão).
- **RF-019** O sistema deve permitir salvar o progresso como rascunho a
  qualquer momento entre as etapas. (RN-044)
- **RF-020** O corretor deve poder retomar o preenchimento de um rascunho
  existente.
- **RF-021** O sistema deve validar os campos obrigatórios de cada etapa
  conforme `docs/business-rules/business-rules.md`.
- **RF-022** O corretor deve poder enviar múltiplas fotos, inclusive pela
  câmera do celular.
- **RF-023** O sistema deve exibir o progresso do upload de cada foto e
  permitir cancelar ou tentar novamente em caso de falha.
- **RF-024** O corretor deve poder reordenar fotos e escolher a foto de
  capa. (RN-034, RN-045)
- **RF-025** O corretor deve poder informar texto alternativo por foto.
- **RF-026** O sistema deve impedir a publicação de um imóvel sem ao
  menos uma foto. (RN-033)
- **RF-027** O corretor deve poder gerar, revisar ou encurtar a descrição
  do imóvel com IA, sempre podendo editar o resultado antes de salvar.
  (RN-042)
- **RF-028** O sistema deve exibir um resumo de revisão antes da
  publicação, com pré-visualização mobile e desktop.
- **RF-029** O sistema deve validar todos os critérios de publicação
  definidos em RN-043 antes de permitir publicar o imóvel.
- **RF-030** O corretor deve poder editar um imóvel já publicado.
- **RF-031** O corretor deve poder despublicar um imóvel publicado.
  (RN-032)
- **RF-032** O corretor deve poder duplicar um imóvel existente. (RN-029)
- **RF-033** O corretor deve poder alterar a situação de um imóvel
  (rascunho, disponível, reservado, vendido, alugado, inativo). (RN-027)
- **RF-034** O corretor deve poder excluir (logicamente) um imóvel.
  (RN-028)
- **RF-035** O corretor deve poder restaurar um imóvel excluído dentro do
  período configurável de retenção. (RN-028)
- **RF-036** O corretor deve poder optar por ocultar o endereço exato do
  imóvel no catálogo público. (RN-039)

## Catálogo digital (Fase 5)

- **RF-037** O visitante deve poder acessar a página pública do corretor
  em `/catalogo/{slug}` sem autenticação. (RN-048)
- **RF-038** O visitante deve poder pesquisar imóveis por termo livre.
- **RF-039** O visitante deve poder filtrar por finalidade, tipo, cidade,
  bairro, faixa de preço, quartos mínimos, vagas, características e
  aceite de financiamento.
- **RF-040** O visitante deve poder ordenar por mais recentes, menor
  preço, maior preço, maior área e imóveis em destaque.
- **RF-041** O sistema deve preservar os filtros aplicados na URL,
  permitindo compartilhar o resultado filtrado. (RN-047)
- **RF-042** O catálogo deve carregar imóveis de forma paginada ou
  progressiva, nunca carregando todas as imagens de uma vez.
- **RF-043** O catálogo deve exibir exclusivamente imóveis publicáveis do
  corretor correspondente ao slug acessado. (RN-046)
- **RF-044** As páginas públicas do catálogo devem ser otimizadas para
  mecanismos de busca (SEO).

## Página individual do imóvel (Fase 6)

- **RF-045** A página do imóvel deve exibir galeria de fotos, capa,
  título público, valor, finalidade, tipo, características, descrição,
  localização permitida e dados do corretor.
- **RF-046** A página do imóvel deve exibir um botão de contato via
  WhatsApp com mensagem pré-formatada. (RN-051)
- **RF-047** No layout mobile, o botão de contato deve permanecer
  visível/fixo. (RN-052)
- **RF-048** A página do imóvel deve exibir uma seção de imóveis
  semelhantes, restrita ao mesmo corretor e a imóveis publicáveis.
  (RN-053)
- **RF-049** A página de um imóvel despublicado ou inexistente deve
  retornar uma resposta apropriada de indisponibilidade, sem expor dados.
  (RN-032, RN-054)

## Compartilhamento (Fase 6)

- **RF-050** O sistema deve oferecer botões para compartilhar pelo
  WhatsApp, copiar link e copiar mensagem, para imóvel individual,
  catálogo completo e resultado filtrado. (RN-059)
- **RF-051** Quando disponível, o sistema pode oferecer compartilhamento
  nativo do dispositivo. (RN-060)
- **RF-052** A mensagem de compartilhamento deve omitir campos não
  preenchidos. (RN-055)
- **RF-053** O sistema deve registrar o evento de compartilhamento sem
  armazenar conteúdo de conversa. (RN-057)

## Geração de anúncios com IA (Fase 7)

- **RF-054** O corretor deve poder selecionar imóvel, canal, objetivo,
  tom, tamanho, público-alvo e aspectos a destacar antes de gerar um
  anúncio.
- **RF-055** O sistema deve gerar título, texto, chamada para ação e
  hashtags (quando aplicável), sinalizando quando houver informação
  ausente relevante. (RN-062)
- **RF-056** O sistema deve sinalizar visivelmente que o conteúdo foi
  gerado por IA. (RN-068)
- **RF-057** O corretor deve poder editar o conteúdo gerado antes de
  copiar ou compartilhar. (RN-067)
- **RF-058** O sistema deve manter histórico dos anúncios gerados por
  imóvel.
- **RF-059** O sistema deve impedir novas gerações além do limite do
  plano do corretor, exibindo mensagem clara. (RN-070)
- **RF-060** O sistema deve tratar falhas do provedor de IA com mensagem
  amigável e permitir nova tentativa. (RN-071)
- **RF-061** A aplicação deve implementar a geração de anúncio através de
  uma interface abstrata (`AiContentProvider`), independente de
  fornecedor específico. (Ver `docs/architecture/decisions/0004-*.md`)

## Artes para redes sociais (Fase 8)

- **RF-062** O corretor deve poder escolher um modelo de arte por formato
  (feed quadrado, feed vertical, Story, Status do WhatsApp, capa de
  Reel) e por tipo (novo imóvel, destaque, oportunidade, venda, aluguel,
  redução de preço, reservado, vendido, visita aberta).
- **RF-063** O corretor deve poder escolher a foto do imóvel usada na
  arte e editar os textos exibidos.
- **RF-064** O sistema deve exibir uma pré-visualização antes da
  exportação. (RN-079)
- **RF-065** O corretor deve poder baixar a arte gerada em qualidade
  adequada para publicação. (RN-080)
- **RF-066** A arte deve aplicar a identidade visual do corretor quando
  configurada, ou um modelo padrão da plataforma quando não houver.
  (RN-076)

## Relatórios (Fase 9)

- **RF-067** O corretor deve poder consultar visualizações do catálogo e
  por imóvel, cliques no WhatsApp, compartilhamentos, cópias de link,
  anúncios gerados e artes geradas.
- **RF-068** O corretor deve poder filtrar o relatório por hoje, últimos 7
  dias, últimos 30 dias e período personalizado.
- **RF-069** O sistema deve identificar o imóvel mais acessado no período
  selecionado.
- **RF-070** O sistema deve isolar os relatórios por corretor. (RN-082)
- **RF-071** O sistema deve exibir um estado vazio claro quando não
  houver dados no período. (RN-088)

## Administração (Fase 1/10 — escopo mínimo)

- **RF-072** O administrador deve poder visualizar a lista de corretores
  cadastrados e a quantidade de imóveis de cada um.
- **RF-073** O administrador deve poder bloquear e desbloquear uma conta
  de corretor.
- **RF-074** O administrador deve poder consultar eventos básicos de
  auditoria.
- **RF-075** O administrador deve poder visualizar indicadores gerais da
  plataforma (nº de corretores, nº de imóveis, nº de imóveis publicados).

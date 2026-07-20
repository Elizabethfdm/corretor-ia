# Regras de Negócio — Corretor IA

Numeração única e sequencial (RN-XXX) para toda a plataforma, usada na
matriz de rastreabilidade ([`docs/quality/traceability-matrix.md`](../quality/traceability-matrix.md))
e referenciada em requisitos funcionais, histórias de usuário e testes.

## Autenticação e conta (RN-001 a RN-014)

- **RN-001 — Unicidade de e-mail.** O e-mail é obrigatório e único por
  conta; duas contas não podem compartilhar o mesmo e-mail.
- **RN-002 — Formato de e-mail.** O e-mail deve possuir formato válido,
  validado no cliente e revalidado no servidor.
- **RN-003 — Senha mínima.** A senha deve possuir no mínimo 8 caracteres e
  combinação mínima adequada de tipos de caractere (definir política exata
  em ADR de autenticação).
- **RN-004 — Confirmação de senha.** A confirmação de senha deve coincidir
  exatamente com a senha informada no cadastro.
- **RN-005 — Armazenamento de senha.** A senha nunca é armazenada em texto
  puro; deve ser armazenada com hash forte e salt (ex.: bcrypt/argon2).
- **RN-006 — Conta bloqueada.** Um usuário bloqueado não pode acessar o
  painel, mesmo com credenciais válidas.
- **RN-007 — Mensagens de erro seguras.** Mensagens de erro de autenticação
  não revelam se um e-mail existe na base nem outros dados sensíveis.
- **RN-008 — Limite de tentativas.** O sistema deve limitar tentativas
  repetidas de autenticação (rate limiting) para mitigar força bruta.
- **RN-009 — Redirecionamento pós-login.** Um usuário já autenticado que
  acessa páginas de login/cadastro é redirecionado ao painel.
- **RN-010 — Proteção de rota privada.** Um usuário não autenticado que
  tenta acessar uma rota privada é redirecionado ao login.
- **RN-011 — Aceite obrigatório.** O cadastro só é concluído com aceite
  explícito dos Termos de Uso e da Política de Privacidade, com data/hora
  registradas (`termsAcceptedAt`, `privacyAcceptedAt`).
- **RN-012 — Sessão segura.** A sessão deve usar cookie `HttpOnly`,
  `Secure` em produção e `SameSite` apropriado.
- **RN-013 — Bloqueio entre contas.** Nenhuma ação de uma conta pode ler ou
  alterar dados de outra conta, independentemente da rota utilizada.
- **RN-014 — Recuperação de senha sem enumeração.** O fluxo de recuperação
  de senha nunca deve confirmar publicamente se o e-mail informado possui
  conta cadastrada.

## Perfil do corretor (RN-015 a RN-025)

- **RN-015 — Nome profissional obrigatório.**
- **RN-016 — CRECI obrigatório para publicação.** O catálogo só pode ser
  publicado com número e estado do CRECI preenchidos.
- **RN-017 — WhatsApp obrigatório para publicação.**
- **RN-018 — Cidade de atuação obrigatória para publicação.**
- **RN-019 — Slug único e amigável.** O slug do catálogo deve ser único em
  toda a plataforma, permitindo apenas letras minúsculas, números e
  hífen.
- **RN-020 — Palavras reservadas proibidas no slug.** Não é permitido usar
  como slug palavras como `admin`, `login`, `api`, `app`, `suporte`,
  `configuracoes` (lista mantida e extensível em configuração da
  aplicação).
- **RN-021 — Validação de arquivos de identidade visual.** Foto de perfil e
  logotipo devem respeitar formatos e tamanho máximo permitidos.
- **RN-022 — Catálogo inativo não é público.** Se `catalogEnabled` for
  falso, a página pública do corretor não deve ser acessível.
- **RN-023 — Alterações restritas ao dono.** Um corretor só pode alterar o
  próprio perfil; nenhuma alteração cruzada é permitida.
- **RN-024 — Compressão de imagem.** Fotos e logotipo devem ser otimizados
  (comprimidos) antes ou depois do upload, preservando qualidade
  aceitável.
- **RN-025 — Uma conta, um perfil.** Cada conta de corretor possui exatamente
  um `BrokerProfile`.

## Imóveis — regras centrais (RN-026 a RN-032)

Correspondem às regras RN-001 a RN-007 do Prompt Mestre original,
renumeradas para manter numeração única no projeto.

- **RN-026 — Isolamento por corretor.** Cada imóvel pertence a um único
  corretor. Toda consulta, alteração e exclusão deve isolar os dados por
  corretor autenticado, validado no servidor — nunca confiar apenas no
  identificador enviado pelo cliente.
- **RN-027 — Estados do imóvel.**
  - _Rascunho:_ não aparece publicamente; pode estar incompleto; pode ser
    editado e excluído.
  - _Disponível:_ aparece no catálogo; recebe visualizações; pode ser
    compartilhado; pode gerar anúncios e artes.
  - _Reservado:_ pode permanecer no catálogo com indicação "Reservado";
    configuração permite ocultá-lo; nunca apresentado como disponível.
  - _Vendido:_ deixa de aparecer como disponível; pode permanecer como
    portfólio conforme configuração; recebe selo "Vendido" quando
    público.
  - _Alugado:_ comportamento equivalente a vendido, com selo
    correspondente.
  - _Inativo:_ não aparece no catálogo; permanece no painel; pode ser
    reativado.
- **RN-028 — Exclusão lógica.** A exclusão de imóvel é lógica (soft
  delete), registrando data e usuário responsável, retirando o imóvel do
  catálogo e impedindo acesso público. Dados são mantidos pelo período
  necessário para auditoria/recuperação, com opção de restauração dentro
  de um período configurável.
- **RN-029 — Duplicação.** Ao duplicar um imóvel: gerar novo identificador
  e novo código de referência quando aplicável; copiar as informações e
  tratar as referências de mídia de forma seguindo associação apropriada;
  iniciar como rascunho; acrescentar "Cópia" ao título interno; não copiar
  métricas; não copiar o slug público; não publicar automaticamente.
- **RN-030 — Valor monetário.** Usar tipo monetário adequado (nunca ponto
  flutuante impreciso); não permitir valores negativos; permitir a opção
  "Consulte o valor"; o valor formatado nunca é usado como fonte de
  persistência (persistir o valor numérico/decimal, formatar apenas na
  exibição).
- **RN-031 — URL pública única.** Cada imóvel publicado possui URL
  amigável e única (`/catalogo/{slugCorretor}/imovel/{slugImovel}-{id}`),
  válida mesmo que outro imóvel tenha título semelhante.
- **RN-032 — Imóvel despublicado.** Um imóvel despublicado não aparece em
  busca nem em "imóveis semelhantes", não deve ser indexado por
  mecanismos de busca, retorna página/resposta de indisponibilidade
  adequada e não expõe dados pelo endpoint público.

## Cadastro de imóveis — validações por etapa (RN-033 a RN-045)

- **RN-033 — Foto obrigatória para publicação.** Um imóvel só pode ser
  publicado com ao menos uma foto.
- **RN-034 — Capa automática.** A primeira foto enviada é definida
  automaticamente como capa; o corretor pode alterar essa escolha.
- **RN-035 — Validação de mídia.** Toda mídia enviada deve ter formato e
  tamanho validados; arquivos executáveis são sempre rejeitados.
- **RN-036 — Nomes seguros de arquivo.** Os arquivos armazenados recebem
  nomes gerados de forma segura e única (nunca o nome original do
  usuário).
- **RN-037 — Metadados sensíveis.** Metadados sensíveis de imagem (ex.:
  geolocalização em EXIF) devem ser removidos quando tecnicamente
  possível.
- **RN-038 — Isolamento de mídia.** Nenhuma conta pode acessar mídia
  privada de outra conta.
- **RN-039 — Privacidade de endereço por padrão.** Por padrão, o número
  exato do imóvel não é exibido publicamente; o catálogo mostra apenas
  bairro e cidade, salvo o corretor optar explicitamente por exibir o
  endereço completo.
- **RN-040 — Dados completos restritos ao painel.** O endereço completo só
  fica disponível no painel privado do corretor dono do imóvel.
- **RN-041 — Observações internas nunca públicas.** O campo de observações
  internas nunca é exibido no catálogo público sob nenhuma circunstância.
- **RN-042 — Conteúdo de IA revisável.** Descrição gerada, revisada ou
  encurtada por IA pode sempre ser alterada pelo corretor antes da
  publicação.
- **RN-043 — Validação de publicação.** Um imóvel só pode ser publicado
  quando: o perfil do corretor é minimamente válido (CRECI e WhatsApp
  informados), título preenchido, finalidade preenchida, tipo preenchido,
  valor válido (ou marcado como "consulte"), cidade e bairro preenchidos,
  ao menos uma foto presente, descrição preenchida e situação igual a
  "disponível".
- **RN-044 — Etapas independentes de rascunho.** O corretor pode salvar
  rascunho a qualquer momento entre as etapas do cadastro, mesmo com
  campos obrigatórios de publicação ainda pendentes.
- **RN-045 — Reordenação e exclusão de fotos.** O corretor pode reordenar
  e excluir fotos a qualquer momento antes ou depois da publicação, desde
  que a regra RN-033 continue satisfeita após a exclusão.

## Catálogo digital e página do imóvel (RN-046 a RN-054)

- **RN-046 — Somente imóveis publicáveis no catálogo.** O catálogo exibe
  exclusivamente imóveis com situação "disponível" (e "reservado"/
  "vendido"/"alugado" conforme configuração de exibição), nunca
  rascunhos ou inativos.
- **RN-047 — Filtros preservados na URL.** Os filtros aplicados no
  catálogo devem ser refletidos na URL, permitindo compartilhamento do
  resultado filtrado.
- **RN-048 — Catálogo acessível sem autenticação.** A navegação completa
  do catálogo público e da página do imóvel não exige login.
- **RN-049 — Nenhum dado interno exposto.** Endpoints públicos nunca
  retornam campos internos (`internalNotes`, `internalTitle`,
  identificadores de storage, dados de conta do corretor além do
  necessário para exibição pública).
- **RN-050 — Identificadores internos não expostos desnecessariamente.**
  URLs e respostas públicas evitam expor identificadores sequenciais
  previsíveis quando isso facilitar enumeração (preferir slugs/UUIDs).
- **RN-051 — Mensagem padrão do WhatsApp.** A página do imóvel monta a
  mensagem padrão de contato com nome do corretor, título do imóvel,
  código de referência e URL do imóvel, com acentuação e URL
  corretamente codificadas.
- **RN-052 — Botão de contato fixo no celular.** Na visualização mobile da
  página do imóvel, o botão de contato permanece visível/fixo.
- **RN-053 — Imóveis semelhantes.** A sugestão de imóveis semelhantes
  nunca inclui imóveis de outro corretor nem imóveis despublicados/
  excluídos.
- **RN-054 — Atualização de "imóveis semelhantes" e busca ao despublicar.**
  Um imóvel despublicado ou excluído durante o acesso de um visitante deve
  deixar de aparecer nas próximas cargas de busca, semelhantes e catálogo.

## Compartilhamento (RN-055 a RN-060)

- **RN-055 — Omissão de campos vazios.** A mensagem de compartilhamento
  nunca exibe campos não preenchidos nem sequências vazias (ex.: "quartos:
  " sem valor).
- **RN-056 — Nenhum dado oculto na mensagem.** A mensagem de
  compartilhamento nunca inclui o endereço quando este estiver marcado
  como oculto.
- **RN-057 — Registro de clique sem conteúdo privado.** O clique de
  compartilhamento é registrado como evento agregado (RN-064), sem
  armazenar o conteúdo da conversa do WhatsApp.
- **RN-058 — Sem confirmação falsa de envio.** A aplicação nunca afirma
  que uma mensagem foi enviada, pois o envio efetivo ocorre dentro do
  WhatsApp, fora do controle da aplicação.
- **RN-059 — Compartilhamento de múltiplos contextos.** É possível
  compartilhar um imóvel individual, o catálogo completo ou um resultado
  filtrado, cada um com sua própria URL válida.
- **RN-060 — Compartilhamento nativo opcional.** Quando o dispositivo
  suportar a API nativa de compartilhamento, ela pode ser oferecida como
  alternativa aos botões dedicados.

## Geração de anúncios com IA (RN-061 a RN-074)

- **RN-061 — Fonte de dados restrita.** A geração de anúncio utiliza
  exclusivamente dados do imóvel pertencente ao corretor autenticado.
- **RN-062 — Proibição de invenção de dados.** A IA nunca inventa
  características, localização, preço ou condições comerciais não
  informadas.
- **RN-063 — Proibição de promessas indevidas.** A IA nunca promete
  valorização, nunca afirma aprovação de financiamento e nunca cria
  urgência falsa (ex.: "última unidade" sem dado correspondente no
  cadastro).
- **RN-064 — Linguagem não discriminatória.** O conteúdo gerado nunca
  utiliza linguagem discriminatória.
- **RN-065 — Nenhum dado privado no texto gerado.** O texto gerado nunca
  inclui dados privados (endereço oculto, observações internas, dados
  pessoais de terceiros).
- **RN-066 — Sem publicação automática.** A IA nunca publica o conteúdo
  automaticamente; o corretor deve revisar e agir manualmente.
- **RN-067 — Edição sempre disponível.** O corretor pode editar o
  conteúdo gerado antes de copiar ou compartilhar.
- **RN-068 — Sinalização de conteúdo de IA.** A interface sinaliza
  claramente que o texto foi gerado por inteligência artificial.
- **RN-069 — Registro de consumo.** Cada geração é registrada (consumo,
  provedor, modelo) para fins de limite de uso e auditoria.
- **RN-070 — Limite por plano.** A quantidade de gerações é limitada
  conforme o plano do corretor (limite configurável).
- **RN-071 — Tratamento de falha do provedor.** Falhas do provedor de IA
  são tratadas com mensagem clara ao usuário e opção de nova tentativa,
  sem travar o restante da aplicação.
- **RN-072 — Timeout obrigatório.** Toda chamada ao provedor de IA possui
  timeout configurado.
- **RN-073 — Sem geração duplicada acidental.** O sistema previne o
  disparo de gerações duplicadas por duplo clique ou reenvio acidental.
- **RN-074 — Segredo de IA nunca no cliente.** A chave de API do provedor
  de IA nunca é enviada ou armazenada no navegador.

## Artes para redes sociais (RN-075 a RN-081)

- **RN-075 — Somente dados públicos.** A arte é composta exclusivamente
  com dados públicos do imóvel (nunca `internalNotes` ou dados ocultos).
- **RN-076 — Identidade visual aplicada.** A arte respeita a identidade
  visual configurada (cores, logotipo); na ausência de configuração,
  aplica-se um modelo visual padrão da plataforma.
- **RN-077 — Sem corte de texto.** O layout impede texto cortado,
  respeitando os limites de cada modelo.
- **RN-078 — Sem distorção de imagem.** A foto do imóvel nunca é
  distorcida (respeita proporção/recorte controlado).
- **RN-079 — Pré-visualização obrigatória.** O corretor visualiza um
  preview antes de exportar/baixar a arte.
- **RN-080 — Exportação em qualidade adequada.** O arquivo exportado
  segue resolução mínima adequada para publicação em redes sociais.
- **RN-081 — Sem editor livre no MVP.** A primeira versão utiliza modelos
  predefinidos; não é oferecido um editor gráfico livre (tipo Canva).

## Relatórios e analytics (RN-082 a RN-090)

- **RN-082 — Isolamento por corretor.** Todo indicador de relatório é
  isolado por corretor; um corretor nunca vê dados agregados de outro.
- **RN-083 — Acesso administrativo não conta como acesso público.**
  Visualizações originadas do próprio painel do corretor (preview) não
  são contabilizadas como visualização pública.
- **RN-084 — Mitigação de duplicidade.** O sistema deve mitigar
  duplicidade excessiva de eventos causada por atualização de página
  (ex.: janela de deduplicação por sessão/tempo).
- **RN-085 — Registro de data e hora.** Todo evento de analytics registra
  data e hora de ocorrência.
- **RN-086 — Origem apenas quando disponível.** O evento registra a
  origem (referrer) apenas quando tecnicamente disponível, sem
  inferências não confiáveis.
- **RN-087 — Coleta mínima de dados pessoais.** Eventos de analytics não
  armazenam dados pessoais desnecessários do visitante (ver LGPD).
- **RN-088 — Estado vazio obrigatório.** A ausência de dados em um
  período deve ser comunicada de forma clara (estado vazio), nunca como
  erro.
- **RN-089 — Eventos rastreados no MVP.** `catalog_view`, `property_view`,
  `whatsapp_click`, `share_click`, `copy_link`, `ad_generated`,
  `art_generated`.
- **RN-090 — Agregação sem exposição individual sensível.** Relatórios
  exibem agregações (contagens por período/imóvel), não listas
  individualizadas de identificação de visitantes.

## Administração da plataforma (RN-091 a RN-095)

- **RN-091 — Escopo mínimo de administração.** O painel administrativo do
  MVP se limita a: listar corretores, visualizar quantidade de imóveis,
  bloquear/desbloquear conta, consultar auditoria básica e indicadores
  gerais.
- **RN-092 — Bloqueio administrativo imediato.** Ao bloquear uma conta, o
  acesso ao painel deve ser negado imediatamente nas próximas
  requisições autenticadas.
- **RN-093 — Catálogo de conta bloqueada.** Definir e documentar
  explicitamente (ADR) se o catálogo público de uma conta bloqueada
  permanece visível ou é ocultado — tratado como decisão de produto
  pendente (ver seção de decisões pendentes na Fase 0).
- **RN-094 — Auditoria de ações administrativas.** Toda ação
  administrativa sensível (bloqueio, desbloqueio) gera um `AuditLog`.
- **RN-095 — Rotas administrativas protegidas.** Rotas administrativas só
  são acessíveis a usuários com papel de administrador, validado no
  servidor.

## LGPD e privacidade (RN-096 a RN-103)

- **RN-096 — Coleta mínima.** A aplicação coleta apenas os dados
  necessários para a finalidade declarada de cada funcionalidade.
- **RN-097 — Finalidade clara.** Cada dado coletado tem finalidade
  documentada (ver `docs/security/threat-model.md`).
- **RN-098 — Consentimento registrado.** Aceites relevantes (Termos de
  Uso, Política de Privacidade) são registrados com data/hora.
- **RN-099 — Solicitação de exclusão de conta.** O corretor pode
  solicitar a exclusão de sua conta; o processamento segue política de
  retenção documentada.
- **RN-100 — Sem coleta desnecessária de visitantes.** Visitantes do
  catálogo público não têm dados pessoais coletados além do
  estritamente necessário para analytics agregado (RN-087).
- **RN-101 — Sem armazenamento de conversas do WhatsApp.** A aplicação
  nunca armazena o conteúdo de conversas do WhatsApp.
- **RN-102 — Sem dados financeiros do cliente final.** A aplicação nunca
  coleta dados financeiros do cliente final (comprador/locatário) no
  MVP.
- **RN-103 — Endereço completo nunca exposto por padrão.** Reforço direto
  de RN-039 sob a ótica de privacidade/LGPD: o padrão do sistema é a
  minimização da exposição de dados de localização.

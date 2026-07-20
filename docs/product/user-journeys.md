# Jornadas de Usuário — Corretor IA

## Jornada 1 — Onboarding do corretor (Maria)

1. Maria acessa a página inicial pelo celular e cria uma conta (nome,
   e-mail, senha, aceite dos termos).
2. É redirecionada ao painel e vê um estado inicial orientando a
   completar o perfil.
3. Preenche o perfil profissional: nome profissional, CRECI, WhatsApp,
   cidade de atuação e escolhe seu slug de catálogo.
4. O sistema valida o slug (único, formato correto, não reservado) e
   mostra a URL pública gerada.
5. Maria é direcionada ao fluxo de cadastro do primeiro imóvel.

**Pontos críticos:** clareza de que o catálogo só fica público após CRECI
e WhatsApp preenchidos; validação de slug em tempo real; fluxo curto o
suficiente para não desmotivar no celular.

## Jornada 2 — Cadastro e publicação de um imóvel (Maria, no celular)

1. Maria toca em "Novo imóvel" e inicia a etapa 1 (informações básicas):
   finalidade, tipo, valor, situação.
2. Avança para etapa 2 (características): quartos, banheiros, vagas,
   áreas, características adicionais.
3. Avança para etapa 3 (localização): CEP com preenchimento assistido,
   bairro, cidade; escolhe manter o endereço exato oculto no catálogo
   público.
4. Avança para etapa 4 (fotos): tira fotos com a câmera do celular
   durante a visita ao imóvel, acompanha o progresso do upload, define a
   foto de capa.
5. Avança para etapa 5 (descrição): opta por gerar a descrição com IA a
   partir dos dados já preenchidos, revisa o texto e ajusta manualmente.
6. Chega à etapa 6 (revisão): visualiza a pré-visualização mobile e
   desktop, confirma que todos os requisitos de publicação estão
   atendidos e publica.
7. O imóvel aparece imediatamente no catálogo público de Maria.

**Pontos críticos:** salvamento automático de rascunho entre etapas
(Maria pode ser interrompida durante a visita); upload resiliente a
conexão instável; validações claras impedindo publicação incompleta sem
frustrar o usuário.

## Jornada 3 — Geração de anúncio e compartilhamento (Maria)

1. A partir da página do imóvel publicado, Maria escolhe "Gerar anúncio
   com IA".
2. Seleciona canal (WhatsApp), tom (acolhedor) e aspectos a destacar
   (piscina, condomínio fechado).
3. A IA gera título, texto e chamada para ação com aviso de que o
   conteúdo foi gerado por IA e deve ser revisado.
4. Maria edita uma frase, copia o texto.
5. Volta à página do imóvel e toca em "Compartilhar no WhatsApp", que
   abre o WhatsApp com a mensagem pré-formatada e o link do imóvel.

**Pontos críticos:** IA nunca inventa dados ausentes; edição sempre
possível antes de copiar; link da mensagem sempre correto e codificado.

## Jornada 4 — Criação de arte para rede social (Rafael)

1. Rafael acessa "Criar arte" a partir de um imóvel publicado.
2. Escolhe o formato (feed quadrado) e o tipo (novo imóvel).
3. O sistema pré-carrega foto, título, bairro, preço e aplica a
   identidade visual (cores e logotipo) já configurada no perfil de
   Rafael.
4. Rafael ajusta o texto de destaque, visualiza o preview e baixa a
   imagem em qualidade adequada para publicação no Instagram.

**Pontos críticos:** nenhum texto cortado no layout; identidade visual
aplicada automaticamente; download confiável mesmo sem editor gráfico
complexo.

## Jornada 5 — Visitante navega no catálogo e entra em contato (Ana Paula)

1. Ana Paula recebe um link de catálogo filtrado pelo WhatsApp
   (`/catalogo/maria-silva-imoveis?finalidade=venda&cidade=...`).
2. A página carrega rapidamente no celular, com imagens otimizadas e
   carregamento progressivo.
3. Ana Paula aplica um filtro adicional (quartos mínimos) e ordena por
   menor preço.
4. Abre um imóvel, navega pela galeria de fotos, lê as características e
   vê que o endereço exato está oculto (apenas bairro/cidade exibidos).
5. Toca no botão fixo de WhatsApp na parte inferior da tela; abre o
   WhatsApp com uma mensagem pré-formatada contendo o título e código do
   imóvel.
6. Antes de sair, visualiza a seção "imóveis semelhantes" e compartilha
   um segundo imóvel com o marido copiando o link.

**Pontos críticos:** nenhuma autenticação exigida; nenhuma rolagem
horizontal; botão de contato sempre acessível; página não expõe dados
privados nem imóveis em rascunho/despublicados.

## Jornada 6 — Corretor consulta relatório de acessos (Maria)

1. Maria acessa "Relatórios" no painel.
2. Filtra pelo período "últimos 7 dias".
3. Vê visualizações do catálogo, cliques no WhatsApp por imóvel e o
   imóvel mais acessado da semana.
4. Identifica que um imóvel específico teve muitos cliques em WhatsApp
   mas poucas visualizações de página — decide dar destaque a ele no
   catálogo.

**Pontos críticos:** dados isolados por corretor; estado vazio claro
quando não há dados; sem exposição de dados pessoais de visitantes.

## Jornada 7 — Tentativa de acesso indevido (caso negativo, obrigatório)

1. Um segundo corretor (ou qualquer usuário autenticado) tenta acessar,
   via URL direta, o painel de edição de um imóvel que não lhe pertence.
2. O servidor valida a posse do recurso e nega o acesso, retornando uma
   resposta apropriada (não uma exposição parcial de dados).
3. Nenhuma informação do imóvel de Maria é exposta ao corretor não
   autorizado.

**Pontos críticos:** validação de posse sempre no servidor (RN-001);
jornada de teste obrigatória em todas as fases que envolvem dados por
corretor.

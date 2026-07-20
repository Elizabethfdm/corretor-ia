# Visão de Produto — Corretor IA

## 1. Declaração de visão

> Para corretores de imóveis autônomos que precisam divulgar imóveis de
> forma rápida e profissional, o **Corretor IA** é uma plataforma SaaS
> mobile-first que centraliza o cadastro do imóvel, a publicação em um
> catálogo digital, a geração de anúncios com IA e a criação de artes para
> redes sociais — permitindo compartilhar tudo pelo WhatsApp em poucos
> passos. Diferente de planilhas, grupos de WhatsApp avulsos ou portais
> genéricos, o Corretor IA foi desenhado para o fluxo real de trabalho do
> corretor autônomo: cadastrar uma vez, divulgar em todos os canais.

## 2. Problema

Corretores autônomos (sem uma imobiliária estruturada por trás) hoje:

- recadastram o mesmo imóvel em múltiplos grupos, redes sociais e
  portais;
- perdem tempo escrevendo anúncios do zero para cada canal;
- não têm um catálogo digital profissional e com URL própria para
  compartilhar;
- não têm visibilidade sobre quantas pessoas viram ou clicaram em um
  imóvel;
- dependem de ferramentas de design que exigem conhecimento técnico para
  criar artes de divulgação.

## 3. Proposta de valor

> Cadastre o imóvel uma vez, publique no seu catálogo digital, gere
> anúncios com IA, crie artes e compartilhe tudo pelo WhatsApp.

## 4. Objetivo do MVP

Validar se corretores autônomos pagariam por uma ferramenta que reduz o
tempo gasto no cadastro, na divulgação e no compartilhamento de imóveis.
O MVP deve ser simples o suficiente para ser utilizado por usuários com
pouca familiaridade tecnológica.

### Prioridades do MVP (ordem de importância)

1. Facilidade de uso.
2. Experiência no celular.
3. Cadastro rápido.
4. Carregamento eficiente de fotos.
5. Catálogo profissional.
6. Compartilhamento simples.
7. Segurança e privacidade.
8. Qualidade do código.
9. Testabilidade.
10. Baixo custo inicial de infraestrutura.

## 5. Fora do MVP (documentado, não implementado)

Recursos avaliados como não essenciais para validar a hipótese principal
do produto nesta primeira versão — ver detalhamento e justificativa em
[`mvp-scope.md`](mvp-scope.md):

- CRM completo;
- chatbot automático;
- publicação automática em redes sociais;
- integração direta com Facebook Marketplace;
- integração com portais imobiliários;
- geração automática de vídeos;
- cobrança recorrente real;
- aplicativo nativo Android ou iOS;
- automação de mensagens pelo WhatsApp Business.

## 6. Métricas de sucesso do MVP (hipóteses a validar)

| Métrica             | Hipótese                                                                               | Como medir                                             |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Ativação            | Corretor completa perfil + publica ao menos 1 imóvel em até 15 minutos após o cadastro | Evento de publicação vs. timestamp de criação de conta |
| Engajamento         | Corretor gera ao menos 1 anúncio com IA por imóvel publicado                           | Contagem de `GeneratedAdvertisement` por `Property`    |
| Compartilhamento    | Corretor compartilha ao menos 50% dos imóveis publicados pelo WhatsApp                 | Evento `share_click` / total de imóveis publicados     |
| Retenção inicial    | Corretor retorna à plataforma em até 7 dias após o primeiro cadastro                   | Login recorrente                                       |
| Interesse comercial | Corretor demonstra disposição a pagar (pesquisa qualitativa pós-uso)                   | Entrevistas/pesquisa, fora do escopo técnico do MVP    |

## 7. Público-alvo

Corretores de imóveis autônomos no Brasil, sem estrutura de TI própria,
que hoje divulgam imóveis manualmente por WhatsApp, redes sociais e
grupos. Ver personas detalhadas em [`personas.md`](personas.md).

## 8. Restrições conhecidas

- Baixo orçamento inicial de infraestrutura — arquitetura deve favorecer
  custo previsível e baixo em escala inicial.
- Usuários com baixa familiaridade tecnológica — prioridade máxima para
  simplicidade de uso, especialmente no celular.
- Conteúdo gerado por IA deve ser sempre revisável pelo corretor antes da
  publicação — a IA nunca publica automaticamente.
- Dados sensíveis de localização (endereço exato do imóvel) não devem ser
  expostos publicamente por padrão.

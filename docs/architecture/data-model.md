# Modelo de Dados Inicial — Corretor IA

> Este documento descreve o modelo conceitual/lógico que servirá de base
> para o `prisma/schema.prisma` a ser criado na Fase 1. Tipos são
> indicados em nível lógico (serão mapeados para tipos Prisma/PostgreSQL
> na implementação). Todas as datas são armazenadas em UTC e convertidas
> para o fuso do usuário apenas na interface.

## Convenções gerais

- Identificadores primários: UUID (evita enumeração sequencial — RN-050).
- Exclusão lógica: campo `deletedAt` (nulo = ativo) nas entidades onde a
  RN-028 exige recuperação/auditoria (`User`, `Property`, `PropertyMedia`).
- Valores monetários: tipo decimal de precisão fixa (nunca `float`) —
  RN-030.
- Enums de domínio (`status`, `purpose`, `propertyType` etc.) são
  modelados como enums do banco, não como texto livre.
- Toda tabela de domínio principal referencia o dono (`brokerId` ou
  `userId`) para permitir o isolamento exigido por RN-026.

## Entidades

### User

| Campo             | Tipo                             | Observações              |
| ----------------- | -------------------------------- | ------------------------ |
| id                | UUID (PK)                        |                          |
| name              | string                           | Nome completo            |
| email             | string, único                    | RN-001, RN-002           |
| passwordHash      | string ou referência de provedor | RN-005; nunca texto puro |
| role              | enum (`BROKER`, `ADMIN`)         |                          |
| status            | enum (`ACTIVE`, `BLOCKED`)       | RN-006                   |
| emailVerifiedAt   | datetime, opcional               | RF-006                   |
| termsAcceptedAt   | datetime                         | RN-011                   |
| privacyAcceptedAt | datetime                         | RN-011                   |
| createdAt         | datetime                         |                          |
| updatedAt         | datetime                         |                          |
| deletedAt         | datetime, opcional               | Exclusão lógica de conta |

Relações: `User 1—1 BrokerProfile` (quando `role = BROKER`);
`User 1—N AuditLog` (como ator).

### BrokerProfile

| Campo                 | Tipo                   | Observações    |
| --------------------- | ---------------------- | -------------- |
| id                    | UUID (PK)              |                |
| userId                | UUID (FK única → User) | RN-025         |
| professionalName      | string                 | RN-015         |
| fullName              | string                 |                |
| photoUrl              | string, opcional       |                |
| logoUrl               | string, opcional       |                |
| creciNumber           | string                 | RN-016         |
| creciState            | string (UF)            | RN-016         |
| phone                 | string, opcional       |                |
| whatsapp              | string                 | RN-017         |
| commercialEmail       | string, opcional       |                |
| biography             | text, opcional         |                |
| city                  | string                 | RN-018         |
| state                 | string (UF)            |                |
| businessAddress       | string, opcional       |                |
| instagramUrl          | string, opcional       |                |
| facebookUrl           | string, opcional       |                |
| linkedinUrl           | string, opcional       |                |
| websiteUrl            | string, opcional       |                |
| slug                  | string, único          | RN-019, RN-020 |
| primaryColor          | string (hex)           |                |
| secondaryColor        | string (hex)           |                |
| catalogEnabled        | boolean                | RN-022         |
| createdAt / updatedAt | datetime               |                |

Índices: único em `slug`; único em `userId`.

### Property

| Campo                 | Tipo                                                                  | Observações                         |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| id                    | UUID (PK)                                                             |                                     |
| brokerId              | UUID (FK → BrokerProfile)                                             | RN-026                              |
| internalTitle         | string                                                                |                                     |
| publicTitle           | string                                                                |                                     |
| referenceCode         | string                                                                | Único por corretor                  |
| purpose               | enum (`SALE`, `RENT`)                                                 |                                     |
| propertyType          | enum (ver lista de tipos)                                             |                                     |
| status                | enum (`DRAFT`, `AVAILABLE`, `RESERVED`, `SOLD`, `RENTED`, `INACTIVE`) | RN-027                              |
| price                 | decimal, opcional                                                     | RN-030                              |
| showPrice             | boolean                                                               | Suporta "Consulte o valor"          |
| condominiumFee        | decimal, opcional                                                     |                                     |
| propertyTax           | decimal, opcional                                                     | IPTU                                |
| bedrooms              | int, opcional                                                         |                                     |
| suites                | int, opcional                                                         |                                     |
| bathrooms             | int, opcional                                                         |                                     |
| parkingSpaces         | int, opcional                                                         |                                     |
| totalArea             | decimal, opcional                                                     |                                     |
| builtArea             | decimal, opcional                                                     |                                     |
| constructionYear      | int, opcional                                                         |                                     |
| furnished             | boolean                                                               |                                     |
| petFriendly           | boolean                                                               |                                     |
| financingAccepted     | boolean                                                               |                                     |
| exchangeAccepted      | boolean                                                               |                                     |
| description           | text, opcional                                                        |                                     |
| highlights            | text, opcional                                                        |                                     |
| nearbyPlaces          | text, opcional                                                        |                                     |
| commercialConditions  | text, opcional                                                        |                                     |
| internalNotes         | text, opcional                                                        | RN-041 — nunca exposto publicamente |
| seoTitle              | string, opcional                                                      |                                     |
| seoDescription        | string, opcional                                                      |                                     |
| slug                  | string                                                                | Único por corretor — RN-031         |
| featured              | boolean                                                               |                                     |
| publishedAt           | datetime, opcional                                                    |                                     |
| createdAt / updatedAt | datetime                                                              |                                     |
| deletedAt             | datetime, opcional                                                    | RN-028                              |

Índices: composto único (`brokerId`, `slug`); composto único (`brokerId`,
`referenceCode`); índice em (`brokerId`, `status`) para consultas do
painel; índice em (`status`, `publishedAt`) para o catálogo público.

Tipos iniciais de `propertyType`: casa, apartamento, terreno, chácara,
sítio, fazenda, sala comercial, imóvel comercial, galpão, cobertura,
sobrado, kitnet, outro.

### PropertyAddress

| Campo                 | Tipo                                  | Observações                    |
| --------------------- | ------------------------------------- | ------------------------------ |
| id                    | UUID (PK)                             |                                |
| propertyId            | UUID (FK única → Property)            |                                |
| zipCode               | string                                |                                |
| state                 | string (UF)                           |                                |
| city                  | string                                |                                |
| neighborhood          | string                                |                                |
| street                | string, opcional                      |                                |
| number                | string, opcional                      |                                |
| complement            | string, opcional                      |                                |
| referencePoint        | string, opcional                      |                                |
| latitude              | decimal, opcional                     |                                |
| longitude             | decimal, opcional                     |                                |
| visibilityType        | enum (`HIDDEN_EXACT`, `FULL_ADDRESS`) | RN-039 — padrão `HIDDEN_EXACT` |
| createdAt / updatedAt | datetime                              |                                |

### PropertyFeature

| Campo       | Tipo                                                                                                                                                                                                                                           | Observações |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| id          | UUID (PK)                                                                                                                                                                                                                                      |             |
| propertyId  | UUID (FK → Property)                                                                                                                                                                                                                           |             |
| featureType | enum (piscina, churrasqueira, área gourmet, varanda, jardim, quintal, elevador, academia, salão de festas, portaria, condomínio fechado, ar-condicionado, energia solar, acessibilidade, vista para o mar, frente para a rua, área de serviço) |             |

Índice composto único (`propertyId`, `featureType`).

### PropertyMedia

| Campo        | Tipo                    | Observações                                          |
| ------------ | ----------------------- | ---------------------------------------------------- |
| id           | UUID (PK)               |                                                      |
| propertyId   | UUID (FK → Property)    |                                                      |
| type         | enum (`PHOTO`, `VIDEO`) |                                                      |
| storageKey   | string                  | Chave interna no storage — nunca exposta diretamente |
| publicUrl    | string                  | RN-036, RN-038                                       |
| thumbnailUrl | string, opcional        |                                                      |
| altText      | string, opcional        |                                                      |
| displayOrder | int                     | RN-045                                               |
| isCover      | boolean                 | RN-034                                               |
| mimeType     | string                  | RN-035                                               |
| size         | int (bytes)             | RN-035                                               |
| width        | int, opcional           |                                                      |
| height       | int, opcional           |                                                      |
| createdAt    | datetime                |                                                      |
| deletedAt    | datetime, opcional      |                                                      |

Índice em (`propertyId`, `displayOrder`); constraint garantindo no máximo
uma mídia com `isCover = true` por imóvel (validado na camada de serviço).

### GeneratedAdvertisement

| Campo                 | Tipo                                                                                      | Observações                           |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| id                    | UUID (PK)                                                                                 |                                       |
| brokerId              | UUID (FK → BrokerProfile)                                                                 | RN-061                                |
| propertyId            | UUID (FK → Property)                                                                      |                                       |
| channel               | enum (Instagram, Facebook, WhatsApp, Story, etc.)                                         |                                       |
| tone                  | enum (profissional, elegante, acolhedor, objetivo, persuasivo, alto padrão, investimento) |                                       |
| objective             | string                                                                                    |                                       |
| title                 | string                                                                                    |                                       |
| content               | text                                                                                      |                                       |
| hashtags              | string[], opcional                                                                        |                                       |
| provider              | string                                                                                    | Nome do provedor de IA usado — RN-069 |
| model                 | string                                                                                    |                                       |
| status                | enum (`GENERATED`, `EDITED`, `FAILED`)                                                    |                                       |
| createdAt / updatedAt | datetime                                                                                  |                                       |

Índice em (`brokerId`, `createdAt`) para histórico e contagem de limite
(RN-070).

### ArtworkTemplate

| Campo                 | Tipo                                                                                                                             | Observações |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| id                    | UUID (PK)                                                                                                                        |             |
| name                  | string                                                                                                                           |             |
| type                  | enum (novo imóvel, destaque, oportunidade, venda, aluguel, redução de preço, reservado, vendido, visita aberta)                  |             |
| width                 | int                                                                                                                              |             |
| height                | int                                                                                                                              |             |
| status                | enum (`ACTIVE`, `INACTIVE`)                                                                                                      |             |
| configuration         | estrutura tipada (layout, posições de campo) — evitar JSON livre; usar estrutura validada por schema Zod mesmo quando persistida |             |
| createdAt / updatedAt | datetime                                                                                                                         |             |

### GeneratedArtwork

| Campo         | Tipo                                                      | Observações |
| ------------- | --------------------------------------------------------- | ----------- |
| id            | UUID (PK)                                                 |             |
| brokerId      | UUID (FK → BrokerProfile)                                 |             |
| propertyId    | UUID (FK → Property)                                      |             |
| templateId    | UUID (FK → ArtworkTemplate)                               |             |
| outputUrl     | string                                                    |             |
| configuration | estrutura tipada (valores efetivamente usados na geração) |             |
| createdAt     | datetime                                                  |             |

### AnalyticsEvent

| Campo             | Tipo                                                                                                                  | Observações                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| id                | UUID (PK)                                                                                                             |                                                         |
| brokerId          | UUID (FK → BrokerProfile)                                                                                             | RN-082                                                  |
| propertyId        | UUID (FK → Property), opcional                                                                                        |                                                         |
| eventType         | enum (`catalog_view`, `property_view`, `whatsapp_click`, `share_click`, `copy_link`, `ad_generated`, `art_generated`) | RN-089                                                  |
| sessionHash       | string, opcional                                                                                                      | Hash não reversível, nunca identificador pessoal direto |
| referrer          | string, opcional                                                                                                      | RN-086                                                  |
| userAgentCategory | enum (`MOBILE`, `TABLET`, `DESKTOP`, `UNKNOWN`)                                                                       |                                                         |
| occurredAt        | datetime                                                                                                              | RN-085                                                  |
| metadata          | estrutura tipada e restrita (nunca dado pessoal — RN-087)                                                             |                                                         |

Índice composto em (`brokerId`, `eventType`, `occurredAt`) para
agregações de relatório.

### AuditLog

| Campo        | Tipo                                         | Observações                               |
| ------------ | -------------------------------------------- | ----------------------------------------- |
| id           | UUID (PK)                                    |                                           |
| userId       | UUID (FK → User), opcional (ação de sistema) |                                           |
| action       | string                                       | Ex.: `BROKER_BLOCKED`, `PROPERTY_DELETED` |
| entityType   | string                                       |                                           |
| entityId     | UUID                                         |                                           |
| safeMetadata | estrutura tipada, sem dado sensível          |                                           |
| ipHash       | string, opcional                             | Hash não reversível                       |
| createdAt    | datetime                                     |                                           |

## Diagrama de relacionamento (conceitual)

```text
User 1───1 BrokerProfile 1───N Property 1───1 PropertyAddress
                              Property 1───N PropertyFeature
                              Property 1───N PropertyMedia
                              Property 1───N GeneratedAdvertisement
                              Property 1───N GeneratedArtwork
BrokerProfile 1───N AnalyticsEvent
ArtworkTemplate 1───N GeneratedArtwork
User 1───N AuditLog
```

## Notas de implementação (Fase 1)

- Entidades adicionais de suporte à autenticação (ex.: tokens de sessão,
  tokens de redefinição de senha) dependem da biblioteca de autenticação
  escolhida (ver ADR 0002) e serão detalhadas nessa fase, sem alterar o
  modelo de domínio acima.
- Nenhum campo de domínio deve usar JSON livre quando uma estrutura
  relacional ou um schema tipado validado (Zod) for suficiente — reservar
  JSON apenas para configurações realmente flexíveis (`ArtworkTemplate.configuration`,
  `GeneratedArtwork.configuration`, `AnalyticsEvent.metadata`), sempre com
  schema de validação associado.

## Notas de implementação (Fase 2)

O `User` conceitual acima foi implementado com o schema gerado pelo
Better Auth (ADR-0002), com as seguintes correspondências — o `prisma/schema.prisma`
real é a fonte da verdade; este documento permanece como referência
conceitual:

| Campo conceitual                             | Implementação real                                                 | Observação                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User.id`                                    | `user.id` (string gerada pela biblioteca)                          | Não é UUID — é o identificador padrão do Better Auth. Demais entidades de domínio (a partir da Fase 3) continuam usando `@default(uuid())` normalmente. |
| `User.passwordHash`                          | `account.password` (tabela `account`, `providerId = "credential"`) | Hash `scrypt`, nunca texto puro (RN-005) — verificado em teste de integração.                                                                           |
| `User.status` (enum `ACTIVE`/`BLOCKED`)      | `user.banned` (boolean) + `user.banReason` + `user.banExpires`     | Campos do plugin `admin`; login é bloqueado nativamente quando `banned = true` (RN-006).                                                                |
| `User.role`                                  | `user.role` (string: `"broker"` \| `"admin"`)                      | Plugin `admin`, `defaultRole: "broker"`.                                                                                                                |
| `User.emailVerifiedAt`                       | `user.emailVerified` (boolean)                                     | A biblioteca usa boolean, não timestamp; verificação de e-mail não é exigida no MVP (RF-006 permanece opcional).                                        |
| `User.termsAcceptedAt` / `privacyAcceptedAt` | Campos customizados (`additionalFields`, `input: false`)           | Carimbados automaticamente em `databaseHooks.user.create.before`, nunca recebidos diretamente do cliente.                                               |

Entidades adicionais criadas pelo Better Auth (sem equivalente no modelo
conceitual original, específicas da biblioteca): `session`, `account`,
`verification` (tokens de verificação/redefinição de senha) e
`rateLimit` (RN-008, armazenamento em banco).

A entidade `AuditLog` foi criada exatamente como modelada, com uma
diferença deliberada: `userId` não usa `@relation` formal com `user`
(ver comentário no `schema.prisma`) — trilha de auditoria deve
sobreviver independentemente do ciclo de vida da conta referenciada.

## Notas de implementação (Fase 3)

`BrokerProfile` foi implementada essencialmente como modelada, com dois
ajustes:

- `userId` também **não** usa `@relation` formal com `user`, pelo mesmo
  motivo do `AuditLog`: evita qualquer conflito com o model `user`
  gerenciado pelo CLI do Better Auth. A unicidade (RN-025 — um perfil
  por conta) é garantida por `@unique` no campo, e a posse é sempre
  resolvida a partir do `userId` da sessão autenticada, nunca de um
  identificador vindo do cliente (RN-023).
- Apenas `professionalName`, `fullName` e `slug` são obrigatórios
  (`NOT NULL`) — o restante dos campos é opcional no banco, permitindo
  salvar um perfil parcial/rascunho. CRECI, WhatsApp e cidade só se
  tornam obrigatórios no momento de **publicar** o catálogo
  (`catalogEnabled = true`), verificado em
  `server/services/broker-profile-service.ts` (RN-016 a RN-018), não no
  schema do banco.
- `photoUrl`/`logoUrl` guardam a URL pública retornada pelo
  `StorageProvider` (ver ADR-0003) — nunca a `storageKey` interna
  diretamente.

## Notas de implementação (Fase 4)

`Property`, `PropertyAddress`, `PropertyFeature` e `PropertyMedia` foram
implementadas essencialmente como modeladas, com as seguintes decisões
tomadas durante a implementação:

- Ao contrário de `User`/`BrokerProfile` (que evitam `@relation` formal
  por conviverem com o schema gerado pelo CLI do Better Auth), `Property`
  é inteiramente nossa — `brokerId` usa `@relation` formal com
  `BrokerProfile` (`onDelete: Cascade`), assim como `PropertyAddress`,
  `PropertyFeature` e `PropertyMedia` em relação a `Property`. Isso
  significa que excluir um `BrokerProfile` (ex.: em testes) apaga em
  cascata todos os seus imóveis e mídias — não é necessário limpar essas
  tabelas manualmente nos testes de integração/E2E.
- Apenas `internalTitle`, `purpose`, `propertyType` e `status` são
  obrigatórios no banco; todo o restante (preço, endereço, descrição,
  fotos) é opcional, permitindo salvar rascunhos incompletos. Os
  critérios mínimos para **publicar** (RN-043: título, preço ou "consulte
  o valor", cidade, bairro, descrição e ao menos uma foto) são
  verificados na camada de serviço
  (`getPropertyPublicationRequirementErrors` em
  `lib/validation/property.ts`, reaproveitada tanto no servidor quanto no
  cliente para o aviso de pendências), não no schema.
- `slug` é opcional no banco (`String?`) mas sempre preenchido pela
  aplicação (`generateSlugWithSuffix`) — permanece regerável a partir do
  título enquanto o imóvel nunca foi publicado (`publishedAt === null`)
  e congela após a primeira publicação, para não quebrar links já
  compartilhados (decisão de produto, não uma regra numerada do
  documento mestre).
- `PropertyMedia.type` já modela `PHOTO` e `VIDEO` no enum, mas apenas
  upload de fotos foi implementado nesta fase — vídeo fica para uma fase
  futura.
- Valores monetários e de área (`price`, `condominiumFee`, `propertyTax`,
  `totalArea`, `builtArea`) trafegam como `string` validada por regex do
  formulário até a camada de serviço, onde são convertidos diretamente
  para `Prisma.Decimal` a partir da string (nunca via `number`/`float`
  intermediário) — precisão de centavos verificada em teste de
  integração (RN-030).

## Notas de implementação (Fase 5)

O catálogo digital não introduz nenhuma entidade nova — consulta o
`Property` já modelado na Fase 4, filtrado por `status = "AVAILABLE"`
(RN-046, ver decisão registrada em `business-rules.md`) e
`deletedAt = null`. Duas decisões de implementação relevantes:

- **Serialização pública nunca reaproveita o serializer do painel**
  (`serialize-property.ts`, Fase 4): existe um serializer próprio
  (`serializePublicProperty` em `catalog-service.ts`) que constrói um
  tipo `PublicProperty` deliberadamente restrito — nunca inclui
  `internalTitle`, `internalNotes`, `referenceCode`, `storageKey` ou
  qualquer campo não listado explicitamente (RN-049). A lista de campos
  públicos é uma lista de permissão (allowlist), não uma lista de
  bloqueio, para que a adição futura de um campo sensível ao `Property`
  nunca vaze automaticamente para o catálogo.
- **Título público sintetizado quando ausente**: `publicTitle` continua
  opcional na Fase 4 (não é exigido para publicar — RN-043). Como
  RN-049 proíbe expor `internalTitle` publicamente, um imóvel publicado
  sem `publicTitle` preenchido precisa de um título público mesmo assim
  — `buildPublicTitle` sintetiza um a partir de tipo + finalidade +
  localização (ex.: "Casa para venda em Jardim Europa, São Paulo"),
  nunca usando o conteúdo de `internalTitle`.

## Notas de implementação (Fase 6)

A página individual do imóvel também não introduz nenhuma entidade
nova — reaproveita `Property` e o mesmo `catalog-service.ts` da Fase 5,
estendido com `getPublicProperty` e um segundo serializer
(`serializePublicPropertyDetail`, superconjunto de `PublicProperty` com
os campos que só fazem sentido na página individual: descrição
completa, destaques, proximidades, condições comerciais,
características, galeria completa e endereço).

- **Endereço público condicionado a `visibilityType`** (RN-039, RN-040,
  campo já existente desde a Fase 4 mas sem nenhum consumidor público
  até agora): `serializePublicAddress` só preenche
  `street`/`number`/`complement`/`referencePoint` quando
  `visibilityType === "FULL_ADDRESS"`; `city`/`neighborhood` são sempre
  públicos independente da visibilidade (já eram exibidos nos cartões
  do catálogo desde a Fase 5).
- **Imóveis semelhantes (RN-053) não usam nenhum campo de
  "similaridade" no schema** — `findSimilarPublic` prioriza mesmo
  `purpose`+`propertyType` do mesmo corretor e completa com os mais
  recentes do mesmo corretor caso não haja `limit` semelhantes
  suficientes com o mesmo tipo. Sempre exclui o próprio imóvel e nunca
  cruza corretores (`brokerId` como filtro obrigatório, nunca vindo do
  cliente).
- **Nenhuma tabela de compartilhamento/analytics foi criada** — o
  registro de clique de compartilhamento (RN-057) depende de
  `AnalyticsEvent`, que só é criado na Fase 9. Os botões de
  compartilhamento desta fase funcionam (WhatsApp, copiar link, copiar
  mensagem, compartilhamento nativo) mas não geram nenhum registro
  ainda.

## Notas de implementação (Fase 7)

`GeneratedAdvertisement` foi implementada com mais campos do que o
modelo conceitual original (Fase 0) previa — `size`, `targetAudience` e
`highlightAspects` foram adicionados para registrar integralmente os
parâmetros de geração (RF-054), não só o resultado, e `callToAction`
ganhou uma coluna própria (o modelo conceitual original só tinha
`title`/`content`/`hashtags`, mas RF-055 exige "chamada para ação" como
campo distinto do corpo do anúncio).

- Ao contrário de `AuditLog` (que deliberadamente não usa `@relation`
  formal para sobreviver ao ciclo de vida da conta referenciada),
  `GeneratedAdvertisement` usa `@relation` formal com `BrokerProfile` e
  `Property` (`onDelete: Cascade` em ambos) — mesmo padrão de
  `Property`/`PropertyAddress` etc.: é um dado dependente do imóvel e do
  corretor, não uma trilha de auditoria independente.
- **Só gerações bem-sucedidas são persistidas.** O enum
  `AdvertisementStatus` inclui `FAILED` (conforme o modelo conceitual
  original), mas nesta fase nenhum registro com esse status chega a ser
  criado — uma falha do provedor de IA (RN-071) não consome a quota do
  corretor (RN-070) nem deixa um registro incompleto no histórico
  (RF-058). O valor `FAILED` permanece no schema para uma eventual fase
  futura com geração assíncrona/enfileirada, onde um registro poderia
  ser criado antes da chamada ao provedor terminar.
- **Título enviado à IA nunca é `internalTitle` bruto** — reaproveita a
  mesma função `buildPublicTitle` já usada pelo catálogo público (Fase
  5), agora extraída para `lib/property/build-public-title.ts`
  (antes vivia só dentro de `catalog-service.ts`) para ser compartilhada
  entre o catálogo e a geração de anúncios sem duplicar a lógica de
  síntese de título (RN-049, RN-065).
- **Limite mensal (RN-070)** é contado via `@@index([brokerId, createdAt])`
  — uma consulta `count` filtrando por `createdAt >= início do mês
  corrente`, não um contador persistido separado. Simplificação
  deliberada: não há sistema de planos em nenhuma fase do produto, então
  o limite é um valor único configurável (`AI_MONTHLY_GENERATION_LIMIT`),
  não "por plano".

## Notas de implementação (Fase 8)

`GeneratedArtwork` substitui a dupla `ArtworkTemplate` +
`GeneratedArtwork` do modelo conceitual original (Fase 0) por uma única
tabela — **não existe uma tabela `ArtworkTemplate`**. RN-081 exige
modelos fixos definidos pela plataforma (nunca editáveis pelo corretor),
então os modelos (dimensões por formato, layout, cor padrão por tipo)
são constantes tipadas em `src/lib/artwork/` (ver ADR-0006), não uma
entidade do banco — mesmo padrão já usado para os tamanhos de anúncio da
Fase 7. Só o resultado de cada geração é persistido.

- `photoMediaId` usa `@relation` opcional (`onDelete: SetNull`) com
  `PropertyMedia` — ao contrário de `broker`/`property` (`onDelete:
  Cascade`, mesmo padrão de `GeneratedAdvertisement`), a foto de origem
  pode ser excluída no futuro sem invalidar o histórico de artes já
  geradas: a imagem final já está persistida em `outputUrl`,
  independente da foto original ainda existir.
- `outputKey` (chave no storage) é guardado além de `outputUrl` —
  mesmo padrão de `PropertyMedia.storageKey`/`publicUrl` — para permitir
  uma eventual rotina de limpeza/expiração por chave no futuro, embora
  nenhuma exclusão de arte seja implementada nesta fase.
- Não há campo `status`/`FAILED` (diferente de `GeneratedAdvertisement`):
  a composição da arte é local (sem chamada a um provedor externo que
  possa falhar de forma assíncrona), então uma falha de geração nunca
  chega a criar um registro incompleto — mesmo efeito prático do padrão
  "só sucesso é persistido" da Fase 7, sem precisar do enum.

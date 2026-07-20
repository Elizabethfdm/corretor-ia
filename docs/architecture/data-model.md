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

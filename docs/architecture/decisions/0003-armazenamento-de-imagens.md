# ADR-0003 — Estratégia de armazenamento de imagens

- **Status:** Aceita — implementada na Fase 3 (perfil do corretor) e
  estendida na Fase 4 (galerias de imóveis), mantendo o mesmo fluxo
  simplificado sem URL assinada (ver seção "Fase 4" abaixo)
- **Data:** 2026-07-19 (nível de estratégia) — atualizada em 2026-07-20
  (Fase 3, implementação) e novamente em 2026-07-20 (Fase 4)
- **Decisores:** Arquitetura / DevOps

## Contexto

O cadastro de imóveis depende fortemente de upload de fotos (múltiplas
por imóvel, inclusive via câmera do celular), com necessidade de:
validação de tipo e tamanho, geração de miniaturas, remoção de metadados
sensíveis, nomes de arquivo seguros e isolamento de mídia por corretor
(RN-035 a RN-038).

## Alternativas consideradas

| Alternativa                                                       | Prós                                                                                                         | Contras                                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Serviço de objetos compatível com S3 (upload via URL assinada)    | Escalável, baixo custo inicial em camadas gratuitas/baixo volume, desacopla arquivo do servidor de aplicação | Exige configuração de credenciais e política de bucket corretamente restrita                                            |
| Armazenar arquivos no próprio servidor de aplicação (disco local) | Simplicidade inicial                                                                                         | Não escala horizontalmente, risco de perda de dados sem backup dedicado, incompatível com ambientes serverless/efêmeros |
| Armazenar binário no banco de dados (bytea)                       | Simplicidade de backup único                                                                                 | Péssima performance e custo de banco para arquivos de mídia; contraindicado                                             |

## Decisão

Usar um serviço de armazenamento de objetos **compatível com a API S3**.
Fluxo de upload:

1. O cliente solicita ao servidor uma URL de upload assinada e de curta
   duração para um `storageKey` gerado de forma aleatória (RN-036).
2. O upload do arquivo ocorre diretamente do cliente para o storage,
   usando essa URL assinada — credenciais de acesso nunca chegam ao
   navegador (RNF-033).
3. Após a confirmação do upload, o servidor valida tipo/tamanho reais do
   arquivo, gera miniatura e persiste o registro `PropertyMedia`.
4. URLs públicas de leitura são geradas apenas para mídia de imóveis
   publicados; mídia de rascunho usa acesso controlado pelo servidor
   (RN-038).

## Decisão efetivamente implementada (Fase 3)

Para a foto de perfil e o logotipo do corretor (arquivo único, pequeno,
enviado com pouca frequência), o fluxo real implementado é mais simples
do que o originalmente desenhado — **sem** URL assinada:

1. O arquivo é enviado como `FormData` diretamente para uma Server
   Action (`uploadPhotoAction`/`uploadLogoAction`), passando pelo
   servidor Next.js.
2. O servidor valida o tamanho (máx. 5 MB) e o **conteúdo real** do
   arquivo via `sharp` — nunca confia no `Content-Type` declarado pelo
   navegador (RN-035). Formatos aceitos: JPEG, PNG, WebP. SVG é
   rejeitado explicitamente (vetor de XSS via `<script>` embutido).
3. A imagem é redimensionada (`fit: inside`, sem ampliar) e recomprimida
   para JPEG com `sharp` (RN-024). A conversão para JPEG descarta EXIF/
   metadados originais por padrão da biblioteca — RN-037 sem passo
   extra.
4. O servidor faz upload do resultado processado via
   `@aws-sdk/client-s3` (`PutObjectCommand`) para um serviço compatível
   com S3, com `storageKey` aleatório (`crypto.randomUUID()` — RN-036).
5. Ao substituir uma foto/logotipo existente, o arquivo antigo é
   removido do storage (best effort — uma falha na limpeza não bloqueia
   a operação principal).

Justificativa para não usar URL assinada nesta fase: para um único
arquivo pequeno por usuário, o ganho de performance de um upload
direto-do-cliente não compensa a complexidade adicional (dois round-trips,
confirmação assíncrona, validação pós-upload). O fluxo original com URL
assinada continua sendo o plano para a **Fase 4** (galerias de imóveis
com múltiplas fotos, potencialmente grandes, enviadas em lote), quando o
ganho de não sobrecarregar o servidor de aplicação se torna relevante.

**Provedor local (desenvolvimento/teste): MinIO**, via
`docker-compose.yml`, 100% compatível com a API S3 usada em produção —
o mesmo código funciona com qualquer provedor real compatível com S3
(AWS S3, Cloudflare R2, DigitalOcean Spaces etc.), trocando apenas
`STORAGE_ENDPOINT`/credenciais. Escolha alinhada a RNF-049 (custo zero
em desenvolvimento) e ao mesmo padrão já usado para e-mail (ADR-0005):
abstração própria (`StorageProvider`) com provedor real de produção
como decisão a confirmar antes do deploy.

## Decisão efetivamente implementada (Fase 4)

Ao chegar a hora de implementar as galerias de imóveis, a decisão foi
**manter o mesmo fluxo simplificado da Fase 3** (sem URL assinada),
em vez de migrar para o desenho original com upload direto-do-cliente:

1. `uploadPropertyPhotos` recebe um array de `File` via `FormData` (o
   `<input type="file" multiple>` já entrega múltiplos arquivos em um
   único envio) e processa cada um sequencialmente com `processImage`
   (a mesma função `sharp` reaproveitada da Fase 3, apenas renomeada de
   `processProfileImage` para refletir o uso genérico), redimensionando
   para no máximo 1600×1600 e recomprimindo para JPEG.
2. Cada arquivo processado é enviado via `@aws-sdk/client-s3` a partir
   do próprio servidor, com `storageKey` aleatório por foto
   (`property/{propertyId}/photo/...`).
3. Limites de proteção adicionados nesta fase: no máximo 30 fotos por
   imóvel e 8 MB por arquivo (`MAX_PHOTOS_PER_PROPERTY`,
   `MAX_UPLOAD_SIZE_BYTES` em `property-media-service.ts`).

Justificativa para não migrar para upload direto-do-cliente com URL
assinada, apesar do plano original: o volume real (até 30 fotos de até
8 MB, tipicamente fotos de celular já comprimidas pela câmera) ainda é
administrável passando pelo servidor Next.js sem degradar a experiência
percebida nos testes manuais/E2E; a complexidade adicional de dois
round-trips e confirmação assíncrona por upload direto-do-cliente não se
provou necessária neste volume. Processamento em fila (mencionado como
possibilidade nas "Consequências" da Fase 3) também não se mostrou
necessário — o processamento síncrono de até 30 imagens permanece dentro
de um tempo de resposta aceitável para uma ação de formulário. Ambas as
alternativas continuam candidatas para revisão caso o uso real em
produção mostre volume ou latência maiores que o testado.

A revogação de acesso a mídia de imóvel excluído/despublicado **não foi
implementada nesta fase**: o bucket do MinIO permanece com leitura
pública anônima para toda a mídia (mesma política da Fase 3), e um
imóvel despublicado ou excluído logicamente apenas deixa de aparecer nas
listagens da aplicação — a URL pública da foto continua tecnicamente
acessível a quem já a possuir. Tratado como limitação conhecida (ver
`docs/evidence/fase-04-cadastro-de-imoveis/README.md`), a avaliar antes
do lançamento em produção.

## Consequências

- É necessário um passo de pós-processamento (miniatura, remoção de
  metadados EXIF sensíveis — RN-037), implementado de forma síncrona
  dentro da própria Server Action tanto para foto/logo de perfil (Fase 3)
  quanto para galerias de imóvel (Fase 4, até 30 arquivos por envio).
  Processamento em fila não se mostrou necessário no volume testado —
  permanece como possibilidade a reavaliar se o volume real em produção
  justificar.
- A revogação de acesso a mídia de um imóvel excluído/despublicado
  **permanece não implementada** (ver seção "Fase 4" acima) — a URL
  pública de uma foto continua acessível mesmo após o imóvel sair de
  circulação. A tratar antes do lançamento em produção, possivelmente
  exigindo migrar o bucket para leitura autenticada com URLs assinadas
  de curta duração para leitura, não só para escrita.
- Bucket do MinIO local configurado com leitura pública anônima
  (`mc anonymous set download`) — adequado para o volume e sensibilidade
  testados até a Fase 4 (fotos de perfil, logo e imóveis, todas
  destinadas a exibição pública quando publicadas). Ver limitação de
  revogação de acesso acima.

## Referências

- https://min.io/docs/minio/container/index.html
- https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
- https://sharp.pixelplumbing.com/

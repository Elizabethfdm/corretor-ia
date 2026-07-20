# ADR-0003 — Estratégia de armazenamento de imagens

- **Status:** Aceita — implementada na Fase 3 (perfil do corretor); fluxo
  de upload direto-do-cliente revisitado quando galerias de imóveis
  chegarem (Fase 4)
- **Data:** 2026-07-19 (nível de estratégia) — atualizada em 2026-07-20
  (Fase 3, implementação)
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

## Consequências

- É necessário um passo de pós-processamento (miniatura, remoção de
  metadados EXIF sensíveis — RN-037), implementado de forma síncrona
  dentro da própria Server Action nesta fase (arquivo único, pequeno).
  Processamento em fila será avaliado na Fase 4 se o volume/tamanho de
  arquivos justificar.
- A revogação de acesso a mídia de um imóvel excluído/despublicado deve
  ser tratada na política de acesso do storage, não apenas na aplicação
  — a detalhar na Fase 4 (mídia de imóvel ainda não existe).
- Bucket do MinIO local configurado com leitura pública anônima
  (`mc anonymous set download`) — adequado para fotos de perfil/logo,
  que são sempre públicas quando o catálogo está ativo. Mídia que
  precisar de controle de acesso mais fino (Fase 4) exigirá revisão
  dessa política.

## Referências

- https://min.io/docs/minio/container/index.html
- https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
- https://sharp.pixelplumbing.com/

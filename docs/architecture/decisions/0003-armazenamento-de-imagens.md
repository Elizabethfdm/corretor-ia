# ADR-0003 — Estratégia de armazenamento de imagens

- **Status:** Aceita (nível de estratégia); provedor específico a
  confirmar na Fase 1/4 conforme custo e disponibilidade
- **Data:** 2026-07-19
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

O provedor concreto (ex.: um serviço de object storage compatível com S3)
será escolhido na Fase 1 com base em custo, região disponível e
facilidade de integração — critério alinhado a RNF-049 (baixo custo
inicial).

## Consequências

- É necessário um passo de pós-processamento (miniatura, remoção de
  metadados EXIF sensíveis — RN-037) que pode rodar de forma síncrona ou
  em fila leve, a detalhar na Fase 4.
- A revogação de acesso a mídia de um imóvel excluído/despublicado deve
  ser tratada na política de acesso do storage, não apenas na aplicação.

## Referências

_A preencher na Fase 1 com a documentação oficial do provedor
efetivamente escolhido._

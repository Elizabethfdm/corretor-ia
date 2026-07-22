# ADR-0007 — Coleta de eventos de analytics e relatórios

- **Status:** Aceita — implementada na Fase 9
- **Data:** 2026-07-21
- **Decisores:** Arquitetura

## Contexto

A Fase 9 (RN-082 a RN-090) exige registrar 7 tipos de evento
(`catalog_view`, `property_view`, `whatsapp_click`, `share_click`,
`copy_link`, `ad_generated`, `art_generated`) e exibir ao corretor um
relatório agregado, isolado por conta, com mitigação de duplicidade por
atualização de página (RN-084) e sem armazenar dados pessoais
desnecessários do visitante (RN-087).

## Alternativas consideradas (mitigação de duplicidade)

| Alternativa                                                          | Prós                                                                                   | Contras                                                                                                                                                                         |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cookie de visitante anônimo + `middleware.ts` para garantir o cookie | Sessão estável entre requisições, dedup mais precisa                                   | Exige novo arquivo de middleware rodando em toda rota pública; Server Components não podem escrever cookies durante a renderização, só Server Actions/Route Handlers/middleware |
| Hash calculado por requisição (IP + User-Agent + dia)                | Nenhuma infraestrutura nova; funciona em Server Components e Server Actions igualmente | Duas pessoas por trás do mesmo IP corporativo/NAT no mesmo dia podem ser tratadas como uma só sessão (mesma limitação inerente a qualquer fingerprint sem cookie)               |

## Decisão

**Dedup via hash computado, sem cookie novo:** `sessionHash =
sha256(ip + "|" + userAgent + "|" + data-no-formato-AAAA-MM-DD)`,
calculado a cada requisição em `lib/analytics/session-hash.ts` — não
reversível (RN-087), sem precisar de cookie nem de `middleware.ts`. A
janela de deduplicação em si (RN-084) é aplicada na consulta ao gravar
um evento: antes de inserir, verifica se já existe um evento do mesmo
tipo, para o mesmo `sessionHash` (e `propertyId`, quando aplicável),
ocorrido nos últimos 30 minutos — se existir, o novo evento é
descartado silenciosamente (nunca um erro para o visitante).

**Categoria de dispositivo sem nova dependência:** classificador
próprio (`lib/analytics/user-agent-category.ts`) por expressões
regulares simples sobre o cabeçalho `User-Agent`, retornando `MOBILE`,
`TABLET`, `DESKTOP` ou `UNKNOWN`. Suficiente para as 4 categorias
exigidas; uma biblioteca como `ua-parser-js` seria capaz de extrair
muito mais detalhes (fabricante, versão exata do SO), mas nada disso é
necessário para o relatório desta fase.

**RN-083 (visualização do próprio painel não conta):** não há uma
prévia do catálogo/imóvel renderizada dentro de `/painel/**` que
reaproveite os mesmos componentes de exibição pública — o painel usa
telas próprias (`ReviewPanel` etc.). Como o código de rastreamento só é
chamado a partir das páginas públicas (`/catalogo/**`), a regra é
satisfeita estruturalmente, sem precisar de uma verificação extra de
"o visitante é o próprio dono da conta".

**Sem rate limiting novo:** as Server Actions públicas que registram
cliques (`whatsapp_click`, `share_click`, `copy_link`) não têm limitação
de taxa dedicada nesta fase — o `CLAUDE.md` reserva rate limiting
obrigatório para rotas de autenticação e endpoints sensíveis; o pior
caso de abuso aqui é inflar contadores agregados do próprio corretor
dono da página (nenhum dado sensível exposto, nenhum acesso indevido a
recurso alheio). Tratado como limitação conhecida.

**Registro best-effort:** `recordAnalyticsEvent` nunca lança para fora —
captura e loga qualquer falha internamente, mesmo padrão já usado por
`recordAuditLog` (Fase 2/3). Uma falha ao gravar um evento nunca
interrompe a navegação do visitante nem uma ação do corretor.

## Consequências

- Nenhuma dependência nova instalada.
- Nenhum cookie novo, nenhum `middleware.ts` novo.
- A precisão da deduplicação é ligeiramente menor do que um cookie de
  sessão dedicado ofereceria (ver tabela de alternativas) — aceitável
  para o objetivo de "mitigar duplicidade excessiva" (RN-084), não
  "eliminar completamente".
- Se no futuro o produto precisar de analytics mais sofisticado
  (funil de conversão por sessão real, retenção, etc.), a introdução de
  um cookie de visitante dedicado continua sendo o próximo passo natural.

## Referências

- `docs/security/threat-model.md`
- RFC 6265 (cookies) — consultado apenas para confirmar a restrição de
  Server Components não poderem defini-los durante a renderização.

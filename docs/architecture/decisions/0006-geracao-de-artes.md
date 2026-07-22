# ADR-0006 — Geração de artes para redes sociais

- **Status:** Aceita — implementada na Fase 8
- **Data:** 2026-07-21
- **Decisores:** Arquitetura

## Contexto

A Fase 8 (RN-075 a RN-081) exige compor uma imagem final (arte) a partir
da foto de um imóvel, sobrepondo textos (badge do tipo de anúncio,
título, subtítulo, chamada para ação) e a identidade visual do corretor
(cores, logotipo), sem nunca cortar texto (RN-077) nem distorcer a foto
(RN-078), com modelos fixos definidos pela plataforma (RN-081 — sem
editor gráfico livre).

## Alternativas consideradas

| Alternativa                                                            | Prós                                                                                  | Contras                                                                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sharp` (já é dependência do projeto, ADR-0003)                        | Nenhuma dependência nova; mesma ferramenta já usada para todo processamento de imagem | Precisa verificar se cobre composição de texto e camadas sem lib adicional                                         |
| `@napi-rs/canvas` (Canvas API via binário Rust, sem compilação nativa) | `measureText()` real para medir texto com precisão                                    | Dependência nova a justificar/manter; redundante com o que `sharp` já oferece (ver Decisão)                        |
| Headless browser (Playwright/Puppeteer) renderizando HTML/CSS          | Máxima flexibilidade de layout (CSS completo)                                         | Dependência pesada só para gerar uma imagem estática; Playwright já é usado no projeto, mas apenas para testes E2E |

## Decisão

Usar exclusivamente `sharp` (nenhuma dependência nova). Ao consultar a
documentação oficial (`sharp.pixelplumbing.com/api-composite` e
`api-constructor`) antes de escrever qualquer código — em vez de
presumir a API —, foi confirmado que `sharp` já resolve os dois
requisitos mais delicados sem precisar de `@napi-rs/canvas` nem de um
navegador headless:

1. **Sem distorção (RN-078):** a foto de base é redimensionada com
   `resize({ width, height, fit: "cover" })` — corta o excedente mantendo
   a proporção original, nunca esmaga/estica a imagem.
2. **Sem corte de texto (RN-077):** cada bloco de texto (badge, título,
   subtítulo, chamada para ação) é renderizado com a opção `text` do
   construtor do `sharp` (`sharp({ text: { text, width, height, ... } })`),
   que usa Pango internamente. Quando `width` **e** `height` são
   informados, a própria biblioteca ajusta automaticamente o tamanho da
   fonte para caber na caixa (`"the text will automatically fit"`) —
   elimina a necessidade de um algoritmo próprio de quebra de linha e
   redução progressiva de fonte, que era o plano original antes de
   consultar a documentação. Como salvaguarda adicional contra textos
   absurdamente longos (que ficariam ilegíveis mesmo cabendo), os campos
   de título/subtítulo/chamada para ação têm limite de caracteres no
   schema Zod (`lib/validation/artwork.ts`).

Composição final: foto de base (cover-fit) + retângulo semitransparente
(`sharp({ create: { width, height, channels: 4, background } })`, sem
gradiente nesta versão — simplificação deliberada) + badge colorido +
blocos de texto + logotipo do corretor (opcional), tudo unido via
`.composite([...])`. Texto do corretor é inserido via Pango markup
(`<span foreground="...">`) para cor/negrito — todo texto vindo do
usuário é escapado (`&`, `<`, `>`, aspas) antes de entrar no markup, pelo
mesmo motivo que qualquer conteúdo dinâmico embutido em um formato
tipo-XML precisa ser escapado (não é uma superfície de XSS, já que nunca
roda em navegador, mas markup malformado quebraria a geração).

**Modelos como código, não como tabela (RN-081):** o `data-model.md`
original (Fase 0) previa uma tabela `ArtworkTemplate` configurável. Como
RN-081 exige explicitamente modelos fixos definidos pela plataforma (não
editáveis pelo corretor), isso foi implementado como constantes tipadas
em `src/lib/artwork/` (dimensões por formato, cor padrão por tipo,
layout relativo único parametrizado pelo tamanho do canvas) — mesmo
padrão já usado para os tamanhos de anúncio da Fase 7. Só o resultado de
cada geração (`GeneratedArtwork`) é persistido no banco.

**Cor de identidade (RN-076):** a cor de destaque do badge usa
`broker.primaryColor` quando configurado; na ausência, cai para uma cor
padrão por tipo de anúncio definida no código. O logotipo do corretor
(`broker.logoUrl`), quando presente, é buscado e composto no canto
inferior; sua ausência não impede a geração (falha ao buscar o logotipo
é tratada como best-effort, mesmo padrão já usado em ADR-0003 para
limpeza de arquivos antigos).

**Formatos verticais com a mesma resolução:** Story, Status do WhatsApp
e capa de Reel usam o mesmo tamanho de canvas (1080×1920) — os três são,
na prática, o mesmo formato vertical de tela cheia em cada plataforma;
tratá-los como três resoluções diferentes seria uma distinção sem
diferença real de renderização nesta fase.

## Consequências

- Nenhuma dependência nova instalada.
- Fonte usada é o nome genérico `sans-serif`, resolvido pelo
  `fontconfig`/Pango do sistema operacional em tempo de execução — não
  há uma fonte customizada embutida no projeto. Em ambientes sem nenhuma
  fonte sans-serif instalada (improvável em Windows, macOS, ou imagens
  Docker `node`/`ubuntu` padrão), o Pango cai para a fonte padrão do
  sistema; o texto continua legível, apenas com uma tipografia
  potencialmente diferente da esperada. Não verificado em um ambiente
  minimalista sem fontconfig — risco a reavaliar antes do deploy em
  produção se a imagem de contêiner final for extremamente minimalista.
- Sem gradiente no retângulo de legibilidade (só cor sólida
  semitransparente) — mais simples de implementar e testar; suficiente
  para o objetivo de contraste de texto sobre foto.
- Se no futuro for necessário um controle de layout mais rico (ex.:
  cantos arredondados, múltiplas fotos por arte, textos com fontes
  customizadas da marca do corretor), `@napi-rs/canvas` continua sendo a
  alternativa mais indicada — foi descartada apenas porque `sharp` já
  cobre integralmente o escopo desta fase.

## Referências

- https://sharp.pixelplumbing.com/api-composite
- https://sharp.pixelplumbing.com/api-constructor
- https://sharp.pixelplumbing.com/api-resize
- ADR-0003 (armazenamento de imagens — reaproveitado sem alterações)

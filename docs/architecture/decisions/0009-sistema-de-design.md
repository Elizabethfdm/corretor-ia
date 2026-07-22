# ADR-0009 — Sistema de design (componentes de UI reutilizáveis)

- **Status:** Aceita — implementada na Fase 1 da refatoração de UX/UI
- **Data:** 2026-07-22
- **Decisores:** Arquitetura / UX

## Contexto

O sistema é funcional (MVP completo, Fases 1-10 entregues), mas a
interface ainda é essencialmente o boilerplate padrão do Next.js/
Tailwind: sem paleta de marca, sem tipografia efetivamente aplicada
(ver "Efeito colateral" abaixo) e sem componentes de UI reutilizáveis
além de 5 arquivos mínimos (`input`/`select`/`submit-button`/
`form-field`/`form-message`). Cada tela reimplementa à mão seu próprio
padrão visual de card, tabela, badge, paginação etc. O objetivo desta
fase é elevar a interface a um nível "pronto para comercialização",
inspirado (não copiado) em SaaS como Notion/HubSpot/Pipefy/Trello/
ClickUp/Stripe Dashboard, começando por uma fundação: paleta,
tipografia e uma biblioteca de componentes reutilizáveis em
`src/components/ui/`, sem alterar nenhuma página ainda.

Dois problemas concretos motivam uma decisão técnica (não só visual):

1. Alguns componentes futuros (Modal/Dialog, Tabs, Dropdown menu)
   exigem gestão de foco e teclado não trivial para atender RNF-019
   (foco preso em modal, `Esc` fecha, foco retorna ao elemento de
   origem) e ao padrão WAI-ARIA correspondente. Implementar isso à mão
   é viável, mas replica lógica que bibliotecas maduras já resolvem e
   testam extensivamente.
2. Sem um utilitário de composição de variantes, cada componente novo
   (`Button` com variantes primary/secondary/outline/ghost/destructive
   e tamanhos, por exemplo) acumula lógica condicional de classes
   Tailwind repetida e propensa a erro.

## Alternativas consideradas

| Alternativa                                                                                                    | Prós                                                                                                                                                                                                                                                                          | Contras                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implementar foco/teclado manualmente para cada componente acessível                                            | Zero dependência nova                                                                                                                                                                                                                                                         | Reimplementa lógica de acessibilidade complexa e bem testada (focus trap, restauração de foco, navegação por seta/Home/End) sem ganho real; maior risco de bug de acessibilidade |
| Biblioteca de componentes visual "pronta" (ex.: Material UI, Ant Design, Chakra)                               | Componentes prontos, menos código próprio                                                                                                                                                                                                                                     | Visual próprio (identidade de marca) fica mais difícil de alcançar; trazem sua própria camada de estilo/tema, que colidiria com Tailwind já em uso; peso de bundle maior         |
| **Primitivos Radix UI (sem estilo) + `class-variance-authority`/`clsx`/`tailwind-merge`, ao estilo shadcn/ui** | Radix resolve só a lógica de acessibilidade (foco/teclado/ARIA), sem impor nenhum estilo visual — 100% do CSS continua Tailwind próprio; dependências pequenas, maduras e amplamente usadas (base do próprio shadcn/ui); `cva` elimina lógica condicional de classes repetida | Mais uma camada de dependências (ainda que pequenas); exige aprender a API dos primitivos Radix usados                                                                           |

## Decisão

Adotar:

- **`class-variance-authority`** (`cva`) + **`clsx`** + **`tailwind-merge`**
  como utilitário de composição de classes/variantes (padrão
  shadcn/ui) — um helper `cn()` em `src/lib/utils/cn.ts` combina
  `clsx` (classes condicionais) com `tailwind-merge` (resolve
  conflitos entre classes Tailwind, ex.: `px-2` vs `px-4`).
- **Radix UI**, pacotes individuais `@radix-ui/react-dialog`,
  `@radix-ui/react-tabs` e `@radix-ui/react-dropdown-menu`, para os
  três componentes que exigem gestão de foco/teclado complexa
  (`Dialog`, `Tabs`, `DropdownMenu`). Radix fornece apenas
  comportamento acessível não estilizado (sub-componentes como
  `Root`/`Trigger`/`Portal`/`Content` via `import * as Dialog from
"@radix-ui/react-dialog"`) — todo o CSS visual desses componentes
  continua 100% Tailwind próprio, escrito no repositório.
- **`lucide-react`** para ícones (leve, tree-shakeable, combina com o
  padrão shadcn/ui/Radix já usado por um grande número de projetos
  Next.js/Tailwind).

Versões confirmadas via `npm view <pacote> version` no momento da
instalação (nunca presumidas): `class-variance-authority@0.7.1`,
`clsx@2.1.1`, `tailwind-merge@3.6.0`, `@radix-ui/react-dialog@1.1.20`,
`@radix-ui/react-tabs@1.1.18`, `@radix-ui/react-dropdown-menu@2.1.21`,
`lucide-react@1.25.0`. API de cada primitivo Radix (nomes de
sub-componentes, props obrigatórias/opcionais, padrão de composição)
consultada na documentação oficial
(`radix-ui.com/primitives/docs/components/{dialog,tabs,dropdown-menu}`)
antes da escrita de qualquer componente de integração — nenhuma API
presumida.

Resumo do que cada primitivo garante (conforme documentação oficial):

- **Dialog**: foco preso dentro do modal enquanto aberto; `Esc` fecha
  e devolve o foco ao elemento que abriu o diálogo (`Dialog.Trigger`);
  `Dialog.Title`/`Dialog.Description` conectam texto ao diálogo via
  ARIA para leitores de tela; padrão WAI-ARIA "Dialog (Modal)".
- **Tabs**: `Tabs.Trigger`/`Tabs.Content` ligados por `value`; setas
  (←→ ou ↑↓ conforme `orientation`) e `Home`/`End` navegam entre
  abas; `activationMode="automatic"` (padrão) ativa o painel ao
  navegar por seta, sem exigir Enter adicional.
- **DropdownMenu**: `Esc` fecha e devolve o foco ao `Trigger`; setas
  navegam entre itens com "typeahead" (busca por texto digitado);
  padrão WAI-ARIA "Menu Button".

## Consequências

- Todos os componentes antigos (`input`/`select`/`submit-button`/
  `form-field`/`form-message`) continuam funcionando exatamente como
  hoje durante a Fase 1 — os novos componentes são criados em
  paralelo, sem nenhuma página consumindo-os ainda. Zero risco de
  regressão observável nesta fase específica.
- Fases seguintes da refatoração de UX/UI migram página por página
  para os novos componentes, cada uma apresentada e aprovada
  individualmente.
- Novas dependências (7, todas pequenas/maduras) passam a fazer parte
  da árvore de dependências de produção; nenhuma delas substitui ou
  conflita com Tailwind CSS, que continua sendo o único mecanismo de
  estilo visual do projeto.
- Efeito colateral corrigido na mesma fase: a fonte Geist já era
  carregada via `next/font/google` em `src/app/layout.tsx` desde as
  fases iniciais, mas `globals.css` sobrescrevia com
  `font-family: Arial, Helvetica, sans-serif` no `body`, tornando esse
  carregamento inerte — corrigido nesta fase ao aplicar a classe
  utilitária `font-sans` (mapeada para `--font-geist-sans` via
  `@theme inline`).

## Referências

- https://www.radix-ui.com/primitives/docs/components/dialog
- https://www.radix-ui.com/primitives/docs/components/tabs
- https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- https://cva.style/docs
- https://github.com/dcastil/tailwind-merge
- https://lucide.dev/guide/packages/lucide-react
</content>

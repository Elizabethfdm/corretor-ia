# ADR-0000 — Modelo de licenciamento do repositório

- **Status:** Proposta (decisão de produto pendente de confirmação)
- **Data:** 2026-07-19
- **Decisores:** Proprietário do produto (pendente)

## Contexto

Todo repositório precisa de um arquivo `LICENSE`. Como o Corretor IA é um
produto SaaS comercial, o modelo de licenciamento afeta diretamente o
modelo de negócio (quem pode usar, copiar ou redistribuir o código).

## Alternativas consideradas

| Alternativa                                          | Prós                                                                                          | Contras                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Proprietária ("todos os direitos reservados")        | Protege integralmente a propriedade intelectual; padrão seguro para produto comercial fechado | Impede qualquer contribuição externa sem acordo formal                   |
| Código aberto (MIT/Apache 2.0)                       | Favorece comunidade, portfólio técnico, contribuições externas                                | Permite uso comercial por terceiros, inclusive concorrentes, sem retorno |
| Fonte disponível com restrição comercial (ex.: BUSL) | Meio-termo — código visível, uso comercial restrito                                           | Modelo menos padronizado; exige texto jurídico próprio                   |

## Decisão (provisória)

Adotado, como padrão seguro da Fase 0, o modelo **proprietário — todos os
direitos reservados** (ver `LICENSE` na raiz), por ser a opção mais segura
para não conceder direitos involuntariamente enquanto o modelo de negócio
não está definido. Esta é uma **decisão de produto que precisa de
confirmação explícita** do proprietário do Corretor IA antes da Fase 10
(Hardening) ou de qualquer divulgação pública do repositório.

## Consequências

- Nenhum uso, cópia ou redistribuição por terceiros é permitido até
  decisão em contrário.
- Caso o proprietário decida futuramente por um modelo diferente, este
  ADR deve ser atualizado (status "Substituída por ADR-YYYY") e o arquivo
  `LICENSE` correspondente atualizado no mesmo commit.

## Referências

- https://choosealicense.com/ (para comparação de modelos, caso se opte
  por código aberto no futuro)

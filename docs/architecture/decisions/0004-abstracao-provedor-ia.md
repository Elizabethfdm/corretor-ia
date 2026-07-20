# ADR-0004 — Abstração do provedor de inteligência artificial

- **Status:** Aceita (nível de estratégia); provedor concreto a confirmar
  na Fase 7
- **Data:** 2026-07-19
- **Decisores:** Arquitetura

## Contexto

O Corretor IA usa IA para gerar anúncios a partir dos dados do imóvel
(Fase 7 — RN-061 a RN-070). O Prompt Mestre exige explicitamente que a
aplicação não fique acoplada a um único fornecedor de IA, para permitir
troca futura de provedor sem reescrever a lógica de negócio.

Nota de correção (Fase 4): esta seção originalmente também citava
"gerar/revisar descrições de imóveis" como uso de IA na Fase 4 — isso
não correspondia ao escopo real de RN-026 a RN-045 (ver
`docs/planning/phases-plan.md`), que é cadastro manual de imóveis, sem
nenhuma funcionalidade de IA. O campo `description` implementado na
Fase 4 é texto livre digitado pelo corretor, sem geração ou revisão
assistida por IA. Corrigido aqui para refletir o escopo real.

## Alternativas consideradas

| Alternativa                                                                        | Prós                                                                                                                                | Contras                                                                                                |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Camada de abstração própria (`AiContentProvider`) com implementação por fornecedor | Independência de fornecedor; testável com mock/fake em testes de integração; troca futura de provedor sem alterar `server/services` | Exige manter um mapeamento de input/output estável entre fornecedores                                  |
| Acoplamento direto ao SDK de um único fornecedor em toda a aplicação               | Menor esforço inicial                                                                                                               | Alto custo de troca futura; dificulta testes determinísticos; contraria explicitamente o Prompt Mestre |

## Decisão

Definir em `lib/ai` uma interface estável, independente de fornecedor:

```typescript
interface AiContentProvider {
  generatePropertyAdvertisement(
    input: PropertyAdvertisementInput,
  ): Promise<PropertyAdvertisementOutput>;
}
```

Regras de implementação:

- `server/services` depende apenas da interface, nunca de um SDK
  concreto.
- Cada fornecedor tem um adaptador próprio (`lib/ai/providers/<fornecedor>`)
  que implementa `AiContentProvider` e traduz o formato de
  entrada/saída específico do fornecedor.
- A escolha do fornecedor concreto em produção é configurada por
  variável de ambiente (`AI_PROVIDER`), nunca hardcoded.
- Testes de integração usam um adaptador _fake_ determinístico,
  eliminando dependência de rede/custo em CI.
- Toda chamada real ao fornecedor tem timeout obrigatório (RN-072) e
  tratamento de falha com nova tentativa controlada (RN-071).
- A chave de API do provedor é lida apenas no servidor a partir de
  variável de ambiente (`AI_API_KEY`), nunca exposta ao cliente
  (RN-074).
- O prompt enviado ao provedor deve ser construído exclusivamente a
  partir de dados do imóvel do corretor autenticado (RN-061), com
  instruções explícitas proibindo invenção de dados (RN-062 a RN-065).

## Consequências

- Adicionar um novo fornecedor de IA no futuro exige apenas um novo
  adaptador, sem alterar `server/services` nem a interface.
- A escolha do fornecedor específico (ex.: qual provedor de modelos de
  linguagem) será feita na Fase 7, avaliando custo, qualidade de saída em
  português do Brasil, e limites de uso — critério documentado nesse
  momento com a documentação oficial vigente do fornecedor escolhido.

## Referências

_A preencher na Fase 7 com a documentação oficial do fornecedor
efetivamente escolhido._

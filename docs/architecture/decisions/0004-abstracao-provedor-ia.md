# ADR-0004 — Abstração do provedor de inteligência artificial

- **Status:** Aceita — abstração e provedor concreto implementados na
  Fase 7
- **Data:** 2026-07-19 (nível de estratégia) — atualizada em 2026-07-21
  (Fase 7, provedor concreto)
- **Decisores:** Arquitetura / Produto

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

## Decisão efetivamente implementada (Fase 7)

Provedor real escolhido: **Anthropic Claude API**, via `@anthropic-ai/sdk`
(pacote oficial, mantido ativamente, versão `^0.112.4` no momento da
integração — verificado com `npm view` e documentação oficial vigente
antes de escrever qualquer código, conforme exige `CLAUDE.md`). Critério:
boa qualidade de saída em português do Brasil, documentação oficial
clara e estável, e alinhamento com o contexto do projeto.

- `AnthropicAiProvider` (`lib/ai/providers/anthropic-ai-provider.ts`)
  implementa `AiContentProvider` chamando `client.messages.create({
  model, max_tokens, system, messages, temperature })` — `system`
  carrega as instruções anti-invenção (RN-062 a RN-065) e o `user`
  message carrega somente os dados do imóvel já validados/serializados
  pelo `server/services` (nunca o SDK recebe o objeto `Property` bruto).
- Modelo padrão configurável via `AI_MODEL` (padrão: `claude-sonnet-5`
  — bom equilíbrio custo/qualidade para texto de marketing curto);
  `AI_API_KEY` lida apenas no servidor via variável de ambiente
  (RN-074), nunca commitada (`.env.example` traz só o nome da variável).
- Timeout explícito por chamada (RN-072) via opção `timeout` do SDK,
  menor que o padrão de 10 minutos da biblioteca — adequado a uma
  geração de texto curto, não a uma tarefa de raciocínio longo.
- Erros de rede/API são capturados via `Anthropic.APIError` (e
  subclasses como `RateLimitError`, `APIConnectionTimeoutError`) e
  traduzidos para um erro de domínio próprio (`AiProviderError`),
  nunca vazando detalhes internos do SDK para a UI (RN-071).
- A resposta esperada é solicitada em um formato de texto estruturado
  (JSON) via instrução no `system` prompt, validado com Zod ao ser
  recebida — se a IA responder algo que não valida contra o schema
  esperado, tratado como falha do provedor (RN-071), nunca aceito às
  cegas.
- `FakeAiProvider` (`lib/ai/providers/fake-ai-provider.ts`) permanece o
  padrão em desenvolvimento/testes (`AI_PROVIDER` não definida ou
  `"fake"`) — determinístico, sem rede nem custo. Chamadas reais à
  Anthropic **não são exercidas pela suíte de testes automatizada**
  deste ambiente (exigiria uma `AI_API_KEY` real) — ver
  `docs/evidence/fase-07-ia-para-anuncios/`.

## Referências

- https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript
- https://platform.claude.com/docs/en/api/messages
- https://github.com/anthropics/anthropic-sdk-typescript

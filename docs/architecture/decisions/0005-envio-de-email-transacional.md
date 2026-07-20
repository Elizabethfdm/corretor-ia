# ADR-0005 — Envio de e-mail transacional

- **Status:** Aceita (nível de estratégia); provedor real de produção é
  uma decisão pendente, não bloqueante para o desenvolvimento
- **Data:** 2026-07-19
- **Decisores:** Arquitetura

## Contexto

A recuperação de senha (RF-004/RF-005, RN-014) e, opcionalmente, a
verificação de e-mail (RF-006) exigem o envio de e-mails transacionais
(link de redefinição de senha, link de verificação). Escolher e
contratar um provedor de e-mail transacional real (Resend, SendGrid, AWS
SES, Postmark etc.) é uma decisão que envolve custo recorrente e uma
conta/credencial que só o proprietário do produto pode criar — não é
algo que possa ser decidido ou provisionado unilateralmente nesta fase.

## Alternativas consideradas

| Alternativa                                                                                               | Prós                                                                                                                                                   | Contras                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Camada abstrata (`EmailProvider`) com implementação de log para dev/teste e provedor real plugável depois | Desbloqueia o desenvolvimento e os testes automatizados imediatamente, sem custo nem credencial; troca de provedor não exige alterar `server/services` | Produção não pode enviar e-mail real até a implementação do provedor concreto ser adicionada                                                                                    |
| Integrar um provedor pago desde já                                                                        | E-mail real funcionando desde o início                                                                                                                 | Exige decisão de produto (qual provedor, orçamento) e credencial que não temos nesta fase; violaria a regra de nunca supor decisões de produto                                  |
| Usar um servidor SMTP de desenvolvimento (ex.: capturador local)                                          | Também não gera custo                                                                                                                                  | Adiciona um serviço a mais no `docker-compose.yml` sem necessidade real neste momento — logar a mensagem é suficiente para os testes automatizados e para inspeção manual local |

## Decisão

Criar uma interface `EmailProvider` em `lib/email`, no mesmo padrão do
`AiContentProvider` (ADR-0004):

```typescript
interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
```

- Implementação `ConsoleEmailProvider` (padrão em desenvolvimento e
  testes): registra a mensagem via `logger` estruturado
  (`lib/observability/logger.ts`) em vez de enviar de verdade — permite
  que testes de integração/E2E capturem o link de redefinição de senha
  sem depender de rede externa nem de credenciais.
- Seleção do provedor via variável de ambiente (`EMAIL_PROVIDER`,
  já prevista em formato similar ao `AI_PROVIDER` — a adicionar em
  `.env.example`), nunca hardcoded.
- Nenhum provedor pago é integrado nesta fase. **Decisão pendente:**
  qual provedor real usar em produção (Resend, SES, Postmark, etc.) —
  cabe ao proprietário do produto, quando a operação em produção for
  planejada.

## Consequências

- O fluxo de recuperação de senha é 100% testável (unitário, integração
  e E2E) sem depender de infraestrutura externa.
- Antes de qualquer operação em produção, um adaptador real de e-mail
  precisa ser implementado e configurado — item explícito do checklist
  de produção (Fase 10).

## Referências

- `docs/architecture/decisions/0004-abstracao-provedor-ia.md` (mesmo
  padrão de abstração de provedor externo)

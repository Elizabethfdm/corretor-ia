# Política de Segurança — Corretor IA

> Status: documento inicial produzido na Fase 0 (Descoberta e Planejamento).
> Será expandido e validado tecnicamente a cada fase, especialmente na
> Fase 10 (Hardening). Ver detalhamento completo em
> [`docs/security/threat-model.md`](docs/security/threat-model.md).

## 1. Escopo

Este documento descreve como vulnerabilidades devem ser reportadas e quais
práticas de segurança são obrigatórias durante todo o desenvolvimento do
Corretor IA.

## 2. Reporte de vulnerabilidades

Enquanto o projeto estiver em desenvolvimento interno (pré-produção), não
publique vulnerabilidades em issues públicas. Reporte diretamente ao
responsável técnico do projeto com:

- descrição da vulnerabilidade;
- passos para reprodução;
- impacto potencial;
- sugestão de correção, se houver.

Um canal de reporte externo (e-mail dedicado / formulário) será definido
antes da abertura comercial da plataforma.

## 3. Princípios obrigatórios (válidos desde a Fase 1)

- Autenticação e autorização sempre validadas no servidor, nunca apenas no
  cliente.
- Isolamento de dados por corretor em toda consulta, alteração e exclusão
  (ver RN-001 em `docs/business-rules/business-rules.md`).
- Proteção contra IDOR, CSRF, XSS e SQL Injection (via ORM parametrizado).
- Rate limiting em rotas de autenticação e endpoints sensíveis.
- Upload de arquivos validado por tipo MIME real, tamanho máximo e nome
  gerado de forma aleatória; nunca aceitar arquivos executáveis.
- Segredos apenas em variáveis de ambiente no servidor — nunca no
  repositório, no cliente ou em logs.
- Cookies de sessão `HttpOnly`, `Secure` em produção e `SameSite`
  apropriado.
- Cabeçalhos de segurança (CSP quando viável, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, etc.).
- Logs estruturados sem senhas, tokens, chaves de API ou dados pessoais
  sensíveis.
- Mensagens de erro de autenticação genéricas (não revelar se o e-mail
  existe na base).
- Trilha de auditoria (`AuditLog`) para ações administrativas e sensíveis.
- Auditoria periódica de dependências (`npm audit` ou equivalente) no
  pipeline de CI.
- Backups e plano de restauração documentados antes da operação em
  produção.

## 4. Proibições absolutas

Nunca versionar no Git:

- chaves de provedores de IA;
- segredos de autenticação (`NEXTAUTH_SECRET` ou equivalente);
- credenciais de banco de dados;
- tokens de acesso a serviços de nuvem/armazenamento;
- dados reais de clientes ou corretores.

Use sempre `.env.example` como referência de variáveis, sem valores reais.

## 5. Classificação de severidade

Ver critérios completos em
[`docs/quality/definition-of-done.md`](docs/quality/definition-of-done.md)
e no Prompt Mestre do projeto. Resumo:

| Severidade | Exemplo                                               | Bloqueia entrega?                                   |
| ---------- | ----------------------------------------------------- | --------------------------------------------------- |
| Crítico    | vazamento de dados, acesso indevido, upload malicioso | Sim                                                 |
| Alto       | catálogo não abre, dados de outro corretor expostos   | Sim                                                 |
| Médio      | funcionalidade secundária falha                       | Corrigir antes da versão, salvo decisão documentada |
| Baixo      | ajuste visual/textual                                 | Pode ser documentado para depois                    |

## 6. LGPD

Ver `docs/security/threat-model.md` (seção de privacidade) e os documentos
legais em `docs/product/` (Termos de Uso, Política de Privacidade), que
deverão ser produzidos como modelos iniciais sujeitos a revisão jurídica
antes da operação comercial.

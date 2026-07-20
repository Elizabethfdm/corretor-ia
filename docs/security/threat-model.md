# Modelo de Ameaças — Corretor IA

## 1. Ativos a proteger

| Ativo                                                         | Por quê                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| Credenciais de conta (e-mail/senha)                           | Acesso indevido a todo o painel do corretor                    |
| Dados de imóveis (incluindo rascunhos e observações internas) | Informação comercial sensível do corretor                      |
| Endereço exato do imóvel                                      | Segurança física dos proprietários/inquilinos                  |
| Mídia (fotos) de imóveis                                      | Propriedade do corretor; uso indevido por terceiros            |
| Dados de perfil do corretor (CRECI, WhatsApp, contatos)       | Identidade profissional; alvo de spam/abuso se vazado          |
| Relatórios de acesso                                          | Informação estratégica do corretor sobre seus imóveis          |
| Chaves de API (IA, storage)                                   | Uso indevido gera custo financeiro e possível abuso do serviço |
| Trilha de auditoria                                           | Necessária para investigação de incidentes                     |

## 2. Atores e superfícies de ataque

- **Visitante anônimo** no catálogo público — superfície: rotas
  públicas, endpoints de busca/filtro, formulário de contato indireto
  (link do WhatsApp).
- **Corretor autenticado malicioso ou comprometido** — superfície: todas
  as rotas do painel, tentando acessar dados de outro corretor (IDOR).
- **Atacante externo genérico** — superfície: formulário de login
  (força bruta), upload de arquivos, endpoints de API.
- **Administrador comprometido** — superfície: rotas administrativas.

## 3. Ameaças principais e mitigação (mapeadas a regras de negócio)

| Ameaça                                                              | Mitigação                                                                                                         | Regra relacionada |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------- |
| IDOR — acessar/editar imóvel de outro corretor trocando o ID na URL | Validação de posse no servidor em toda operação, nunca confiar em ID do cliente                                   | RN-026            |
| Exposição de dados internos via API pública                         | Serializadores de resposta pública nunca incluem `internalNotes`, `internalTitle`, IDs de storage                 | RN-041, RN-049    |
| Exposição de endereço exato do imóvel                               | Campo de visibilidade explícito (`visibilityType`), padrão oculto                                                 | RN-039, RN-103    |
| Força bruta de login                                                | Rate limiting + mensagens de erro genéricas                                                                       | RN-007, RN-008    |
| Enumeração de e-mails cadastrados                                   | Resposta idêntica em recuperação de senha, exista ou não a conta                                                  | RN-014            |
| Upload de arquivo malicioso disfarçado de imagem                    | Validação de tipo MIME real (não apenas extensão), rejeição de executáveis, nome de arquivo gerado aleatoriamente | RN-035, RN-036    |
| XSS via campos de texto livre (descrição, biografia)                | Sanitização/escape consistente na renderização; nunca `dangerouslySetInnerHTML` sem sanitização                   | RNF-030           |
| SQL Injection                                                       | Uso exclusivo de ORM parametrizado (Prisma), nunca SQL concatenado                                                | RNF-030           |
| CSRF em ações de estado (publicar, excluir)                         | Proteção nativa do framework de autenticação/formulários + verificação de origem                                  | RNF-030           |
| Vazamento de segredo (chave de IA, credencial de banco) via commit  | `.gitignore` cobrindo `.env*`; `.env.example` sem valores; revisão antes de commit                                | RN-074, RNF-033   |
| Abuso do limite de geração de IA (custo financeiro)                 | Limite por plano registrado e validado no servidor antes de cada geração                                          | RN-069, RN-070    |
| Sessão sequestrada (cookie roubado)                                 | Cookie `HttpOnly`, `Secure`, `SameSite`; expiração adequada; possibilidade de revogação                           | RN-012, RNF-035   |
| Conta bloqueada continuando a acessar recursos já autenticados      | Verificação de status em toda requisição autenticada, não apenas no login                                         | RN-006, RN-092    |
| Registro de auditoria adulterado ou ausente                         | `AuditLog` append-only, sem endpoint de edição/exclusão exposto                                                   | RN-094            |
| Dados pessoais de visitantes coletados sem necessidade              | Eventos de analytics restritos a dados agregados/hash, nunca PII direta                                           | RN-087, RN-100    |

## 4. Privacidade e LGPD

Princípios aplicados desde o MVP (detalhamento das regras RN-096 a
RN-103 em `docs/business-rules/business-rules.md`):

- Coleta mínima de dados, com finalidade clara e documentada por
  funcionalidade.
- Consentimento (Termos de Uso, Política de Privacidade) registrado com
  data e hora.
- Solicitação de exclusão de conta suportada, com política de retenção a
  documentar antes da operação comercial.
- Nenhuma conversa do WhatsApp é armazenada pela aplicação.
- Nenhum dado financeiro do cliente final (comprador/locatário) é
  coletado no MVP.
- Endereço completo do imóvel nunca exposto publicamente por padrão.

### Documentos legais a produzir (modelos iniciais)

- Termos de Uso.
- Política de Privacidade.
- Política de Cookies (se aplicável, a confirmar conforme mecanismos de
  analytics escolhidos).
- Aviso sobre conteúdo gerado por IA.

Todos esses documentos devem ser identificados como **modelos iniciais
que exigem revisão jurídica antes da operação comercial** — não serão
tratados como peças jurídicas finais nesta fase.

## 5. Rotina de segurança contínua

- Auditoria de dependências no pipeline de CI (Fase 1 em diante).
- Revisão de segurança dedicada na Fase 10 (Hardening), cobrindo a lista
  de testes de segurança em `docs/quality/test-strategy.md`.
- Nenhum erro crítico ou alto de segurança pode permanecer aberto em uma
  entrega (ver `docs/quality/definition-of-done.md`).

## 6. Backup e recuperação (a detalhar operacionalmente na Fase 1/10)

- Backups periódicos do banco de dados.
- Plano de restauração testado antes da operação em produção.
- Política de retenção alinhada à RN-028 (recuperação de imóvel excluído)
  e à LGPD (RN-099).

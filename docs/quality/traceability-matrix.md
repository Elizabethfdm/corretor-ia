# Matriz de Rastreabilidade — Corretor IA

> Atualizada ao final de cada fase. Nesta Fase 0, todos os itens estão
> como "Pendente" pois nenhum código ou teste foi implementado ainda. As
> colunas de teste recebem o identificador do teste quando ele for
> criado (convenção: `UNIT-<módulo>-NNN`, `INT-<módulo>-NNN`,
> `E2E-<módulo>-NNN`).

| Requisito (RF)                                | Regra (RN)              | Critério de aceite (resumo)                                             | Teste unitário     | Teste integração           | Teste E2E         | Status   | Evidência |
| --------------------------------------------- | ----------------------- | ----------------------------------------------------------------------- | ------------------ | -------------------------- | ----------------- | -------- | --------- |
| RF-001 Criar conta                            | RN-001 a RN-005, RN-011 | Conta criada com dados válidos e aceite dos termos                      | UNIT-AUTH-001      | INT-AUTH-001               | E2E-AUTH-001      | Pendente | —         |
| RF-002 Login                                  | RN-007, RN-008          | Login com credenciais válidas concede acesso ao painel                  | UNIT-AUTH-002      | INT-AUTH-002               | E2E-AUTH-002      | Pendente | —         |
| RF-004/RF-005 Recuperar/redefinir senha       | RN-014                  | Fluxo não revela existência do e-mail; nova senha funciona              | UNIT-AUTH-003      | INT-AUTH-003               | E2E-AUTH-020      | Pendente | —         |
| RF-007/RF-008 Proteção de rotas               | RN-010, RN-013          | Usuário não autenticado é redirecionado; conta não acessa dado de outra | —                  | INT-AUTH-004               | E2E-AUTH-019      | Pendente | —         |
| RF-012/RF-013 Publicação de perfil            | RN-016 a RN-020         | Catálogo só ativa com CRECI/WhatsApp/cidade/slug válidos                | UNIT-BROKER-001    | INT-BROKER-001             | E2E-BROKER-003    | Pendente | —         |
| RF-018/RF-029 Cadastro e publicação de imóvel | RN-033, RN-043          | Imóvel só publica com todos os critérios de RN-043 atendidos            | UNIT-PROPERTY-001  | INT-PROPERTY-001           | E2E-PROPERTY-008  | Pendente | —         |
| RF-019 Salvar rascunho                        | RN-044                  | Progresso salvo entre etapas sem exigir campos de publicação            | UNIT-PROPERTY-002  | INT-PROPERTY-002           | E2E-PROPERTY-005  | Pendente | —         |
| RF-026 Foto obrigatória                       | RN-033                  | Publicação bloqueada sem ao menos 1 foto                                | UNIT-PROPERTY-003  | INT-PROPERTY-003           | E2E-PROPERTY-007  | Pendente | —         |
| RF-031 Despublicar imóvel                     | RN-032                  | Imóvel despublicado não aparece em catálogo/semelhantes/busca           | UNIT-PROPERTY-004  | INT-PROPERTY-004           | E2E-PROPERTY-018  | Pendente | —         |
| RF-034/RF-035 Excluir/restaurar imóvel        | RN-028                  | Exclusão lógica reversível dentro do período configurável               | UNIT-PROPERTY-005  | INT-PROPERTY-005           | —                 | Pendente | —         |
| RF-036 Ocultar endereço                       | RN-039, RN-040          | Endereço completo nunca exposto publicamente quando oculto              | UNIT-PROPERTY-006  | INT-PROPERTY-006           | E2E-PROPERTY-013  | Pendente | —         |
| RF-037/RF-043 Catálogo público                | RN-046, RN-048          | Catálogo acessível sem login, somente imóveis publicáveis               | —                  | INT-CATALOG-001            | E2E-CATALOG-009   | Pendente | —         |
| RF-039/RF-041 Filtros na URL                  | RN-047                  | Filtro aplicado reflete na URL e é compartilhável                       | UNIT-CATALOG-001   | —                          | E2E-CATALOG-010   | Pendente | —         |
| RF-046 Botão WhatsApp                         | RN-051, RN-055, RN-056  | Mensagem correta, sem campos vazios nem dado oculto                     | UNIT-CATALOG-002   | —                          | E2E-PROPERTY-011  | Pendente | —         |
| RF-049 Isolamento entre corretores            | RN-026                  | Corretor B não acessa/edita imóvel de corretor A                        | —                  | INT-PROPERTY-007           | E2E-PROPERTY-019  | Pendente | —         |
| RF-054/RF-061 Geração de anúncio              | RN-061 a RN-068         | IA não inventa dados; conteúdo editável; sinalizado como gerado por IA  | UNIT-AI-001        | INT-AI-001 (provedor fake) | E2E-AI-012        | Pendente | —         |
| RF-059 Limite de geração                      | RN-070                  | Bloqueio de nova geração ao atingir limite do plano                     | UNIT-AI-002        | INT-AI-002                 | —                 | Pendente | —         |
| RF-062/RF-065 Criação de arte                 | RN-076 a RN-080         | Arte exportada respeita identidade visual e não corta texto             | UNIT-ARTWORK-001   | —                          | E2E-ARTWORK-013   | Pendente | —         |
| RF-067/RF-070 Relatório de acessos            | RN-082, RN-089          | Indicadores isolados por corretor, eventos corretos registrados         | UNIT-ANALYTICS-001 | INT-ANALYTICS-001          | E2E-ANALYTICS-014 | Pendente | —         |
| RF-072/RF-073 Administração                   | RN-091, RN-092          | Bloqueio de conta nega acesso imediatamente                             | —                  | INT-ADMIN-001              | —                 | Pendente | —         |

## Como manter esta matriz

- Ao planejar uma fase, adicionar as linhas correspondentes antes da
  implementação (parte da Definition of Ready).
- Ao implementar os testes, preencher os identificadores reais.
- Ao concluir a fase, atualizar o status (`Pendente` → `Implementado` →
  `Verificado`) e o link de evidência em `docs/evidence/`.
- Esta matriz é resumida — nem toda regra RN-XXX ou requisito RF-XXX tem
  uma linha dedicada aqui; regras auxiliares/transversais (ex.: RN-055
  reaproveitada por vários fluxos) aparecem associadas ao requisito mais
  representativo.

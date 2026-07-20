# Mapa de Funcionalidades — Corretor IA

Mapa organizado por módulo. Cada módulo corresponde a uma fase de
desenvolvimento (ver [`docs/planning/phases-plan.md`](../planning/phases-plan.md))
e a um conjunto de requisitos funcionais numerados em
[`docs/requirements/functional-requirements.md`](../requirements/functional-requirements.md).

| Módulo                | Funcionalidades principais                                                                                                                   | Perfis envolvidos       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1. Autenticação       | Criar conta, login, logout, recuperar senha, redefinir senha, aceite de termos, proteção de rotas                                            | Corretor, Administrador |
| 2. Perfil do corretor | Cadastrar/editar perfil profissional, identidade visual (cores/logo), slug do catálogo, ativar/desativar catálogo                            | Corretor                |
| 3. Imóveis            | Cadastro em etapas, edição, rascunho, publicação/despublicação, duplicação, mudança de status, exclusão lógica, restauração, gestão de fotos | Corretor                |
| 4. Catálogo digital   | Página pública do corretor, busca, filtros, ordenação, paginação/carregamento progressivo                                                    | Visitante               |
| 5. Página do imóvel   | Galeria, informações, endereço com privacidade, contato, imóveis semelhantes                                                                 | Visitante               |
| 6. Compartilhamento   | Compartilhar imóvel/catálogo/resultado filtrado/arte pelo WhatsApp, copiar link, copiar mensagem                                             | Corretor, Visitante     |
| 7. IA — Anúncios      | Selecionar imóvel/canal/tom/objetivo, gerar anúncio, editar, histórico, limite de uso                                                        | Corretor                |
| 8. Artes              | Selecionar modelo/foto, personalizar texto, pré-visualizar, exportar/baixar                                                                  | Corretor                |
| 9. Relatórios         | Indicadores de acesso, cliques, compartilhamentos, imóvel mais acessado, filtros por período                                                 | Corretor                |
| 10. Administração     | Listar corretores, bloquear/desbloquear conta, auditoria básica, indicadores gerais                                                          | Administrador           |

## Funcionalidades explicitamente fora do MVP

Ver justificativa completa em [`mvp-scope.md`](mvp-scope.md).

- CRM completo.
- Chatbot automático.
- Publicação automática em redes sociais.
- Integração direta com Facebook Marketplace.
- Integração com portais imobiliários.
- Geração automática de vídeos.
- Cobrança recorrente real (pagamentos).
- Aplicativo nativo Android ou iOS.
- Automação de mensagens pelo WhatsApp Business.

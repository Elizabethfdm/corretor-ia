# Escopo do MVP — Corretor IA

## 1. Dentro do escopo (primeira versão)

1. Autenticação de corretores (conta própria, sem login social nesta
   versão, salvo decisão em contrário registrada em ADR).
2. Perfil profissional público com catálogo digital em URL própria
   (`/catalogo/{slug}`).
3. Cadastro e administração de imóveis (etapas, rascunho, publicação,
   status, duplicação, exclusão lógica).
4. Catálogo digital público com busca, filtros e ordenação.
5. Página individual do imóvel com galeria, dados públicos e contato via
   WhatsApp.
6. Compartilhamento de imóvel, catálogo e resultado filtrado pelo
   WhatsApp.
7. Geração de anúncios com IA (camada abstrata de provedor).
8. Criação de artes a partir de modelos predefinidos (sem editor gráfico
   livre).
9. Relatório básico de acessos e contatos, isolado por corretor.
10. Painel administrativo mínimo (listar corretores, bloquear/desbloquear,
    auditoria básica, indicadores gerais).
11. Responsividade completa (celular, tablet, desktop) — mobile-first.
12. Segurança e isolamento de dados por corretor desde o primeiro módulo.

## 2. Fora do escopo (documentado como possibilidade futura)

| Recurso                                                     | Motivo de exclusão do MVP                                                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| CRM completo                                                | Aumenta complexidade sem validar a hipótese principal (divulgação rápida); pode ser avaliado após validação do MVP            |
| Chatbot automático                                          | Requer integração e treinamento adicionais; não é bloqueador para a proposta de valor central                                 |
| Publicação automática em redes sociais                      | Depende de integrações com APIs de terceiros sujeitas a aprovação e mudanças frequentes de política                           |
| Integração direta com Facebook Marketplace                  | Mesma razão acima; alto custo de manutenção para validar hipótese inicial                                                     |
| Integração com portais imobiliários                         | Cada portal exige contrato/format específico (XML, feed); escopo grande demais para o MVP                                     |
| Geração automática de vídeos                                | Custo computacional e de produto elevado; sem evidência de que é bloqueador de adoção inicial                                 |
| Cobrança recorrente real                                    | MVP tem foco em validar valor de uso antes de validar monetização automatizada; cobrança pode ser manual/comercial nesta fase |
| Aplicativo nativo Android/iOS                               | Web responsiva mobile-first atende a prioridade "experiência no celular" com custo de desenvolvimento e manutenção menor      |
| Automação de mensagens pelo WhatsApp Business (API oficial) | Exige aprovação/custo de API de negócios; MVP usa link direto (`wa.me`) suficiente para o fluxo manual do corretor            |

Esses itens devem ser reavaliados após a validação do MVP, com base em
evidência de uso real e feedback qualitativo dos corretores.

## 3. Critérios gerais de aceite do MVP

O MVP estará apto para validação com usuários reais quando todos os itens
abaixo forem verdadeiros:

1. Um corretor consegue criar sua conta.
2. Consegue completar seu perfil.
3. Consegue acessar pelo celular e pelo tablet sem problemas de layout.
4. Consegue cadastrar um imóvel.
5. Consegue adicionar e organizar fotos.
6. Consegue salvar rascunho.
7. Consegue publicar o imóvel.
8. O imóvel aparece no catálogo correto (e somente nele).
9. Outro corretor não consegue acessá-lo no painel.
10. Um visitante consegue abrir o catálogo sem autenticação.
11. Consegue pesquisar e filtrar imóveis.
12. Consegue abrir a página de um imóvel.
13. O endereço privado não é exibido quando configurado como oculto.
14. Consegue abrir o WhatsApp com a mensagem já preparada.
15. O corretor consegue gerar um anúncio com IA.
16. A IA não inventa características em testes controlados.
17. O corretor consegue criar uma arte.
18. Consegue consultar acessos e cliques do seu catálogo.
19. O sistema funciona nas resoluções mínimas definidas (ver
    `docs/requirements/non-functional-requirements.md`).
20. O pipeline de CI está verde.
21. Não existem bugs críticos ou altos abertos.
22. A documentação está atualizada.
23. O build de produção passa.
24. As principais jornadas E2E passam.
25. A revisão de segurança não encontra falhas críticas.

Esta lista é a referência oficial de "pronto para validação do MVP" e deve
ser conferida na Fase 10 (Hardening).

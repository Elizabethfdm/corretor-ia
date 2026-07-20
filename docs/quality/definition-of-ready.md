# Definition of Ready (DoR) — Corretor IA

Uma história de usuário ou tarefa técnica só pode entrar em
implementação quando todos os itens abaixo estiverem atendidos.

1. Descrição da funcionalidade e benefício ao usuário está clara.
2. Regras de negócio envolvidas estão identificadas e numeradas em
   `docs/business-rules/business-rules.md` (ou uma nova regra foi
   proposta e documentada).
3. Critérios de aceite estão escritos em formato Given/When/Then.
4. Cenários negativos relevantes foram identificados (não apenas o
   caminho feliz).
5. Dependências de outras funcionalidades/fases estão identificadas.
6. Impacto em funcionalidades já existentes foi avaliado.
7. Campos e entidades envolvidos já existem no modelo de dados
   (`docs/architecture/data-model.md`) ou a alteração necessária está
   explicitada.
8. Requisitos não funcionais aplicáveis (acessibilidade, performance,
   segurança, responsividade) foram identificados.
9. Tipos de teste necessários (unitário, integração, E2E, acessibilidade,
   segurança) foram definidos.
10. Não há decisão de produto pendente e não resolvida que bloqueie a
    implementação (decisões técnicas comuns não bloqueiam — são
    resolvidas pela equipe adotando a opção mais segura e simples).

Itens que não atendem à DoR devem retornar ao planejamento antes de
iniciar a implementação.

# ADR-0002 — Estratégia de autenticação

- **Status:** Aceita (nível de estratégia); escolha da biblioteca exata a
  confirmar no início da Fase 1 consultando documentação vigente
- **Data:** 2026-07-19
- **Decisores:** Arquitetura / Segurança

## Contexto

O sistema precisa de cadastro, login, logout, recuperação e redefinição
de senha, verificação de e-mail (quando suportada), sessão segura e
proteção de rotas privadas (RF-001 a RF-010). Implementar primitivas
criptográficas de autenticação do zero é desaconselhado por risco de
segurança.

## Alternativas consideradas

| Alternativa                                                                                                     | Prós                                                                                                    | Contras                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Biblioteca de autenticação madura para Next.js (ex.: solução de sessão baseada em cookies com adaptador Prisma) | Implementação testada em produção por terceiros, suporte a hashing seguro, gestão de sessão e providers | Exige avaliar a documentação vigente no momento da Fase 1 para confirmar compatibilidade com a versão do Next.js escolhida |
| Implementação própria de autenticação (hash manual + JWT manual)                                                | Controle total                                                                                          | Alto risco de erro em detalhes críticos de segurança (expiração, rotação, storage de sessão); não recomendado              |
| Serviço de autenticação totalmente terceirizado (ex.: Auth-as-a-Service)                                        | Menor esforço de manutenção                                                                             | Custo recorrente, dependência externa forte, possível fricção com requisito de baixo custo inicial (RNF-049)               |

## Decisão

Utilizar uma **biblioteca de autenticação madura e mantida, integrada ao
Next.js**, com sessão baseada em cookie seguro (`HttpOnly`, `Secure` em
produção, `SameSite` apropriado) e senha em hash forte (bcrypt/argon2 ou
equivalente já suportado pela biblioteca escolhida). A escolha da
biblioteca específica e da versão exata será confirmada no início da
Fase 1, verificando na documentação oficial vigente:

1. se está ativamente mantida;
2. compatibilidade com a versão do Next.js/App Router em uso;
3. suporte nativo a adaptador Prisma/PostgreSQL;
4. suporte a fluxo de recuperação/redefinição de senha sem enumeração de
   e-mail (RN-014).

Login social (Google, Facebook etc.) **não** está no escopo do MVP —
apenas e-mail/senha, conforme `docs/product/mvp-scope.md`. Caso avaliado
no futuro, será tratado em ADR específico.

## Consequências

- Rate limiting de tentativas de login (RN-008) precisa ser implementado
  de forma complementar à biblioteca escolhida, caso ela não ofereça essa
  proteção nativamente.
- Entidades de suporte (tokens de sessão/redefinição) serão modeladas na
  Fase 1 conforme exigido pela biblioteca escolhida, sem alterar as
  entidades de domínio já descritas em `docs/architecture/data-model.md`.

## Referências

_A preencher na Fase 1 com links para a documentação oficial da versão
efetivamente adotada._

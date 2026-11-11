# MarketCore Web — Design da v1

Data: 2026-11-11 · Status: aprovado em conversa, aguardando revisão escrita

## Objetivo

Frontend da loja MarketCore, consumindo a API Spring Boot (`MarketCore-Spring`) rodando em
`http://localhost:8080`. Projeto de portfólio e estudo: o código deve ser simples de ler e cada
decisão deve estar explicada.

**Pronto quando:** repositório `michaelcostadevv/MarketCore-Web` (público) no GitHub, com CI verde
e a vitrine de produtos consumindo a API local. As demais telas da v1 vêm em PRs seguintes.

## Escopo da v1

| Tela | Rota | Acesso | Endpoint |
|---|---|---|---|
| Vitrine (busca + paginação) | `/` | público | `GET /produtos?nome=&page=&size=` |
| Detalhe do produto | `/produtos/:id` | público | `GET /produtos/{id}` |
| Login | `/login` | público | `POST /auth/login` → `GET /auth/me` |
| Cadastro | `/cadastro` | público | `POST /auth/register` |
| Carrinho | `/carrinho` | público (finalizar exige login) | — |
| Meus pedidos | `/pedidos` | autenticado | `GET /pedidos` |
| Detalhe do pedido (cancelar) | `/pedidos/:id` | autenticado | `GET /pedidos/{id}`, `PATCH /pedidos/{id}/status` |

Fora da v1: painel admin (CRUD de produtos/clientes), pagamento, deploy.

## Stack

- **Vite + React + TypeScript**: template `react-ts`.
- **React Router**: roteamento.
- **TanStack Query + `fetch`**: estado do servidor (cache, loading, erro, invalidação após mutações).
- **Tailwind CSS**: estilo, via plugin oficial do Vite.
- **Vitest + Testing Library**: testes.
- **ESLint** (config do template) + `tsc` para typecheck.

## Arquitetura

```
src/
  api/         client.ts, types.ts, produtos.ts, auth.ts, pedidos.ts
  auth/        AuthContext (token + usuário logado)
  carrinho/    CarrinhoContext (itens, persistido no localStorage)
  components/  Header, ProdutoCard, Paginacao, MensagemErro, RotaProtegida
  pages/       uma por rota
  lib/         formatarPreco, formatarData
```

Regra: páginas não chamam `fetch`. Elas usam hooks (`useProdutos`, `useMeusPedidos`...), que
usam as funções de `api/`, que usam `client.ts`.

### Cliente HTTP (`api/client.ts`)

- Base: `import.meta.env.VITE_API_URL`, padrão `http://localhost:8080`.
- Envia `Authorization: Bearer <token>` quando houver token.
- Resposta não-2xx: lê o corpo no formato de erro da API
  (`{ timestamp, status, erro, mensagem, caminho, detalhes[] }`) e lança `ApiError`
  com `status`, `mensagem` e `detalhes`. Sem corpo JSON (ex.: API fora do ar), usa uma
  mensagem genérica ("Não foi possível conectar à API").
- 401 em rota autenticada: remove o token e o usuário volta para `/login`.

### Tipos (`api/types.ts`)

Espelham os DTOs do backend. Paginação no formato `VIA_DTO` do Spring Data:
`Pagina<T> = { content: T[]; page: { size; number; totalElements; totalPages } }`.
`BigDecimal` chega como `number` no JSON. É usado só para exibição; o servidor é a fonte da verdade.

### Autenticação

- Token JWT no `localStorage` (sobrevive ao F5). Risco conhecido: XSS poderia lê-lo. A
  alternativa (cookie `httpOnly`) exige mudança no backend e fica registrada no README como melhoria.
- Após login: `GET /auth/me` → `{ id, email, role, admin, clienteId, nome }`, exibido no Header.
- `RotaProtegida` redireciona para `/login` se não houver usuário.

### Carrinho

Somente no front (`localStorage`). Total exibido é estimativa. Finalizar envia
`POST /pedidos { itens: [{ produtoId, quantidade }] }`; erros 422 (estoque) aparecem na tela.
Sucesso: limpa o carrinho, invalida a query de pedidos e da vitrine (estoque mudou) e vai para
o detalhe do pedido criado.

### Erros e estados

Toda tela com dados mostra três estados: carregando, erro (`MensagemErro` com a `mensagem` da
API e os `detalhes`, se houver) e vazio (ex.: "Nenhum produto encontrado").

## Testes

- `client.ts`: converte o JSON de erro da API em `ApiError`; trata falha de rede.
- Lógica do carrinho: adicionar, alterar quantidade, remover, total.
- Vitrine: renderiza produtos a partir de um `fetch` simulado.

## CI (GitHub Actions)

Em push na `main` e em PRs: Node 24, `npm ci` → `npm run lint` → `npm run typecheck` →
`npm test` → `npm run build`.

## Entrega (um PR por tema)

1. `main`: commit inicial com o esqueleto do Vite + esta spec.
2. `chore/ci-e-readme`: workflow de CI + README (rodar o front junto com a API).
3. `feat/vitrine`: Tailwind, router, Query, cliente da API, vitrine e detalhe do produto.
4. `feat/autenticacao`: login, cadastro, `/auth/me`, logout. *(após merge do 3)*
5. `feat/carrinho-e-pedidos`: carrinho, finalizar, meus pedidos, cancelar. *(após merge do 4)*

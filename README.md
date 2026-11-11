# 🛒 MarketCore Web

[![CI](https://github.com/michaelcostadevv/MarketCore-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/michaelcostadevv/MarketCore-Web/actions/workflows/ci.yml)

Frontend da loja **MarketCore**, construído em React, consumindo a
[MarketCore API](https://github.com/michaelcostadevv/MarketCore-Spring) (Spring Boot + JWT).

## 🚀 Tecnologias

* **React 19 + TypeScript**, empacotado com **Vite**
* **React Router**: navegação entre páginas
* **TanStack Query**: busca e cache dos dados da API
* **Tailwind CSS**: estilo
* **Vitest + Testing Library**: testes
* **oxlint**: lint

## ⚙️ Funcionalidades (v1)

* Vitrine pública com busca e paginação, e detalhe do produto
* Login e cadastro com JWT; o cabeçalho mostra quem está logado (`/auth/me`)
* Carrinho e finalização de pedido
* "Meus pedidos", com detalhe e cancelamento

O design e o plano estão em [`docs/specs`](docs/specs) e [`docs/plans`](docs/plans).

## 🛠️ Como rodar (front + API)

### Pré-requisitos

* Node.js 24+
* A **MarketCore API** rodando em `http://localhost:8080`

### 1. Suba a API

No repositório [MarketCore-Spring](https://github.com/michaelcostadevv/MarketCore-Spring):

```bash
cp .env.example .env
docker compose up --build
```

Confira em http://localhost:8080/swagger-ui.html.

### 2. Suba o front

Neste repositório:

```bash
cp .env.example .env
npm install
npm run dev
```

Abra **http://localhost:5173**.

> **Por que a porta 5173?** A API só aceita chamadas do navegador vindas das origens liberadas
> no CORS (`CORS_ALLOWED_ORIGINS`, padrão `http://localhost:5173`). O `vite.config.ts` fixa essa
> porta com `strictPort`: se ela estiver ocupada, o Vite falha em vez de subir em outra porta e
> causar erros de CORS difíceis de entender.

### Variáveis de ambiente

| Variável | Padrão | Para quê |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Endereço da API |

Só variáveis com prefixo `VITE_` chegam ao código do navegador. Por isso, **nunca** coloque
segredos nelas: tudo que vai para o front é público.

## 📜 Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run lint` | Procura problemas no código (oxlint) |
| `npm run typecheck` | Checa os tipos do TypeScript |
| `npm test` | Roda os testes (Vitest) |
| `npm run build` | Gera a versão de produção em `dist/` |

O CI do GitHub Actions roda `lint`, `typecheck`, `test` e `build` em todo push e pull request.

## 🔐 Sobre o token JWT

O token fica no `localStorage` para o login sobreviver a um F5. A desvantagem: se o site
tivesse uma falha de XSS, um script malicioso conseguiria lê-lo. A alternativa mais segura é
um cookie `httpOnly`, que o JavaScript não lê, mas isso exige mudanças na API. Fica como
melhoria futura.

## 🪟 Nota para Windows com Smart App Control

O projeto usa **Vite 7**. O Vite 8 usa o Rolldown, cujo binário nativo é bloqueado pelo
Smart App Control do Windows 11 ("An Application Control policy has blocked this file").

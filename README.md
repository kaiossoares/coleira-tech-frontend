# Coleira Tech — App (frontend)

App web mobile-first para acompanhar coleiras GPS de pets. Implementa as 10 telas do design
"Coleira Tech — App": login, criar conta, início (vazio e com coleiras), cadastrar coleira,
cadastrar animal, detalhe do animal, e editar animal, coleira e área segura.

React 19 + TypeScript + Vite + React Router. Sem biblioteca de UI: os tokens do design estão em
`src/styles/global.css`.

## Rodando

```bash
npm install
cp .env.example .env   # já vem com VITE_API_MODE=mock
npm run dev            # http://localhost:5173
```

No modo **mock** o app funciona sem backend (dados no `localStorage`):

- `demo@coleira.tech` / `12345678`: conta com 3 animais (rastreando, fora da área, sem sinal)
- Criar conta nova: começa vazia e passa pelo fluxo de cadastro de coleira e animal

Para limpar os dados do mock, apague a chave `coleira.mockdb.v1` do localStorage.

## Conectando ao backend

1. Implemente os endpoints de [`docs/API.md`](docs/API.md).
2. No `.env`:
   ```
   VITE_API_MODE=http
   VITE_API_BASE_URL=/api
   VITE_PROXY_TARGET=http://localhost:3000   # seu servidor em dev
   ```
3. Em produção, sirva o `dist/` e aponte `VITE_API_BASE_URL` para a URL da API
   (ou exponha a API em `/api` no mesmo domínio).

Nenhuma tela chama `fetch` direto: tudo passa pela interface `ApiClient` (`src/api/client.ts`),
com duas implementações, `httpApi` e `mockApi`.

## Estrutura

```
src/
  api/          types.ts (contrato), client.ts (interface), http.ts (REST), mock.ts, token.ts
  auth/         AuthContext (sessão), RequireAuth/GuestOnly (rotas)
  components/   Icon, Field, Segmented, Toggle, TopBar, Status, MapView, PetForm, QrScanner, States
  hooks/        useResource (carregar + polling), useSubmit (estado de formulários)
  pages/        uma por tela
  utils/        format (máscaras, rótulos), geo (distâncias), status (regra), onboarding
docs/API.md     contrato para o backend
```

## Rotas

| Rota | Tela |
|---|---|
| `/login`, `/cadastro` | 1, 2 |
| `/` | 3 (sem coleiras) ou 6 (com coleiras) |
| `/coleiras/nova` → `/animais/novo` | 4 → 5 (passos 1 e 2) |
| `/animais/:id` | 7 |
| `/animais/:id/editar`, `/coleira`, `/area` | 8, 9, 10 |
| `/animais/:id/trocar-coleira` | 4 no modo "trocar coleira" |

## Sobre o mapa

`MapView` desenha o mapa ilustrado do design. O fundo (ruas, parque, água) é decorativo,
mas o círculo da área segura e o marcador do animal são posicionados em escala a partir de
`safeArea.center`, `radiusM` e `lastLocation`. Para usar um mapa real (Leaflet/OSM, Google Maps,
Mapbox), troque a implementação de `src/components/MapView.tsx` mantendo as mesmas props.
A busca por endereço em "Editar área segura" envia o texto como `address` para o backend geocodificar.

## Scripts

- `npm run dev`: servidor de desenvolvimento
- `npm run build`: checagem de tipos e build de produção em `dist/`
- `npm run typecheck`: só a checagem de tipos

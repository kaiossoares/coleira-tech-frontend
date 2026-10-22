# Coleira Tech — App (frontend)

App web mobile-first para acompanhar coleiras GPS de pets. Implementa as 10 telas do design
"Coleira Tech — App": login, criar conta, início (vazio e com coleiras), cadastrar coleira,
cadastrar animal, detalhe do animal, e editar animal, coleira e área segura.

React 19 + TypeScript + Vite + React Router + Leaflet (mapas). Sem biblioteca de UI: os tokens do
design estão em `src/styles/global.css`.

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

`MapView` (`src/components/MapView.tsx`) é um mapa real com [Leaflet](https://leafletjs.com) +
[react-leaflet](https://react-leaflet.js.org), ambos open source, e tiles do OpenStreetMap.
Tudo vem das coordenadas: `safeArea.center` + `radiusM` desenham o círculo e a casa, e
`lastLocation` posiciona o animal.

- **Tempo real:** o mapa só depende das props. Quando `pet.position` muda (hoje pelo polling de
  30 s do `useResource`; no futuro por WebSocket/SSE), o marcador se move e a câmera acompanha.
  Se o usuário arrastar ou der zoom no mapa grande, a câmera para de seguir até ele tocar em
  "Centralizar" (`ref.recenter()`).
- **Interação:** só o mapa grande é interativo. Os mapas dos cartões e do formulário são estáticos.
  Em "Editar área segura", tocar no mapa ou arrastar a casa muda o centro, e arrastar a alça muda
  o raio (`onCenterChange`, `onRadiusChange`).
- **Tiles:** por padrão usa `tile.openstreetmap.org`, que serve para desenvolvimento, mas a
  [política de uso](https://operations.osmfoundation.org/policies/tiles/) não permite tráfego alto.
  Em produção, aponte `VITE_MAP_TILE_URL` (e `VITE_MAP_ATTRIBUTION`) para um servidor próprio
  ou para um provedor compatível com Leaflet.

A busca por endereço em "Editar área segura" envia o texto como `address` para o backend geocodificar.

## Scripts

- `npm run dev`: servidor de desenvolvimento
- `npm run build`: checagem de tipos e build de produção em `dist/`
- `npm run typecheck`: só a checagem de tipos

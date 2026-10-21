# Contrato da API — Coleira Tech

O front chama estes endpoints quando `VITE_API_MODE=http`. Os tipos exatos estão em
[`src/api/types.ts`](../src/api/types.ts); o cliente está em [`src/api/http.ts`](../src/api/http.ts).

## Convenções

- Base: `VITE_API_BASE_URL` (padrão `/api`). JSON em camelCase, datas em ISO 8601 (UTC).
- Autenticação: `Authorization: Bearer <token>` em todas as rotas, exceto `/auth/login`,
  `/auth/register` e `/auth/password-reset`.
- `204 No Content` para operações sem corpo de resposta.
- Erros: status HTTP adequado + corpo

  ```json
  { "message": "Texto exibido ao usuário", "code": "email_taken", "fields": { "email": "E-mail já cadastrado." } }
  ```

  `message` aparece no topo do formulário; `fields` aparece embaixo de cada campo.
  `401` faz o app descartar o token e voltar ao login.

## Autenticação

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `AuthSession` = `{ token, user }` |
| POST | `/auth/register` | `{ name, email, phone, password, acceptedTerms }` | `AuthSession` |
| GET | `/auth/me` | — | `User` |
| POST | `/auth/logout` | — | 204 |
| POST | `/auth/password-reset` | `{ email }` | 204 (sempre, mesmo se o e-mail não existir) |

`phone` chega mascarado `(11) 90000-0000`; normalize no servidor.

## Animais

O app trabalha com uma visão agregada por animal:

```ts
PetOverview = {
  pet: Pet,
  collar: Collar | null,
  safeArea: SafeArea | null,
  lastLocation: LocationFix | null,   // { lat, lng, recordedAt, address? }
  status: 'tracking' | 'outside' | 'no_signal',
  distanceFromCenterM: number | null,
}
```

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/pets` | — | `PetOverview[]` (tela inicial; o app consulta a cada 30 s) |
| GET | `/pets/:id` | — | `PetOverview` (detalhe; consulta a cada 30 s) |
| POST | `/pets` | `PetInput` | `Pet` |
| PATCH | `/pets/:id` | `PetUpdate` (parcial) | `Pet` |
| DELETE | `/pets/:id` | — | 204 (a coleira fica livre) |
| PUT | `/pets/:id/photo` | `multipart/form-data`, campo `photo` | `Pet` com `photoUrl` |
| PUT | `/pets/:id/safe-area` | `SafeAreaInput` (parcial) | `SafeArea` |
| PUT | `/pets/:id/collar` | `{ collarId }` | `Pet` (troca a coleira; a anterior é desvinculada) |

`PetInput` (POST /pets):

```json
{
  "name": "Thor", "species": "dog", "breed": "Golden Retriever",
  "color": "Caramelo", "colorHex": "#C98B4A", "sex": "male", "size": "L",
  "birthDate": "2022-03-10", "weightKg": 32, "notes": "Dócil…",
  "collarId": "c_123",
  "safeArea": { "label": "Casa", "radiusM": 100, "center": { "lat": -23.56, "lng": -46.65 }, "alertOnExit": true }
}
```

`safeArea.center` pode faltar se o usuário negar a localização do celular; nesse caso
o backend escolhe o centro (por exemplo, a primeira posição recebida da coleira).

Em `PUT /pets/:id/safe-area`, `address` pode chegar como texto digitado na busca:
o backend deve geocodificar e atualizar `center`.

### Regra de status (calculada pelo backend)

1. Sem posição, ou `signal = "none"`, ou última posição mais antiga que
   `max(3 × updateIntervalSec, 300 s)` → `no_signal`
2. Distância até `safeArea.center` maior que `safeArea.radiusM` → `outside`
3. Caso contrário → `tracking`

O mock implementa a mesma regra em [`src/utils/status.ts`](../src/utils/status.ts).

## Coleiras

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/collars` | `CollarInput` = `{ code, nickname?, updateIntervalSec, notifySignalLoss, notifyLowBattery }` | `Collar` |
| PATCH | `/collars/:id` | `CollarUpdate` (parcial, sem `code`) | `Collar` |
| DELETE | `/collars/:id` | — | 204 (desvincula do animal e da conta) |

- `code` no formato `CT-XXXX-XXXX` (QR code ou digitado).
- `updateIntervalSec` ∈ `30 | 60 | 300`. O backend repassa esse valor ao hardware.
- `POST /collars` deve responder `409` com `fields.code` se a coleira já pertence a outra
  conta ou já está em uso.

## Fluxos do app → chamadas

| Tela | Chamadas |
|---|---|
| 1 · Login | `POST /auth/login` |
| 2 · Criar conta | `POST /auth/register` |
| 3/6 · Início | `GET /pets` (lista vazia mostra o estado "Nenhuma coleira") |
| 4 · Cadastrar coleira | `POST /collars` |
| 5 · Cadastrar animal | `POST /pets` e, se houver foto, `PUT /pets/:id/photo` |
| 7 · Detalhe | `GET /pets/:id`; switch "Avisar quando sair" → `PUT /pets/:id/safe-area { alertOnExit }` |
| 8 · Editar animal | `PATCH /pets/:id`, `PUT /pets/:id/photo`, `DELETE /pets/:id` |
| 9 · Editar coleira | `PATCH /collars/:id`, `DELETE /collars/:id` |
| 9 → Trocar coleira | `POST /collars` e `PUT /pets/:id/collar` |
| 10 · Editar área | `PUT /pets/:id/safe-area { radiusM, center?, address? }` |

## Ainda não usados pelo front (sugestões para o backend)

- Push / SMS de alerta (saída da área, sinal perdido, bateria < 15%).
- `GET /pets/:id/history?from=&to=` para o botão "Ver histórico de trajeto" (hoje mostra "em breve").
- WebSocket/SSE para posição em tempo real no lugar do polling de 30 s.

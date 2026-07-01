# Wasabi React UI

Modern admin console for Wasabi A/B testing, replacing the frozen AngularJS UI in [`modules/ui/`](../ui/).

## Stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS 4 + shadcn/ui v4 (radix-nova)
- React Router v7, TanStack Query v5, TanStack Table
- React Hook Form + Zod, Recharts, date-fns, sonner

## Development

**Prerequisites:** Node 18+, running Wasabi backend on `:8080`.

```bash
cd modules/ui-react
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000 — Vite proxies `/api/v1` to the backend.

## Production build (separate static host)

```bash
npm run build
```

Deploy the `dist/` folder to your static host (S3, nginx, Netlify, etc.).

Set at build time:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Wasabi API origin, e.g. `https://wasabi.example.com` |
| `VITE_AUTHN_TYPE` | `basic` (default) or `sso` |
| `VITE_SSO_NO_AUTH_REDIRECT` | SSO login redirect URL |
| `VITE_SSO_LOGOUT_REDIRECT` | SSO logout redirect URL |

### Backend CORS

Enable CORS on the Wasabi API for your React origin:

```
Access-Control-Allow-Origin: https://ui.example.com
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## Testing

```bash
npm test          # Vitest unit/integration tests
npm run lint      # ESLint
```

## Project structure

```
src/
├── api/           # Domain API modules (axios client + endpoints)
├── components/    # UI primitives + domain components
├── contexts/      # AuthContext
├── hooks/         # React Query hooks
├── pages/         # Route-level screens
├── lib/           # Utilities and constants
└── types/         # Shared TypeScript types
```

## Routes

| Path | Feature |
|------|---------|
| `/login` | Basic auth sign-in |
| `/sso` | SSO entry (when enabled) |
| `/experiments` | Experiment list |
| `/experiments/new` | Create draft experiment |
| `/experiments/:id` | Experiment detail (tabs) |
| `/applications` | Application list (admin) |
| `/applications/:app/priorities` | Priority ordering |
| `/applications/:app/pages` | Page manager |
| `/applications/:app/logs` | Audit logs |
| `/users` | User roles (admin) |
| `/superadmins` | Superadmin management |
| `/feedback` | Feedback inbox |
| `/user-access/:user/:app/:role` | Deep-link role grant |
| `/plugins` | Plugin placeholder |

## Migration status

See [`PARITY_CHECKLIST.md`](PARITY_CHECKLIST.md) for legacy route parity tracking.

The legacy UI remains at `modules/ui/dist/` in the Wasabi JAR until cutover is verified.

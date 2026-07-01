# React UI — Legacy Parity Checklist

Tracks feature parity with the frozen AngularJS admin console (`modules/ui/app/scripts/app.js`).

## Routes

| Legacy state | Legacy URL | React route | Status |
|--------------|------------|-------------|--------|
| signin | `/signin` | `/login` | Done |
| experiments | `/experiments` | `/experiments` | Done |
| experiment | `/experiments/:id/...` | `/experiments/:id` | Done |
| applications | `/applications` | `/applications` | Done |
| users | `/users` | `/users` | Done |
| superadmins | `/superadmins` | `/superadmins` | Done |
| priorities | `/priorities/:app` | `/applications/:app/priorities` | Done |
| pages | `/pages/:app` | `/applications/:app/pages` | Done |
| logs | `/logs/:app` | `/applications/:app/logs` | Done |
| feedbackReader | `/feedbackReader` | `/feedback` | Done |
| userAccess | `/userAccess/:u/:a/:r` | `/user-access/:u/:a/:r` | Done |
| plugins | `/plugins` | `/plugins` | Stub |

## Experiment features

| Feature | Status |
|---------|--------|
| List + search/filter + card/table toggle | Done |
| Create draft experiment | Done |
| Experiment detail tabs | Done |
| Buckets (create, balance, close, empty, delete) | Done |
| Results / analytics (Recharts) | Done |
| Segmentation rule + test | Done |
| Mutual exclusion | Done |
| Pages tab (read) | Done |
| API Calls samples | Done |
| Lifecycle (start/stop/terminate/delete) | Done |
| Favorites | API wired, UI pending |
| Advanced card view analytics | Partial |

## Auth & admin

| Feature | Status |
|---------|--------|
| Basic auth login | Done |
| Permission loading | Done |
| Role-based admin nav | Done |
| Session idle timeout | Done |
| 401 interceptor | Done |
| SSO login/logout | Stub (`/sso`, env-driven) |
| Feedback submit (header modal) | Done |

## Production cutover

- [ ] Deploy `dist/` to static host with `VITE_API_URL`
- [ ] Configure backend CORS for React origin
- [ ] Smoke test: login → list → create → start → view results
- [ ] Team sign-off on parity
- [ ] Optional: redirect banner in legacy UI

## E2E smoke test script (manual)

1. Sign in with valid credentials
2. Open `/experiments` — list loads
3. Create draft at `/experiments/new`
4. Add buckets on detail page
5. Start experiment
6. View Results tab
7. (Admin) Open `/applications`, `/users`, `/feedback`

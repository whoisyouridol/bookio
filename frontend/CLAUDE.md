# BookVisit — Frontend Conventions

## Stack
- React 18 + TypeScript + Vite 6
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- React Router v7 (`createBrowserRouter`)
- TanStack Query v5 (`useQuery`, `useMutation`)
- Axios (via `src/api/client.ts`)
- Sonner (toasts)
- `@react-oauth/google` (Google One Tap / button)

## Dev Server
- Port: **5175** (hardcoded in `vite.config.ts`)
- Proxy: all `/api/*` → `http://localhost:5032` (same-origin for HttpOnly cookies)
- Start: `npm run dev` from `frontend/`

## Key Files
| File | Purpose |
|---|---|
| `src/types/index.ts` | ALL TypeScript interfaces — must match BE DTOs exactly (camelCase) |
| `src/api/client.ts` | axios instance, baseURL `/api`, withCredentials, in-memory token, 401 refresh interceptor |
| `src/api/auth.ts` | All auth API calls |
| `src/api/salons.ts` | Salon API calls |
| `src/contexts/AuthContext.tsx` | Auth source of truth — `useAuth()`, `AuthProvider`, `Role` type |
| `src/contexts/RoleContext.tsx` | Compat shim over AuthContext — `setRole` is no-op |
| `src/context/ThemeContext.tsx` | CSS variable theme switcher (default: purple) |
| `src/context/BookingContext.tsx` | Booking flow state |
| `src/styles/index.css` | Tailwind v4 imports + theme.css |
| `src/App.tsx` | All routes via `createBrowserRouter` |
| `src/main.tsx` | `GoogleOAuthProvider` + `AuthProvider` + `QueryClient` + `Toaster` + `App` |
| `vite.config.ts` | Port 5175, proxy to 5032, `@` alias to `src/` |

## Routing Structure

### Auth routes (public)
```
/login                    LoginPage
/register                 RegisterPage (client/salon/master email)
/register/master          MasterRegisterPage (salon picker → Google/Facebook)
/auth/forgot-password     ForgotPasswordPage
/auth/reset-password      ResetPasswordPage
```

### Client routes
```
/                         HomePage
/salon/:salonId           SalonDetailsPage
/salon/:salonId/master/:masterId          MasterProfilePage
/salon/:salonId/master/:masterId/book     BookingFlowPage
/booking/confirmation/:bookingId          BookingConfirmationPage
/booking/:bookingId       ViewBookingPage
/bookings                 MyBookingsPage
```

### Admin routes (guarded by RoleGuard)
```
/admin                    DashboardPage (superadmin) or redirects by role
/admin/salons             SalonsPage
/admin/salons/new|:id     SalonFormPage
/admin/masters            MastersPage
/admin/masters/new|:id    MasterFormPage
/admin/services           ServicesPage
/admin/bookings           BookingsAdminPage
/admin/bookings/:id       BookingDetailAdminPage
```

## Auth Context
```ts
const { user, role, salonId, masterId, isAuthenticated, isLoading,
        login, register, loginWithGoogle, loginWithFacebook, logout } = useAuth();
```
- `role`: `'superadmin' | 'salon_admin' | 'master_admin' | 'client'`
- Role mapping from BE: `SuperAdmin→superadmin`, `SalonAdmin→salon_admin`, `MasterAdmin→master_admin`, `Client→client`
- Session restored on mount via `POST /api/auth/refresh` (HttpOnly cookie)

## Type Conventions
- All interfaces in `src/types/index.ts` — camelCase matching BE DTOs
- When BE adds a field → add to interface here first, then use in components
- Key types: `UserDto`, `AdminUserDto`, `SalonDto`, `MasterDto`, `BookingDto`, `MasterServiceDto`, etc.

## MasterDto — important field
```ts
interface MasterDto {
  isDeleted: boolean;  // soft-delete flag (NOT isActive — Master uses IsDeleted on BE)
  // ...
}
```
Display: `m.isDeleted ? 'Deleted' : 'Active'`

## Theming
- CSS variables on `document.documentElement` via ThemeContext
- Default: purple (`#8B5CF6`)
- Components use `var(--color-primary)`, `var(--border-radius)` etc.
- Per-salon theming architecture ready — extend ThemeContext

## Google OAuth (Frontend)
- Provider: `GoogleOAuthProvider` in `main.tsx` with `clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}`
- Login: `<GoogleLogin onSuccess={...} />` component from `@react-oauth/google`
- Returns `credentialResponse.credential` (id_token) → send to `POST /api/auth/google`
- Master registration: same credential → `POST /api/auth/master/google` with `{ credential, salonId }`

## Facebook OAuth (Frontend)
- Uses `window.FB.login(cb, { scope: 'email,public_profile' })`
- Returns `res.authResponse.accessToken` → send to `POST /api/auth/facebook`

## Patterns
- API calls via TanStack Query: `useQuery` for reads, `useMutation` for writes
- Errors shown via `toast.error(msg)` from sonner
- Extract error: `(err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Fallback'`
- Loading states: disable buttons with `disabled={loading}`, show spinner or `…` text
- Forms: controlled inputs with `useState`, `onSubmit` with `e.preventDefault()`

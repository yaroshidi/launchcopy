

# Authentication and Paid Subscription Setup

This plan adds secure user authentication (Google + email/password), basic user profiles, and prepares the app to become a paid tool with Stripe subscriptions.

---

## Phase 1: Authentication

### 1.1 Database Setup

Create a **profiles** table to store basic user info from their Google account:

- `id` (UUID, references auth.users)
- `display_name` (text)
- `avatar_url` (text)
- `email` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Enable Row Level Security so users can only read/update their own profile.

Create a trigger that auto-creates a profile row whenever a new user signs up (pulling name/avatar from their auth metadata).

### 1.2 Google OAuth

Configure Google as a sign-in provider using the managed Lovable Cloud solution. This works out of the box with no extra Google Cloud setup needed.

### 1.3 Auth Page (`/auth`)

Create a dedicated authentication page with:

- **Google sign-in button** (primary, prominent)
- **Email/password sign-in and sign-up** as a secondary option
- Clean, dark-themed design matching the existing glassmorphism style
- Input validation using zod (email format, password minimum length)
- Proper error handling (user already exists, invalid credentials, etc.)
- Automatic redirect to home page after successful login

### 1.4 Auth Context and Route Protection

- Create an `AuthProvider` context that wraps the app, managing session state
- Use `supabase.auth.onAuthStateChange` + `supabase.auth.getSession` following the correct initialization order
- Protect the main page: unauthenticated users get redirected to `/auth`
- Authenticated users on `/auth` get redirected to `/`

### 1.5 Navbar Updates

- Show the user's avatar and display name in the top-right corner
- Add a dropdown menu with "Sign Out" option
- Remove or keep the GitHub link as needed

---

## Phase 2: Stripe Payments (Monthly Subscription)

This will use the Lovable Stripe integration to set up monthly subscriptions.

### 2.1 Enable Stripe

Enable the Stripe integration which will provide the tools and knowledge to properly implement subscription billing. This step needs to happen first -- it will unlock the specific implementation details and tooling for creating products, prices, checkout sessions, and managing subscriptions.

### 2.2 Subscription Flow (details after Stripe is enabled)

Once Stripe is enabled, we will:

- Create a subscription product and monthly price
- Add a paywall: users who aren't subscribed see a pricing/upgrade page instead of the analysis tool
- Build a checkout flow that redirects to Stripe for payment
- Handle subscription status checks on each page load
- Add a "Manage Subscription" link for existing subscribers

---

## Technical Details

### New files:
- `src/pages/Auth.tsx` -- Login/signup page with Google OAuth and email/password
- `src/contexts/AuthContext.tsx` -- Auth provider with session management
- `src/components/UserMenu.tsx` -- Avatar dropdown with sign-out

### Modified files:
- `src/App.tsx` -- Wrap with AuthProvider, add `/auth` route, add route protection
- `src/components/Navbar.tsx` -- Add user menu (avatar + dropdown)
- `src/pages/Index.tsx` -- Gate analysis behind auth check

### Database migration:
- Create `profiles` table with RLS policies
- Create trigger function `handle_new_user` to auto-populate profiles on signup

### Auth configuration:
- Configure Google OAuth via the managed Cloud solution
- Email/password auth enabled by default

### Security considerations:
- RLS on profiles table (users read/update only their own row)
- zod validation on all auth form inputs
- No sensitive data logged to console
- Proper error messages without leaking internal details
- Session tokens managed by the auth library (not manually stored)


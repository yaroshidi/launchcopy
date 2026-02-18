

## Add "Manage Billing" to the Profile Dropdown

### What Changes
Add a "Manage Billing" menu item to the user dropdown (UserMenu.tsx) that opens the Stripe Customer Portal. This lets paid users change plans, update payment methods, or cancel -- right from the profile menu without scrolling to pricing.

### Details

**`src/components/UserMenu.tsx`**:
- Import `CreditCard` icon from lucide-react and `supabase` client
- Import `useToast` for error feedback
- Add a `handleManageBilling` async function that calls `supabase.functions.invoke('customer-portal')` and opens the returned URL in a new tab
- Add a new `DropdownMenuItem` with the CreditCard icon labeled "Manage Billing", placed between "My Scans" and "Sign out"
- Only show this item for paid users (`isPaid` from `useAuth()`)
- Show a loading state (disabled + spinner) while the portal session is being created

### Menu Layout (paid users)

```text
+------------------------+
| user@email.com         |
| My Scans               |
| Manage Billing         |  <-- new
| Sign out               |
+------------------------+
```

Free users won't see "Manage Billing" since they have no Stripe subscription to manage.

### No Backend Changes
The `customer-portal` edge function already exists and works. This is a frontend-only change.



## Problem

The verification email for `yaroshidi@hotmail.com` was processed by the system (the auth hook ran successfully), but Hotmail/Outlook likely filtered or silently dropped it because the email comes from a default system sender with no custom domain reputation. This is a known deliverability issue with Microsoft email providers.

## Plan

Two changes, matching your selections:

### 1. Add a "Resend verification email" flow on the Auth page

- After a successful signup, show a "Didn't receive the email?" section with a **Resend** button
- Add a 60-second cooldown timer between resends to prevent abuse
- Display clear status messages ("Email sent!", "Check your spam folder", cooldown countdown)
- Implement by calling `supabase.auth.resend({ type: 'signup', email })` on button click
- Track state with `showResend`, `resendCooldown`, and `resendLoading` in the Auth component

### 2. Set up branded email sending on your custom domain

Your project already has `trylaunchcopy.com` as a custom domain. We need to configure it as an email sender domain so auth emails come from something like `noreply@trylaunchcopy.com` instead of the default sender. This dramatically improves Hotmail/Outlook deliverability.

**Steps:**
1. Open the email domain setup dialog to provision DNS records for `trylaunchcopy.com`
2. You'll add the required DNS records (SPF, DKIM, DMARC) at your domain registrar
3. Once DNS verifies, I'll scaffold branded email templates matching LaunchCopy's dark theme and deploy them

**To get started with the email domain, click below:**

<lov-actions>
<lov-open-email-setup>Set up email domain</lov-open-email-setup>
</lov-actions>


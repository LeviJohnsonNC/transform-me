# Plan: Password reset for your account

Goal: you can get back into levijohnson@gmail.com this morning without knowing the old password.

## How it will work

1. On the sign-in screen, a new "Forgot password?" link.
2. You enter your email and get a reset email from the app.
3. Clicking the link opens a "Set a new password" page in the app.
4. You pick a new password and land straight in your account, with all your habits, records and rewards intact.

## What gets built

- **Forgot password step** on the existing sign-in screen: email field, "Send reset link" button, and a confirmation message telling you to check your inbox (and spam).
- **New "Set a new password" page** at `/reset-password`: two password fields (new + confirm), basic length check, success message, then into the app.
- **Routing fix**: right now every signed-out visitor is sent to the sign-in screen, and a reset link signs you in automatically before you've chosen a password. The reset page needs to open first and take priority over that redirect, so the link always lands on the password form rather than dropping you into the app with the old password still unchanged.

## Technical notes

- `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`.
- `/reset-password` must be a public route rendered before the `!user` early return in `App.tsx`; detect the recovery session (`type=recovery` in the URL hash / `PASSWORD_RECOVERY` auth event) and hold the user on the form.
- `supabase.auth.updateUser({ password })` on the recovery session — no `current_password` on this page.
- Email/password auth is already enabled; reset emails send through the built-in Lovable auth email templates, so no domain or key setup is needed.

## If the email doesn't arrive

Reset emails can be slow or land in spam. If it hasn't shown up within a few minutes, tell me and I'll set a temporary password on the account directly so you're in immediately, and you can change it from the new page afterwards.

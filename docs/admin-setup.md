# Admin deployment setup

The administration interface is available at `/admin/login`. It remains
unusable until all required Vercel environment variables are configured.

## Required Vercel variables

- `ADMIN_EMAIL` — the single authorized administrator email.
- `ADMIN_PASSWORD_HASH` — generated locally with
  `npm run admin:hash-password`. Never enter the plain password in Vercel.
- `SESSION_SECRET` — at least 32 random characters. Generate a new value with
  `openssl rand -base64 48`.
- `GITHUB_OWNER` — `infoallurecelebrations-hub`.
- `GITHUB_REPOSITORY` — `allure-aura-creations`.
- `GITHUB_BRANCH` — `main`.
- `GITHUB_CONTENT_TOKEN` — a fine-grained GitHub personal access token.

Create the GitHub token for only the `allure-aura-creations` repository and
grant only **Contents: Read and write**. Metadata read access is added by
GitHub automatically. Do not use an account-wide classic token.

Configure the values for both Preview and Production in Vercel. Do not add
`ADMIN_USE_LOCAL_CONTENT` in Vercel; that flag exists only for local visual
testing.

## Publishing behavior

The editor reads the latest content and branch revision directly from GitHub.
Publishing validates every field and image, checks that the branch has not
changed since it was loaded, then creates one atomic commit containing:

- `content/catalog.json`
- `content/journal.json`
- `content/reviews.json`
- `content/site.json`
- up to four optimized product images per publish (maximum 650 KB each)
- removed or replaced product images are deleted from the current revision;
  earlier versions remain recoverable through Git history

The GitHub commit starts the normal Vercel deployment. A stale editor is
rejected instead of overwriting a newer revision.

The admin loads all content from one pinned revision. Uploaded image previews
remain visible after publishing, and authenticated image reads come from GitHub
so refreshing the editor does not depend on the storefront deployment finishing.
The public storefront receives images and content together in its next deployment.

Edits stay in the current tab until published. Uploading and publishing lock the
editor to prevent concurrent changes. Discard and sign-out actions confirm before
dropping a draft. If a session expires during publishing, keep the editor open,
sign in in a second tab and retry. Reloading or closing the tab discards the draft.

## Verification

Run `npm test`, `npm run test:admin`, `npm run lint`, `npm run typecheck` and
`npm run build`. See `tests/e2e/README.md` for the browser setup. Automated tests
use mocked GitHub publishing and never add test products to the live store.

## Security notes

- Sessions use signed, Secure, HttpOnly, SameSite cookies and expire after
  eight hours.
- Login attempts have a best-effort serverless rate limit.
- State-changing requests reject cross-origin browser requests.
- Passwords, tokens, customer data, payment data and private order information
  must never be entered into public content fields.
- The password formerly embedded in the legacy `index.html` is compromised by
  definition. Use a completely new password and rotate any place where the old
  value was reused.

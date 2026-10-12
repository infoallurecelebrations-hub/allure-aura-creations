# Later zero-cost Cloudflare migration

The current implementation is being staged on Vercel Hobby at the owner's
request. This document records the planned portable architecture for the later
move to Cloudflare and is not active yet.

## Runtime

1. GitHub stores source code, public content JSON and optimized catalogue
   images.
2. Cloudflare Pages builds the Next.js static export from `main` and serves the
   generated `out/` directory.
3. Public visitors receive static files only. Orders continue through WhatsApp;
   no customer records or payment data are stored in JSON.
4. Cloudflare Pages Functions handle the small authenticated admin API.
5. Publishing from the admin creates one atomic commit through the GitHub API.
   That commit is the audit trail, backup and rollback point, and it triggers a
   fresh deployment.

## Content layout

- `content/catalog.json` — products, categories and packages
- `content/site.json` — public business details and site settings
- `content/journal.json` — journal entries
- `content/reviews.json` — approved public reviews
- `public/uploads/products/` — resized WebP catalogue images

Only public storefront data belongs in these files. Passwords, tokens, private
customer details and order data are forbidden.

## Administration security

- GitHub OAuth identifies the administrator.
- Only the configured GitHub login is authorized.
- A signed, Secure, HttpOnly, SameSite cookie holds the short-lived session.
- The content token is fine-grained and restricted to this repository's
  Contents permission.
- Publish requests require the last-read commit SHA to prevent one edit from
  silently overwriting another.
- JSON shape, image MIME type, pixel dimensions and byte size are validated
  before a commit is created.
- Rate limiting is applied to authentication and publishing endpoints.

## Operational limits

- One admin publish equals one GitHub commit and one Pages build.
- Images are resized in the browser and stored as WebP with a conservative
  maximum size before upload to keep the repository healthy.
- This design suits a small catalogue with occasional edits. If uploads or
  edits become frequent, images should later move to object storage and content
  to a real database without changing the storefront components.

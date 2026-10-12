# Allure Aura Creations

The repository contains a structured Next.js storefront and protected
administration app. The current hosting target is Vercel Hobby;
public pages remain statically optimized while
admin routes run as serverless functions.

## Current migration state

- `index.html` is retained as the legacy source; Next.js does not serve it.
- `src/` contains the multi-page storefront and administration implementation.
- The canonical Vercel project is `allure-aura-creations`. Its admin secrets
  are configured in Vercel, separate from the public source files.
- Product and site content is kept as versioned JSON in `content/`.
- Optimized product images belong in `public/uploads/products/`.
- The admin uses server-side password verification, signed HttpOnly sessions
  and atomic GitHub commits. No client-side credential from the legacy site is
  reused.

## Local commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:admin
npm run test:storefront # requires npm run build first
npm run build
npm run admin:hash-password
```

`npm run admin:hash-password` securely prompts for a new password and prints the
PBKDF2 hash to store in Vercel. The password itself is never committed.

## Main directories

- `src/app/` — routes, layouts, route handlers and server entry points
- `src/components/` — reusable presentation components
- `src/features/` — storefront and administration interfaces
- `src/lib/server/` — session security, validation and GitHub publishing
- `content/` — public, versioned JSON used to build the storefront
- `public/brand/` — static brand assets after migration
- `public/uploads/products/` — optimized public catalogue images
- `tests/` — unit and end-to-end tests

See `docs/admin-setup.md` before enabling the admin in Vercel. The later
Cloudflare migration design remains in `docs/free-architecture.md`.

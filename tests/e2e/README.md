# End-to-end tests

Run `npx playwright install chromium`, then `npm run test:admin`.
To use an installed Chrome browser instead, set `ADMIN_TEST_CHROME` to its path.
For the production build, run `npm run build` followed by
`ADMIN_TEST_MODE=production npm run test:admin`.

The suite starts an isolated local Next server on port 3187 with temporary
credentials. It exercises real authentication and browser editing, with mocked
content/publish responses so no test data reaches GitHub or Vercel. Server unit
tests separately exercise the GitHub API adapter and validation with mocked HTTP.

All admin sections are checked at widths of 320, 390, 768, 1024 and 1440 pixels.
Screenshots are saved in the ignored `test-results/admin/` directory.

## Storefront

Run `npm run build` followed by `npm run test:storefront`. The same
`ADMIN_TEST_CHROME` override is supported. This suite starts the production
server on port 3188 and checks all eight public pages at the same five widths,
internal links, navigation, catalogue prices and filters, product/package order
links, query-price tampering, form validation, and WhatsApp handoff fallbacks.
WhatsApp windows are intercepted; no messages are sent.

To check a deployment instead of starting a local server, set
`STOREFRONT_TEST_URL=https://allure-aura-creations.vercel.app`. The deployment's
catalogue must match the local checkout. Screenshots are saved in the ignored
`test-results/storefront/` directory. Browser errors and failed assets fail the
suite.

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

# Authentication feature

This folder contains the admin login interface and client-side session state.
Identity verification, signed HttpOnly cookies, authorization checks and login
throttling belong in `functions/`; credentials never belong in the browser
bundle or committed JSON.

# Security Policy

## Reporting a vulnerability

Please **do not open a public issue or pull request** for security problems.

Report privately to **[SECURITY CONTACT EMAIL]** with:

- a description of the issue and its impact,
- the affected page, route or component,
- steps to reproduce (role used, browser, sample data),
- any suggested fix.

You can expect an acknowledgement within **[N] business days** and a status update
within **[N] business days**. Please give us a reasonable time to fix the issue before
any disclosure.

## Scope

This repository contains the SylviaNG Community admin UI (Angular). In scope: token and
session handling, route guards, XSS and unsafe rendering of user content, exposure of data in
the browser, and insecure configuration. Server-side authorization is enforced by the backend
service; client-side guards are a UX convenience and are not a security boundary.

## Supported versions

Only the latest state of the `dev` branch and the current release branch (`main`) receive
security fixes. [CONFIRM RELEASE POLICY]

## Secrets and configuration

- Never commit credentials, tokens or private URLs. The app stores its sign-in token and expiry in
  the browser's `localStorage`; do not log or expose them.
- The dev-only `X-Dev-Employee-Id` / `X-Dev-Role` headers are sent when nobody is signed in; the backend
  honors them only in its `Development` environment. Do not rely on them anywhere else.
- Demo accounts and credentials must not be shown or shipped in production builds.

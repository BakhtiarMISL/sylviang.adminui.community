# Changelog

All notable changes to the SylviaNG Community admin UI are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Earlier history
is available in the git log and merged pull requests #1 to #10.

## [Unreleased]

### Added
- `hrOnlyGuard` route guard for HR-only pages.
- Terms of Use and Privacy Policy page (`public/legal/terms-privacy-policy.html`, draft) linked from the login screen.
- Project documents: `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, pull request template.

### Changed
- Community and messenger pages, shared services and interfaces updated to match the current backend.

### Fixed
- Login: the "Forgot password?" link was a dead `javascript:void(0)` anchor; it now shows guidance that
  passwords are reset by the HR administrator (the backend has no self-service reset endpoint).

### Removed
- Attendance and Payroll modules inherited from the HRMS template (pages, routes, services, enums,
  interfaces) and their `BASE_URL_Attendance` / `BASE_URL_Payroll` constants.

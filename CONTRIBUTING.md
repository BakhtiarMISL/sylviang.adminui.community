# Contributing to sylviang.adminui.community (admin UI)

## Branching and pull requests

```
main  ->  dev  ->  community_engagement_<topic>ui   (your feature branch)
```

1. Branch from the latest `origin/dev`: `git fetch origin && git switch -c community_engagement_<topic>ui origin/dev`.
2. Commit in small, themed commits with clear messages.
3. Push the branch and open a pull request **into `dev`** (never directly into `main`).
4. Fill in the pull request template. `dev` is merged to `main` by the maintainers.

## Local setup

```bash
npm install
npm start          # ng serve, http://localhost:4200
```

The backend (`SylviaNG.Community`) must be running on `http://localhost:5210`.

### Environment configuration

There is no `.env` mechanism. API and SignalR URLs are constants in
`src/environments/environment.ts` (`Base_URL`, `BASE_URL_Community`, `BASE_URL_Auth`, hub URLs).
There is currently **only one environment file** and `angular.json` defines no `fileReplacements`,
so production builds reuse the development URLs. Change `Base_URL` locally when pointing at another
backend and do not commit machine-specific values. A proper `environment.prod.ts` is planned work.

## Build and test

```bash
npm run build
npm test
ng test --include=src/app/app.spec.ts    # single spec file
```

There is no lint script or ESLint configuration yet. Follow `.editorconfig`.

## Code conventions

- Angular 19 with classic NgModule bootstrap (`app.module.ts`); do not switch to standalone bootstrap.
- Folder-by-feature under `src/app/pages/{employee-directory,dashboard,community,messenger,notifications}`, each with a
  routing module. Cross-cutting code lives in `src/app/@core/`.
- State lives in RxJS `BehaviorSubject`s inside `providedIn: 'root'` services; no NgRx.
- Use the path aliases `@app/*`, `@core/*`, `@pages/*`, `@shared/*`, `@env/*`.
- UI kit: PrimeNG (Aura) + Tailwind CSS. Support light and dark themes.
- Route guards (`authGuard`, `hrAdminGuard`, `hrOnlyGuard`) are UX only. Every restricted action must also be
  enforced by the backend.
- New services return the backend envelope type `ApiResponse<T>` and use `BASE_URL_Community`.

## Before you open a pull request

- [ ] `npm run build` and `npm test` pass
- [ ] No secrets, tokens, personal data or machine-specific URLs are included
- [ ] Any new endpoint usage matches the backend controller (route, verb, DTO)
- [ ] `CHANGELOG.md` updated under **Unreleased**

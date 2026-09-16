# CI/CD Pipeline Updates

## Purpose

The CI pipeline automatically checks backend and frontend changes before they
are merged into `main`. The staging pipeline also runs the same checks before
building or deploying the application.

## Updates Made

### Pull request CI workflow

The new `.github/workflows/ci.yml` workflow:

- Runs automatically for pull requests targeting `main`.
- Can be reused by other workflows through `workflow_call`.
- Runs the backend and frontend jobs in parallel.
- Uses read-only repository permissions.

The backend job:

- Starts a temporary PostgreSQL 16 database with PGVector.
- Installs Python 3.13 and the development dependencies.
- Runs all tests discovered by `python -m pytest` in `server`.
- Fails the CI check if any backend test fails.

The frontend job:

- Installs Node.js 22 and dependencies with `npm ci`.
- Runs the `@freshr/web` Vitest suite once without watch mode.
- Builds the frontend to detect TypeScript and production-build errors.
- Fails the CI check if a test or build step fails.

Python and npm dependency caching are enabled to make later CI runs faster.

### Staging deployment gate

The existing `.github/workflows/build-deploy-staging.yml` workflow now:

- Calls `.github/workflows/ci.yml` before building Docker images.
- Uses `needs: ci` to block image building when CI fails.
- Deploys to staging only after CI and image building both succeed.

The resulting staging flow is:

```text
Push to main -> CI -> Build and push images -> Deploy to staging
```

## Pull Request Flow

The intended pull request flow is:

```text
Open or update PR -> Backend and frontend checks -> Approval -> Merge
-> Run CI again -> Build images -> Deploy to staging
```

Running CI again after a merge protects staging in case the final merge commit
behaves differently from the individual pull request branch.

## GitHub Settings Still Required

The workflow code runs tests, but repository settings must enforce the result.
After this branch is pushed and the workflow has run at least once:

1. Add `Backend tests` and `Frontend tests` as required status checks for
   `main` in the active GitHub ruleset.
2. Keep the existing pull request approval requirement if human review is
   required.
3. Enable GitHub auto-merge if passing checks and approval should merge a pull
   request automatically.

Without required status checks, a failing CI run is visible but does not by
itself prevent an authorized developer from merging. Without auto-merge,
passing checks make the pull request mergeable but do not merge it.

## Possible Improvements

### Short-term

- Add workflow concurrency so a new commit cancels an older CI run for the
  same pull request.
- Add job timeouts so stalled tests cannot run indefinitely.
- Upload test and coverage reports as workflow artifacts.
- Add linting and formatting checks for backend and frontend code.

### Security and reliability

- Pin third-party GitHub Actions to full commit SHAs.
- Add dependency and security scanning.
- Add a migration check to catch missing Django migrations.
- Notify the development team when staging deployment fails.

### Test coverage

- Add browser-based end-to-end tests for critical user flows.
- Add a real Celery, Redis, and ingestion smoke test in a separate job.
- Add production deployment verification and rollback checks.
- Add mobile or shared-package tests if those workspaces gain test suites.

Slower smoke and end-to-end tests should remain separate from fast unit and
integration tests so developers receive quick pull request feedback.

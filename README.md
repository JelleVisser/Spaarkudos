# Spaarkudos

Spaarkudos is a mobile-first family rewards application. Parents award virtual currency (**kudos**) to their children for positive behaviour; children can track their balance and choose rewards from a family shop.

> **Project status:** Initial project setup. The MVP is being built (_cough_ vibe-coded) incrementally, with each milestone reviewed before the next begins.

## Planned MVP

- Parent login with Google or Facebook via Firebase Authentication.
- Automatic creation of a first family group named `Familie naam`.
- Add and remove children, including per-child balances and transaction history.
- Manual and scheduled kudos rewards.
- A family shop with stock management and parent-controlled fulfillment.
- Shareable child dashboard URLs, with balance history, shop browsing, and celebration effects.
- Firebase-backed security, scheduled functions, and local emulator support.

All application UI text will be in Dutch. Source code, data fields, comments, and architecture use English.

## Technology

- Angular 22 with standalone components, Signals, and Signal Forms
- TypeScript in strict mode
- WebAwesome, Chart.js, and canvas-confetti
- Firebase Authentication, Cloud Firestore, Cloud Functions, Hosting, and Emulator Suite
- ESLint 9 with angular-eslint flat configuration
- Prettier
- Vitest and jsdom
- Firebase Rules tests with `@firebase/rules-unit-testing`
- Husky and lint-staged

## Development approach

The MVP is implemented in reviewable milestones:

1. Project scaffold and developer tooling
2. Firebase configuration, emulators, security rules, and Functions foundation
3. Authentication and first-login group creation
4. Parent dashboard and child management
5. Balance adjustments, ledger, and charts
6. Shop management and purchase fulfillment
7. Public child dashboard and shop experience
8. Scheduled rewards, completion tests, polish, and deployment documentation

Each milestone pauses for review and confirmation before work continues.

## Getting started

The application has not been scaffolded yet. Once the first milestone is complete, this section will contain the exact installation, emulator, test, and run commands.

Expected prerequisites:

- A current Node.js LTS release compatible with Angular 22
- npm
- Firebase CLI
- A Firebase project with Authentication, Firestore, Cloud Functions, and Hosting enabled

## Firebase configuration

Real Firebase credentials are intentionally not committed. The project will provide environment placeholders and clear setup instructions for:

- Creating a Firebase project
- Enabling Google and Facebook providers
- Configuring local environment values
- Running the Firebase Emulator Suite
- Deploying Rules, Functions, and Hosting

## Quality checks

The completed project will provide commands for the following checks:

```text
npm run lint
npm test
npm run build
```

Pre-commit hooks will format staged files and run relevant lint checks. Continuous integration can be enabled through GitHub Actions once this repository is connected to GitHub.

## Documentation

The full agreed MVP scope is available in [SPECIFICATION.md](./SPECIFICATION.md).

## License

No license has been selected yet.

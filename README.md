# Spaarkudos

Spaarkudos is a mobile-first family rewards application. Parents award virtual currency (**kudos**) to their children for positive behaviour; children can track their balance and choose rewards from a family shop.

> **Project status:** Milestone 8 complete: scheduled rewards, tests, polish, and deployment documentation. The MVP is being built (_cough_ vibe-coded) incrementally, with each milestone reviewed before the next begins.

## Planned MVP

- Parent login with Google via Firebase Authentication.
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

Prerequisites:

- Node.js 22.22.3 or newer
- npm

Install dependencies and start the local development server:

```bash
npm install
npm start
```

Open `http://localhost:4200/` in a browser.

Run quality checks:

```bash
npm run lint
npm test -- --watch=false
npm run build
```

## Firebase configuration

Real Firebase credentials are intentionally not committed. Production placeholders are in `src/environments/environment.ts` and `.firebaserc`; replace them only when a Firebase project has been created.

For local testing against a real Firebase project, copy the ignored example file and replace its placeholders:

```powershell
Copy-Item src\environments\environment.local.example.ts src\environments\environment.local.ts
npm run start:local
```

`environment.local.ts`, `.env` files, Firebase service-account JSON files, and local `.firebaserc` overrides are ignored by Git. Keep all credentials in Firebase or Google Cloud configuration.

The local Firebase Emulator Suite uses the safe `demo-spaarkudos` project, which cannot access live Firebase resources:

```bash
npm run emulators
npm run test:rules
```

The second command starts Auth and Firestore emulators, runs the Firestore Security Rules tests, then stops the emulators. The Emulator Suite UI is available at `http://localhost:4000` while emulators are running.

The TypeScript Cloud Functions workspace is in `functions/`. Build it with:

```bash
npm --prefix functions run build
```

To use Google sign-in outside the emulators, replace the Firebase placeholders and enable Google in the Firebase Authentication console. The first successful parent sign-in automatically creates a `Familie naam` group owned by that parent.

## Deploy to Firebase

1. Create a Firebase project and enable the **Google** provider in **Authentication → Sign-in method**. Add your Hosting domain to **Authentication → Settings → Authorized domains**.
2. Update `.firebaserc` with the Firebase project ID. Copy `src/environments/environment.local.example.ts` to the ignored `environment.local.ts`, then paste the Web App configuration from **Project settings → Your apps**.
3. Sign in to the Firebase CLI and select the project:

   ```powershell
   npx.cmd firebase login
   npx.cmd firebase use spaarkudos
   ```

4. Build the application and Functions:

   ```powershell
   npm.cmd run build
   npm.cmd --prefix functions run build
   ```

5. Deploy the security rules, indexes, HTTP endpoint, scheduled reward functions, and Hosting site:

   ```powershell
   npx.cmd firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
   ```

   The public child dashboard requires the `childDashboard` Function to be deployed. The three scheduled Functions run in `Europe/Amsterdam`: daily at 06:00, Monday at 06:00, and the first day of each month at 06:00. A billing-enabled Firebase project may be required for Cloud Functions and Cloud Scheduler.

6. Open the Hosting URL reported by the deploy command. Sign in as a parent, create a child, then use **Open de kinderpagina** to obtain that child’s shareable URL.

## Quality checks

Pre-commit hooks format staged files and run relevant lint checks. Continuous integration can be enabled through GitHub Actions once this repository is connected to GitHub.

## Documentation

The full agreed MVP scope is available in [SPECIFICATION.md](./SPECIFICATION.md).

## License

No license has been selected yet.

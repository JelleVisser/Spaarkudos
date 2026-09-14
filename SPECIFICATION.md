# Spaarkudos MVP Specification

## Purpose

Spaarkudos is a mobile-first family rewards web application. Parents award virtual currency, named **kudos**, to their children for positive behaviour. Children can view their balance and browse a family shop where they can choose items to claim from their parent.

## Technology

- Frontend: Angular (latest stable version), TypeScript, WebAwesome, Chart.js, and canvas-confetti.
- Backend: Firebase Authentication, Cloud Firestore, and TypeScript Firebase Cloud Functions.
- Authentication provider: Google OAuth.
- All source code, database field names, comments, and architecture are in English.
- All user-facing application text is in Dutch.
- The application is responsive and designed mobile-first.

## Roles

### Parent

- Parents must authenticate with Google before accessing management features.
- The authenticated creator of a group is its only owner and manager. Shared parent management is out of scope.
- On a parent's first successful sign-in, the application creates one group named `Familie naam`.
- A parent can access only groups they created.

### Child

- Children do not authenticate.
- A child dashboard is available at `/group/:groupId/member/:memberId`.
- A valid request requires a member that belongs to the group in the URL.
- Child-facing data is served by a public Cloud Function endpoint. Direct unauthenticated Firestore reads are denied.
- The URL identifiers are generated as high-entropy, non-guessable IDs. Anyone in possession of a valid link can view the relevant child-facing data.

## Parent features

### Group management

- The default group name is `Familie naam`.
- The owner can edit the group name.

### Child management

- The owner can add a child with a required name; names may contain emoji.
- The owner can delete a child only after entering a textual confirmation.
- The owner can view an individual child dashboard containing current balance, a cumulative-balance Chart.js chart, and a transaction ledger. Here they can also edit the child name.

### Balance management

- The owner can manually add or remove kudos.
- Every manual adjustment requires a non-empty textual reason.
- Member balances may become negative.
- The owner can enable or disable a periodic reward and set its amount and interval: `daily`, `weekly`, or `monthly`.

### Shop and fulfillment

- The owner can create, edit, and delete family shop items.
- A shop item has a description, cost, and either finite stock or unlimited stock.
- The owner manually fulfills a child's verbal request by selecting the item from the management UI.
- A fulfillment creates a purchase transaction and deducts the item cost from the child balance.
- If an item has finite stock, fulfillment atomically decrements stock.
- Fulfillment is blocked when finite stock is `0`.

## Child features

- The child dashboard displays their current balance, cumulative-balance chart, and transaction history.
- The child can browse the family shop.
- Each shop item displays its description, cost, and stock status.
- An item with stock `0` displays `Uitverkocht` and cannot be selected.
- An item the child cannot afford is visually locked or greyed out and shows the number of additional kudos required.
- Selecting an affordable, in-stock item triggers a canvas-confetti effect and prominently shows: `Gefeliciteerd! Ga naar je ouder om dit item te claimen!`
- Selecting an item does not mutate the database, reserve stock, or create a purchase request.

## Firestore data model

### `groups/{groupId}`

```ts
interface IGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
}
```

### `groups/{groupId}/members/{memberId}`

```ts
interface IMember {
  id: string;
  name: string;
  currentBalance: number;
  periodicReward: {
    enabled: boolean;
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly';
    createdAt: FirebaseFirestore.Timestamp;
  } | null;
}
```

### `groups/{groupId}/shopItems/{shopItemId}`

```ts
interface IShopItem {
  id: string;
  description: string;
  cost: number;
  stock: number | null; // null means unlimited
  createdAt: FirebaseFirestore.Timestamp;
}
```

### `groups/{groupId}/transactions/{transactionId}`

```ts
interface ITransaction {
  id: string;
  memberId: string;
  amount: number; // positive for rewards, negative for deductions or purchases
  reason: string;
  type: 'manual' | 'periodic' | 'purchase';
  createdAt: FirebaseFirestore.Timestamp;
}
```

## Scheduled periodic rewards

- A TypeScript Firebase Scheduled Cloud Function applies enabled periodic rewards server-side, independent of whether clients are open.
- The configured Firebase project time zone determines all schedules.
- Daily rewards run every day at 06:00.
- Weekly rewards run every Monday at 06:00.
- Monthly rewards run on the first day of every month at 06:00.
- Each execution increases the member balance by the configured amount and appends a `periodic` transaction with reason `Automatic periodic credit`.
- The MVP does not require a separate idempotency design beyond normal scheduled-function operation.

## Security and access model

- Firebase Security Rules allow authenticated users to read and write only data in groups whose `createdBy` equals `auth.uid`.
- Unauthenticated direct Firestore reads and writes are denied.
- The public child endpoint validates the `groupId`/`memberId` relationship, reads data with trusted server credentials, and returns only the requested child's public dashboard data, ledger, and shop inventory.
- Sensitive owner-only fields and management operations are never exposed through the child endpoint.
- Parent mutations that must remain consistent, particularly purchase fulfillment and stock decrement, run atomically in a Firestore transaction or trusted Cloud Function.

## Firebase configuration and deployment

- The repository must include placeholder Firebase environment configuration rather than a real project identifier or credentials.
- Deployment documentation must give clear, concise steps to create a Firebase project, enable Google authentication, configure the Angular environment placeholders, deploy Firestore rules and indexes, deploy Cloud Functions, and deploy the web application.

## Implementation workflow

Implementation is delivered in small, reviewable milestones. After each milestone, work pauses for user review and explicit confirmation before the next milestone begins. Each checkpoint includes a summary of changed files, implemented behaviour, and verification performed.

1. Project scaffold and developer tooling.
2. Firebase configuration placeholders, Emulator Suite, Firestore Rules, and Cloud Functions foundation.
3. Authentication and first-login group creation.
4. Parent dashboard and child/member management.
5. Balance adjustments, transaction ledger, and charts.
6. Shop management and parent purchase fulfillment.
7. Public child dashboard, shop, and confetti interaction.
8. Scheduled rewards, test completion, polish, and deployment documentation.

### Engineering baseline

- Angular CLI 22.
- TypeScript strict mode.
- Angular Signals and Signal Forms.
- angular-eslint 22 with ESLint 9 flat configuration.
- Prettier with `eslint-config-prettier`.
- Vitest with jsdom.
- Firebase Emulator Suite.
- `@firebase/rules-unit-testing`.
- Husky and lint-staged.
- GitHub Actions when the repository is connected.

## Out of scope for the MVP

- Multiple parent accounts managing the same group.
- Child accounts or child authentication.
- A persisted child purchase request, reservation, or approval workflow.
- Stock reservation following a child’s shop selection.
- More advanced scheduler retry/idempotency handling.

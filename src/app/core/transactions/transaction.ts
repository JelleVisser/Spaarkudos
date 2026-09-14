import { Injectable, inject, signal } from '@angular/core';
import {
  Timestamp,
  Unsubscribe,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../firebase/firebase.providers';

export interface ITransaction {
  id: string;
  memberId: string;
  amount: number;
  reason: string;
  type: 'manual' | 'periodic' | 'purchase';
  createdAt: Timestamp | null;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly firestore = inject(FIREBASE_FIRESTORE);
  private readonly transactionList = signal<ITransaction[]>([]);
  private readonly loading = signal(false);
  private readonly loadError = signal<string | null>(null);
  private transactionsListener?: Unsubscribe;

  readonly transactions = this.transactionList.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly errorMessage = this.loadError.asReadonly();

  watch(groupId: string, memberId: string): void {
    this.transactionsListener?.();
    this.loading.set(true);
    this.loadError.set(null);

    const transactions = query(
      collection(this.firestore, 'groups', groupId, 'transactions'),
      where('memberId', '==', memberId),
    );
    this.transactionsListener = onSnapshot(
      transactions,
      (snapshot) => {
        const transactionList = snapshot.docs
          .map((transaction) => ({ id: transaction.id, ...transaction.data() }) as ITransaction)
          .sort((first, second) => this.timestampValue(first) - this.timestampValue(second));
        this.transactionList.set(transactionList);
        this.loading.set(false);
      },
      () => {
        this.loadError.set('De transactiegeschiedenis kon niet worden geladen.');
        this.loading.set(false);
      },
    );
  }

  stopWatching(): void {
    this.transactionsListener?.();
    this.transactionsListener = undefined;
  }

  async addManualAdjustment(
    groupId: string,
    memberId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    const member = doc(this.firestore, 'groups', groupId, 'members', memberId);
    const transaction = doc(collection(this.firestore, 'groups', groupId, 'transactions'));

    await runTransaction(this.firestore, async (firestoreTransaction) => {
      const memberSnapshot = await firestoreTransaction.get(member);
      if (!memberSnapshot.exists()) {
        throw new Error('Member does not exist.');
      }

      const currentBalance = Number(memberSnapshot.data()['currentBalance'] ?? 0);
      firestoreTransaction.update(member, { currentBalance: currentBalance + amount });
      firestoreTransaction.set(transaction, {
        id: transaction.id,
        memberId,
        amount,
        reason: reason.trim(),
        type: 'manual',
        createdAt: serverTimestamp(),
      });
    });
  }

  private timestampValue(transaction: ITransaction): number {
    return transaction.createdAt?.toMillis() ?? 0;
  }
}

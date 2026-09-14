import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../firebase/firebase.providers';

export interface IShopItem {
  id: string;
  description: string;
  cost: number;
  stock: number | null;
}

export class ShopItemOutOfStockError extends Error {
  constructor() {
    super('This shop item is out of stock.');
  }
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly firestore = inject(FIREBASE_FIRESTORE);
  private readonly destroyRef = inject(DestroyRef);
  private shopItemsListener?: Unsubscribe;
  private readonly itemList = signal<IShopItem[]>([]);
  private readonly loading = signal(false);
  private readonly loadError = signal<string | null>(null);

  readonly items = this.itemList.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly errorMessage = this.loadError.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.shopItemsListener?.());
  }

  watch(groupId: string): void {
    this.shopItemsListener?.();
    this.loading.set(true);
    this.loadError.set(null);
    const items = query(
      collection(this.firestore, 'groups', groupId, 'shopItems'),
      orderBy('description'),
    );
    this.shopItemsListener = onSnapshot(
      items,
      (snapshot) => {
        this.itemList.set(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as IShopItem),
        );
        this.loading.set(false);
      },
      () => {
        this.loadError.set('De shopartikelen konden niet worden geladen. Probeer het opnieuw.');
        this.loading.set(false);
      },
    );
  }

  stopWatching(): void {
    this.shopItemsListener?.();
    this.shopItemsListener = undefined;
  }

  async add(groupId: string, item: Omit<IShopItem, 'id'>): Promise<void> {
    const shopItem = doc(collection(this.firestore, 'groups', groupId, 'shopItems'));
    await setDoc(shopItem, {
      id: shopItem.id,
      ...this.itemData(item),
      createdAt: serverTimestamp(),
    });
  }

  async update(groupId: string, itemId: string, item: Omit<IShopItem, 'id'>): Promise<void> {
    await updateDoc(
      doc(this.firestore, 'groups', groupId, 'shopItems', itemId),
      this.itemData(item),
    );
  }

  async remove(groupId: string, itemId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'groups', groupId, 'shopItems', itemId));
  }

  async fulfill(groupId: string, memberId: string, itemId: string): Promise<void> {
    const member = doc(this.firestore, 'groups', groupId, 'members', memberId);
    const item = doc(this.firestore, 'groups', groupId, 'shopItems', itemId);
    const transaction = doc(collection(this.firestore, 'groups', groupId, 'transactions'));

    await runTransaction(this.firestore, async (firestoreTransaction) => {
      const [memberSnapshot, itemSnapshot] = await Promise.all([
        firestoreTransaction.get(member),
        firestoreTransaction.get(item),
      ]);
      if (!memberSnapshot.exists() || !itemSnapshot.exists()) {
        throw new Error('Member or shop item does not exist.');
      }

      const itemData = itemSnapshot.data() as Omit<IShopItem, 'id'>;
      if (itemData.stock !== null && itemData.stock <= 0) {
        throw new ShopItemOutOfStockError();
      }

      const currentBalance = Number(memberSnapshot.data()['currentBalance'] ?? 0);
      firestoreTransaction.update(member, { currentBalance: currentBalance - itemData.cost });
      if (itemData.stock !== null) {
        firestoreTransaction.update(item, { stock: itemData.stock - 1 });
      }
      firestoreTransaction.set(transaction, {
        id: transaction.id,
        memberId,
        amount: -itemData.cost,
        reason: `Aankoop: ${itemData.description}`,
        type: 'purchase',
        createdAt: serverTimestamp(),
      });
    });
  }

  private itemData(item: Omit<IShopItem, 'id'>): Omit<IShopItem, 'id'> {
    return {
      description: item.description.trim(),
      cost: item.cost,
      stock: item.stock,
    };
  }
}

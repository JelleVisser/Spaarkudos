import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../firebase/firebase.providers';

export interface IMember {
  id: string;
  name: string;
  currentBalance: number;
  periodicReward: null;
}

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly firestore = inject(FIREBASE_FIRESTORE);
  private readonly destroyRef = inject(DestroyRef);
  private membersListener?: Unsubscribe;
  private readonly memberList = signal<IMember[]>([]);
  private readonly loading = signal(false);
  private readonly loadError = signal<string | null>(null);

  readonly members = this.memberList.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly errorMessage = this.loadError.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.membersListener?.());
  }

  watch(groupId: string): void {
    this.membersListener?.();
    this.loading.set(true);
    this.loadError.set(null);

    const members = query(
      collection(this.firestore, 'groups', groupId, 'members'),
      orderBy('name'),
    );

    this.membersListener = onSnapshot(
      members,
      (snapshot) => {
        this.memberList.set(
          snapshot.docs.map((member) => ({ id: member.id, ...member.data() }) as IMember),
        );
        this.loading.set(false);
      },
      () => {
        this.loadError.set('De kinderen konden niet worden geladen. Probeer het opnieuw.');
        this.loading.set(false);
      },
    );
  }

  async add(groupId: string, name: string): Promise<void> {
    const member = doc(collection(this.firestore, 'groups', groupId, 'members'));
    await setDoc(member, {
      id: member.id,
      name: this.cleanName(name),
      currentBalance: 0,
      periodicReward: null,
      createdAt: serverTimestamp(),
    });
  }

  async rename(groupId: string, memberId: string, name: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'groups', groupId, 'members', memberId), {
      name: this.cleanName(name),
    });
  }

  async remove(groupId: string, memberId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'groups', groupId, 'members', memberId));
  }

  watchMember(
    groupId: string,
    memberId: string,
    onMember: (member: IMember | null) => void,
    onError: () => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(this.firestore, 'groups', groupId, 'members', memberId),
      (snapshot) => {
        onMember(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as IMember) : null);
      },
      onError,
    );
  }

  private cleanName(name: string): string {
    return name.trim();
  }
}

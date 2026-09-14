import { Injectable, inject, signal } from '@angular/core';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../firebase/firebase.providers';

export interface IFamilyGroup {
  id: string;
  name: string;
  createdBy: string;
}

@Injectable({ providedIn: 'root' })
export class Group {
  private readonly firestore = inject(FIREBASE_FIRESTORE);
  private readonly currentGroup = signal<IFamilyGroup | null>(null);

  readonly group = this.currentGroup.asReadonly();

  async ensureInitialGroup(user: User): Promise<void> {
    const groups = collection(this.firestore, 'groups');
    const existingGroups = await getDocs(
      query(groups, where('createdBy', '==', user.uid), limit(1)),
    );

    if (!existingGroups.empty) {
      const existingGroup = existingGroups.docs[0];
      this.currentGroup.set({
        id: existingGroup.id,
        ...existingGroup.data(),
      } as IFamilyGroup);
      return;
    }

    const group = doc(groups);
    await setDoc(group, {
      id: group.id,
      name: 'Familie naam',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    this.currentGroup.set({
      id: group.id,
      name: 'Familie naam',
      createdBy: user.uid,
    });
  }
}

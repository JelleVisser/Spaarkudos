import { Injectable, inject } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class Group {
  private readonly firestore = inject(FIREBASE_FIRESTORE);

  async ensureInitialGroup(user: User): Promise<void> {
    const groups = collection(this.firestore, 'groups');
    const existingGroups = await getDocs(
      query(groups, where('createdBy', '==', user.uid), limit(1)),
    );

    if (!existingGroups.empty) {
      return;
    }

    const group = doc(groups);
    await setDoc(group, {
      id: group.id,
      name: 'Familie naam',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  }
}

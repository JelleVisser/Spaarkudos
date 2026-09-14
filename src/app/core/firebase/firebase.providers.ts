import { InjectionToken, Provider } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('Firebase app');
export const FIREBASE_AUTH = new InjectionToken<Auth>('Firebase authentication');
export const FIREBASE_FIRESTORE = new InjectionToken<Firestore>('Firebase Firestore');

function getFirebaseApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(environment.firebase) : getApp();
}

function getFirebaseAuth(app: FirebaseApp): Auth {
  const auth = getAuth(app);

  if (environment.useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }

  return auth;
}

function getFirebaseFirestore(app: FirebaseApp): Firestore {
  const firestore = getFirestore(app);

  if (environment.useEmulators) {
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }

  return firestore;
}

export function provideFirebase(): Provider[] {
  return [
    { provide: FIREBASE_APP, useFactory: getFirebaseApp },
    { provide: FIREBASE_AUTH, deps: [FIREBASE_APP], useFactory: getFirebaseAuth },
    { provide: FIREBASE_FIRESTORE, deps: [FIREBASE_APP], useFactory: getFirebaseFirestore },
  ];
}

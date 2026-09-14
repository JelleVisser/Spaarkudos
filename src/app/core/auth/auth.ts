import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Group } from '../groups/group';
import { FIREBASE_AUTH } from '../firebase/firebase.providers';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly groupService = inject(Group);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUser = signal<User | null | undefined>(undefined);
  private readonly authError = signal<string | null>(null);
  private readonly signingIn = signal(false);
  private readonly creatingInitialGroup = signal(false);
  private initializationPromise?: Promise<void>;

  readonly user = this.currentUser.asReadonly();
  readonly isReady = computed(() => this.currentUser() !== undefined);
  readonly isSigningIn = this.signingIn.asReadonly();
  readonly isCreatingInitialGroup = this.creatingInitialGroup.asReadonly();
  readonly errorMessage = this.authError.asReadonly();

  initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        (user) => {
          this.currentUser.set(user);

          if (user) {
            void this.createInitialGroup(user);
          } else {
            this.creatingInitialGroup.set(false);
          }

          resolve();
        },
        () => {
          this.currentUser.set(null);
          this.authError.set('Je sessie kon niet worden geladen. Probeer het opnieuw.');
          resolve();
        },
      );

      this.destroyRef.onDestroy(unsubscribe);
    });

    return this.initializationPromise;
  }

  async signIn(): Promise<void> {
    this.authError.set(null);
    this.signingIn.set(true);

    try {
      await signInWithPopup(this.auth, new GoogleAuthProvider());
    } catch (error) {
      this.authError.set(this.getSignInErrorMessage(error));
    } finally {
      this.signingIn.set(false);
    }
  }

  async signOut(): Promise<void> {
    this.authError.set(null);
    await signOut(this.auth);
  }

  private async createInitialGroup(user: User): Promise<void> {
    this.creatingInitialGroup.set(true);
    this.authError.set(null);

    try {
      await this.groupService.ensureInitialGroup(user);
    } catch {
      this.authError.set('Je familiegroep kon niet worden aangemaakt. Probeer het opnieuw.');
    } finally {
      this.creatingInitialGroup.set(false);
    }
  }

  private getSignInErrorMessage(error: unknown): string {
    const errorCode = this.getErrorCode(error);

    switch (errorCode) {
      case 'auth/popup-closed-by-user':
        return 'Aanmelden is geannuleerd.';
      case 'auth/popup-blocked':
        return 'Je browser blokkeerde het aanmeldvenster. Sta pop-ups toe en probeer opnieuw.';
      case 'auth/account-exists-with-different-credential':
        return 'Gebruik dezelfde aanmeldmethode als waarmee je eerder bent aangemeld.';
      case 'auth/operation-not-allowed':
        return 'Deze aanmeldmethode is nog niet geactiveerd.';
      default:
        return 'Aanmelden is niet gelukt. Probeer het opnieuw.';
    }
  }

  private getErrorCode(error: unknown): string | null {
    return typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : null;
  }
}

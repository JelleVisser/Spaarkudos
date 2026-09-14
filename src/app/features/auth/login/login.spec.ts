import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../../../core/auth/auth';
import { Login } from './login';

describe('Login', () => {
  const signIn = vi.fn().mockResolvedValue(undefined);
  const authService = {
    errorMessage: signal<string | null>(null),
    isSigningIn: signal(false),
    signIn,
    user: signal(null),
  };

  beforeEach(async () => {
    signIn.mockClear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compileComponents();
  });

  it('shows Google as the parent sign-in method', async () => {
    const fixture = TestBed.createComponent(Login);

    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toContain('Google');
  });

  it('starts Google sign-in when its button is selected', async () => {
    const fixture = TestBed.createComponent(Login);
    const googleButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    googleButton.click();
    await fixture.whenStable();

    expect(signIn).toHaveBeenCalledWith();
  });
});

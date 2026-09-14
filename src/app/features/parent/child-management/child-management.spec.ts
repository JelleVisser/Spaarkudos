import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Group } from '../../../core/groups/group';
import { MemberService } from '../../../core/members/member';
import { ChildManagement } from './child-management';

describe('ChildManagement', () => {
  const watch = vi.fn();
  const add = vi.fn().mockResolvedValue(undefined);
  const rename = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);
  const groupService = {
    group: signal({ id: 'family-group', name: 'Familie naam', createdBy: 'parent-owner' }),
  };
  const memberService = {
    members: signal([{ id: 'child-1', name: 'Sam', currentBalance: 4, periodicReward: null }]),
    isLoading: signal(false),
    errorMessage: signal<string | null>(null),
    watch,
    add,
    rename,
    remove,
  };

  beforeEach(async () => {
    watch.mockClear();
    add.mockClear();
    rename.mockClear();
    remove.mockClear();

    await TestBed.configureTestingModule({
      imports: [ChildManagement],
      providers: [
        provideRouter([]),
        { provide: Group, useValue: groupService },
        { provide: MemberService, useValue: memberService },
      ],
    }).compileComponents();
  });

  it('loads and displays the children belonging to the current family group', async () => {
    const fixture = TestBed.createComponent(ChildManagement);

    await fixture.whenStable();

    expect(watch).toHaveBeenCalledWith('family-group');
    expect(fixture.nativeElement.textContent).toContain('Sam');
    expect(fixture.nativeElement.textContent).toContain('4 kudos');
  });

  it('adds a child with the entered name', async () => {
    const fixture = TestBed.createComponent(ChildManagement);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('#new-child-name') as HTMLInputElement;

    input.value = 'Lina 🎨';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(add).toHaveBeenCalledWith('family-group', 'Lina 🎨');
  });

  it('requires the matching child name before deletion', async () => {
    const fixture = TestBed.createComponent(ChildManagement);
    await fixture.whenStable();
    const deleteButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Verwijderen'),
    ) as HTMLButtonElement;

    deleteButton.click();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('#delete-confirmation') as HTMLInputElement;
    input.value = 'Sam';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    const confirmButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Definitief verwijderen'),
    ) as HTMLButtonElement;

    confirmButton.click();
    await fixture.whenStable();

    expect(remove).toHaveBeenCalledWith('family-group', 'child-1');
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Group } from '../../../core/groups/group';
import { ShopService } from '../../../core/shop/shop';
import { ShopManagement } from './shop-management';

describe('ShopManagement', () => {
  const watch = vi.fn();
  const add = vi.fn().mockResolvedValue(undefined);
  const shopService = {
    items: signal([]),
    isLoading: signal(false),
    errorMessage: signal<string | null>(null),
    watch,
    stopWatching: vi.fn(),
    add,
    update: vi.fn(),
    remove: vi.fn(),
  };
  const groupService = {
    group: signal({ id: 'family-group', name: 'Familie naam', createdBy: 'parent-owner' }),
  };

  beforeEach(async () => {
    watch.mockClear();
    add.mockClear();
    await TestBed.configureTestingModule({
      imports: [ShopManagement],
      providers: [
        provideRouter([]),
        { provide: Group, useValue: groupService },
        { provide: ShopService, useValue: shopService },
      ],
    }).compileComponents();
  });

  it('loads the current family shop', async () => {
    const fixture = TestBed.createComponent(ShopManagement);

    await fixture.whenStable();

    expect(watch).toHaveBeenCalledWith('family-group');
  });

  it('adds an unlimited-stock item', async () => {
    const fixture = TestBed.createComponent(ShopManagement);
    await fixture.whenStable();
    const description = fixture.nativeElement.querySelector(
      '#item-description',
    ) as HTMLInputElement;
    const cost = fixture.nativeElement.querySelector('#item-cost') as HTMLInputElement;

    description.value = 'Filmavond';
    description.dispatchEvent(new Event('input'));
    cost.value = '5';
    cost.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(add).toHaveBeenCalledWith('family-group', {
      description: 'Filmavond',
      cost: 5,
      stock: null,
    });
  });
});

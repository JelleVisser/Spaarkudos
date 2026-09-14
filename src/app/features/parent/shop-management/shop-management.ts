import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormField, disabled, form, submit, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Group } from '../../../core/groups/group';
import { IShopItem, ShopService } from '../../../core/shop/shop';

interface ShopItemFormModel {
  description: string;
  cost: number;
  unlimitedStock: boolean;
  stock: number;
}

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-shop-management',
  styleUrl: './shop-management.scss',
  templateUrl: './shop-management.html',
})
export class ShopManagement {
  private readonly destroyRef = inject(DestroyRef);
  private readonly groupService = inject(Group);
  private readonly shopService = inject(ShopService);
  private readonly itemModel = signal<ShopItemFormModel>(this.emptyFormModel());
  private readonly editingItem = signal<IShopItem | null>(null);
  private readonly savingItem = signal(false);
  private readonly operationError = signal<string | null>(null);

  protected readonly itemForm = form(this.itemModel, (schema) => {
    validate(schema.description, ({ value }) =>
      value().trim().length === 0
        ? { kind: 'required', message: 'Vul een omschrijving in.' }
        : undefined,
    );
    validate(schema.cost, ({ value }) =>
      value() <= 0
        ? { kind: 'positive-cost', message: 'De kosten moeten hoger zijn dan nul.' }
        : undefined,
    );
    validate(schema.stock, ({ value, valueOf }) =>
      !valueOf(schema.unlimitedStock) && (!Number.isInteger(value()) || value() < 0)
        ? { kind: 'valid-stock', message: 'De voorraad moet nul of hoger zijn.' }
        : undefined,
    );
    disabled(schema.stock, { when: ({ valueOf }) => valueOf(schema.unlimitedStock) });
  });
  protected readonly group = this.groupService.group;
  protected readonly items = this.shopService.items;
  protected readonly isLoading = this.shopService.isLoading;
  protected readonly loadError = this.shopService.errorMessage;
  protected readonly editing = computed(() => this.editingItem());
  protected readonly saving = this.savingItem.asReadonly();
  protected readonly errorMessage = this.operationError.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.shopService.stopWatching());
    effect(() => {
      const group = this.group();
      if (group) {
        this.shopService.watch(group.id);
      }
    });
  }

  protected saveItem(): void {
    submit(this.itemForm, async () => {
      const group = this.group();
      if (!group) {
        return;
      }
      const item = this.toShopItem();
      this.operationError.set(null);
      this.savingItem.set(true);
      try {
        const editingItem = this.editingItem();
        if (editingItem) {
          await this.shopService.update(group.id, editingItem.id, item);
        } else {
          await this.shopService.add(group.id, item);
        }
        this.closeEditor();
      } catch {
        this.operationError.set('Het shopartikel kon niet worden opgeslagen. Probeer het opnieuw.');
      } finally {
        this.savingItem.set(false);
      }
    });
  }

  protected startEditing(item: IShopItem): void {
    this.operationError.set(null);
    this.editingItem.set(item);
    this.itemModel.set({
      description: item.description,
      cost: item.cost,
      unlimitedStock: item.stock === null,
      stock: item.stock ?? 0,
    });
    this.itemForm().reset();
  }

  protected async deleteItem(item: IShopItem): Promise<void> {
    const group = this.group();
    if (!group || !confirm(`Weet je zeker dat je “${item.description}” wilt verwijderen?`)) {
      return;
    }

    this.operationError.set(null);
    try {
      await this.shopService.remove(group.id, item.id);
    } catch {
      this.operationError.set('Het shopartikel kon niet worden verwijderd. Probeer het opnieuw.');
    }
  }

  protected closeEditor(): void {
    this.editingItem.set(null);
    this.itemModel.set(this.emptyFormModel());
    this.itemForm().reset();
  }

  private toShopItem(): Omit<IShopItem, 'id'> {
    const value = this.itemModel();
    return {
      description: value.description,
      cost: value.cost,
      stock: value.unlimitedStock ? null : value.stock,
    };
  }

  private emptyFormModel(): ShopItemFormModel {
    return { description: '', cost: 0, unlimitedStock: true, stock: 0 };
  }
}

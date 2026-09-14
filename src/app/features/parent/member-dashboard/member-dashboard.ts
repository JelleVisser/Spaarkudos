import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Group } from '../../../core/groups/group';
import { IMember, MemberService } from '../../../core/members/member';
import { IShopItem, ShopItemOutOfStockError, ShopService } from '../../../core/shop/shop';
import { TransactionService } from '../../../core/transactions/transaction';
import { BalanceChart } from '../balance-chart/balance-chart';

@Component({
  imports: [BalanceChart, FormField, RouterLink],
  selector: 'app-member-dashboard',
  styleUrl: './member-dashboard.scss',
  templateUrl: './member-dashboard.html',
})
export class MemberDashboard {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly groupService = inject(Group);
  private readonly memberService = inject(MemberService);
  private readonly transactionService = inject(TransactionService);
  private readonly shopService = inject(ShopService);
  private readonly adjustmentModel = signal({ amount: 0, reason: '' });
  private readonly selectedMember = signal<IMember | null>(null);
  private readonly error = signal<string | null>(null);
  private readonly savingAdjustment = signal(false);
  private readonly fulfillingItemId = signal('');
  private readonly pendingFulfillment = signal<IShopItem | null>(null);
  private readonly fulfillmentError = signal<string | null>(null);
  private memberUnsubscribe?: () => void;
  private readonly memberId = this.route.snapshot.paramMap.get('memberId') ?? '';

  protected readonly adjustmentForm = form(this.adjustmentModel, (schema) => {
    validate(schema.amount, ({ value }) =>
      value() === 0
        ? { kind: 'zero-amount', message: 'Vul een aantal kudos in, behalve nul.' }
        : undefined,
    );
    validate(schema.reason, ({ value }) =>
      value().trim().length === 0 ? { kind: 'required', message: 'Vul een reden in.' } : undefined,
    );
  });
  protected readonly group = this.groupService.group;
  protected readonly member = this.selectedMember.asReadonly();
  protected readonly transactions = this.transactionService.transactions;
  protected readonly transactionsLoading = this.transactionService.isLoading;
  protected readonly transactionError = this.transactionService.errorMessage;
  protected readonly errorMessage = this.error.asReadonly();
  protected readonly saving = this.savingAdjustment.asReadonly();
  protected readonly shopItems = this.shopService.items;
  protected readonly shopLoading = this.shopService.isLoading;
  protected readonly fulfillmentErrorMessage = this.fulfillmentError.asReadonly();
  protected readonly fulfilling = this.fulfillingItemId.asReadonly();
  protected readonly pendingItem = this.pendingFulfillment.asReadonly();
  protected readonly transactionRows = computed(() => [...this.transactions()].reverse());
  protected readonly childDashboardRoute = computed(() => {
    const group = this.group();
    return group ? ['/group', group.id, 'member', this.memberId] : [];
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.memberUnsubscribe?.();
      this.transactionService.stopWatching();
      this.shopService.stopWatching();
    });
    effect(() => {
      const group = this.group();
      if (group && this.memberId) {
        this.watchMember(group.id);
        this.transactionService.watch(group.id, this.memberId);
        this.shopService.watch(group.id);
      }
    });
  }

  protected requestFulfillment(item: IShopItem): void {
    if (item.stock === 0 || this.fulfillingItemId()) {
      return;
    }
    this.fulfillmentError.set(null);
    this.pendingFulfillment.set(item);
  }

  protected cancelFulfillment(): void {
    if (!this.fulfillingItemId()) {
      this.pendingFulfillment.set(null);
    }
  }

  protected async confirmFulfillment(): Promise<void> {
    const item = this.pendingFulfillment();
    const group = this.group();
    if (!item || !group || !this.member() || item.stock === 0) {
      return;
    }

    this.fulfillmentError.set(null);
    this.fulfillingItemId.set(item.id);
    try {
      await this.shopService.fulfill(group.id, this.memberId, item.id);
    } catch (error) {
      this.fulfillmentError.set(
        error instanceof ShopItemOutOfStockError
          ? 'Dit artikel is niet meer op voorraad.'
          : 'De aankoop kon niet worden verwerkt. Probeer het opnieuw.',
      );
    } finally {
      this.fulfillingItemId.set('');
      this.pendingFulfillment.set(null);
    }
  }

  protected addAdjustment(): void {
    submit(this.adjustmentForm, async () => {
      const group = this.group();
      if (!group || !this.member()) {
        return;
      }

      this.error.set(null);
      this.savingAdjustment.set(true);
      try {
        await this.transactionService.addManualAdjustment(
          group.id,
          this.memberId,
          this.adjustmentModel().amount,
          this.adjustmentModel().reason,
        );
        this.adjustmentModel.set({ amount: 0, reason: '' });
        this.adjustmentForm().reset();
      } catch {
        this.error.set('De saldoaanpassing kon niet worden opgeslagen. Probeer het opnieuw.');
      } finally {
        this.savingAdjustment.set(false);
      }
    });
  }

  private watchMember(groupId: string): void {
    this.memberUnsubscribe?.();
    this.memberUnsubscribe = this.memberService.watchMember(
      groupId,
      this.memberId,
      (member) => this.selectedMember.set(member),
      () => this.error.set('Dit kind kon niet worden geladen.'),
    );
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import confetti from 'canvas-confetti';
import {
  ChildDashboardApi,
  ChildDashboardData,
} from '../../../core/child-dashboard/child-dashboard-api';
import { BalanceChart } from '../../parent/balance-chart/balance-chart';

@Component({
  imports: [BalanceChart],
  selector: 'app-child-dashboard',
  styleUrl: './child-dashboard.scss',
  templateUrl: './child-dashboard.html',
})
export class ChildDashboard {
  private readonly route = inject(ActivatedRoute);
  private readonly childDashboardApi = inject(ChildDashboardApi);
  private readonly dashboardData = signal<ChildDashboardData | null>(null);
  private readonly loadingState = signal(true);
  private readonly errorState = signal(false);
  private readonly selectedReward = signal<ChildDashboardData['shopItems'][number] | null>(null);

  protected readonly data = this.dashboardData.asReadonly();
  protected readonly isLoading = this.loadingState.asReadonly();
  protected readonly hasError = this.errorState.asReadonly();
  protected readonly requestedReward = this.selectedReward.asReadonly();
  protected readonly transactionRows = computed(() =>
    [...(this.data()?.transactions ?? [])].reverse(),
  );

  constructor() {
    const groupId = this.route.snapshot.paramMap.get('groupId') ?? '';
    const memberId = this.route.snapshot.paramMap.get('memberId') ?? '';
    void this.load(groupId, memberId);
  }

  protected celebrate(reward: ChildDashboardData['shopItems'][number]): void {
    if ((this.data()?.member.currentBalance ?? 0) < reward.cost || reward.stock === 0) {
      return;
    }
    void confetti({
      colors: ['#4c327d', '#6b46c1', '#f4b400', '#55c1a7'],
      particleCount: 90,
      spread: 65,
    });
    this.selectedReward.set(reward);
  }

  protected closeRewardMessage(): void {
    this.selectedReward.set(null);
  }

  private async load(groupId: string, memberId: string): Promise<void> {
    if (!groupId || !memberId) {
      this.errorState.set(true);
      this.loadingState.set(false);
      return;
    }

    try {
      this.dashboardData.set(await this.childDashboardApi.getDashboard(groupId, memberId));
    } catch {
      this.errorState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }
}

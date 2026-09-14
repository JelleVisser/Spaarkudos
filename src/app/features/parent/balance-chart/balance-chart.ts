import { Component, ElementRef, afterRenderEffect, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ITransaction } from '../../../core/transactions/transaction';

Chart.register(...registerables);

@Component({
  selector: 'app-balance-chart',
  styleUrl: './balance-chart.scss',
  templateUrl: './balance-chart.html',
})
export class BalanceChart {
  readonly transactions = input.required<ITransaction[]>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterRenderEffect({
      write: (onCleanup) => {
        const canvas = this.canvas().nativeElement;
        const transactions = this.transactions();
        const chart = new Chart(canvas, this.configuration(transactions));
        onCleanup(() => chart.destroy());
      },
    });
  }

  private configuration(transactions: ITransaction[]): ChartConfiguration<'line'> {
    let balance = 0;
    const labels = transactions.map((transaction) => this.formatDate(transaction.createdAt));
    const balances = transactions.map((transaction) => {
      balance += transaction.amount;
      return balance;
    });

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            borderColor: '#6b46c1',
            data: balances,
            fill: false,
            label: 'Kudos-saldo',
            tension: 0.25,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        scales: { y: { ticks: { precision: 0 } } },
      },
    };
  }

  private formatDate(timestamp: ITransaction['createdAt']): string {
    return timestamp
      ? new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(
          timestamp.toDate(),
        )
      : 'Nu';
  }
}

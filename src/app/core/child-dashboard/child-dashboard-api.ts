import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ChildDashboardData {
  member: {
    id: string;
    name: string;
    currentBalance: number;
  };
  transactions: {
    id: string;
    amount: number;
    reason: string;
    type: 'manual' | 'periodic' | 'purchase';
    createdAt: string | null;
  }[];
  shopItems: {
    id: string;
    description: string;
    cost: number;
    stock: number | null;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ChildDashboardApi {
  async getDashboard(groupId: string, memberId: string): Promise<ChildDashboardData> {
    const url = new URL(this.endpoint());
    url.searchParams.set('groupId', groupId);
    url.searchParams.set('memberId', memberId);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Child dashboard request failed: ${response.status}`);
    }
    return (await response.json()) as ChildDashboardData;
  }

  private endpoint(): string {
    if (environment.useEmulators) {
      return `http://127.0.0.1:5001/${environment.firebase.projectId}/europe-west1/childDashboard`;
    }
    return `https://europe-west1-${environment.firebase.projectId}.cloudfunctions.net/childDashboard`;
  }
}

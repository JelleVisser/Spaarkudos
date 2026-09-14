import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();

setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 10,
});

export const healthCheck = onRequest((request, response) => {
  if (request.method !== 'GET') {
    response.status(405).send('Method Not Allowed');
    return;
  }

  response.status(200).json({ status: 'ok' });
});

export const childDashboard = onRequest({ cors: true }, async (request, response) => {
  if (request.method !== 'GET') {
    response.status(405).send('Method Not Allowed');
    return;
  }

  const groupId = request.query['groupId'];
  const memberId = request.query['memberId'];
  if (typeof groupId !== 'string' || typeof memberId !== 'string' || !groupId || !memberId) {
    response.status(400).json({ error: 'A valid groupId and memberId are required.' });
    return;
  }

  const firestore = getFirestore();
  const group = firestore.collection('groups').doc(groupId);
  const member = group.collection('members').doc(memberId);
  const [groupSnapshot, memberSnapshot, transactionsSnapshot, shopItemsSnapshot] =
    await Promise.all([
      group.get(),
      member.get(),
      group.collection('transactions').where('memberId', '==', memberId).get(),
      group.collection('shopItems').get(),
    ]);

  if (!groupSnapshot.exists || !memberSnapshot.exists) {
    response.status(404).json({ error: 'Child dashboard not found.' });
    return;
  }

  const memberData = memberSnapshot.data();
  const transactions = transactionsSnapshot.docs
    .map((transaction) => {
      const data = transaction.data();
      return {
        id: transaction.id,
        amount: data['amount'],
        reason: data['reason'],
        type: data['type'],
        createdAt: data['createdAt']?.toDate().toISOString() ?? null,
      };
    })
    .sort((first, second) => (first.createdAt ?? '').localeCompare(second.createdAt ?? ''));
  const shopItems = shopItemsSnapshot.docs
    .map((item) => {
      const data = item.data();
      return {
        id: item.id,
        description: data['description'],
        cost: data['cost'],
        stock: data['stock'] ?? null,
      };
    })
    .sort((first, second) => first.description.localeCompare(second.description));

  response.status(200).json({
    member: {
      id: memberSnapshot.id,
      name: memberData?.['name'],
      currentBalance: memberData?.['currentBalance'],
    },
    transactions,
    shopItems,
  });
});

type PeriodicRewardInterval = 'daily' | 'weekly' | 'monthly';

const periodicSchedules: Record<PeriodicRewardInterval, string> = {
  daily: '0 6 * * *',
  weekly: '0 6 * * 1',
  monthly: '0 6 1 * *',
};

async function applyPeriodicRewards(interval: PeriodicRewardInterval): Promise<void> {
  const firestore = getFirestore();
  const members = await firestore.collectionGroup('members').get();
  const eligibleMembers = members.docs.filter((member) => {
    const periodicReward = member.data()['periodicReward'];
    return periodicReward?.enabled === true && periodicReward.interval === interval;
  });

  await Promise.all(
    eligibleMembers.map(async (member) => {
      const group = member.ref.parent.parent;
      if (!group) {
        return;
      }

      await firestore.runTransaction(async (transaction) => {
        const memberSnapshot = await transaction.get(member.ref);
        const periodicReward = memberSnapshot.data()?.['periodicReward'];
        if (
          !memberSnapshot.exists ||
          periodicReward?.enabled !== true ||
          periodicReward.interval !== interval ||
          typeof periodicReward.amount !== 'number' ||
          periodicReward.amount <= 0
        ) {
          return;
        }

        const currentBalance = Number(memberSnapshot.data()?.['currentBalance'] ?? 0);
        const transactionReference = group.collection('transactions').doc();
        transaction.update(member.ref, { currentBalance: currentBalance + periodicReward.amount });
        transaction.set(transactionReference, {
          id: transactionReference.id,
          memberId: member.id,
          amount: periodicReward.amount,
          reason: 'Automatic periodic credit',
          type: 'periodic',
          createdAt: new Date(),
        });
      });
    }),
  );
}

export const applyDailyPeriodicRewards = onSchedule(
  { schedule: periodicSchedules.daily, timeZone: 'Europe/Amsterdam' },
  () => applyPeriodicRewards('daily'),
);

export const applyWeeklyPeriodicRewards = onSchedule(
  { schedule: periodicSchedules.weekly, timeZone: 'Europe/Amsterdam' },
  () => applyPeriodicRewards('weekly'),
);

export const applyMonthlyPeriodicRewards = onSchedule(
  { schedule: periodicSchedules.monthly, timeZone: 'Europe/Amsterdam' },
  () => applyPeriodicRewards('monthly'),
);

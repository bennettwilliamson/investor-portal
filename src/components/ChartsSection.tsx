'use client';

import dynamic from 'next/dynamic';
import styles from '@/app/page.module.scss';

const BalanceFlowChart = dynamic(() => import('@/components/BalanceFlowChart'), { ssr: false });
const ReturnCombo = dynamic(() => import('@/components/ReturnCombo'), { ssr: false });

export default function ChartsSection() {
  return (
    <>
      <div className={styles.chart}>
        <BalanceFlowChart />
      </div>
      <div className={styles.chart}>
        <ReturnCombo />
      </div>
    </>
  );
} 
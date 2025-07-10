import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import dashboardData from '@/data/dashboardData';
import styles from './page.module.scss';
import dynamic from 'next/dynamic';

// Lazy-load chart components to avoid SSR issues with recharts
const BalanceFlowChart = dynamic(() => import('@/components/BalanceFlowChart'), { ssr: false });
const ReturnCombo = dynamic(() => import('@/components/ReturnCombo'), { ssr: false });

export default function Home() {
  const { welcome, stats, historical } = dashboardData;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.welcome}>
          <h1>{welcome.text}</h1>
          <div className={styles.statGrid}>
            {stats.map(({ label, value }) => (
              <StatCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>

        <section className={styles.historical}>
          <h2>Your Historical Returns</h2>
          <div className={styles.statGrid}>
            {historical.map(({ label, value }) => (
              <StatCard key={label} label={label} value={value} />
            ))}
          </div>
          <div className={styles.chart}>
            <BalanceFlowChart />
          </div>
          <div className={styles.chart}>
            <ReturnCombo />
          </div>
        </section>
      </main>
    </>
  );
} 
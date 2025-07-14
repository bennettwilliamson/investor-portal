import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import dashboardData from '@/data/dashboardData';
import styles from './page.module.scss';
import BalanceFlowChart from '@/components/BalanceFlowChart';
import ReturnCombo from '@/components/ReturnCombo';

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
          {/* Charts */}
          <div className={styles.charts}>
            <div className={styles.chartWrapper}>
              <BalanceFlowChart style={{ width: '100%', height: '100%' }} />
            </div>
            <div className={styles.chartWrapper}>
              <ReturnCombo style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
} 
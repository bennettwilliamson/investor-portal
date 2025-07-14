import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.address}>250 East Eagles Gate Dr. Suite 340 Eagle, ID 83616</p>
      </div>
    </footer>
  );
} 
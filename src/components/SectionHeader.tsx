import styles from './SectionHeader.module.scss';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader = ({ title }: SectionHeaderProps) => {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
};

export default SectionHeader; 
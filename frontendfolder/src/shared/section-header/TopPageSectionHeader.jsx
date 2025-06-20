import { useNavigate } from "react-router-dom";
import styles from "./TopPageSectionHeader.module.css";
import MediumButtons from "../buttons/MediumButtons";

export default function TopPageSectionHeader({
  root,
  currentPage,
  rootNavigatePage,
  title,
  buttonType,
  buttonNavigation,
  deleteModalOpen,
}) {
  const navigate = useNavigate();

  return (
    <main className={styles.topPageSectionHeader}>
      <section className={styles.breadcrumbNavigation}>
        <ul>
          <li>
            <a onClick={() => navigate(rootNavigatePage)}>{root}</a>
          </li>
          <li>{currentPage}</li>
        </ul>
      </section>
      <section className={styles.title}>
        <h1>{title}</h1>
        {buttonType && (
          <MediumButtons
            type={buttonType}
            navigatePage={buttonNavigation}
            deleteModalOpen={deleteModalOpen}
          />
        )}
      </section>
    </main>
  );
}
  
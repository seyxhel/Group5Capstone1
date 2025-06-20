import { useNavigate } from 'react-router-dom';
import styles from './MediumButtons.module.css';

export default function MediumButtons({ type, navigatePage = null, deleteModalOpen }) {
  const navigate = useNavigate();
  const lowerType = type.toLowerCase();
  const icon = icons[lowerType];

  const handleClick = () => {
    if (navigatePage) {
      navigate(navigatePage);
    } else if (typeof deleteModalOpen === 'function') {
      deleteModalOpen();
    }
  };

  return (
    <button
      type="button"
      className={`${styles.mediumButton} ${styles[lowerType]}`}
      onClick={handleClick}
    >
      {icon && <img src={icon} alt={`${type} icon`} />}
      <span>{type.replace(/-/g, ' ')}</span>
    </button>
  );
}

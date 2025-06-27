import { FaEdit, FaTimes, FaEye, FaUndoAlt } from "react-icons/fa";
import styles from "./TicketActions.module.css";

const isWithdrawAllowed = (status = "") => {
  const normalized = status.toLowerCase();
  return ["new", "pending", "submitted", "open", "on progress", "on hold"].includes(normalized);
};

const isCloseAllowed = (status = "") => {
  const normalized = status.toLowerCase();
  return ["new", "pending", "submitted", "open", "on progress", "on hold", "resolved"].includes(normalized);
};

const actionMap = {
  edit: {
    icon: FaEdit,
    className: styles.edit,
    handler: "onEdit",
    isAllowed: (status) => ["new", "pending", "submitted", "open"].includes(status.toLowerCase()),
  },
  delete: {
    icon: FaTimes,
    className: styles.delete,
    handler: "onDelete",
    isAllowed: isCloseAllowed,
  },
  view: {
    icon: FaEye,
    className: styles.view,
    handler: "onView",
    isAllowed: () => true,
  },
  withdraw: {
    icon: FaUndoAlt,
    className: styles.withdraw,
    handler: "onWithdraw",
    isAllowed: isWithdrawAllowed,
  },
};

const getTicketActions = (type, row, handlers = {}) => {
  const config = actionMap[type];
  if (!config) return null;

  const { icon: Icon, className, handler, isAllowed } = config;
  const disabled = !isAllowed(row.status);

  return (
    <button
      className={`${styles.btn} ${className}`}
      disabled={disabled}
      onClick={() => !disabled && handlers[handler]?.(row)}
    >
      <Icon className={styles.icon} />
    </button>
  );
};

export default getTicketActions;

import { FaEdit, FaTimes, FaEye } from "react-icons/fa";

const isActionAllowed = (status) => ["New", "Pending"].includes(status);

const getTicketActions = (type, row, { onEdit, onDelete, onView } = {}) => {
  const isAllowed = isActionAllowed(row.status);

  switch (type) {
    case "edit":
      return (
        <button
          className="action-btn action-btn-edit"
          disabled={!isAllowed}
          onClick={() => isAllowed && onEdit?.(row)}
        >
          <FaEdit className="action-icon" />
        </button>
      );

    case "delete":
      return (
        <button
          className="action-btn action-btn-delete"
          disabled={!isAllowed}
          onClick={() => isAllowed && onDelete?.(row)}
        >
          <FaTimes className="action-icon" />
        </button>
      );

    case "view":
      return (
        <button
          className="action-btn action-btn-view"
          onClick={() => onView?.(row)}
        >
          <FaEye className="action-icon" />
        </button>
      );

    default:
      return null;
  }
};

export default getTicketActions;

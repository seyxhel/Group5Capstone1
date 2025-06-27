import { FaCheck, FaTimes, FaEye } from "react-icons/fa";

const isUserActionAllowed = (status) => status === "Pending";

const getUserActions = (type, row, { onApprove, onReject, onView } = {}) => {
  const isAllowed = isUserActionAllowed(row.status);

  switch (type) {
    case "approve":
      return (
        <button
          className="action-btn action-btn-approve"
          disabled={!isAllowed}
          onClick={() => isAllowed && onApprove?.(row)}
        >
          <FaCheck className="action-icon" />
        </button>
      );

    case "reject":
      return (
        <button
          className="action-btn action-btn-reject"
          disabled={!isAllowed}
          onClick={() => isAllowed && onReject?.(row)}
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

export default getUserActions;

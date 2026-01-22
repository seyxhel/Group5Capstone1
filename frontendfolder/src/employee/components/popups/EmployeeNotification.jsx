import React from 'react';
import { HiOutlineDocumentAdd } from 'react-icons/hi';
import { MdUpdate } from 'react-icons/md';
import Notification from '../../../shared/notification/Notification';
import authService from '../../../utilities/service/authService';
import {
  getRecentNotifications,
  getUnreadCount,
  deleteNotification,
  clearAllNotifications,
  markAllAsRead,
} from '../../../utilities/storages/notificationStorage';

const EmployeeNotification = ({ show, onClose, onCountChange, anchorRef }) => {
  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;

  const [notifications, setNotifications] = React.useState([]);

  const reload = React.useCallback(() => {
    try {
      if (!userId) return;
      const items = getRecentNotifications(userId);
      setNotifications(items);
      if (typeof onCountChange === 'function') {
        const unread = getUnreadCount(userId);
        onCountChange(unread);
      }
    } catch (e) {
      // ignore
    }
  }, [userId, onCountChange]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  // When the dropdown is opened, mark notifications as read (optional UX).
  React.useEffect(() => {
    try {
      if (show && userId) {
        // Mark all as read and refresh counts
        markAllAsRead(userId);
        reload();
      }
    } catch (e) {}
  }, [show, userId, reload]);

  const handleDelete = (id) => {
    try {
      deleteNotification(id);
      reload();
    } catch (e) {}
  };

  const handleClearAll = () => {
    try {
      clearAllNotifications(userId);
      reload();
    } catch (e) {}
  };

  return (
    <Notification
      items={notifications}
      open={show}
      onClose={onClose}
      onDelete={handleDelete}
      onClear={handleClearAll}
      title="Notifications"
      anchorRef={anchorRef}
    />
  );
};

export default EmployeeNotification;
import { HiOutlineDocumentAdd } from 'react-icons/hi';
import { MdUpdate } from 'react-icons/md';
import { createRoleNotifications } from '../../../shared/notification/Notification';

const initialNotifications = [
  {
    id: 'c1',
    icon: <HiOutlineDocumentAdd size={20} />,
    title: 'New Ticket Submitted',
    message: 'A new support ticket was submitted by an employee.',
    time: '2 minutes ago',
  },
  {
    id: 'c2',
    icon: <MdUpdate size={20} />,
    title: 'User Approval Needed',
    message: 'You have pending user requests that need review.',
    time: '1 hour ago',
  },
  {
    id: 'c3',
    icon: <HiOutlineDocumentAdd size={20} />,
    title: 'System Maintenance',
    message: 'Scheduled maintenance will begin tonight at 10 PM.',
    time: '3 hours ago',
  },
];

const CoordinatorAdminNotifications = createRoleNotifications(
  initialNotifications,
  'Coordinator Notifications'
);

export default CoordinatorAdminNotifications;

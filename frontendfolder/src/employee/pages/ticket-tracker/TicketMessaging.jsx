import { useState } from 'react';
import styles from './TicketMessaging.module.css';

const formatDate = (date) =>
  date ? new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'None';

export default function TicketMessaging({ initialMessages }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: 'You',
        message: newMessage,
        timestamp: formatDate(new Date().toISOString()),
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.messagesContent}>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.sender === 'You' ? styles.myMessage : styles.theirMessage}>
          <div className={styles.messageSender}>{msg.sender}</div>
          <div className={styles.messageText}>{msg.message}</div>
          <div className={styles.messageTimestamp}>{msg.timestamp}</div>
        </div>
      ))}
      <div className={styles.messageInputContainer}>
        <textarea
          className={styles.messageInput}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

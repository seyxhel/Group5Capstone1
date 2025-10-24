import { useState } from 'react';
import styles from './TicketMessaging.module.css';
import { backendTicketService } from '../../../services/backend/ticketService';

// Format to MM/DD/YY, HH:MM AM/PM
const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return '';
  }
};

export default function TicketMessaging({ ticketId, initialMessages = [], onCommentCreated }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    setSending(true);
    try {
      // Persist to backend (employee comments are non-internal)
      const created = await backendTicketService.createComment(ticketId, text, false);

      // Normalized returned shape: may include created_at, comment, user
      const createdAt = created.created_at || created.createdAt || created.timestamp || new Date().toISOString();
      const commentText = created.comment || created.comment_text || created.message || text;

      const mapped = {
        id: created.id || Math.random().toString(36).slice(2, 9),
        sender: 'You',
        message: commentText,
        timestamp: formatDate(createdAt),
        raw: created,
      };

      setMessages((m) => [...m, mapped]);
      setNewMessage('');

      if (typeof onCommentCreated === 'function') onCommentCreated(created);
    } catch (err) {
      console.error('Failed to send comment:', err);
      // Optional: show toast here
    } finally {
      setSending(false);
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
          disabled={sending}
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

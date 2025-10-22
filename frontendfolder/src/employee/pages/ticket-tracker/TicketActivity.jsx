import React, { useState, useEffect } from 'react';
import styles from './TicketActivity.module.css';

export default function TicketActivity({ ticketLogs = [], initialMessages = [] }) {
  const [activeTab, setActiveTab] = useState('logs');
  const [messages, setMessages] = useState(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // initialize messages when initialMessages changes
    if ((messages?.length || 0) === 0 && initialMessages?.length) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: 'You',
        message: newMessage,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      };
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage('');
      setActiveTab('message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabContent}>
        {activeTab === 'logs' ? (
          <div className={styles.logsContent}>
            {ticketLogs.map((log) => (
              <div key={log.id} className={styles.logEntry}>
                <div className={styles.logUser}>{log.user}</div>
                <div className={styles.logAction}>{log.action}</div>
                <div className={styles.logTimestamp}>{log.timestamp}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.messageSection}>
            <div className={styles.messagesContent}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.messageEntry} ${msg.sender === 'You' ? styles.myMessage : styles.theirMessage}`}
                >
                  <div className={styles.messageSender}>{msg.sender}</div>
                  <div className={styles.messageText}>{msg.message}</div>
                  <div className={styles.messageTimestamp}>{msg.timestamp}</div>
                </div>
              ))}
            </div>

            <div className={styles.messageInputContainer}>
              <textarea
                className={styles.messageInput}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={2}
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
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { FiPaperclip, FiSend, FiMoreHorizontal, FiX, FiChevronDown, FiVolume2 } from "react-icons/fi";
import MapLogo from "../../../../shared/assets/MapLogo.png";
import styles from "./EmployeeChatbot.module.css";

const EmployeeChatbot = ({ closeModal }) => {
  const [messages, setMessages] = useState([]);
  const welcomeMessage = {
    text: "Hi there! 👋 I'm PAXI, your go-to support buddy.\nHow can I assist you today?",
    sender: "bot",
    isList: false,
    suggestions: [
      { label: 'Tickets Help', type: 'redirect', route: '/employee/tickets' },
      { label: 'Recommend Solutions', type: 'redirect', route: '/employee/frequently-asked-questions' },
      { label: 'Fill Out Forms', type: 'prefill', route: '/employee/submit-ticket' }
    ]
  };

  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle scroll detection for down arrow button
  useEffect(() => {
    const chatMessages = chatMessagesRef.current;
    if (!chatMessages) return;

    const handleScroll = () => {
      // Since we use column-reverse, scrollTop > 0 means scrolled away from bottom
      setShowScrollButton(chatMessages.scrollTop > 100);
    };

    chatMessages.addEventListener('scroll', handleScroll);
    return () => chatMessages.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = 0; // For column-reverse
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Show welcome message with typing effect on open
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([welcomeMessage]);
        setIsTyping(false);
      }, 900);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = getBotResponse(inputValue);
      setMessages((prev) => [
        ...prev,
        {
          text: botResponse.text,
          sender: "bot",
          isList: botResponse.isList,
          listItems: botResponse.listItems,
          suggestions: botResponse.suggestions,
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes("hardware") || msg.includes("software")) {
      return {
        text: "For hardware vs software issues, try the following steps:",
        isList: true,
        listItems: [
          "✅ Restart your device",
          "✅ Check if others have the same issue",
          "✅ Look for error messages",
          "✅ Contact IT support for diagnosis",
        ],
        suggestions: [
          { label: 'Open FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' },
          { label: 'Submit a Ticket', type: 'prefill', route: '/employee/submit-ticket' }
        ]
      };
    }
    if (msg.includes('password') || msg.includes('forgot') || msg.includes('change password')) {
      return {
        text: "If you need to change or reset your password, you can go to your settings to update it or follow the reset flow.",
        isList: false,
        suggestions: [
          { label: 'Reset / Change Password', type: 'redirect', route: '/employee/settings' },
          { label: 'How to reset password (KB)', type: 'redirect', route: '/employee/frequently-asked-questions' },
        ],
      };
    }
    if (msg.includes('submit') || msg.includes('create ticket') || msg.includes('open ticket') || msg.includes('report')) {
      return {
        text: "I can help you open a ticket. Would you like me to pre-fill a ticket form for you based on your message?",
        isList: false,
        suggestions: [
          { label: 'Open pre-filled ticket', type: 'prefill', route: '/employee/submit-ticket' },
          { label: 'Browse ticket categories', type: 'redirect', route: '/employee/faq' },
        ],
      };
    }
    if (msg.includes('faq') || msg.includes('help article') || msg.includes('knowledge')) {
      return {
        text: 'Here are some frequently asked questions and articles that might help:',
        isList: false,
        suggestions: [
          { label: 'Open FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' },
        ],
      };
    }
    return {
      text: "Thanks for your message! Would you like to browse solutions, FAQs, or open a ticket?",
      isList: false,
      suggestions: [
        { label: 'Open FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' },
        { label: 'Submit a Ticket', type: 'prefill', route: '/employee/submit-ticket' },
        { label: 'Reset Password', type: 'redirect', route: '/employee/settings' }
      ]
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const userMessage = {
        text: `📌 You uploaded: ${file.name}`,
        sender: "user",
      };
      setMessages((prev) => [...prev, userMessage]);
    }
  };

  // Remove emoji from text for TTS
  const stripEmojis = (str) =>
    str.replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu, '').replace(/\s{2,}/g, ' ').trim();

  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        let toSpeak = Array.isArray(text) ? text.join('. ') : text;
        toSpeak = stripEmojis(toSpeak);
        // Replace all variants of PAXI with 'pak c' for TTS
        toSpeak = toSpeak.replace(/PAXI/gi, 'pak c');
        const utter = new SpeechSynthesisUtterance(toSpeak);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch (e) {
        // ignore
      }
    }
  };

  const renderMessage = (msg, index) => {
    // Generate a real-time timestamp for each message
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div key={index} className={styles['message-wrapper']}>
        <div
          className={`${styles.message} ${
            msg.sender === "user" ? styles["user-message"] : styles["bot-message"]
          }`}
          style={msg.sender === 'user' ? { color: '#fff' } : {}}
        >
          {msg.isList && msg.listItems ? (
            <>
              <p className={msg.sender === 'user' ? styles['user-message-text'] : ''}>{msg.text}</p>
              <ul className={styles.botFeaturesList}>
                {msg.listItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          ) : (
            msg.text.split("\n").map((line, i) => (
              <p key={i} className={msg.sender === 'user' ? styles['user-message-text'] : ''}>{line}</p>
            ))
          )}
        </div>

        {/* Ellipsis and timestamp below the message bubble for both user and bot */}
        <div
          className={
            msg.sender === 'user'
              ? `${styles['message-actions-below']} ${styles['message-actions-below-user']}`
              : styles['message-actions-below']
          }
        >
          {msg.sender === 'bot' ? (
            <>
              <div className={styles['ellipsis-wrapper']}>
                <button
                  className={styles['ellipsis-btn']}
                  onClick={() => setMenuOpenIndex(menuOpenIndex === index ? null : index)}
                  aria-label="More"
                  title="More"
                >
                  <FiMoreHorizontal />
                </button>
                {menuOpenIndex === index && (
                  <div className={styles['ellipsis-menu']}>
                    <button
                      className={styles['ellipsis-menu-item']}
                      onClick={() => {
                        speakText(msg.isList && Array.isArray(msg.listItems) ? `${msg.text} ${msg.listItems.join('. ')}` : msg.text);
                        setMenuOpenIndex(null);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <FiVolume2 style={{ fontSize: 18 }} />
                      Read Aloud
                    </button>
                  </div>
                )}
              </div>
              <span className={styles['message-timestamp']}>{timeString}</span>
            </>
          ) : (
            <span className={styles['message-timestamp']}>{timeString}</span>
          )}
        </div>

        {/* Suggestion buttons outside the message bubble for bot messages */}
        {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
          <div className={styles['suggestions-row-outside-column']}>
            {msg.suggestions.map((sugg, i) => (
              <button
                key={i}
                className={styles['suggestion-btn-rect']}
                onClick={() => {
                  if (sugg.type === 'redirect') {
                    navigate(sugg.route);
                  } else if (sugg.type === 'prefill') {
                    const lastUserMsg = messages.filter(m => m.sender === 'user').slice(-1)[0];
                    const prefill = {
                      subject: lastUserMsg?.text?.slice(0, 60) || 'Support request',
                      description: lastUserMsg?.text || '',
                    };
                    navigate(sugg.route, { state: { prefill } });
                  }
                }}
              >
                {sugg.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles["chatbot-container"]}>
      <div className={styles["chat-window"]}>
        <div className={styles["chat-header"]}>
          <div className={styles["chat-header-logo"]}>
            <img src={MapLogo} alt="Map Logo" className={styles["map-logo"]} />
            <h3>PAXI</h3>
          </div>
          <button className={styles["close-btn"]} onClick={closeModal}>
            <FiX />
          </button>
        </div>

        <div className={styles["chat-messages"]} ref={chatMessagesRef}>
          {isTyping && (
            <div
              className={`${styles.message} ${styles["bot-message"]} ${styles["typing-indicator"]}`}
              aria-label="Bot is typing"
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          {messages.slice().reverse().map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button 
            className={styles["scroll-to-bottom"]} 
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <FiChevronDown />
          </button>
        )}

        <div className={styles["chat-input-container"]}>
          <div className={styles["chat-input-area"]}>
            <label className={styles["upload-btn"]}>
              <input type="file" onChange={handleFileUpload} hidden />
              <FiPaperclip className={styles["upload-icon"]} />
            </label>
            <input
              type="text"
              placeholder="What's your message?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
            <button className={styles["send-btn"]} onClick={handleSend}>
              <FiSend size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeChatbot;
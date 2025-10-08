import { useState, useEffect, useRef } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";
import MapLogo from "../../../../shared/assets/MapLogo.png";
import styles from "./EmployeeChatbot.module.css";

const EmployeeChatbot = ({ closeModal }) => {
  const [messages, setMessages] = useState([
    {
      text: "👋 Hello there!\n\nI'm PAXI, your go-to support buddy! Need help with something?\nDon’t worry—I've got you covered. Here's what I can do for you:\n\n✅ Troubleshoot common issues (slow computer, lost password, connection problems? No problem!)\n✅ Help you submit a support request if you need IT assistance\n✅ Provide updates on your ticket status so you always know what's happening\n✅ Share quick tech tips to make your work easier\n\n📝 Let’s get started! How can I help today? 😊",
      sender: "bot",
      isList: false,
    },
    {
      text: "What should I do if I encounter a technical issue with my computer, but I’m not sure whether it’s hardware or software-related?",
      sender: "user",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      };
    }
    return {
      text: "Thanks for your message! We'll get back to you shortly.",
      isList: false,
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

  const renderMessage = (msg, index) => (
    <div
      key={index}
      className={`${styles.message} ${
        msg.sender === "user" ? styles["user-message"] : styles["bot-message"]
      }`}
    >
      {msg.isList && msg.listItems ? (
        <>
          <p>{msg.text}</p>
          <ul className={styles.botFeaturesList}>
            {msg.listItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </>
      ) : (
        msg.text.split("\n").map((line, i) => <p key={i}>{line}</p>)
      )}
    </div>
  );

  return (
    <div className={styles["chatbot-container"]}>
      <div className={styles["chat-window"]}>
        <div className={styles["chat-header"]}>
          <div className={styles["chat-header-logo"]}>
            <img src={MapLogo} alt="Map Logo" className={styles["map-logo"]} />
            <h3>PAXI</h3>
          </div>
          <button className={styles["close-btn"]} onClick={closeModal}>
            ✖
          </button>
        </div>

        <div className={styles["chat-messages"]}>
          {messages.map(renderMessage)}
          {isTyping && (
            <div
              className={`${styles.message} ${styles["bot-message"]} ${styles["typing-indicator"]}`}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles["chat-input-container"]}>
          <div className={styles["chat-input-area"]}>
            <input
              type="text"
              placeholder="What's your message?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
            <label className={styles["upload-btn"]}>
              <input type="file" onChange={handleFileUpload} hidden />
              <FiPaperclip className={styles["upload-icon"]} />
            </label>
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

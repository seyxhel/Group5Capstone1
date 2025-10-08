import { useState, useEffect, useRef } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";
import MapLogo from "../../../../shared/assets/MapLogo.png";
import styles from "./EmployeeChatbot.module.css";
import { marked } from "marked";

function buildFAQPrompt(faqs) {
  let prompt = "You are a support assistant for SmartSupport. Only answer questions based on the following FAQs:\n";
  faqs.forEach((faq, idx) => {
    prompt += `${idx + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n`;
  });
  prompt += "If you don't know the answer, say 'Please refer to our support team.'";
  return prompt;
}

const faqs = [
  {
    question: "Who is the CEO of MAP Active Philippines?",
    answer: "Elizabeth Marcelo Tinio is the CEO of MAP Active Philippines."
  },
  {
    question: "Who are the decision makers in Map Active Philippines?",
    answer: "The decision makers in Map Active Philippines are Anton Gonzalez, Anton Gonzalez, Belinda Cueto-buenaventura, etc. Click to Find Map Active Philippines decision makers emails."
  },
  {
    question: "Where is MAP ACTIVE PHILIPPINES INC. located?",
    answer: "MAP ACTIVE PHILIPPINES INC. is located at 19th, 20th and 21st Floors 1 Proscenium Estrella Drive corner JP Rizal Street, Rockwell Center, Makati, Metro Manila, 1211 Philippines"
  },
  {
    question: "What services does Map Active Philippines offer?",
    answer: "Map Active Philippines specializes in brand distribution and brand marketing. We provide a comprehensive range of services that include logistics management, retail distribution, and marketing strategies tailored to enhance brand visibility and consumer engagement. Our expertise allows us to effectively connect brands with their target audiences across various platforms."
  },
  {
    question: "Which industries does Map Active serve?",
    answer: "Map Active serves a diverse range of industries, including consumer goods, fashion, electronics, and food and beverages. Our extensive experience in brand distribution allows us to cater to the unique needs of each sector, ensuring that our clients achieve optimal market penetration and brand loyalty."
  },
  {
    question: "How does Map Active ensure effective brand marketing?",
    answer: "We employ a multi-faceted approach to brand marketing that includes market research, targeted advertising, promotional campaigns, and strategic partnerships. Our team of marketing professionals utilizes data-driven insights to create customized marketing strategies that resonate with consumers and drive sales."
  },
  {
    question: "Can Map Active assist with logistics and supply chain management?",
    answer: "Yes, Map Active offers logistics and supply chain management services as part of our brand distribution solutions. We manage the entire supply chain process, from warehousing to transportation, ensuring that products are delivered efficiently and effectively to meet market demand."
  },
  {
    question: "What is the process for partnering with Map Active?",
    answer: "To partner with Map Active, interested brands can reach out through our website or contact our business development team directly. We will conduct an initial consultation to understand your brand's needs and objectives, followed by a tailored proposal outlining how we can support your brand's growth through our distribution and marketing services."
  },
  {
    question: "Does Map Active provide support for new product launches?",
    answer: "Absolutely! Map Active has extensive experience in supporting new product launches. We offer services that include market analysis, promotional strategies, and distribution planning to ensure a successful introduction of your product to the market. Our team works closely with clients to create impactful launch campaigns that drive awareness and sales."
  },
  {
    question: "What kind of retail stores does MAP Active operate?",
    answer: "MAP Active operates a wide variety of retail stores, including Planet Sports, Sports Warehouse, New Balance Store, Rookie USA, and Foot Locker."
  },
  {
    question: "Is MAP Active a distributor?",
    answer: "Yes, they are the official distributor for several brands, including New Balance, Converse, Fitflop, and Skechers."
  },
  {
    question: "What are some of the popular brands they carry?",
    answer: "Some popular brands include Starbucks, Zara, Apple, Marks & Spencer, SOGO, SEIBU, Oshkosh B'Gosh, and Reebok, among others."
  },
  {
    question: "How do I create a ticket?",
    answer: "You can create a ticket by clicking +Submit a Ticket at the dashboard or adding a new ticket at the ticket list"
  },
  {
    question: "What information do I need to include in my ticket?",
    answer: "Subject, Category, Sub-category are required and description and file attachments are optional"
  },
  {
    question: "Can I update my ticket after it's been submitted?",
    answer: "Yes, you can update or add additional information to your ticket at any time"
  },
  {
    question: "Will I receive notifications about my ticket?",
    answer: "Yes, you will receive email notifications whenever there is an update on your ticket. This includes when your ticket is assigned, resolved, or requires additional action."
  },
  {
    question: "What happens if my issue is not resolved?",
    answer: "If your issue cannot be resolved in the expected time frame, it will be escalated to higher-level support. We will inform you of the next steps or alternative solutions."
  },
  {
    question: "Is there a way to cancel or delete a ticket?",
    answer: "Tickets cannot be deleted once they are created, but if you no longer need support, you can withdraw the ticket."
  },
  {
    question: "What if my ticket has been marked as resolved but the issue isn't fixed?",
    answer: "If the issue persists after your ticket has been marked as resolved, you can follow up the ticket and the agents will investigate further to ensure the issue is properly addressed"
  }
];

const FAQ_SYSTEM_PROMPT = buildFAQPrompt(faqs);

const defaultMessages = [
  {
    text: "👋 Hello there!\n\nI'm PAXI, your go-to support buddy! Need help with something?\nDon’t worry—I've got you covered. Here's what I can do for you:\n\n✅ Troubleshoot common issues (slow computer, lost password, connection problems? No problem!)\n✅ Help you submit a support request if you need IT assistance\n✅ Provide updates on your ticket status so you always know what's happening\n✅ Share quick tech tips to make your work easier\n\n📝 Let’s get started! How can I help today? 😊",
    sender: "bot",
    isList: false,
    time: new Date(),
  }
];

const EmployeeChatbot = ({ closeModal }) => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatbotMessages");
    if (saved) {
      return JSON.parse(saved).map(msg => ({
        ...msg,
        time: msg.time ? new Date(msg.time) : new Date()
      }));
    }
    return defaultMessages;
  });

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

  useEffect(() => {
    localStorage.setItem("chatbotMessages", JSON.stringify(messages));
  }, [messages]);

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes}${ampm}`;
  };

  const formatDateDisplay = (date) => {
    const month = date.toLocaleString("default", { month: "long" }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    const weekday = date.toLocaleString("default", { weekday: "long" }).toUpperCase();
    return `${month} ${day}, ${year} | ${weekday}`;
  };
  // Ensure the OpenRouter API key is set in your .env file.
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  console.log("OpenRouter API Key present:", !!import.meta.env.VITE_OPENROUTER_API_KEY);

  // Simple local FAQ matcher: returns a FAQ answer if it matches closely enough
  const findFAQAnswer = (userMessage) => {
    if (!userMessage) return null;
    const text = userMessage.toLowerCase();

    // Exact substring match against question or answer
    for (const faq of faqs) {
      const q = faq.question.toLowerCase();
      const a = faq.answer.toLowerCase();
      if (q.includes(text) || a.includes(text) || text.includes(q)) return faq.answer;
    }

    // Token match: count overlapping long tokens
    const tokens = text.split(/\W+/).filter(t => t.length > 3);
    if (tokens.length === 0) return null;
    let best = { score: 0, answer: null };
    for (const faq of faqs) {
      const q = faq.question.toLowerCase() + ' ' + faq.answer.toLowerCase();
      let score = 0;
      for (const tok of tokens) if (q.includes(tok)) score++;
      if (score > best.score) best = { score, answer: faq.answer };
    }
    // require at least two token matches to accept
    return best.score >= 2 ? best.answer : null;
  };

  const fetchOpenRouterResponse = async (userMessage) => {
    // If we don't have an API key, attempt local FAQ lookup first
    if (!apiKey) {
      const local = findFAQAnswer(userMessage);
      return local || "Please refer to our support team.";
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: FAQ_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      });

      const data = await response.json();
      if (data.error) {
        // If the API reports missing auth, fall back to FAQ
        const msg = data.error.message || "Unknown error from API.";
        if (/auth|credential/i.test(msg)) {
          const local = findFAQAnswer(userMessage);
          return local || "Please refer to our support team.";
        }
        return `Error: ${msg}`;
      }
      return data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";
    } catch (error) {
      // Network or other error: fallback to local FAQ
      const local = findFAQAnswer(userMessage);
      return local || "Sorry, there was an error connecting to the support service.";
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      text: inputValue,
      sender: "user",
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    const botText = await fetchOpenRouterResponse(userMessage.text);

    setMessages((prev) => [
      ...prev,
      {
        text: botText,
        sender: "bot",
        time: new Date(),
        isList: false,
      },
    ]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const userMessage = {
        text: `📎 You uploaded: ${file.name}`,
        sender: "user",
        time: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }
  };

  const renderMessage = (msg, index) => {
    const time = msg.time ? new Date(msg.time) : new Date();
    return (
      <div
        key={index}
        className={`${styles.message} ${msg.sender === "user" ? styles["user-message"] : styles["bot-message"]}`}
      >
        <div className={styles["timestamp-display"]}>
          {formatTime(time)} | {formatDateDisplay(time)}
        </div>
        <div
          className={styles["message-content"]}
          dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
        />
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
            ✖
          </button>
        </div>

        <div className={styles["chat-messages"]}>
          {messages.map(renderMessage)}
          {isTyping && (
            <div className={`${styles.message} ${styles["bot-message"]} ${styles["typing-indicator"]}`}>
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
              autoComplete="off"
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

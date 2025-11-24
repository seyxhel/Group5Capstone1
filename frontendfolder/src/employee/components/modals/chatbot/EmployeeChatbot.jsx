import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { FiPaperclip, FiSend, FiMoreHorizontal, FiX, FiChevronDown, FiVolume2 } from "react-icons/fi";
import MapLogo from "../../../../shared/assets/MapLogo.png";
import styles from "./EmployeeChatbot.module.css";
import axios from 'axios';
import { API_CONFIG } from '../../../../config/environment.js';

const EmployeeChatbot = ({ closeModal }) => {
  const [messages, setMessages] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const welcomeMessage = {
    text: "Hi there! 👋 I'm PAXI, your go-to support buddy.\nHow can I assist you today?",
    sender: "bot",
    isList: false,
    suggestions: [
      { label: 'Browse FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' },
      { label: 'Submit a Ticket', type: 'prefill', route: '/employee/submit-ticket' },
      { label: 'View My Tickets', type: 'redirect', route: '/employee/active-tickets' }
    ]
  };

  // Fallback default messages collection (used by local matcher)
  const defaultMessages = [welcomeMessage];

  // Build a compact system prompt from available FAQs to guide the external LLM
  const buildFAQPrompt = (faqsList) => {
    if (!faqsList || faqsList.length === 0) return 'You are a helpful support assistant for employees. Answer concisely and avoid external links.';
    const top = faqsList.slice(0, 8).map((f, i) => `${i + 1}. ${f.question}`).join('\n');
    return `You are a helpful support assistant for employees. The following are known FAQ titles to refer to when answering user queries:\n${top}\nIf the user asks a question answered by these FAQs, respond using that FAQ content.`;
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

  useEffect(() => {
    try {
      const isAuth = !!localStorage.getItem('loggedInUser');
      if (!isAuth) return; // do not persist chat history for unauthenticated users
      localStorage.setItem("chatbotMessages", JSON.stringify(messages));
    } catch (e) {
      // ignore storage errors
    }
  }, [messages]);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        // Try to get token from localStorage first, then cookies
        let token = localStorage.getItem("access_token");
        if (!token && typeof document !== 'undefined' && document.cookie) {
          try {
            const match = document.cookie.match(/(?:^|; )access_token=([^;]+)/);
            if (match && match[1]) token = decodeURIComponent(match[1]);
          } catch (e) {
            // ignore cookie parsing errors
          }
        }
        if (!token) {
          console.warn("No access token found. FAQs may not load.");
          // Continue anyway — the request might work with session cookies
        }

    const baseUrl = API_CONFIG.BACKEND.BASE_URL || '';
    const articlesUrl = `${baseUrl.replace(/\/$/, '')}/api/articles/`;

    // If BASE_URL is empty string, fall back to relative path
    const requestUrl = baseUrl ? articlesUrl : '/api/articles/';

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await axios.get(requestUrl, {
          headers,
          withCredentials: true,
          validateStatus: (status) => status < 500, // Accept all 2xx and 4xx responses
        });

        console.log("Full API Response:", response);
        console.log("Request Config:", response.config);
        console.log("Response Headers:", response.headers);

        // Check if the response is HTML (indicating an error or redirect)
        if (typeof response.data === "string" && response.data.startsWith("<!doctype html>")) {
          console.error("Received HTML response instead of JSON. Possible redirect or error page:", response.data);
          if (response.request?.res?.responseUrl) {
            console.error("Redirected to:", response.request.res.responseUrl);
          }
          return;
        }

        if (response.status === 401 || response.status === 403) {
          console.error("Authentication error. Please check your access token.");
          return;
        }

        if (response.headers["content-type"]?.includes("application/json")) {
          // Map backend KnowledgeArticle fields to the front-end FAQ shape and
          // normalize visibility check (backend uses 'Employee' capitalization).
          const mapped = response.data
            .map((a) => ({
              id: a.id,
              question: a.subject || '',
              answer: a.description || '',
              visibility: a.visibility || '',
              is_archived: !!a.is_archived,
            }))
            .filter((faq) => !faq.is_archived && (faq.visibility || '').toLowerCase() === 'employee');

          console.log(`✅ Chatbot loaded ${mapped.length} Knowledge Base articles (employee-visible, non-archived):`);
          console.table(mapped.map((faq, idx) => ({
            '#': idx + 1,
            'Article ID': faq.id,
            'Subject': faq.question.slice(0, 60) + (faq.question.length > 60 ? '...' : ''),
            'Answer Length': `${faq.answer.length} chars`,
            'Visibility': faq.visibility
          })));
          console.log('These articles will be used for FAQ matching in the chatbot.');
          setFaqs(mapped);
        } else {
          console.error("Unexpected response format. Expected JSON but received:", response.data);
        }
      } catch (error) {
        if (error.response) {
          console.error("Error response from server:", error.response);
        } else if (error.request) {
          console.error("No response received from server:", error.request);
        } else {
          console.error("Error setting up the request:", error.message);
        }
      }
    };

    fetchFAQs();
  }, []);

  const FAQ_SYSTEM_PROMPT = useMemo(() => buildFAQPrompt(faqs), [faqs]);

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
  if (import.meta.env.DEV) {
    console.debug("OpenRouter API Key present:", !!import.meta.env.VITE_OPENROUTER_API_KEY);
  }

  // Enhanced local FAQ matcher with weighted scoring
  const findFAQAnswer = (userMessage) => {
    if (!userMessage) return null;
    const text = userMessage.toLowerCase().trim();

    console.log(`🔍 Chatbot FAQ Search: "${userMessage}"`);
    console.log(`📚 Available KB articles for matching: ${faqs?.length || 0}`);

    // Handle greetings
    if (text.length < 3) {
      const greetingRe = /^(hi|hello|hey|hey there|good morning|good afternoon|good evening)[.!]?$/i;
      if (greetingRe.test(text)) {
        console.log('✅ Detected greeting, returning canned greeting.');
        return { answer: defaultMessages[0].text, question: "greeting", faq: null };
      }
      return null;
    }

    if (!faqs || faqs.length === 0) {
      console.warn('⚠️ No KB articles available for FAQ matching!');
      return null;
    }

    // Tokenize user input (ignore common stop words)
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'that', 'this', 'it', 'be', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can']);
    const tokens = text.split(/\W+/).filter(t => t.length > 2 && !stopWords.has(t));
    
    if (tokens.length === 0) return null;

    // Score each FAQ
    let best = { score: 0, answer: null, question: null };
    for (const faq of faqs) {
      const q = (faq.question || '').toLowerCase();
      const a = (faq.answer || '').toLowerCase();
      let score = 0;

      // Exact phrase match in question (highest weight)
      if (q.includes(text)) score += 100;
      
      // Exact phrase match in answer (high weight)
      if (a.includes(text)) score += 80;

      // User query is substring of FAQ question (very relevant)
      if (text.includes(q) && q.length > 5) score += 90;

      // Token matching with position weighting
      tokens.forEach((tok, idx) => {
        const posWeight = 1 + (tokens.length - idx) * 0.1; // Earlier tokens weighted higher
        
        // Question match (higher weight)
        if (q.includes(tok)) score += 10 * posWeight;
        
        // Answer match (lower weight)
        if (a.includes(tok)) score += 5 * posWeight;
        
        // Exact word boundary match (bonus)
        const wordBoundaryRegex = new RegExp(`\\b${tok}\\b`);
        if (wordBoundaryRegex.test(q)) score += 5 * posWeight;
        if (wordBoundaryRegex.test(a)) score += 3 * posWeight;
      });

      // Length similarity bonus (prefer FAQs with similar length to query)
      const lengthDiff = Math.abs(q.length - text.length);
      if (lengthDiff < 20) score += 5;

      if (score > best.score) {
        best = { score, answer: faq.answer, question: faq.question, faq }; // Include full FAQ object for context
      }
    }

    // Require minimum score threshold
    const threshold = tokens.length > 3 ? 15 : 10;
    if (best.score >= threshold) {
      console.log(`✅ FAQ Match Found! Score: ${best.score.toFixed(1)} (threshold: ${threshold})`);
      console.log(`   Matched KB Article: "${best.question?.slice(0, 100)}${best.question?.length > 100 ? '...' : ''}"`);
      console.log(`   Answer preview: "${best.answer?.slice(0, 150)}${best.answer?.length > 150 ? '...' : ''}"`);
      return { answer: best.answer, question: best.question, faq: best.faq }; // Return full context
    }
    
    console.log(`❌ No FAQ match found. Best score: ${best.score.toFixed(1)} (threshold: ${threshold})`);
    if (best.question) {
      console.log(`   Closest match was: "${best.question.slice(0, 80)}${best.question.length > 80 ? '...' : ''}" (score: ${best.score.toFixed(1)})`);
    }
    console.log(`   Search tokens used: [${tokens.join(', ')}]`);
    return null;
  };

  const fetchOpenRouterResponse = async (userMessage) => {
    // Try local FAQ lookup first — quicker and avoids external API if we already know the answer
    // If the user explicitly asks to list FAQs, return a list from the loaded `faqs`.
    const listFaqsRe = /\b(list|show|display|what are)\b.*\b(faqs|faq|knowledge articles|articles|knowledge base)\b/i;
    if (listFaqsRe.test(userMessage)) {
      if (!faqs || faqs.length === 0) return { text: "There are no knowledge base articles available right now.", matchedQuestion: null };
      // Return a friendly bullet list (short subjects)
      const items = faqs.map((f, i) => `${i + 1}. ${f.question}`);
      return { text: `Here are the available knowledge base articles:\n\n${items.join('\n')}`, matchedQuestion: "list_faqs" };
    }

    const localFirst = findFAQAnswer(userMessage);
    // If we have a local FAQ hit, attempt to paraphrase it so responses feel fresh
    if (localFirst) {
      console.log('✅ Using FAQ answer (will paraphrase if API key available)');
      const answerText = typeof localFirst === 'string' ? localFirst : localFirst.answer;
      const matchedQuestion = typeof localFirst === 'object' ? localFirst.question : null;
      
      // If no API key, return the raw local answer
      if (!apiKey) {
        console.log('⚠️ No OpenRouter API key - returning raw FAQ answer');
        return { text: answerText, matchedQuestion };
      }

      // Build a paraphrase prompt that keeps technical tokens intact
      const paraphraseSystem = `You are a helpful assistant that rewrites support FAQ answers into a friendly, conversational single-paragraph response appropriate for an employee. Preserve any technical tokens (code snippets, commands, filenames, product names, acronyms, URLs, tokens with slashes or dots, words in ALL CAPS, or anything enclosed in backticks) verbatim; do NOT translate or alter them. Only paraphrase the human-readable sentences around those technical tokens. Keep the meaning identical and the length similar. Use natural variation (synonyms, alternate sentence order) so repeated questions get slightly different phrasing.`;

      try {
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: paraphraseSystem },
              { role: "user", content: `Question: ${userMessage}\n\nFAQ answer:\n${answerText}` },
            ],
          }),
        });

        const data = await resp.json();
        if (data?.choices?.[0]?.message?.content) {
          const paraphrased = data.choices[0].message.content.trim();
          // Safety: if paraphrase is suspiciously short/empty, fallback to original
          if (paraphrased.length < 10) return { text: answerText, matchedQuestion };
          return { text: paraphrased, matchedQuestion };
        }
        return { text: answerText, matchedQuestion };
      } catch (e) {
        console.error('Paraphrase request failed, returning original FAQ answer', e);
        return { text: answerText, matchedQuestion };
      }
    }

    // If we don't have an OpenRouter API key and no local match, fall back to a generic message
    if (!apiKey) {
      return { text: "Please refer to our support team.", matchedQuestion: null };
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
          if (local) {
            const answerText = typeof local === 'string' ? local : local.answer;
            const matchedQuestion = typeof local === 'object' ? local.question : null;
            return { text: answerText, matchedQuestion };
          }
          return { text: "Please refer to our support team.", matchedQuestion: null };
        }
        return { text: `Error: ${msg}`, matchedQuestion: null };
      }
      return { text: data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.", matchedQuestion: null };
    } catch (error) {
      // Network or other error: fallback to local FAQ
      const local = findFAQAnswer(userMessage);
      if (local) {
        const answerText = typeof local === 'string' ? local : local.answer;
        const matchedQuestion = typeof local === 'object' ? local.question : null;
        return { text: answerText, matchedQuestion };
      }
      return { text: "Sorry, there was an error connecting to the support service.", matchedQuestion: null };
    }
  };

  // Generate context-aware suggestions based on the matched KB article
  const getContextualSuggestions = (matchedQuestion) => {
    if (!matchedQuestion) return getDefaultSuggestions();
    
    const q = matchedQuestion.toLowerCase();
    
    // Ticket-related questions
    if (q.includes('ticket') || q.includes('submit')) {
      if (q.includes('categories') || q.includes('issues')) {
        return [
          { label: 'Submit a Ticket', type: 'prefill', route: '/employee/submit-ticket' },
          { label: 'View My Tickets', type: 'redirect', route: '/employee/ticket-tracker' },
          { label: 'Browse All FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' }
        ];
      }
      if (q.includes('track') || q.includes('status')) {
        return [
          { label: 'View My Tickets', type: 'redirect', route: '/employee/ticket-tracker' },
          { label: 'Submit New Ticket', type: 'prefill', route: '/employee/submit-ticket' },
          { label: 'Browse FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' }
        ];
      }
      if (q.includes('attach') || q.includes('file')) {
        return [
          { label: 'Submit a Ticket', type: 'prefill', route: '/employee/submit-ticket' },
          { label: 'View Ticket Guidelines', type: 'redirect', route: '/employee/frequently-asked-questions' },
          { label: 'My Tickets', type: 'redirect', route: '/employee/ticket-tracker' }
        ];
      }
    }
    
    // Password/account questions
    if (q.includes('password') || q.includes('profile') || q.includes('account')) {
      return [
        { label: 'Go to Settings', type: 'redirect', route: '/employee/settings' },
        { label: 'View Account FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' },
        { label: 'Submit a Ticket', type: 'prefill', route: '/employee/submit-ticket' }
      ];
    }
    
    // General FAQ browsing
    return [
      { label: 'Browse All FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' },
      { label: 'Submit a Ticket', type: 'prefill', route: '/employee/submit-ticket' },
      { label: 'View My Tickets', type: 'redirect', route: '/employee/ticket-tracker' }
    ];
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    const userMessageObj = {
      text: userMessage,
      sender: "user",
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Use the FAQ-aware response function instead of hardcoded patterns
      const botResponse = await fetchOpenRouterResponse(userMessage);
      const responseText = typeof botResponse === 'string' ? botResponse : botResponse.text;
      const matchedQuestion = typeof botResponse === 'object' ? botResponse.matchedQuestion : null;
      
      console.log(`💡 Generating suggestions for matched question: "${matchedQuestion || 'none'}"`);
      const suggestions = getContextualSuggestions(matchedQuestion);
      
      setMessages((prev) => [
        ...prev,
        {
          text: responseText,
          sender: "bot",
          time: new Date(),
          suggestions,
        },
      ]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error. Please try again.",
          sender: "bot",
          time: new Date(),
          suggestions: getDefaultSuggestions(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const getDefaultSuggestions = () => [
    { label: 'Browse FAQs', type: 'redirect', route: '/employee/frequently-asked-questions' },
    { label: 'Submit a Ticket', type: 'prefill', route: '/employee/submit-ticket' },
    { label: 'View My Tickets', type: 'redirect', route: '/employee/ticket-tracker' }
  ];

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
              autoComplete="off"
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
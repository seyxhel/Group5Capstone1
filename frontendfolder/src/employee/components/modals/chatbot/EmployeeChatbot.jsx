import { useState, useEffect, useRef, useMemo } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";
import MapLogo from "../../../../shared/assets/MapLogo.png";
import styles from "./EmployeeChatbot.module.css";
import { marked } from "marked";
import axios from "axios";
import { API_CONFIG } from '../../../../config/environment.js';

function buildFAQPrompt(faqs) {
  let prompt = "You are a support assistant for SmartSupport. Only answer questions based on the following FAQs:\n";
  faqs.forEach((faq, idx) => {
    prompt += `${idx + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n`;
  });
  prompt += "If you don't know the answer, say 'Please refer to our support team.'";
  return prompt;
}

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
    try {
      const isAuth = !!localStorage.getItem('loggedInUser');
      if (!isAuth) return defaultMessages;
      const saved = localStorage.getItem("chatbotMessages");
      if (saved) {
        return JSON.parse(saved).map(msg => ({
          ...msg,
          time: msg.time ? new Date(msg.time) : new Date()
        }));
      }
    } catch (e) {
      // If anything goes wrong reading storage, fall back to defaults
    }
    return defaultMessages;
  });

  const [faqs, setFaqs] = useState([]);
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
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("No access token found. Please log in.");
          return;
        }

    const baseUrl = API_CONFIG.BACKEND.BASE_URL || '';
    const articlesUrl = `${baseUrl.replace(/\/$/, '')}/api/articles/`;

    // If BASE_URL is empty string, fall back to relative path
    const requestUrl = baseUrl ? articlesUrl : '/api/articles/';

    const response = await axios.get(requestUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

          console.log('Loaded FAQs count=', mapped.length);
          console.debug('Loaded FAQs (summary):', mapped.map(f => ({ id: f.id, question: f.question?.slice(0,80), visibility: f.visibility, is_archived: f.is_archived })));
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
  console.log("OpenRouter API Key present:", !!import.meta.env.VITE_OPENROUTER_API_KEY);

  // Simple local FAQ matcher: returns a FAQ answer if it matches closely enough
  const findFAQAnswer = (userMessage) => {
    if (!userMessage) return null;
    const text = userMessage.toLowerCase();

    // Avoid matching tiny inputs like "hi" against FAQ content.
    // Short strings often appear inside other words (e.g. 'hi' in 'this')
    // which causes accidental matches. For short greetings, return the
    // default greeting instead of searching the KB.
    const trimmed = userMessage.trim();
    if (trimmed.length < 3) {
      const greetingRe = /^(hi|hello|hey|hey there|good morning|good afternoon|good evening)[.!]?$/i;
      if (greetingRe.test(trimmed)) {
        console.debug('Detected greeting, returning canned greeting.');
        return defaultMessages[0].text;
      }
      return null;
    }

    // Exact substring match against question or answer
    for (const faq of faqs) {
      const q = faq.question.toLowerCase();
      const a = faq.answer.toLowerCase();
      if (q.includes(text) || a.includes(text) || text.includes(q)) return faq.answer;
    }

    // Token match: count overlapping tokens (allow shorter tokens to help match brief questions)
    const tokens = text.split(/\W+/).filter(t => t.length > 2);
    if (tokens.length === 0) return null;
    let best = { score: 0, answer: null };
    for (const faq of faqs) {
      const q = (faq.question || '').toLowerCase() + ' ' + (faq.answer || '').toLowerCase();
      let score = 0;
      for (const tok of tokens) if (q.includes(tok)) score++;
      // log each faq's score for this query (debug level)
      console.debug('FAQ score', { id: faq.id, question: faq.question, score });
      if (score > best.score) best = { score, answer: faq.answer };
    }
    // require at least one token match to accept (lenient)
    if (best.score >= 1) {
      console.debug('FAQ matcher: matched tokens=', tokens, 'score=', best.score, 'answer=', best.answer?.slice(0, 120));
      return best.answer;
    }
    console.debug('FAQ matcher: no good local match', { tokens, best });
    return null;
  };

  const fetchOpenRouterResponse = async (userMessage) => {
    // Try local FAQ lookup first — quicker and avoids external API if we already know the answer
    // If the user explicitly asks to list FAQs, return a list from the loaded `faqs`.
    const listFaqsRe = /\b(list|show|display|what are)\b.*\b(faqs|faq|knowledge articles|articles|knowledge base)\b/i;
    if (listFaqsRe.test(userMessage)) {
      if (!faqs || faqs.length === 0) return "There are no knowledge base articles available right now.";
      // Return a friendly bullet list (short subjects)
      const items = faqs.map((f, i) => `${i + 1}. ${f.question}`);
      return `Here are the available knowledge base articles:\n\n${items.join('\n')}`;
    }

    const localFirst = findFAQAnswer(userMessage);
    // If we have a local FAQ hit, attempt to paraphrase it so responses feel fresh
    if (localFirst) {
      console.log('Local FAQ hit — attempting paraphrase via OpenRouter');
      // If no API key, return the raw local answer
      if (!apiKey) {
        return localFirst;
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
              { role: "user", content: `Question: ${userMessage}\n\nFAQ answer:\n${localFirst}` },
            ],
          }),
        });

        const data = await resp.json();
        if (data?.choices?.[0]?.message?.content) {
          const paraphrased = data.choices[0].message.content.trim();
          // Safety: if paraphrase is suspiciously short/empty, fallback to original
          if (paraphrased.length < 10) return localFirst;
          return paraphrased;
        }
        return localFirst;
      } catch (e) {
        console.error('Paraphrase request failed, returning original FAQ answer', e);
        return localFirst;
      }
    }

    // If we don't have an OpenRouter API key and no local match, fall back to a generic message
    if (!apiKey) {
      return "Please refer to our support team.";
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

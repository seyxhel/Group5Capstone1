import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { FaThumbsUp, FaThumbsDown, FaHeart, FaComment } from 'react-icons/fa';
import faqs from '../../../utilities/storages/faqs';
import styles from './EmployeeFAQs.module.css';
// ViewCard removed — using a fragment wrapper instead
import InputField from '../../../shared/components/InputField';
import Button from '../../../shared/components/Button';

const EmployeeFAQs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [reactions, setReactions] = useState({});
  const [feedbackText, setFeedbackText] = useState({});

  const toggleAnswer = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const query = searchTerm.toLowerCase();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    );
  });

  // Categorize FAQs by simple keyword mapping
  const categorize = (faq) => {
    const text = (faq.question + ' ' + faq.answer).toLowerCase();
    if (text.includes('password') || text.includes('profile')) return 'Account';
    if (text.includes('submit') || text.includes('submission')) return 'Submission';
    if (text.includes('attach') || text.includes('attachment') || text.includes('file')) return 'Attachments';
    if (text.includes('priority') || text.includes('sla')) return 'Priority & SLA';
    if (text.includes('close') || text.includes('withdraw') || text.includes('closed')) return 'Records';
    if (text.includes('track') || text.includes('status') || text.includes('history')) return 'Tracking';
    if (text.includes('csat') || text.includes('rating') || text.includes('satisfaction')) return 'Feedback';
    if (text.includes('urgent') || text.includes('critical')) return 'Urgent';
    if (text.includes('hardware') || text.includes('printer') || text.includes('computer')) return 'Hardware';
    if (text.includes('software') || text.includes('license')) return 'Software';
    if (text.includes('access')) return 'Access';
    return 'General';
  };

  const categorizedFaqs = faqs.map((f) => ({ ...f, category: categorize(f) }));
  const categories = ['All', ...Array.from(new Set(categorizedFaqs.map((f) => f.category)))];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const visibleFaqs = categorizedFaqs.filter((faq) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLike = (id) => {
    setReactions((prev) => {
      const cur = prev[id] || { likes: 0, dislikes: 0, vote: null };
      const next = { ...cur };
      if (cur.vote === 'like') {
        next.likes = Math.max(0, cur.likes - 1);
        next.vote = null;
      } else if (cur.vote === 'dislike') {
        next.dislikes = Math.max(0, cur.dislikes - 1);
        next.likes = cur.likes + 1;
        next.vote = 'like';
      } else {
        next.likes = cur.likes + 1;
        next.vote = 'like';
      }
      return { ...prev, [id]: next };
    });
  };

  const handleDislike = (id) => {
    setReactions((prev) => {
      const cur = prev[id] || { likes: 0, dislikes: 0, vote: null };
      const next = { ...cur };
      if (cur.vote === 'dislike') {
        next.dislikes = Math.max(0, cur.dislikes - 1);
        next.vote = null;
      } else if (cur.vote === 'like') {
        next.likes = Math.max(0, cur.likes - 1);
        next.dislikes = cur.dislikes + 1;
        next.vote = 'dislike';
      } else {
        next.dislikes = cur.dislikes + 1;
        next.vote = 'dislike';
      }
      return { ...prev, [id]: next };
    });
  };

  const handleSubmitFeedback = (id) => {
    // keep simple logging behavior as in KB
    console.log(`Feedback for ${id}: ${feedbackText[id] || ''}`);
    setReactions((prev) => ({
      ...prev,
      [id]: { ...prev[id], feedbackSubmitted: true },
    }));
  };

  const handleCancelFeedback = (id) => {
    setFeedbackText((prev) => ({ ...prev, [id]: '' }));
    setReactions((prev) => ({
      ...prev,
      [id]: { ...prev[id], vote: null },
    }));
  };

  return (
    <>
      <div className={styles.faqContainer}>
        <div className={styles.faqHeader}>
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to the most common questions about our services and processes.</p>
        </div>
        <div className={styles.searchWrapper}>
          <InputField
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setExpandedIndex(null);
            }}
            aria-label="Search FAQs"
          />
        </div>
        <div className={styles.categoryChips}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.chip} ${selectedCategory === cat ? styles.activeChip : ''}`}
              onClick={() => { setSelectedCategory(cat); setExpandedIndex(null); }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.cardGrid}>
          {visibleFaqs.length > 0 ? (
            visibleFaqs.map((faq, index) => {
              const idKey = faq.id || `idx-${index}`;
              const reaction = reactions[idKey] || { likes: 0, dislikes: 0, vote: null };
              return (
                <div key={idKey} className={`${styles.card} ${expandedIndex === index ? styles.expanded : ''}`} data-faq-id={faq.id}>
                  <div className={styles.cardHeader} onClick={() => toggleAnswer(index)}>
                    <span className={styles.cardTitle}>{faq.question}</span>
                    {expandedIndex === index ? (
                      <FiChevronDown className={styles.faqArrow} />
                    ) : (
                      <FiChevronRight className={styles.faqArrow} />
                    )}
                  </div>

                  <div className={styles.articleMeta}>
                    <span className={styles.metaItem}>
                      Updated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={styles.metaSeparator}>•</span>
                    <span className={styles.metaItem}>
                      {reaction.likes || 0} {reaction.likes === 1 ? 'person' : 'people'} found this helpful
                    </span>
                  </div>

                  {expandedIndex === index && (
                    <>
                      <div className={styles.cardBody}>
                        <p>{faq.answer}</p>
                      </div>

                      <div className={styles.feedbackContainer}>
                        <div className={styles.reactionPrompt}>Was this article helpful?</div>
                        <div className={styles.reactionBtns}>
                          <button
                            type="button"
                            className={`${styles.reactionBtn} ${reaction.vote === 'like' ? styles.activeYes : ''}`}
                            onClick={() => handleLike(idKey)}
                            aria-pressed={reaction.vote === 'like'}
                          >
                            <FaThumbsUp className={styles.iconThumbsUp} />
                            <span className={styles.reactionLabel}>Yes</span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.reactionBtn} ${reaction.vote === 'dislike' ? styles.activeNo : ''}`}
                            onClick={() => handleDislike(idKey)}
                            aria-pressed={reaction.vote === 'dislike'}
                          >
                            <FaThumbsDown className={styles.iconThumbsDown} />
                            <span className={styles.reactionLabel}>No</span>
                          </button>
                        </div>

                        {reaction.vote === 'like' && !reaction.feedbackSubmitted && (
                          <div className={styles.successMessage}>
                            <FaHeart className={styles.successIconGreen} /> Thank you for your feedback! We're glad this article was helpful.
                          </div>
                        )}

                        {reaction.vote === 'dislike' && !reaction.feedbackSubmitted && (
                          <div className={styles.feedbackSection}>
                            <div className={styles.feedbackPrompt}>What could we improve?</div>
                            <InputField
                              type="textarea"
                              placeholder="Tell us what was unclear or missing..."
                              value={feedbackText[idKey] || ''}
                              onChange={(e) => setFeedbackText((prev) => ({ ...prev, [idKey]: e.target.value }))}
                              inputStyle={{ minHeight: '80px', backgroundColor: '#ffffff' }}
                            />
                            <div className={styles.feedbackActions}>
                              <Button
                                variant="primary"
                                size="default"
                                onClick={() => handleSubmitFeedback(idKey)}
                              >
                                Submit Feedback
                              </Button>
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => handleCancelFeedback(idKey)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {reaction.feedbackSubmitted && (
                          <div className={reaction.vote === 'dislike' ? styles.successMessageBlue : styles.successMessage}>
                            {reaction.vote === 'dislike' ? (
                              <FaComment className={styles.successIconBlue} />
                            ) : (
                              <FaHeart className={styles.successIconGreen} />
                            )} Thank you for your sharing! Your feedback has been recorded and will help us to make our content better.
                          </div>
                        )}
                      </div>

                      {faq.category && (
                        <div className={styles.relatedArticles}>
                          <h3 className={styles.relatedTitle}>Related Articles</h3>
                          <div className={styles.relatedList}>
                            {visibleFaqs
                              .filter((a) => a.category === faq.category && a.id !== faq.id)
                              .slice(0, 2)
                              .map((relatedFaq) => (
                                <button
                                  key={relatedFaq.id}
                                  className={styles.relatedLink}
                                  onClick={() => {
                                    const relatedIndex = visibleFaqs.findIndex((a) => a.id === relatedFaq.id);
                                    setExpandedIndex(relatedIndex);
                                    setTimeout(() => {
                                      document.querySelector(`[data-faq-id="${relatedFaq.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                  }}
                                >
                                  {relatedFaq.question}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <div className={styles.noResults}>
              No results found for "{searchTerm}"
            </div>
          )}
        </div>
        </div>
    </>
  );
};

export default EmployeeFAQs;

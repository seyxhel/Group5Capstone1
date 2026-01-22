import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { FaThumbsUp, FaThumbsDown, FaHeart, FaComment } from 'react-icons/fa';
import ARTICLES from '../../../mocks/seed/articles.json';
import styles from './CoordinatorKnowledgebase.module.css';
import InputField from '../../../shared/components/InputField';
import Button from '../../../shared/components/Button';

const CoordinatorKnowledgebase = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reactions, setReactions] = useState({});
  const [feedbackText, setFeedbackText] = useState({});

  const toggleAnswer = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Only show articles visible to Ticket Coordinators
  const visibleArticles = ARTICLES.filter((article) => {
    return (article.visibility || '').toLowerCase() === 'ticket coordinator';
  });

  // Categorize articles by keyword mapping
  const categorize = (article) => {
    const text = (article.title + ' ' + (article.content || article.summary || '')).toLowerCase();
    if (text.includes('ticket') || text.includes('submission')) return 'Tickets';
    if (text.includes('assign') || text.includes('assignment')) return 'Assignment';
    if (text.includes('priority') || text.includes('sla')) return 'Priority & SLA';
    if (text.includes('close') || text.includes('resolve') || text.includes('resolution')) return 'Resolution';
    if (text.includes('attach') || text.includes('attachment') || text.includes('file')) return 'Attachments';
    if (text.includes('report') || text.includes('tracking')) return 'Reports';
    if (text.includes('knowledge') || text.includes('kb')) return 'Knowledge Base';
    return 'General';
  };

  const categorizedArticles = visibleArticles.map((a) => ({ ...a, category: categorize(a) }));
  const categories = ['All', ...Array.from(new Set(categorizedArticles.map((a) => a.category)))];

  const filteredArticles = categorizedArticles.filter((article) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      article.title.toLowerCase().includes(query) ||
      (article.content || '').toLowerCase().includes(query) ||
      (article.summary || '').toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
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
      <div className={styles.kbContainer}>
        <div className={styles.kbHeader}>
          <h1>Knowledge Base</h1>
          <p>Find answers and resources to help you manage tickets and coordinate support effectively.</p>
        </div>
        <div className={styles.searchWrapper}>
          <InputField
            placeholder="Search Knowledge Base..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setExpandedIndex(null);
            }}
            aria-label="Search Knowledge Base"
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
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article, index) => {
              const idKey = article.id || `idx-${index}`;
              const reaction = reactions[idKey] || { likes: 0, dislikes: 0, vote: null };
              return (
                <div key={idKey} className={`${styles.card} ${expandedIndex === index ? styles.expanded : ''}`} data-article-id={article.id}>
                  <div className={styles.cardHeader} onClick={() => toggleAnswer(index)}>
                    <span className={styles.cardTitle}>{article.title}</span>
                    {expandedIndex === index ? (
                      <FiChevronDown className={styles.kbArrow} />
                    ) : (
                      <FiChevronRight className={styles.kbArrow} />
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
                        <p dangerouslySetInnerHTML={{ __html: article.content || article.summary || '' }} />
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

                      {/* Related Articles */}
                      {article.category && (
                        <div className={styles.relatedArticles}>
                          <h3 className={styles.relatedTitle}>Related Articles</h3>
                          <div className={styles.relatedList}>
                            {filteredArticles
                              .filter((a) => a.category === article.category && a.id !== article.id)
                              .slice(0, 2)
                              .map((relatedArticle) => (
                                <button
                                  key={relatedArticle.id}
                                  className={styles.relatedLink}
                                  onClick={() => {
                                    const relatedIndex = filteredArticles.findIndex((a) => a.id === relatedArticle.id);
                                    setExpandedIndex(relatedIndex);
                                    setTimeout(() => {
                                      document.querySelector(`[data-article-id="${relatedArticle.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                  }}
                                >
                                  {relatedArticle.title}
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

export default CoordinatorKnowledgebase;

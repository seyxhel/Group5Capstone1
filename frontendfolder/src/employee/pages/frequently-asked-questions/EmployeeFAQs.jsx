import { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import styles from './EmployeeFAQs.module.css';
import kbService from '../../../services/kbService';

const EmployeeFAQs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleAnswer = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Filter articles by search term (search in subject and description)
  const filteredFaqs = articles.filter((faq) => {
    const query = searchTerm.toLowerCase();
    return (
      (faq.subject || '').toLowerCase().includes(query) ||
      (faq.description || '').toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const all = await kbService.listArticles({});
        if (!isMounted) return;
        // kbService maps archived -> archived and visibility normalized to 'Employee', etc.
        const visible = (all || []).filter(a => !a.archived && (a.visibility || '').toLowerCase() === 'employee');
        // normalize shape to match previous `faqs` structure: { subject, description }
        // NOTE: backend / adapter sometimes returns `subject`/`description` or `title`/`content`.
        const mapped = visible.map(a => ({
          subject: a.subject ?? a.title ?? a.name ?? '',
          description: a.description ?? a.content ?? a.body ?? '',
          id: a.id
        }));
        setArticles(mapped);
      } catch (err) {
        console.error('Error loading KB articles for FAQs:', err);
        setArticles([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  // No debug helpers in production: resume normal behavior

  return (
    <div className={styles.faqContainer}>
      <div className={styles.searchWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setExpandedIndex(null);
          }}
        />
      </div>

      {/* debug UI removed */}

  <ul className={styles.faqList}>
        {loading ? (
          <div className={styles.noResults}>Loading...</div>
        ) : filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <li key={faq.id || index} className={styles.faqItem} data-testid={`faq-item-${index}`}>
              <div
                className={styles.faqQuestion}
                onClick={() => { toggleAnswer(index); }}
                role="button"
                aria-expanded={expandedIndex === index}
                data-subject={faq.subject}
              >
                <span data-testid={`faq-subject-${index}`}>{faq.subject}</span>
                {expandedIndex === index ? (
                  <FiChevronDown className={styles.faqArrow} />
                ) : (
                  <FiChevronRight className={styles.faqArrow} />
                )}
              </div>
              {expandedIndex === index && (
                <div className={styles.faqAnswer}>
                  <p data-testid={`faq-description-${index}`}>{faq.description}</p>
                </div>
              )}
            </li>
          ))
        ) : (
          <div className={styles.noResults}>
            No results found for "{searchTerm}"
          </div>
        )}
      </ul>

      {/* debug UI removed */}
    </div>
  );
};

export default EmployeeFAQs;

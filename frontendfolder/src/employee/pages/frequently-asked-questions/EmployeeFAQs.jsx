import { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import styles from './EmployeeFAQs.module.css';
import ViewCard from '../../../shared/components/ViewCard';
import InputField from '../../../shared/components/InputField';
import kbService from '../../../services/kbService';

const EmployeeFAQs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleAnswer = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Filter articles by search term (search in question and answer)
  const filteredFaqs = articles.filter((faq) => {
    const query = searchTerm.toLowerCase();
    return (
      (faq.question || '').toLowerCase().includes(query) ||
      (faq.answer || '').toLowerCase().includes(query)
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
        // normalize shape to provide `question` and `answer` fields that the UI expects.
        // NOTE: backend / adapter sometimes returns `subject`/`description` or `title`/`content`.
        const mapped = visible.map(a => ({
          id: a.id,
          subject: a.subject ?? a.title ?? a.name ?? '',
          description: a.description ?? a.content ?? a.body ?? '',
          // UI expects question/answer, so map those as well
          question: a.subject ?? a.title ?? a.name ?? '',
          answer: a.description ?? a.content ?? a.body ?? ''
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
    <ViewCard>
      <div className={styles.faqContainer}>
        <div className={styles.searchWrapper}>
          <InputField
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setExpandedIndex(null);
            }}
            inputStyle={{ width: '100%' }}
            aria-label="Search FAQs"
          />
        </div>

        <ul className={styles.faqList}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <li key={index} className={styles.faqItem}>
                <div
                  className={styles.faqQuestion}
                  onClick={() => toggleAnswer(index)}
                >
                  <span>{faq.question}</span>
                  {expandedIndex === index ? (
                    <FiChevronDown className={styles.faqArrow} />
                  ) : (
                    <FiChevronRight className={styles.faqArrow} />
                  )}
                </div>
                {expandedIndex === index && (
                  <div className={styles.faqAnswer}>
                    <p>{faq.answer}</p>
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
        </div>
    </ViewCard>
  );
};

export default EmployeeFAQs;

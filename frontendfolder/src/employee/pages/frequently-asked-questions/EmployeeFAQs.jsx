import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import faqs from '../../../utilities/storages/faqs';
import styles from './EmployeeFAQs.module.css';

const EmployeeFAQs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

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
  );
};

export default EmployeeFAQs;

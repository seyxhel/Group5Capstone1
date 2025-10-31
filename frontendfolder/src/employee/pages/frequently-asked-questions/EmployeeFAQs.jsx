import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import faqs from '../../../utilities/storages/faqs';
import styles from './EmployeeFAQs.module.css';
import ViewCard from '../../../shared/components/ViewCard';
import InputField from '../../../shared/components/InputField';

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

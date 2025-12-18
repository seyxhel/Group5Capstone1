import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import ARTICLES from '../../../mocks/seed/articles.json';
import styles from './CoordinatorKnowledgebase.module.css';
import ViewCard from '../../../shared/components/ViewCard';
import InputField from '../../../shared/components/InputField';
import Breadcrumb from '../../../shared/components/Breadcrumb';

const CoordinatorKnowledgebase = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleAnswer = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Only show articles visible to Ticket Coordinators
  const visibleArticles = ARTICLES.filter((article) => {
    return (article.visibility || '').toLowerCase() === 'ticket coordinator';
  });

  const filteredArticles = visibleArticles.filter((article) => {
    const query = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      (article.content || '').toLowerCase().includes(query) ||
      (article.summary || '').toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Breadcrumb
        root="Admin"
        rootNavigatePage="/admin/coordinator-admin"
        currentPage="Knowledge Base"
        title="Knowledge Base"
      />
      <ViewCard>
        <div className={styles.kbContainer}>
          <div className={styles.searchWrapper}>
            <InputField
              placeholder="Search Knowledge Base..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setExpandedIndex(null);
              }}
              inputStyle={{ width: '100%' }}
              aria-label="Search Knowledge Base"
            />
          </div>

          <ul className={styles.kbList}>
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article, index) => (
                <li key={article.id || index} className={styles.kbItem}>
                  <div
                    className={styles.kbQuestion}
                    onClick={() => toggleAnswer(index)}
                  >
                    <span>{article.title}</span>
                    {expandedIndex === index ? (
                      <FiChevronDown className={styles.kbArrow} />
                    ) : (
                      <FiChevronRight className={styles.kbArrow} />
                    )}
                  </div>
                  {expandedIndex === index && (
                    <div className={styles.kbAnswer}>
                      <p dangerouslySetInnerHTML={{ __html: article.content || article.summary || '' }} />
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
    </>
  );
};

export default CoordinatorKnowledgebase;

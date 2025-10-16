import React from 'react';
import ArticleCard from './ArticleCard';
import styles from './ArticleList.module.css';

const ArticleList = ({ articles = [], onOpen }) => {
  return (
    <div className={styles.list}>
      {articles.length === 0 ? (
        <p>No articles found.</p>
      ) : (
        articles.map(a => (
          <ArticleCard key={a.id} article={a} onOpen={onOpen} />
        ))
      )}
    </div>
  );
};

export default ArticleList;

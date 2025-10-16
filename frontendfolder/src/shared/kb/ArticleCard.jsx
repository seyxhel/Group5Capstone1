import React from 'react';
import styles from './ArticleCard.module.css';

const ArticleCard = ({ article, onOpen }) => {
  return (
    <article className={styles.card} onClick={() => onOpen && onOpen(article)}>
      <h3 className={styles.title}>{article.title}</h3>
      <p className={styles.meta}>Last updated: {article.date_modified} — {article.author}</p>
      <p className={styles.excerpt}>{article.content.slice(0, 120)}{article.content.length>120? '...' : ''}</p>
    </article>
  );
};

export default ArticleCard;

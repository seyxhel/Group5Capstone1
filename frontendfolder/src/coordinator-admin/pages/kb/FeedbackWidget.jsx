import React, { useState } from 'react';
import styles from './FeedbackWidget.module.css';

const FeedbackWidget = ({ articleId, onSubmit }) => {
  const [helpful, setHelpful] = useState(null);
  const [comment, setComment] = useState('');

  const submit = () => {
    onSubmit && onSubmit({ articleId, helpful, comment });
    setComment('');
  };

  return (
    <div className={styles.widget}>
      <div className={styles.buttons}>
        <button className={helpful===true?styles.active:''} onClick={() => setHelpful(true)}>👍</button>
        <button className={helpful===false?styles.active:''} onClick={() => setHelpful(false)}>👎</button>
      </div>
      <textarea value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Optional comment" />
      <div className={styles.actions}><button onClick={submit}>Send feedback</button></div>
    </div>
  );
};

export default FeedbackWidget;

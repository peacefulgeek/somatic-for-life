import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const isArticle = location.pathname.startsWith('/articles/');

  useEffect(() => {
    if (!isArticle) {
      setProgress(0);
      return;
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isArticle]);

  if (!isArticle) return null;

  return (
    <div
      id="reading-progress"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
      style={{ width: `${progress}%` }}
    />
  );
}

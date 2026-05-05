import React from 'react';

interface AuthorBylineProps {
  authorName?: string;
  credential?: string;
  lastUpdatedISO?: string;
  selfReferencingNote?: string;
}

export function AuthorByline({
  authorName = 'The Oracle Lover',
  credential = 'Intuitive Educator & Oracle Guide',
  lastUpdatedISO = new Date().toISOString().split('T')[0],
  selfReferencingNote = "I've spent years writing about somatic healing on this site. The body's wisdom is not mystical — it's biological. And it's available to you right now.",
}: AuthorBylineProps) {
  return (
    <aside className="author-byline" data-eeat="author">
      <p>
        <strong>Reviewed by {authorName}</strong>, {credential}.{' '}
        Last updated <time dateTime={lastUpdatedISO}>{lastUpdatedISO}</time>.
      </p>
      <p>{selfReferencingNote}</p>
    </aside>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';

interface AssessmentSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  time_minutes: number;
  question_count: number;
  category: string;
  related_article?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'polyvagal-theory': '#4A8C6A',
  'somatic-healing': '#6A5A90',
  'nervous-system': '#C4713A',
  'trauma-therapy': '#5A7A9A',
  'self-directed': '#8A6A4A',
};

const CATEGORY_LABELS: Record<string, string> = {
  'polyvagal-theory': 'Polyvagal Theory',
  'somatic-healing': 'Somatic Healing',
  'nervous-system': 'Nervous System',
  'trauma-therapy': 'Trauma Therapy',
  'self-directed': 'Self-Directed',
};

export function AssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Assessments | The Body Remembers';
    fetch('/api/assessments')
      .then(r => r.json())
      .then(data => { setAssessments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Could not load assessments'); setLoading(false); });
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Assessments' },
        ]} />

        <div className="page-header">
          <div className="page-header-eyebrow">Free Self-Assessment Tools</div>
          <h1 className="page-header-title">Know Your Nervous System</h1>
          <p className="page-header-description">
            Research-grounded assessments to help you understand your nervous system state, trauma response patterns, and readiness for somatic work. No email required. No data stored.
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{
          background: 'var(--accent-light)',
          border: '1px solid var(--accent-soft)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-4) var(--space-5)',
          marginBottom: 'var(--space-8)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> These assessments are educational tools, not clinical diagnoses. They're designed to help you understand your patterns and have more informed conversations with a therapist. If you're in crisis, please contact a mental health professional.
          </p>
        </div>

        {/* Assessment Cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
            {assessments.map((a) => {
              const color = CATEGORY_COLORS[a.category] || '#6A5A90';
              const label = CATEGORY_LABELS[a.category] || a.category;
              return (
                <Link
                  key={a.id}
                  to={`/assessments/${a.slug}`}
                  className="assessment-card"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="assessment-card-icon" style={{ background: `${color}18`, fontSize: '1.75rem', color }}>
                    {a.icon}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color,
                    marginBottom: 'var(--space-2)',
                  }}>
                    {label}
                  </div>
                  <h2 className="assessment-card-title">{a.title}</h2>
                  <p className="assessment-card-description">{a.description}</p>
                  <div className="assessment-card-meta">
                    <span>⏱ {a.time_minutes} min</span>
                    <span>· {a.question_count} questions</span>
                  </div>
                  <div className="assessment-card-cta" style={{ background: color }}>
                    Take Assessment →
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* About the assessments */}
        <section style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-8)',
        }}>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>About These Assessments</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
            {[
              { icon: '🔬', title: 'Research-Grounded', body: 'Each assessment is based on established frameworks from somatic psychology, polyvagal theory, and trauma research (Porges, Siegel, Levine, van der Kolk).' },
              { icon: '🔒', title: 'Private by Design', body: 'Your responses are never stored or transmitted. Everything happens in your browser. No account, no email, no tracking.' },
              { icon: '📖', title: 'Linked to Learning', body: 'Each result connects you to relevant articles and practices so you know what to do next — not just what state you\'re in.' },
              { icon: '🌱', title: 'A Starting Point', body: 'These are tools for self-awareness, not clinical diagnoses. Use them as an invitation to explore, not a verdict.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{item.title}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';

interface Option {
  label: string;
  score: Record<string, number>;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface ResultEntry {
  label: string;
  range?: [number, number];
  threshold?: number;
  color: string;
  emoji: string;
  headline: string;
  body: string;
  practices: string[];
  related_article?: string;
}

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  time_minutes: number;
  question_count: number;
  category: string;
  questions: Question[];
  results: Record<string, ResultEntry>;
}

interface ResultState {
  key: string;
  result: ResultEntry;
  scores: Record<string, number>;
}

function computeResult(assessment: Assessment, answers: Record<number, number>): ResultState | null {
  const scores: Record<string, number> = {};

  for (const question of assessment.questions) {
    const answerIndex = answers[question.id];
    if (answerIndex === undefined) continue;
    const option = question.options[answerIndex];
    if (!option) continue;
    for (const [key, value] of Object.entries(option.score)) {
      scores[key] = (scores[key] || 0) + (value as number);
    }
  }

  const results = assessment.results;

  // Strategy 1: range-based (e.g., low/moderate/high with numeric ranges)
  const rangeKeys = Object.keys(results).filter(k => results[k].range);
  if (rangeKeys.length > 0) {
    // Sum all scores to get a total
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    for (const key of rangeKeys) {
      const r = results[key];
      if (r.range && total >= r.range[0] && total <= r.range[1]) {
        return { key, result: r, scores };
      }
    }
    // Fallback: pick closest range
    const sorted = rangeKeys.sort((a, b) => (results[a].range![0] || 0) - (results[b].range![0] || 0));
    return { key: sorted[0], result: results[sorted[0]], scores };
  }

  // Strategy 2: dominant score key (e.g., ventral/sympathetic/dorsal)
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (dominant && results[dominant[0]]) {
    return { key: dominant[0], result: results[dominant[0]], scores };
  }

  // Fallback: first result
  const firstKey = Object.keys(results)[0];
  return { key: firstKey, result: results[firstKey], scores };
}

export function AssessmentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  useEffect(() => {
    setLoading(true);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    fetch(`/api/assessments/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => {
        setAssessment(data);
        document.title = `${data.title} | The Body Remembers`;
        setLoading(false);
      })
      .catch(() => {
        setError('Assessment not found');
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius)' }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Assessments', href: '/assessments' }, { label: 'Not Found' }]} />
          <div style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔍</div>
            <h1 style={{ marginBottom: 'var(--space-4)' }}>Assessment Not Found</h1>
            <Link to="/assessments" className="btn-primary">View All Assessments</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const totalQuestions = assessment.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (answeredCount < totalQuestions) return;
    const r = computeResult(assessment, answers);
    setResult(r);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Assessments', href: '/assessments' },
          { label: assessment.title },
        ]} />

        {!submitted ? (
          <>
            {/* Header */}
            <div className="page-header">
              <div className="page-header-eyebrow">
                {assessment.icon} Assessment · {assessment.time_minutes} min · {totalQuestions} questions
              </div>
              <h1 className="page-header-title">{assessment.title}</h1>
              <p className="page-header-description">{assessment.description}</p>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                <span>{answeredCount} of {totalQuestions} answered</span>
                <span>{progress}%</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
                  height: '100%',
                  width: `${progress}%`,
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
              {assessment.questions.map((question, qi) => {
                const isAnswered = answers[question.id] !== undefined;
                return (
                  <div
                    key={question.id}
                    id={`q-${question.id}`}
                    style={{
                      background: 'var(--bg-card)',
                      border: `2px solid ${isAnswered ? 'var(--accent)' : 'var(--border-card)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-6)',
                      boxShadow: isAnswered ? '0 0 0 4px var(--accent-light)' : 'var(--shadow-card)',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <p style={{
                      fontWeight: 700,
                      marginBottom: 'var(--space-4)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        background: isAnswered ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: isAnswered ? 'white' : 'var(--text-muted)',
                        borderRadius: '50%',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        marginRight: 'var(--space-3)',
                        flexShrink: 0,
                        transition: 'all 0.25s ease',
                      }}>
                        {isAnswered ? '✓' : qi + 1}
                      </span>
                      {question.text}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {question.options.map((option, oi) => {
                        const isSelected = answers[question.id] === oi;
                        return (
                          <button
                            key={oi}
                            onClick={() => handleAnswer(question.id, oi)}
                            style={{
                              background: isSelected ? 'var(--accent)' : 'var(--bg-secondary)',
                              color: isSelected ? 'white' : 'var(--text-secondary)',
                              border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                              borderRadius: 'var(--radius)',
                              padding: 'var(--space-3) var(--space-4)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: 'var(--text-sm)',
                              fontWeight: isSelected ? 600 : 400,
                              transition: 'all 0.2s ease',
                              lineHeight: 1.5,
                              minHeight: 'var(--tap-target-min)',
                              fontFamily: 'var(--font-sans)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-3)',
                            }}
                          >
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? 'rgba(255,255,255,0.6)' : 'var(--border)'}`,
                              background: isSelected ? 'rgba(255,255,255,0.25)' : 'transparent',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                            }}>
                              {isSelected ? '✓' : ''}
                            </span>
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <button
                onClick={handleSubmit}
                disabled={answeredCount < totalQuestions}
                style={{
                  background: answeredCount >= totalQuestions
                    ? 'linear-gradient(135deg, var(--accent), var(--accent-hover))'
                    : 'var(--bg-secondary)',
                  color: answeredCount >= totalQuestions ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--space-4) var(--space-10)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  cursor: answeredCount >= totalQuestions ? 'pointer' : 'not-allowed',
                  transition: 'all 0.25s ease',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: answeredCount >= totalQuestions ? '0 4px 16px rgba(106,90,144,0.35)' : 'none',
                  transform: answeredCount >= totalQuestions ? 'translateY(0)' : 'none',
                }}
              >
                {answeredCount < totalQuestions
                  ? `Answer ${totalQuestions - answeredCount} more question${totalQuestions - answeredCount !== 1 ? 's' : ''}`
                  : 'See My Results →'}
              </button>
              {answeredCount < totalQuestions && (
                <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  Complete all {totalQuestions} questions to see your personalized results.
                </p>
              )}
            </div>
          </>
        ) : result ? (
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Result Hero */}
            <div style={{
              background: `linear-gradient(135deg, ${result.result.color}22 0%, ${result.result.color}0a 100%)`,
              border: `2px solid ${result.result.color}50`,
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-10)',
              marginBottom: 'var(--space-8)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', lineHeight: 1 }}>{result.result.emoji}</div>
              <div style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: result.result.color,
                marginBottom: 'var(--space-3)',
              }}>
                Your Result
              </div>
              <h1 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-5)',
                lineHeight: 1.2,
              }}>
                {result.result.label}
              </h1>
              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                fontStyle: 'italic',
                fontWeight: 500,
              }}>
                {result.result.headline}
              </p>
            </div>

            {/* Understanding Your Result */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-7)',
              marginBottom: 'var(--space-6)',
              boxShadow: 'var(--shadow-card)',
            }}>
              <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                Understanding Your Result
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: 'var(--text-base)' }}>
                {result.result.body}
              </p>
            </div>

            {/* Practices */}
            {result.result.practices && result.result.practices.length > 0 && (
              <div style={{
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-soft)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-7)',
                marginBottom: 'var(--space-6)',
              }}>
                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)', color: 'var(--accent)' }}>
                  Practices to Try
                </h2>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {result.result.practices.map((p, i) => (
                    <li key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        background: 'var(--accent)',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '1px',
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Article */}
            {result.result.related_article && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                marginBottom: 'var(--space-8)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}>
                <div style={{ fontSize: '1.5rem' }}>📖</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                    Recommended Reading
                  </div>
                  <Link
                    to={`/articles/${result.result.related_article}`}
                    style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}
                  >
                    Read the related article →
                  </Link>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              lineHeight: 1.7,
            }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Remember:</strong> This assessment is an educational tool, not a clinical diagnosis. Results reflect patterns, not permanent states. If you're struggling, please reach out to a qualified mental health professional.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'var(--space-12)' }}>
              <button
                onClick={handleReset}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.2s ease',
                }}
              >
                ↺ Retake Assessment
              </button>
              <Link
                to="/assessments"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                Take Another Assessment
              </Link>
              <Link
                to="/articles"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                Read Articles
              </Link>
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}

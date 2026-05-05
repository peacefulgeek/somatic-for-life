import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';

export function AboutPage() {
  return (
    <div>
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-hero) 0%, var(--accent-dark) 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-12) var(--space-10)',
            marginBottom: 'var(--space-10)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🌿</div>
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, color: 'white', marginBottom: 'var(--space-4)', lineHeight: 1.2 }}>
              About The Body Remembers
            </h1>
            <p style={{ fontSize: 'var(--text-xl)', opacity: 0.85, lineHeight: 1.7, maxWidth: '540px' }}>
              The research-grounded resource for body-based trauma healing. No fluff. No mysticism. Just what the science actually says — and what actually works.
            </p>
          </div>

          {/* About the site */}
          <section style={{ marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-5)' }}>What This Site Is</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
              The Body Remembers is a resource for people who want to understand somatic trauma healing — what it is, how it works, and whether it might help them. It's written by The Oracle Lover, an intuitive educator and oracle guide who has spent years studying and writing about body-based approaches to trauma recovery.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
              The title comes from Bessel van der Kolk's landmark book <em>The Body Keeps the Score</em> — the idea that the body stores what the mind can't fully process. Unresolved trauma doesn't just live in memory. It lives in the nervous system, in posture, in breathing patterns, in the way you respond to threat even when there is no threat.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              This site exists because most information about somatic healing is either too clinical (hard to understand) or too mystical (hard to trust). We're trying to be neither.
            </p>
          </section>

          {/* About the author */}
          <section style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)',
            marginBottom: 'var(--space-10)',
          }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-5)' }}>About The Oracle Lover</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
              The Oracle Lover is an intuitive educator and oracle guide who writes about the intersection of ancient wisdom and modern neuroscience. The approach is direct, science-grounded, and deeply practical.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
              "The body doesn't lie. The mind does. Constantly." That's the core of this work — learning to trust the body's signals over the mind's stories about them.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-5)' }}>
              The Oracle Lover draws on the work of Bessel van der Kolk, Peter Levine, Pat Ogden, Stephen Porges, Resmaa Menakem, and others — translating research into language that's actually useful.
            </p>
            <a
              href="https://theoraclelover.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'var(--accent)',
                color: 'white',
                padding: 'var(--space-3) var(--space-6)',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                textDecoration: 'none',
              }}
            >
              Visit theoraclelover.com →
            </a>
          </section>

          {/* What we cover */}
          <section style={{ marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-5)' }}>What We Cover</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              {[
                { icon: '🧠', title: 'Polyvagal Theory', desc: 'How the autonomic nervous system responds to threat and safety' },
                { icon: '🌿', title: 'Somatic Experiencing', desc: 'Peter Levine\'s approach to releasing stored trauma through body awareness' },
                { icon: '👁', title: 'EMDR', desc: 'Eye movement desensitization and reprocessing — what it is and what the research shows' },
                { icon: '⚡', title: 'Nervous System Regulation', desc: 'Practical approaches to working with the sympathetic and parasympathetic systems' },
                { icon: '💜', title: 'Trauma-Informed Therapy', desc: 'When talk therapy isn\'t enough and what to look for instead' },
                { icon: '🧘', title: 'Somatic Practices', desc: 'Body-based practices you can do on your own — TRE, breathwork, yoga, and more' },
              ].map(item => (
                <div key={item.title} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius)',
                  padding: 'var(--space-5)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <section style={{
            background: 'var(--accent-light)',
            border: '1px solid var(--accent-soft)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-8)',
          }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>Medical Disclaimer</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              The content on this site is for educational purposes only. It is not a substitute for professional medical or mental health advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition or mental health concern.
            </p>
          </section>

          {/* Affiliate disclosure */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>Affiliate Disclosure</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              This site participates in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. When you click an Amazon link and make a purchase, we may earn a small commission at no additional cost to you. We only recommend products we genuinely believe are useful.
            </p>
          </section>

          <div style={{ textAlign: 'center' }}>
            <Link to="/articles" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              background: 'var(--accent)',
              color: 'white',
              padding: 'var(--space-4) var(--space-8)',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              textDecoration: 'none',
            }}>
              Start Reading →
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

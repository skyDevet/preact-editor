import { templates } from '../data/templates.js';
import { useState } from 'preact/hooks';

export function LandingPage({ onGetStarted }) {
    const [category, setCategory] = useState('all');
    const filtered = category === 'all'
        ? templates
        : templates.filter(t => t.category === category);

    return (
        <div class="landing-page" style={{display:'block', paddingTop:'80px'}}>
            <div class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">
                        Create amazing videos with <span class="gradient-text">DART</span>
                    </h1>
                    <p class="hero-subtitle">
                        Professional video editing tools for everyone.
                    </p>
                    <div class="hero-buttons">
                        <button class="hero-btn primary" onClick={onGetStarted}>
                            🎬 Get Started Free
                        </button>
                        <button class="hero-btn secondary"
                            onClick={() => alert('Demo would play here')}>
                            ▶ Watch Demo
                        </button>
                    </div>
                </div>
            </div>

            <div class="templates-section">
                <div class="section-header">
                    <h2>Start with a template</h2>
                </div>
                <div class="template-categories">
                    {['all','social','business','education','events','gaming'].map(cat => (
                        <button
                            key={cat}
                            class={`category-btn ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>
                <div class="templates-grid">
                    {filtered.map(t => (
                        <div key={t.id} class="template-card" onClick={onGetStarted}>
                            <div class="template-preview" style={{background: t.color}}>
                                {t.preview}
                            </div>
                            <div class="template-info">
                                <div class="template-title">{t.title}</div>
                                <div class="template-category">{t.category}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div class="cta-section" style={{padding:'80px 0', textAlign:'center'}}>
                <h2>Start creating amazing videos today</h2>
                <button class="hero-btn primary" onClick={onGetStarted}>
                    Get Started Free →
                </button>
            </div>
        </div>
    );
}

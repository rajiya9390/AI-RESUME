/**
 * AI Resume Builder - Intelligence Layer v1.3
 * Templates + Bullet Guidance + Improvement Logic
 */

const App = {
    // Action Verbs for Guidance
    actionVerbs: ['Built', 'Developed', 'Designed', 'Implemented', 'Led', 'Improved', 'Created', 'Optimized', 'Automated'],

    // Initial State
    state: {
        personal: { name: '', email: '', phone: '', location: '' },
        summary: '',
        education: [],
        experience: [],
        projects: [],
        skills: '',
        links: { github: '', linkedin: '' },
        selectedTemplate: 'template-classic'
    },

    init() {
        this.cacheDOM();
        this.loadFromStorage();
        this.bindEvents();
        this.handleInitialRoute();
    },

    cacheDOM() {
        this.root = document.getElementById('app-root');
    },

    loadFromStorage() {
        const saved = localStorage.getItem('resumeBuilderData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.error("Error loading state", e);
            }
        }
    },

    saveToStorage() {
        localStorage.setItem('resumeBuilderData', JSON.stringify(this.state));
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href')?.startsWith('/')) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }

            if (e.target.id === 'load-sample') this.loadSampleData();
            if (e.target.matches('.btn-add-edu')) this.addEntry('education');
            if (e.target.matches('.btn-add-exp')) this.addEntry('experience');
            if (e.target.matches('.btn-add-proj')) this.addEntry('projects');
            if (e.target.matches('.btn-remove-entry')) this.removeEntry(e.target.dataset.type, e.target.dataset.index);

            // Template Switcher
            if (e.target.matches('.tab-btn')) {
                this.state.selectedTemplate = e.target.dataset.template;
                this.saveToStorage();
                this.render();
            }
        });

        // Live Sync
        document.addEventListener('input', (e) => {
            if (window.location.pathname === '/builder') {
                this.syncFormToState();
                this.saveToStorage();
                this.renderLivePreview();
                this.updateScorePanel();
                // If it's a bullet input, we might need to re-render the specific guide
                if (e.target.tagName === 'TEXTAREA' && e.target.dataset.subfield === 'desc') {
                    this.updateBulletGuidance(e.target);
                }
            }
        });

        window.addEventListener('popstate', () => this.renderRoute(window.location.pathname));
    },

    navigate(path) {
        if (window.location.pathname === path) return;
        window.history.pushState({}, '', path);
        this.renderRoute(path);
    },

    handleInitialRoute() {
        this.renderRoute(window.location.pathname);
    },

    renderRoute(path) {
        this.updateActiveNav(path);
        window.scrollTo(0, 0);

        switch (path) {
            case '/': this.renderHome(); break;
            case '/builder': this.renderBuilder(); break;
            case '/preview': this.renderCleanPreview(); break;
            case '/proof': this.renderProof(); break;
            default: this.renderHome(); break;
        }
    },

    updateActiveNav(path) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === path);
        });
    },

    // Refresh current view based on current route
    render() {
        this.renderRoute(window.location.pathname);
    },

    // --- LOGIC ---

    addEntry(type) {
        const entry = { id: Date.now() };
        if (type === 'education') { entry.school = ''; entry.degree = ''; }
        if (type === 'experience') { entry.company = ''; entry.role = ''; entry.desc = ''; }
        if (type === 'projects') { entry.name = ''; entry.desc = ''; }

        this.state[type].push(entry);
        this.saveToStorage();
        this.render();
    },

    removeEntry(type, index) {
        this.state[type].splice(index, 1);
        this.saveToStorage();
        this.render();
    },

    syncFormToState() {
        const personalFields = this.root.querySelectorAll('[data-field^="personal."]');
        personalFields.forEach(f => {
            const key = f.getAttribute('data-field').split('.')[1];
            this.state.personal[key] = f.value;
        });

        const linkFields = this.root.querySelectorAll('[data-field^="links."]');
        linkFields.forEach(f => {
            const key = f.getAttribute('data-field').split('.')[1];
            this.state.links[key] = f.value;
        });

        this.state.summary = this.root.querySelector('[data-field="summary"]')?.value || '';
        this.state.skills = this.root.querySelector('[data-field="skills"]')?.value || '';

        ['education', 'experience', 'projects'].forEach(type => {
            const containers = this.root.querySelectorAll(`[data-entry-type="${type}"]`);
            this.state[type] = Array.from(containers).map(container => {
                const data = {};
                container.querySelectorAll('[data-subfield]').forEach(input => {
                    data[input.getAttribute('data-subfield')] = input.value;
                });
                return data;
            });
        });
    },

    calculateATSScore() {
        let score = 0;
        const { summary, education, experience, projects, skills, links } = this.state;

        const wordCount = summary.trim().split(/\s+/).filter(w => w).length;
        if (wordCount >= 40 && wordCount <= 120) score += 15;
        if (projects.length >= 2) score += 10;
        if (experience.length >= 1) score += 10;
        const skillCount = skills.split(',').map(s => s.trim()).filter(s => s).length;
        if (skillCount >= 8) score += 10;
        if (links.github || links.linkedin) score += 10;
        const hasNumbers = [...experience, ...projects].some(p => /[0-9]+|%|k|m|x/.test((p.desc || '').toLowerCase()));
        if (hasNumbers) score += 15;
        const eduComplete = education.length > 0 && education.every(e => e.school && e.degree);
        if (eduComplete) score += 10;

        return {
            total: Math.min(score, 100),
            wordCount,
            projectsCount: projects.length,
            experienceCount: experience.length,
            skillCount,
            hasLinks: !!(links.github || links.linkedin),
            hasNumbers,
            eduComplete
        };
    },

    getTopImprovements(stats) {
        const imps = [];
        if (stats.projectsCount < 2) imps.push({ label: "Add at least 2 projects.", priority: 1 });
        if (!stats.hasNumbers) imps.push({ label: "Include measurable impact (numbers, %, $).", priority: 1 });
        if (stats.wordCount < 40) imps.push({ label: "Summary is too short (<40 words).", priority: 2 });
        if (stats.skillCount < 8) imps.push({ label: "Target 8+ strategic skills.", priority: 2 });
        if (stats.experienceCount === 0) imps.push({ label: "Add an internship or project work.", priority: 1 });

        return imps.slice(0, 3);
    },

    checkBullet(text) {
        const words = text.trim().split(/\s+/);
        const firstWord = words[0] ? words[0].replace(/[^a-zA-Z]/g, '') : '';
        const startsWithVerb = this.actionVerbs.some(v => v.toLowerCase() === firstWord.toLowerCase());
        const hasNumbers = /[0-9]+|%|k|m|x/.test(text.toLowerCase());
        return { startsWithVerb, hasNumbers };
    },

    updateBulletGuidance(textarea) {
        const guideEl = textarea.nextElementSibling;
        if (!guideEl || !guideEl.classList.contains('bullet-guide')) return;

        const { startsWithVerb, hasNumbers } = this.checkBullet(textarea.value);
        if (!textarea.value.trim()) {
            guideEl.innerHTML = '';
            return;
        }

        let html = '';
        if (!startsWithVerb) html += `<span>⚠ Use an action verb.</span>`;
        if (!hasNumbers) html += `<span>⚠ Add measurable impact.</span>`;

        guideEl.innerHTML = html || '<span class="passed">✓ Strong bullet point.</span>';
    },

    // --- RENDERERS ---

    renderBuilder() {
        this.root.innerHTML = `
            <div class="builder-grid">
                <div class="form-panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 class="serif">Resume Builder</h2>
                        <button class="btn btn-secondary" id="load-sample" style="font-size: 11px;">Load Sample</button>
                    </div>

                    <!-- Template Switcher -->
                    <div class="template-tabs">
                        <button class="tab-btn ${this.state.selectedTemplate === 'template-classic' ? 'active' : ''}" data-template="template-classic">Classic</button>
                        <button class="tab-btn ${this.state.selectedTemplate === 'template-modern' ? 'active' : ''}" data-template="template-modern">Modern</button>
                        <button class="tab-btn ${this.state.selectedTemplate === 'template-minimal' ? 'active' : ''}" data-template="template-minimal">Minimal</button>
                    </div>

                    <!-- Personal Info -->
                    <div class="form-section">
                        <h3 class="section-title">Personal Information</h3>
                        <div class="input-group"><label class="input-label">Full Name</label><input type="text" data-field="personal.name"></div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="input-group"><label class="input-label">Email</label><input type="email" data-field="personal.email"></div>
                            <div class="input-group"><label class="input-label">Phone</label><input type="tel" data-field="personal.phone"></div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3 class="section-title">Summary</h3>
                        <textarea data-field="summary" rows="3" placeholder="40-120 words recommended."></textarea>
                    </div>

                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);">
                            <h3 class="section-title" style="border:none; margin:0;">Experience</h3>
                            <button class="btn-ghost btn-add-exp">+ Add</button>
                        </div>
                        <div id="experience-entries"></div>
                    </div>

                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);">
                            <h3 class="section-title" style="border:none; margin:0;">Projects</h3>
                            <button class="btn-ghost btn-add-proj">+ Add</button>
                        </div>
                        <div id="projects-entries"></div>
                    </div>

                    <div class="form-section">
                        <h3 class="section-title">Skills</h3>
                        <input type="text" data-field="skills" placeholder="List 8+ skills for higher score.">
                    </div>
                </div>

                <div class="preview-panel">
                    <div style="width: 100%; max-width: 600px;">
                        <div id="score-panel-root"></div>
                        <div id="live-preview-container"></div>
                    </div>
                </div>
            </div>
        `;
        this.populateFormFromState();
        this.renderLivePreview();
        this.updateScorePanel();

        // Initial bullet check
        this.root.querySelectorAll('textarea[data-subfield="desc"]').forEach(ta => this.updateBulletGuidance(ta));
    },

    updateScorePanel() {
        const root = document.getElementById('score-panel-root');
        if (!root) return;
        const stats = this.calculateATSScore();
        const improvements = this.getTopImprovements(stats);

        root.innerHTML = `
            <div class="score-card">
                <div class="score-header"><span class="score-label">ATS Readiness</span><span class="score-value">${stats.total}%</span></div>
                <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${stats.total}%"></div></div>
                
                <h4 style="font-size:11px; text-transform:uppercase; margin-bottom:12px; opacity:0.6;">Top 3 Improvements</h4>
                <ul class="suggestions-list">
                    ${improvements.length ? improvements.map(i => `<li class="suggestion-item">${i.label}</li>`).join('') : '<li style="font-size:13px; color:var(--color-success);">✓ No major improvements needed.</li>'}
                </ul>
            </div>
        `;
    },

    renderEntryForm(type, entry, index) {
        if (type === 'experience' || type === 'projects') {
            const titleLabel = type === 'experience' ? 'Company' : 'Project Name';
            const subLabel = type === 'experience' ? 'role' : 'none';
            const titleField = type === 'experience' ? 'company' : 'name';

            return `
                <div class="entry-card" data-entry-type="${type}" data-index="${index}">
                    <button class="btn-remove-entry" data-type="${type}" data-index="${index}" style="position:absolute; top:8px; right:8px; opacity:0.3;">✕</button>
                    <div class="input-group"><input type="text" data-subfield="${titleField}" placeholder="${titleLabel}" value="${entry[titleField] || ''}"></div>
                    ${type === 'experience' ? `<div class="input-group"><input type="text" data-subfield="role" placeholder="Role" value="${entry.role || ''}"></div>` : ''}
                    <textarea data-subfield="desc" placeholder="Details (Start with Developed/Built...)" rows="2">${entry.desc || ''}</textarea>
                    <div class="bullet-guide"></div>
                </div>`;
        }

        // Education
        return `
            <div class="entry-card" data-entry-type="${type}" data-index="${index}">
                <button class="btn-remove-entry" data-type="${type}" data-index="${index}" style="position:absolute; top:8px; right:8px; opacity:0.3;">✕</button>
                <div class="input-group"><input type="text" data-subfield="school" placeholder="University" value="${entry.school || ''}"></div>
                <div class="input-group"><input type="text" data-subfield="degree" placeholder="Degree" value="${entry.degree || ''}"></div>
            </div>`;
    },

    populateFormFromState() {
        this.root.querySelectorAll('[data-field]').forEach(input => {
            const field = input.getAttribute('data-field');
            if (field.includes('.')) { input.value = this.state[field.split('.')[0]][field.split('.')[1]] || ''; }
            else { input.value = this.state[field] || ''; }
        });
        ['education', 'experience', 'projects'].forEach(type => {
            const container = document.getElementById(`${type}-entries`);
            if (container) container.innerHTML = (this.state[type] || []).map((entry, i) => this.renderEntryForm(type, entry, i)).join('');
        });
    },

    renderLivePreview() {
        const container = document.getElementById('live-preview-container');
        if (!container) return;
        container.innerHTML = `
            <div class="resume-paper ${this.state.selectedTemplate}" style="transform: scale(0.75); transform-origin: top left; width: 800px; min-height: 1000px; margin-bottom: -250px;">
                ${this.generateResumeHTML()}
            </div>
        `;
    },

    renderCleanPreview() {
        this.root.innerHTML = `
            <div style="padding: var(--space-xl) var(--space-m); display: flex; flex-direction: column; align-items: center; background: #fff;">
                <div class="template-tabs" style="width: 300px; margin-bottom: 40px;">
                    <button class="tab-btn ${this.state.selectedTemplate === 'template-classic' ? 'active' : ''}" data-template="template-classic">Classic</button>
                    <button class="tab-btn ${this.state.selectedTemplate === 'template-modern' ? 'active' : ''}" data-template="template-modern">Modern</button>
                    <button class="tab-btn ${this.state.selectedTemplate === 'template-minimal' ? 'active' : ''}" data-template="template-minimal">Minimal</button>
                </div>
                <div class="resume-paper clean ${this.state.selectedTemplate}" style="width: 800px; min-height: 1000px;">
                    ${this.generateResumeHTML()}
                </div>
            </div>
        `;
    },

    generateResumeHTML() {
        const { personal, summary, education, experience, projects, skills, links } = this.state;

        const section = (title, content) => (!content || content.length < 5) ? '' : `
            <div class="resume-section">
                <h4 class="resume-section-title">${title}</h4>
                ${content}
            </div>`;

        const expHTML = experience.filter(e => e.company || e.role).map(e => `
            <div class="resume-entry">
                <div class="resume-entry-header"><span>${e.company}</span></div>
                <div class="resume-entry-sub"><span>${e.role}</span></div>
                <p style="font-size: 14px; margin-top: 4px; color: #444;">${e.desc || ''}</p>
            </div>`).join('');

        const projHTML = projects.filter(p => p.name).map(p => `
            <div class="resume-entry">
                <div class="resume-entry-header"><span>${p.name}</span></div>
                <p style="font-size: 14px; margin-top: 2px; color: #444;">${p.desc || ''}</p>
            </div>`).join('');

        const eduHTML = education.filter(e => e.school).map(e => `
            <div class="resume-entry">
                <div class="resume-entry-header"><span>${e.school}</span></div>
                <div class="resume-entry-sub"><span>${e.degree}</span></div>
            </div>`).join('');

        const skillArr = skills.split(',').map(s => s.trim()).filter(s => s);
        const skillHTML = skillArr.length ? `<div class="resume-skills">${skillArr.map(s => `<span class="skill-pill">${s}</span>`).join('')}</div>` : '';

        const contactArr = [personal.email, personal.phone, personal.location, links.github, links.linkedin].filter(Boolean);

        return `
            <div class="resume-header">
                <h1>${personal.name || 'Your Name'}</h1>
                <div class="resume-contact">${contactArr.map(c => `<span>${c}</span>`).join(' • ')}</div>
            </div>
            ${section('Summary', summary ? `<p style="font-size: 14px; color:#333;">${summary}</p>` : '')}
            ${section('Experience', expHTML)}
            ${section('Projects', projHTML)}
            ${section('Education', eduHTML)}
            ${section('Skills', skillHTML)}
        `;
    },

    loadSampleData() {
        this.state = {
            ...this.state,
            personal: { name: 'Alex Rivera', email: 'alex.rivera@example.com', phone: '+1 555-0123', location: 'Austin, TX' },
            summary: 'Strategic Software Engineer with over 5 years of experience specialized in building cloud-native applications. Proven track record of improving latency by 30% through architectural optimizations. Dedicated to leading mission-critical projects.',
            experience: [{ company: 'Innovate Tech', role: 'Senior Developer', desc: 'Developed a high-availability microservices architecture.' }],
            projects: [{ name: 'ATS Engine', desc: 'Optimized the recruitment flow by 25% using a custom scoring algorithm.' }],
            skills: 'React, Node.js, AWS, Kubernetes, Python, SQL, Docker, Redis',
            links: { github: 'github.com/alexrivera', linkedin: 'linkedin.com/in/alexrivera' }
        };
        this.saveToStorage();
        this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

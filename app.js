/**
 * AI Resume Builder - Intelligence Layer v1.2
 * Autosave + ATS Scoring v1 (Deterministic)
 */

const App = {
    // Initial State
    state: {
        personal: { name: '', email: '', phone: '', location: '' },
        summary: '',
        education: [],
        experience: [],
        projects: [],
        skills: '',
        links: { github: '', linkedin: '' }
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
                this.state = JSON.parse(saved);
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
        });

        // Live Sync
        document.addEventListener('input', (e) => {
            if (window.location.pathname === '/builder') {
                this.syncFormToState();
                this.saveToStorage();
                this.renderLivePreview();
                this.updateScorePanel();
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

    // --- LOGIC ---

    addEntry(type) {
        const entry = { id: Date.now() };
        if (type === 'education') { entry.school = ''; entry.degree = ''; entry.date = ''; }
        if (type === 'experience') { entry.company = ''; entry.role = ''; entry.desc = ''; }
        if (type === 'projects') { entry.name = ''; entry.desc = ''; }

        this.state[type].push(entry);
        this.saveToStorage();
        this.renderBuilder();
    },

    removeEntry(type, index) {
        this.state[type].splice(index, 1);
        this.saveToStorage();
        this.renderBuilder();
    },

    syncFormToState() {
        // Personal and Links
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

        // Summary and Skills
        this.state.summary = this.root.querySelector('[data-field="summary"]')?.value || '';
        this.state.skills = this.root.querySelector('[data-field="skills"]')?.value || '';

        // Dynamic Entries
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
        const { personal, summary, education, experience, projects, skills, links } = this.state;

        // 1. Summary Length (40-120 words)
        const wordCount = summary.trim().split(/\s+/).filter(w => w).length;
        if (wordCount >= 40 && wordCount <= 120) score += 15;

        // 2. Projects (At least 2)
        if (projects.length >= 2) score += 10;

        // 3. Experience (At least 1)
        if (experience.length >= 1) score += 10;

        // 4. Skills (At least 8)
        const skillCount = skills.split(',').map(s => s.trim()).filter(s => s).length;
        if (skillCount >= 8) score += 10;

        // 5. Links
        if (links.github || links.linkedin) score += 10;

        // 6. Measurable Impact (Numbers in exp/proj)
        const hasNumbers = [...experience, ...projects].some(p => {
            const text = (p.desc || '').toLowerCase();
            return /[0-9]+|%|k|m|x/.test(text); // Basic number detection
        });
        if (hasNumbers) score += 15;

        // 7. Education Completeness
        const eduComplete = education.length > 0 && education.every(e => e.school && e.degree);
        if (eduComplete) score += 10;

        return {
            total: Math.min(score, 100),
            checks: {
                summary: wordCount >= 40 && wordCount <= 120,
                projects: projects.length >= 2,
                experience: experience.length >= 1,
                skills: skillCount >= 8,
                links: !!(links.github || links.linkedin),
                impact: hasNumbers,
                education: eduComplete
            }
        };
    },

    getSuggestions(checks) {
        const suggestions = [];
        if (!checks.experience) suggestions.push("Add at least 1 work experience entry.");
        if (!checks.projects) suggestions.push("Add at least 2 projects.");
        if (!checks.impact) suggestions.push("Add measurable impact (numbers, %, k) to your bullets.");
        if (!checks.summary) suggestions.push("Write a stronger summary (40–120 words).");
        if (!checks.skills) suggestions.push("Add more skills (target 8+).");
        if (!checks.links) suggestions.push("Add GitHub or LinkedIn links.");

        return suggestions.slice(0, 3);
    },

    // --- RENDERERS ---

    renderHome() {
        this.root.innerHTML = `
            <section class="hero-section">
                <h1>Build a Resume That Gets Read.</h1>
                <p class="mb-12" style="font-size: 20px; color: #555;">Create professional, high-impact resumes with ease.</p>
                <div class="mt-24">
                    <a href="/builder" class="btn btn-primary">Start Building</a>
                </div>
            </section>
        `;
    },

    renderBuilder() {
        this.root.innerHTML = `
            <div class="builder-grid">
                <div class="form-panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                        <h2 class="serif">Resume Builder</h2>
                        <button class="btn btn-secondary" id="load-sample" style="font-size: 11px;">Load Sample Data</button>
                    </div>

                    <!-- Personal Info -->
                    <div class="form-section">
                        <h3 class="section-title">Personal Information</h3>
                        <div class="input-group"><label class="input-label">Full Name</label><input type="text" data-field="personal.name" placeholder="John Doe"></div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="input-group"><label class="input-label">Email</label><input type="email" data-field="personal.email"></div>
                            <div class="input-group"><label class="input-label">Phone</label><input type="tel" data-field="personal.phone"></div>
                        </div>
                        <div class="input-group"><label class="input-label">Location</label><input type="text" data-field="personal.location" placeholder="San Francisco, CA"></div>
                    </div>

                    <!-- Summary -->
                    <div class="form-section">
                        <h3 class="section-title">Summary</h3>
                        <textarea data-field="summary" rows="4" placeholder="40-120 words for best ATS results..."></textarea>
                    </div>

                    <!-- Education -->
                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--color-border);">
                            <h3 class="section-title" style="border:none; margin:0;">Education</h3>
                            <button class="btn-ghost btn-add-edu">+ Add</button>
                        </div>
                        <div id="education-entries"></div>
                    </div>

                    <!-- Experience -->
                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--color-border);">
                            <h3 class="section-title" style="border:none; margin:0;">Experience</h3>
                            <button class="btn-ghost btn-add-exp">+ Add</button>
                        </div>
                        <div id="experience-entries"></div>
                    </div>

                    <!-- Projects -->
                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--color-border);">
                            <h3 class="section-title" style="border:none; margin:0;">Projects</h3>
                            <button class="btn-ghost btn-add-proj">+ Add</button>
                        </div>
                        <div id="projects-entries"></div>
                    </div>

                    <!-- Skills -->
                    <div class="form-section">
                        <h3 class="section-title">Skills</h3>
                        <input type="text" data-field="skills" placeholder="React, Python, SQL (comma separated)...">
                    </div>

                    <!-- Links -->
                    <div class="form-section">
                        <h3 class="section-title">Links</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="input-group"><label class="input-label">GitHub</label><input type="text" data-field="links.github"></div>
                            <div class="input-group"><label class="input-label">LinkedIn</label><input type="text" data-field="links.linkedin"></div>
                        </div>
                    </div>
                </div>

                <div class="preview-panel">
                    <div style="width: 100%; max-width: 600px;">
                        <!-- SCORE PANEL -->
                        <div id="score-panel-root"></div>

                        <div id="live-preview-container"></div>
                    </div>
                </div>
            </div>
        `;
        this.populateFormFromState();
        this.renderLivePreview();
        this.updateScorePanel();
    },

    updateScorePanel() {
        const root = document.getElementById('score-panel-root');
        if (!root) return;

        const scoreData = this.calculateATSScore();
        const suggestions = this.getSuggestions(scoreData.checks);

        root.innerHTML = `
            <div class="score-card">
                <div class="score-header">
                    <span class="score-label">ATS Readiness Score</span>
                    <span class="score-value">${scoreData.total}%</span>
                </div>
                <div class="score-bar-bg">
                    <div class="score-bar-fill" style="width: ${scoreData.total}%"></div>
                </div>
                ${suggestions.length ? `
                    <ul class="suggestions-list">
                        ${suggestions.map(s => `<li class="suggestion-item">${s}</li>`).join('')}
                    </ul>
                ` : '<p style="font-size: 13px; color: var(--color-success); font-weight: 600;">✓ Looking Great!</p>'}
            </div>
        `;
    },

    populateFormFromState() {
        // Individual fields
        this.root.querySelectorAll('[data-field]').forEach(input => {
            const field = input.getAttribute('data-field');
            if (field.includes('.')) {
                const [obj, key] = field.split('.');
                input.value = this.state[obj][key] || '';
            } else {
                input.value = this.state[field] || '';
            }
        });

        // Loop sections
        ['education', 'experience', 'projects'].forEach(type => {
            const container = document.getElementById(`${type}-entries`);
            if (container) {
                container.innerHTML = (this.state[type] || []).map((entry, i) => this.renderEntryForm(type, entry, i)).join('');
            }
        });
    },

    renderEntryForm(type, entry, index) {
        let fields = '';
        if (type === 'education') {
            fields = `
                <div class="input-group"><input type="text" data-subfield="school" placeholder="University Name" value="${entry.school || ''}"></div>
                <div class="input-group"><input type="text" data-subfield="degree" placeholder="Degree" value="${entry.degree || ''}"></div>
            `;
        } else if (type === 'experience') {
            fields = `
                <div class="input-group"><input type="text" data-subfield="company" placeholder="Company Name" value="${entry.company || ''}"></div>
                <div class="input-group"><input type="text" data-subfield="role" placeholder="Role" value="${entry.role || ''}"></div>
                <textarea data-subfield="desc" placeholder="Responsibilities (include numbers like 20% improvement...)" rows="3">${entry.desc || ''}</textarea>
            `;
        } else {
            fields = `
                <div class="input-group"><input type="text" data-subfield="name" placeholder="Project Name" value="${entry.name || ''}"></div>
                <textarea data-subfield="desc" placeholder="Overview (mention metrics if possible)" rows="2">${entry.desc || ''}</textarea>
            `;
        }

        return `
            <div class="entry-card" data-entry-type="${type}" data-index="${index}">
                <button class="btn-remove-entry" data-type="${type}" data-index="${index}" style="position:absolute; top:8px; right:8px; font-size:10px; opacity:0.3;">✕</button>
                ${fields}
            </div>`;
    },

    renderLivePreview() {
        const container = document.getElementById('live-preview-container');
        if (!container) return;
        container.innerHTML = `
            <div class="resume-paper" style="transform: scale(calc(600 / 800)); transform-origin: top left; margin-bottom: -200px; width: 800px; min-height: 1000px;">
                ${this.generateResumeHTML()}
            </div>
        `;
    },

    renderCleanPreview() {
        this.root.innerHTML = `
            <div style="padding: var(--space-xl) var(--space-m); display: flex; justify-content: center; background: #fff;">
                <div class="resume-paper clean" style="width: 800px; min-height: 1000px;">
                    ${this.generateResumeHTML()}
                </div>
            </div>
        `;
    },

    generateResumeHTML() {
        const { personal, summary, education, experience, projects, skills, links } = this.state;

        const renderSection = (title, content) => {
            if (!content || (Array.isArray(content) && content.length === 0)) return '';
            return `
                <div class="resume-section">
                    <h4 class="resume-section-title">${title}</h4>
                    ${content}
                </div>
            `;
        };

        const expHTML = experience.filter(e => e.company || e.role).map(e => `
            <div class="resume-entry">
                <div class="resume-entry-header"><span>${e.company}</span></div>
                <div class="resume-entry-sub"><span>${e.role}</span></div>
                <p style="font-size: 14px; margin-top: 4px; color: #444;">${e.desc || ''}</p>
            </div>
        `).join('');

        const projHTML = projects.filter(p => p.name).map(p => `
            <div class="resume-entry">
                <div class="resume-entry-header"><span>${p.name}</span></div>
                <p style="font-size: 14px; margin-top: 2px; color: #444;">${p.desc || ''}</p>
            </div>
        `).join('');

        const eduHTML = education.filter(e => e.school).map(e => `
            <div class="resume-entry">
                <div class="resume-entry-header"><span>${e.school}</span></div>
                <div class="resume-entry-sub"><span>${e.degree}</span></div>
            </div>
        `).join('');

        const skillArr = skills.split(',').map(s => s.trim()).filter(s => s);
        const skillHTML = skillArr.length ? `
            <div class="resume-skills">
                ${skillArr.map(s => `<span class="skill-pill">${s}</span>`).join('')}
            </div>
        ` : '';

        const contactArr = [personal.email, personal.phone, personal.location, links.github, links.linkedin].filter(Boolean);

        return `
            <div class="resume-header">
                <h1>${personal.name || 'Full Name'}</h1>
                <div class="resume-contact">
                    ${contactArr.map(c => `<span>${c}</span>`).join(' • ')}
                </div>
            </div>

            ${renderSection('Summary', summary ? `<p style="font-size: 14px; white-space: pre-line; color: #333;">${summary}</p>` : '')}
            ${renderSection('Experience', expHTML)}
            ${renderSection('Projects', projHTML)}
            ${renderSection('Education', eduHTML)}
            ${renderSection('Skills', skillHTML)}
        `;
    },

    loadSampleData() {
        this.state = {
            personal: { name: 'Alex Rivera', email: 'alex.rivera@example.com', phone: '+1 (555) 0123', location: 'Austin, TX' },
            summary: 'Results-driven Software Engineer with over 5 years of experience specialized in building cloud-native applications. Proven track record of improving system performance by 30% through targeted optimizations and architectural redesigns. Passionate about solving complex problems and leading high-performing technical teams.',
            education: [{ school: 'University of Texas', degree: 'B.S. in Computer Science' }],
            experience: [{ company: 'Innovate Tech', role: 'Senior Developer', desc: 'Led a team of 10 to deliver a mission-critical platform. Reduced downtime by 45% and mentored 4 junior engineers.' }],
            projects: [
                { name: 'E-commerce Engine', desc: 'Built a high-throughput checkout system handling 50k requests per minute.' },
                { name: 'ATS Scanner', desc: 'Developed a deterministic scoring algorithm for resume parsing.' }
            ],
            skills: 'React, Node.js, AWS, Kubernetes, Docker, PostgreSQL, Typescript, Redis, Python',
            links: { github: 'github.com/alexrivera', linkedin: 'linkedin.com/in/alexrivera' }
        };
        this.saveToStorage();
        this.renderBuilder();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

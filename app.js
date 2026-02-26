/**
 * AI Resume Builder - Intelligence Layer v1.0
 * Pure Layout Skeleton & Dynamic Data Sync
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
        this.bindEvents();
        this.handleInitialRoute();
    },

    cacheDOM() {
        this.root = document.getElementById('app-root');
        this.navLinks = document.querySelectorAll('.nav-link');
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href')?.startsWith('/')) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }

            // Builder Actions
            if (e.target.id === 'load-sample') this.loadSampleData();
            if (e.target.matches('.btn-add-edu')) this.addEntry('education');
            if (e.target.matches('.btn-add-exp')) this.addEntry('experience');
            if (e.target.matches('.btn-add-proj')) this.addEntry('projects');
        });

        // Live Sync for the Builder
        document.addEventListener('input', (e) => {
            if (window.location.pathname === '/builder') {
                this.syncFormToState();
                this.renderLivePreview();
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

    // --- PAGE RENDERERS ---

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
                        <button class="btn btn-secondary" id="load-sample" style="font-size: 13px; padding: 8px 16px;">Load Sample Data</button>
                    </div>

                    <!-- Personal Info -->
                    <div class="form-section">
                        <h3 class="section-title">Personal Information</h3>
                        <div class="input-group">
                            <label class="input-label">Full Name</label>
                            <input type="text" data-field="personal.name" placeholder="John Doe">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="input-group"><label class="input-label">Email</label><input type="email" data-field="personal.email"></div>
                            <div class="input-group"><label class="input-label">Phone</label><input type="tel" data-field="personal.phone"></div>
                        </div>
                        <div class="input-group">
                            <label class="input-label">Location</label>
                            <input type="text" data-field="personal.location" placeholder="City, State">
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="form-section">
                        <h3 class="section-title">Professional Summary</h3>
                        <textarea data-field="summary" rows="4" placeholder="Brief overview of your career and goals..."></textarea>
                    </div>

                    <!-- Education -->
                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 class="section-title" style="margin-bottom: 0; border: none;">Education</h3>
                            <button class="btn-ghost btn-add-edu">+ Add Entry</button>
                        </div>
                        <div id="education-entries"></div>
                    </div>

                    <!-- Experience -->
                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 class="section-title" style="margin-bottom: 0; border: none;">Experience</h3>
                            <button class="btn-ghost btn-add-exp">+ Add Entry</button>
                        </div>
                        <div id="experience-entries"></div>
                    </div>

                    <!-- Projects -->
                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 class="section-title" style="margin-bottom: 0; border: none;">Projects</h3>
                            <button class="btn-ghost btn-add-proj">+ Add Entry</button>
                        </div>
                        <div id="projects-entries"></div>
                    </div>

                    <!-- Skills -->
                    <div class="form-section">
                        <h3 class="section-title">Skills</h3>
                        <input type="text" data-field="skills" placeholder="React, Node.js, Python...">
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
                    <div id="live-preview-container">
                        <!-- Resume Layout Shell -->
                    </div>
                </div>
            </div>
        `;
        this.renderLivePreview();
        this.populateFormFromState();
    },

    renderCleanPreview() {
        this.root.innerHTML = `
            <div style="padding: var(--space-xl) var(--space-m); display: flex; justify-content: center; background: #fff;">
                <div class="resume-paper clean">
                    ${this.generateResumeHTML()}
                </div>
            </div>
        `;
    },

    renderProof() {
        this.root.innerHTML = `<section class="hero-section"><h1>Project Proof</h1><p class="subtext">Verification and artifacts placeholder.</p></section>`;
    },

    // --- LOGIC ---

    addEntry(type) {
        const entry = { id: Date.now() };
        if (type === 'education') entry.school = '';
        if (type === 'experience') entry.company = '';
        if (type === 'projects') entry.name = '';

        this.state[type].push(entry);
        this.renderBuilder();
    },

    syncFormToState() {
        const inputs = this.root.querySelectorAll('[data-field]');
        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            const value = input.value;

            if (field.includes('.')) {
                const [obj, key] = field.split('.');
                this.state[obj][key] = value;
            } else {
                this.state[field] = value;
            }
        });

        // Sync Dynamic Entries
        this.syncDynamicEntries('education');
        this.syncDynamicEntries('experience');
        this.syncDynamicEntries('projects');
    },

    syncDynamicEntries(type) {
        const containers = this.root.querySelectorAll(`[data-entry-type="${type}"]`);
        this.state[type] = Array.from(containers).map(container => {
            const data = {};
            container.querySelectorAll('[data-subfield]').forEach(input => {
                data[input.getAttribute('data-subfield')] = input.value;
            });
            return data;
        });
    },

    populateFormFromState() {
        // Simple fields
        this.root.querySelectorAll('[data-field]').forEach(input => {
            const field = input.getAttribute('data-field');
            if (field.includes('.')) {
                const [obj, key] = field.split('.');
                input.value = this.state[obj][key] || '';
            } else {
                input.value = this.state[field] || '';
            }
        });

        // Dynamic Entries
        ['education', 'experience', 'projects'].forEach(type => {
            const container = document.getElementById(`${type}-entries`);
            if (container) {
                container.innerHTML = this.state[type].map((entry, i) => this.renderEntryForm(type, entry, i)).join('');
            }
        });
    },

    renderEntryForm(type, entry, index) {
        let fields = '';
        if (type === 'education') {
            fields = `
                <div class="input-group"><label class="input-label">School</label><input type="text" data-subfield="school" value="${entry.school || ''}"></div>
                <div class="input-group"><label class="input-label">Degree</label><input type="text" data-subfield="degree" value="${entry.degree || ''}"></div>
            `;
        } else if (type === 'experience') {
            fields = `
                <div class="input-group"><label class="input-label">Company</label><input type="text" data-subfield="company" value="${entry.company || ''}"></div>
                <div class="input-group"><label class="input-label">Role</label><input type="text" data-subfield="role" value="${entry.role || ''}"></div>
            `;
        } else {
            fields = `
                <div class="input-group"><label class="input-label">Project Name</label><input type="text" data-subfield="name" value="${entry.name || ''}"></div>
                <textarea data-subfield="desc" placeholder="Project description...">${entry.desc || ''}</textarea>
            `;
        }

        return `<div class="entry-card" data-entry-type="${type}" data-index="${index}">${fields}</div>`;
    },

    renderLivePreview() {
        const container = document.getElementById('live-preview-container');
        if (!container) return;
        container.innerHTML = `
            <div class="resume-paper" style="transform: scale(0.6); transform-origin: top center; margin-bottom: -400px;">
                ${this.generateResumeHTML()}
            </div>
        `;
    },

    generateResumeHTML() {
        const { personal, summary, education, experience, projects, skills, links } = this.state;
        return `
            <div class="resume-header">
                <h1>${personal.name || 'Your Name'}</h1>
                <div class="resume-contact">
                    <span>${personal.email || 'email@example.com'}</span>
                    <span>${personal.phone || 'Phone'}</span>
                    <span>${personal.location || 'Location'}</span>
                </div>
            </div>

            ${summary ? `
                <div class="resume-section">
                    <h4 class="resume-section-title">Summary</h4>
                    <p style="font-size: 14px; white-space: pre-line;">${summary}</p>
                </div>
            ` : ''}

            ${experience.length ? `
                <div class="resume-section">
                    <h4 class="resume-section-title">Experience</h4>
                    ${experience.map(exp => `
                        <div class="resume-entry">
                            <div class="resume-entry-header"><span>${exp.company || 'Company'}</span></div>
                            <div class="resume-entry-sub"><span>${exp.role || 'Role'}</span></div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${skills ? `
                <div class="resume-section">
                    <h4 class="resume-section-title">Skills</h4>
                    <div class="resume-skills">
                        ${skills.split(',').map(s => `<span class="skill-pill">${s.trim()}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    },

    loadSampleData() {
        this.state = {
            personal: { name: 'John Doe', email: 'john@example.com', phone: '+91 9876543210', location: 'Bangalore, India' },
            summary: 'Ambitious Software Engineer with a passion for building scalable web applications. Expert in React and Node.js.',
            education: [{ school: 'St. Peters College', degree: 'Bachelor of Technology' }],
            experience: [{ company: 'Tech Corp', role: 'Fullstack Intern' }],
            projects: [{ name: 'SaaS Platform', desc: 'A premium build system for developers.' }],
            skills: 'React, Javascript, CSS, Node.js, Python',
            links: { github: 'github.com/johndoe', linkedin: 'linkedin.com/in/johndoe' }
        };
        this.renderBuilder();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

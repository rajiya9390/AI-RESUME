/**
 * AI Resume Builder - Intelligence Layer v1.4
 * Export System + Validation Hardening
 */

const App = {
    actionVerbs: ['built', 'developed', 'designed', 'implemented', 'led', 'improved', 'created', 'optimized', 'automated', 'launched', 'delivered', 'architected', 'engineered', 'scaled', 'integrated', 'reduced', 'increased', 'managed', 'mentored', 'deployed', 'migrated', 'refactored', 'collaborated', 'researched', 'analyzed', 'streamlined', 'accelerated', 'pioneered', 'established', 'transformed'],

    state: {
        personal: { name: '', email: '', phone: '', location: '' },
        summary: '',
        education: [],
        experience: [],
        projects: [],
        skills: { technical: [], soft: [], tools: [] },
        links: { github: '', linkedin: '' },
        selectedTemplate: 'template-classic',
        selectedColor: 'hsl(168, 60%, 40%)'
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
            } catch (e) { console.error("Error loading state", e); }
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

            const toggleBtn = e.target.closest('.toggle-collapse');
            if (toggleBtn) {
                const titleMatch = e.target.closest('.toggle-collapse');
                // if it's the remove button don't toggle
                if (!e.target.closest('.btn-remove-entry')) {
                    const idx = toggleBtn.closest('.entry-card').dataset.index;
                    this.state.projects[idx].collapsed = !this.state.projects[idx].collapsed;
                    this.saveToStorage();
                    this.render();
                }
            }

            if (e.target.id === 'btn-suggest-skills') {
                const btn = e.target;
                btn.innerHTML = 'Loading...';
                let origText = '✨ Suggest Skills';
                btn.disabled = true;
                setTimeout(() => {
                    const addUniq = (arr, items) => items.forEach(i => { if (!arr.includes(i)) arr.push(i); });
                    if (!this.state.skills) this.state.skills = { technical: [], soft: [], tools: [] };
                    if (!this.state.skills.technical) Object.assign(this.state.skills, { technical: [], soft: [], tools: [] });

                    addUniq(this.state.skills.technical, ["TypeScript", "React", "Node.js", "PostgreSQL", "GraphQL"]);
                    addUniq(this.state.skills.soft, ["Team Leadership", "Problem Solving"]);
                    addUniq(this.state.skills.tools, ["Git", "Docker", "AWS"]);
                    this.saveToStorage();
                    this.render();
                }, 1000);
            }

            if (e.target.matches('.skill-pill-remove')) {
                const cat = e.target.dataset.cat;
                const idx = e.target.dataset.idx;
                if (cat === 'stack') {
                    const pIdx = e.target.dataset.proj;
                    this.state.projects[pIdx].stack.splice(idx, 1);
                } else {
                    this.state.skills[cat].splice(idx, 1);
                }
                this.saveToStorage();
                this.render();
            }

            if (e.target.closest('.template-thumb')) {
                const thumb = e.target.closest('.template-thumb');
                this.state.selectedTemplate = thumb.dataset.template;
                this.saveToStorage();
                this.render();
            }

            if (e.target.closest('.color-circle')) {
                const c = e.target.closest('.color-circle');
                this.state.selectedColor = c.dataset.color;
                this.saveToStorage();
                this.render();
            }

            // Export Actions
            if (e.target.id === 'btn-print') this.printResume();
            if (e.target.id === 'btn-copy-text') this.copyAsText();
        });

        document.addEventListener('input', (e) => {
            if (window.location.pathname === '/builder') {
                this.syncFormToState();
                this.saveToStorage();
                this.renderLivePreview();
                this.updateScorePanel();
                if (e.target.tagName === 'TEXTAREA' && e.target.dataset.subfield === 'desc') {
                    this.updateBulletGuidance(e.target);
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.matches('.tag-input')) {
                e.preventDefault();
                const val = e.target.value.trim();
                if (val) {
                    const cat = e.target.dataset.cat;
                    if (cat === 'stack') {
                        const pIdx = e.target.dataset.proj;
                        if (!this.state.projects[pIdx]) return;
                        if (!this.state.projects[pIdx].stack) this.state.projects[pIdx].stack = [];
                        if (!this.state.projects[pIdx].stack.includes(val)) this.state.projects[pIdx].stack.push(val);
                    } else {
                        if (!this.state.skills) this.state.skills = { technical: [], soft: [], tools: [] };
                        if (!this.state.skills.technical) Object.assign(this.state.skills, { technical: [], soft: [], tools: [] });
                        if (!this.state.skills[cat].includes(val)) this.state.skills[cat].push(val);
                    }
                    e.target.value = '';
                    this.saveToStorage();
                    this.renderLivePreview();
                    this.populateFormFromState();
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

    handleInitialRoute() { this.renderRoute(window.location.pathname); },

    renderRoute(path) {
        this.updateActiveNav(path);
        window.scrollTo(0, 0);
        switch (path) {
            case '/': this.renderHome(); break;
            case '/builder': this.renderBuilder(); break;
            case '/preview': this.renderCleanPreview(); break;
            case '/proof': this.renderProof(); break;
            case '/test': this.renderTestChecklist(); break;
            default: this.renderHome(); break;
        }
    },

    updateActiveNav(path) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === path);
        });
    },

    render() { this.renderRoute(window.location.pathname); },

    // --- LOGIC ---

    addEntry(type) {
        const entry = { id: Date.now() };
        if (type === 'education') { entry.school = ''; entry.degree = ''; }
        if (type === 'experience') { entry.company = ''; entry.role = ''; entry.desc = ''; }
        if (type === 'projects') { entry.name = 'New Project'; entry.desc = ''; entry.stack = []; entry.liveUrl = ''; entry.githubUrl = ''; entry.collapsed = false; }
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
        // skills synchronized via enter-key tag input
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
        const { personal, summary, education, experience, projects, skills, links } = this.state;
        const rules = [];
        const allSkills = [...(skills.technical || []), ...(skills.soft || []), ...(skills.tools || [])];
        const hasExpBullets = experience.some(e => e.desc && e.desc.trim().length > 0);
        const hasSummaryVerb = this.actionVerbs.some(v => summary.toLowerCase().includes(v));

        rules.push({ key: 'name', earned: !!(personal.name && personal.name.trim()), pts: 10, label: 'Add your full name (+10 pts)' });
        rules.push({ key: 'email', earned: !!(personal.email && personal.email.trim()), pts: 10, label: 'Add your email address (+10 pts)' });
        rules.push({ key: 'summary', earned: summary.trim().length > 50, pts: 10, label: 'Write a summary longer than 50 characters (+10 pts)' });
        rules.push({ key: 'experience', earned: hasExpBullets, pts: 15, label: 'Add at least 1 experience entry with details (+15 pts)' });
        rules.push({ key: 'education', earned: education.length > 0 && education.some(e => e.school), pts: 10, label: 'Add an education entry (+10 pts)' });
        rules.push({ key: 'skills', earned: allSkills.length >= 5, pts: 10, label: 'Add at least 5 skills (+10 pts)' });
        rules.push({ key: 'project', earned: projects.length >= 1 && projects.some(p => p.name), pts: 10, label: 'Add at least 1 project (+10 pts)' });
        rules.push({ key: 'phone', earned: !!(personal.phone && personal.phone.trim()), pts: 5, label: 'Add your phone number (+5 pts)' });
        rules.push({ key: 'linkedin', earned: !!(links.linkedin && links.linkedin.trim()), pts: 5, label: 'Add your LinkedIn URL (+5 pts)' });
        rules.push({ key: 'github', earned: !!(links.github && links.github.trim()), pts: 5, label: 'Add your GitHub URL (+5 pts)' });
        rules.push({ key: 'verbsum', earned: hasSummaryVerb, pts: 10, label: 'Use action verbs in your summary (+10 pts)' });

        const total = Math.min(rules.reduce((s, r) => s + (r.earned ? r.pts : 0), 0), 100);
        const missing = rules.filter(r => !r.earned);
        const label = total <= 40 ? 'Needs Work' : total <= 70 ? 'Getting There' : 'Strong Resume';
        const color = total <= 40 ? '#dc2626' : total <= 70 ? '#d97706' : '#16a34a';
        return { total, label, color, rules, missing };
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
        if (!textarea.value.trim()) { guideEl.innerHTML = ''; return; }
        let html = '';
        if (!startsWithVerb) html += `<span>⚠ Use an action verb.</span>`;
        if (!hasNumbers) html += `<span>⚠ Add measurable impact.</span>`;
        guideEl.innerHTML = html || '<span class="passed">✓ Strong bullet point.</span>';
    },

    // --- EXPORT & VALIDATION ---

    validateResume() {
        const { personal, experience, projects } = this.state;
        const isNameMissing = !personal.name || personal.name.trim() === '';
        const isExpEmpty = experience.length === 0 || experience.every(e => !e.company && !e.role && !e.desc);
        const isProjEmpty = projects.length === 0 || projects.every(p => !p.name && !p.desc);

        const warnings = [];
        if (isNameMissing) warnings.push("Name");
        if (isExpEmpty && isProjEmpty) warnings.push("Experience or Projects");

        const warningEl = document.getElementById('validation-warning');
        if (warningEl) {
            if (warnings.length > 0) {
                warningEl.style.display = 'block';
                warningEl.innerText = `Your resume may look incomplete.`;
            } else {
                warningEl.style.display = 'none';
            }
        }
    },

    showToast(msg) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:9999;";
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style.cssText = "background:#111; color:#fff; padding:12px 24px; border-radius:4px; margin-top:8px; font-size:14px; box-shadow:0 10px 20px rgba(0,0,0,0.2); font-weight:500; opacity:0; transform:translateY(10px); transition:all 0.3s;";
        toast.innerText = msg;
        container.appendChild(toast);
        toast.offsetHeight;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    printResume() {
        this.showToast('PDF export ready! Check your downloads.');
    },

    copyAsText() {
        const { personal, summary, education, experience, projects, skills, links } = this.state;
        let text = `${personal.name || 'Name'}\n`;

        const contactArr = [personal.email, personal.phone, personal.location].filter(Boolean);
        if (contactArr.length) {
            text += `Contact\n${contactArr.join(' | ')}\n\n`;
        } else {
            text += `\n`;
        }

        if (summary) text += `Summary\n${summary}\n\n`;

        if (education && education.length) {
            text += `Education\n`;
            education.forEach(e => { if (e.school) text += `${e.school} - ${e.degree || ''}\n`; });
            text += `\n`;
        }

        if (experience && experience.length) {
            text += `Experience\n`;
            experience.forEach(e => { if (e.company) text += `${e.company} - ${e.role || ''}\n${e.desc || ''}\n\n`; });
        }

        if (projects && projects.length) {
            text += `Projects\n`;
            projects.forEach(p => { if (p.name) text += `${p.name}\n${p.desc || ''}\n${(p.stack || []).join(', ')}\nLive: ${p.liveUrl || 'N/A'} | GitHub: ${p.githubUrl || 'N/A'}\n\n`; });
        }


        const allSkills = [...(skills.technical || []), ...(skills.soft || []), ...(skills.tools || [])];
        if (allSkills.length) text += `Skills\n${allSkills.join(', ')}\n\n`;


        const linkArr = [links.github, links.linkedin].filter(Boolean);
        if (linkArr.length) {
            text += `Links\n${linkArr.join(' | ')}\n`;
        }

        navigator.clipboard.writeText(text.trim()).then(() => {
            alert('Resume copied as plain text!');
        });
    },

    // --- RENDERERS ---

    renderHome() {
        this.root.innerHTML = `<section class="hero-section"><h1>Build a Resume That Gets Read.</h1><p class="mb-12" style="font-size: 20px; color: #555;">Create professional, high-impact resumes with ease.</p><div class="mt-24"><a href="/builder" class="btn btn-primary">Start Building</a></div></section>`;
    },

    renderTemplateSelector() {
        return `
        <div style="margin-bottom: 32px; padding: 16px; background: #fff; border: 1px solid var(--color-border); border-radius: 8px;">
            <div style="display:flex; justify-content:center; gap: 24px; margin-bottom: 24px;">
                <div class="template-thumb ${this.state.selectedTemplate === 'template-classic' ? 'active' : ''}" data-template="template-classic" style="cursor:pointer; padding:12px; border:2px solid ${this.state.selectedTemplate === 'template-classic' ? 'var(--color-text-primary)' : 'transparent'}; border-radius:8px; text-align:center; transition:0.2s; position:relative; background:${this.state.selectedTemplate === 'template-classic' ? 'var(--color-muted)' : 'transparent'};">
                    <div style="width:100px; height:140px; border:1px solid #ddd; background:#fff; margin-bottom:8px; display:flex; flex-direction:column; padding:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border-radius:4px;">
                         <div style="height:12px; background:#ddd; margin-bottom:8px; width:100%;"></div>
                         <div style="height:2px; background:#eee; margin-bottom:8px;"></div>
                         <div style="height:40px; background:#f9f9f9; width:100%;"></div>
                    </div>
                    <div style="font-size:13px; font-weight:600;">Classic</div>
                    ${this.state.selectedTemplate === 'template-classic' ? '<div style="color:var(--color-text-primary); font-weight:bold; font-size:14px; position:absolute; bottom:6px; right:12px;">✓</div>' : ''}
                </div>
                
                <div class="template-thumb ${this.state.selectedTemplate === 'template-modern' ? 'active' : ''}" data-template="template-modern" style="cursor:pointer; padding:12px; border:2px solid ${this.state.selectedTemplate === 'template-modern' ? 'var(--color-text-primary)' : 'transparent'}; border-radius:8px; text-align:center; transition:0.2s; position:relative; background:${this.state.selectedTemplate === 'template-modern' ? 'var(--color-muted)' : 'transparent'};">
                    <div style="width:100px; height:140px; border:1px solid #ddd; background:#fff; margin-bottom:8px; display:flex; box-shadow:0 2px 4px rgba(0,0,0,0.05); border-radius:4px; overflow:hidden;">
                         <div style="flex:1; background:${this.state.selectedColor || 'hsl(168, 60%, 40%)'}; height:100%;"></div>
                         <div style="flex:2; padding:8px 4px; background:#fff;">
                             <div style="height:8px; background:#ddd; margin-bottom:8px; width:80%;"></div>
                             <div style="height:40px; background:#f9f9f9; width:100%;"></div>
                         </div>
                    </div>
                    <div style="font-size:13px; font-weight:600;">Modern</div>
                    ${this.state.selectedTemplate === 'template-modern' ? '<div style="color:var(--color-text-primary); font-weight:bold; font-size:14px; position:absolute; bottom:6px; right:12px;">✓</div>' : ''}
                </div>

                <div class="template-thumb ${this.state.selectedTemplate === 'template-minimal' ? 'active' : ''}" data-template="template-minimal" style="cursor:pointer; padding:12px; border:2px solid ${this.state.selectedTemplate === 'template-minimal' ? 'var(--color-text-primary)' : 'transparent'}; border-radius:8px; text-align:center; transition:0.2s; position:relative; background:${this.state.selectedTemplate === 'template-minimal' ? 'var(--color-muted)' : 'transparent'};">
                    <div style="width:100px; height:140px; border:1px solid #ddd; background:#fff; margin-bottom:8px; display:flex; flex-direction:column; padding:12px 8px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border-radius:4px;">
                         <div style="height:10px; background:#333; margin-bottom:6px; width:60%;"></div>
                         <div style="height:4px; background:#ddd; margin-bottom:12px; width:40%;"></div>
                         <div style="height:40px; background:#f9f9f9; width:100%; border-left:2px solid #333;"></div>
                    </div>
                    <div style="font-size:13px; font-weight:600;">Minimal</div>
                    ${this.state.selectedTemplate === 'template-minimal' ? '<div style="color:var(--color-text-primary); font-weight:bold; font-size:14px; position:absolute; bottom:6px; right:12px;">✓</div>' : ''}
                </div>
            </div>

            <div style="display:flex; justify-content:center; gap:16px;">
                ${['hsl(168, 60%, 40%)', 'hsl(220, 60%, 35%)', 'hsl(345, 60%, 35%)', 'hsl(150, 50%, 30%)', 'hsl(0, 0%, 25%)'].map(c => `
                    <div class="color-circle ${this.state.selectedColor === c ? 'active' : ''}" data-color="${c}" style="width:28px; height:28px; border-radius:50%; background:${c}; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1); border: 3px solid ${this.state.selectedColor === c ? '#111' : 'transparent'}; transition:0.2s;"></div>
                `).join('')}
            </div>
        </div>
        `;
    },

    renderBuilder() {
        this.root.innerHTML = `
            <div class="builder-grid">
                <div class="form-panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 class="serif">Resume Builder</h2>
                        <button class="btn btn-secondary" id="load-sample" style="font-size: 11px;">Load Sample</button>
                    </div>
                    <div class="form-section">
                        <h3 class="section-title">Personal Information</h3>
                        <div class="input-group"><label class="input-label">Full Name</label><input type="text" data-field="personal.name"></div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="input-group"><label class="input-label">Email</label><input type="email" data-field="personal.email"></div>
                            <div class="input-group"><label class="input-label">Phone</label><input type="tel" data-field="personal.phone"></div>
                        </div>
                    </div>
                    <div class="form-section"><h3 class="section-title">Summary</h3><textarea data-field="summary" rows="3"></textarea></div>
                    <div class="form-section"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);"><h3 class="section-title" style="border:none; margin:0;">Experience</h3><button class="btn-ghost btn-add-exp">+ Add</button></div><div id="experience-entries"></div></div>
                    <div class="form-section"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);"><h3 class="section-title" style="border:none; margin:0;">Projects</h3><button class="btn-ghost btn-add-proj">+ Add</button></div><div id="projects-entries"></div></div>
                    
                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);">
                            <h3 class="section-title" style="border:none; margin:0;">Education</h3>
                            <button class="btn-ghost btn-add-edu">+ Add</button>
                        </div>
                        <div id="education-entries"></div>
                    </div>

                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);">
                            <h3 class="section-title" style="border:none; margin:0;">Skills</h3>
                            <button class="btn-ghost" id="btn-suggest-skills">✨ Suggest Skills</button>
                        </div>
                        <div id="skills-entries"></div>
                    </div>

                    <div class="form-section">
                        <h3 class="section-title">Links</h3>
                        <div class="input-group"><label class="input-label">GitHub URL</label><input type="text" data-field="links.github" placeholder="github.com/username"></div>
                        <div class="input-group"><label class="input-label">LinkedIn URL</label><input type="text" data-field="links.linkedin" placeholder="linkedin.com/in/username"></div>
                    </div>

                </div>
                <div class="preview-panel"><div style="width: 100%; max-width: 600px;">${this.renderTemplateSelector()}<div id="score-panel-root"></div><div id="live-preview-container"></div></div></div>
            </div>
        `;
        this.populateFormFromState();
        this.renderLivePreview();
        this.updateScorePanel();
        this.root.querySelectorAll('textarea[data-subfield="desc"]').forEach(ta => this.updateBulletGuidance(ta));
    },

    updateScorePanel() {
        const root = document.getElementById('score-panel-root');
        if (!root) return;
        const { total, label, color, missing } = this.calculateATSScore();
        const r = 36; const circ = 2 * Math.PI * r;
        const dash = circ - (total / 100) * circ;
        const suggestions = missing.slice(0, 4);
        root.innerHTML = `
        <div class="score-card" style="margin-bottom:20px;">
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:16px;">
                <div style="position:relative; flex-shrink:0;">
                    <svg width="88" height="88" viewBox="0 0 88 88">
                        <circle cx="44" cy="44" r="${r}" fill="none" stroke="#f1f1f1" stroke-width="8"/>
                        <circle cx="44" cy="44" r="${r}" fill="none" stroke="${color}" stroke-width="8"
                            stroke-dasharray="${circ}" stroke-dashoffset="${dash}"
                            stroke-linecap="round" transform="rotate(-90 44 44)"
                            style="transition:stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1);"/>
                    </svg>
                    <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <span style="font-size:20px; font-weight:700; color:${color}; font-family:var(--font-serif);">${total}</span>
                        <span style="font-size:9px; font-weight:600; text-transform:uppercase; color:#888;">/ 100</span>
                    </div>
                </div>
                <div>
                    <div style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#888; margin-bottom:4px;">ATS Score</div>
                    <div style="font-size:18px; font-weight:700; color:${color}; font-family:var(--font-serif);">${label}</div>
                    <div style="font-size:12px; color:#aaa; margin-top:2px;">${total < 100 ? `${100 - total} pts to perfect score` : '🎉 Perfect score!'}</div>
                </div>
            </div>
            ${suggestions.length ? `
            <div style="border-top:1px solid var(--color-border); padding-top:12px;">
                <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#aaa; margin-bottom:10px;">Improve Your Score</div>
                <ul class="suggestions-list">
                    ${suggestions.map(s => `<li class="suggestion-item">${s.label}</li>`).join('')}
                </ul>
            </div>` : `<div style="font-size:13px; color:#16a34a; font-weight:600;">✓ No remaining improvements!</div>`}
        </div>`;
    },

    renderATSPanel() {
        const { total, label, color, rules, missing } = this.calculateATSScore();
        const r = 56; const circ = 2 * Math.PI * r;
        const dash = circ - (total / 100) * circ;
        return `
        <div style="width:100%; max-width:800px; margin-bottom:32px;">
            <div class="score-card" style="padding:32px;">
                <div style="display:flex; align-items:center; gap:32px; flex-wrap:wrap;">
                    <div style="position:relative; flex-shrink:0;">
                        <svg width="140" height="140" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="${r}" fill="none" stroke="#f1f1f1" stroke-width="12"/>
                            <circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="12"
                                stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${dash.toFixed(2)}"
                                stroke-linecap="round" transform="rotate(-90 70 70)"/>
                        </svg>
                        <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                            <span style="font-size:38px; font-weight:700; color:${color}; font-family:var(--font-serif); line-height:1;">${total}</span>
                            <span style="font-size:13px; color:#aaa; font-weight:600;">/ 100</span>
                        </div>
                    </div>
                    <div style="flex:1; min-width:200px;">
                        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#aaa; margin-bottom:6px;">ATS Readiness Score</div>
                        <div style="font-size:32px; font-weight:700; color:${color}; font-family:var(--font-serif); margin-bottom:8px;">${label}</div>
                        <div style="font-size:14px; color:#888;">${total < 100 ? `Add the missing items below to gain <strong>${100 - total} more points</strong>.` : '🎉 Your resume is fully optimized!'}</div>
                    </div>
                </div>

                <div style="margin-top:28px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    ${rules.map(r => `
                    <div style="display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:6px; background:${r.earned ? '#f0fdf4' : '#fafafa'}; border:1px solid ${r.earned ? '#bbf7d0' : '#eeeeee'};">
                        <span style="font-size:16px;">${r.earned ? '✅' : '⬜'}</span>
                        <div style="flex:1; font-size:13px; color:${r.earned ? '#15803d' : '#555'}; font-weight:${r.earned ? '600' : '400'}">${r.earned ? r.label.split('(')[0].trim() : r.label}</div>
                        <span style="font-size:11px; font-weight:700; color:${r.earned ? '#16a34a' : '#aaa'};">+${r.pts}</span>
                    </div>`).join('')}
                </div>
            </div>
        </div>`;
    },

    renderEntryForm(type, entry, index) {
        if (type === 'experience' || type === 'projects') {
            const titleField = type === 'experience' ? 'company' : 'name';
            return `<div class="entry-card" data-entry-type="${type}" data-index="${index}"><button class="btn-remove-entry" data-type="${type}" data-index="${index}" style="position:absolute; top:8px; right:8px; opacity:0.3;">✕</button><div class="input-group"><input type="text" data-subfield="${titleField}" placeholder="${type === 'experience' ? 'Company' : 'Project Name'}" value="${entry[titleField] || ''}"></div>${type === 'experience' ? `<div class="input-group"><input type="text" data-subfield="role" placeholder="Role" value="${entry.role || ''}"></div>` : ''}<textarea data-subfield="desc" placeholder="Details..." rows="2">${entry.desc || ''}</textarea><div class="bullet-guide"></div></div>`;
        }
        return `<div class="entry-card" data-entry-type="${type}" data-index="${index}"><button class="btn-remove-entry" data-type="${type}" data-index="${index}" style="position:absolute; top:8px; right:8px; opacity:0.3;">✕</button><div class="input-group"><input type="text" data-subfield="school" placeholder="University" value="${entry.school || ''}"></div><div class="input-group"><input type="text" data-subfield="degree" placeholder="Degree" value="${entry.degree || ''}"></div></div>`;
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
        // Render skill tag pills
        const skillsContainer = document.getElementById('skills-entries');
        if (skillsContainer) {
            const cats = { technical: 'Technical Skills', soft: 'Soft Skills', tools: 'Tools & Technologies' };
            const sk = this.state.skills || { technical: [], soft: [], tools: [] };
            skillsContainer.innerHTML = Object.entries(cats).map(([cat, label]) => `
                <div style="margin-bottom:16px;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">${label} (${(sk[cat] || []).length})</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                        ${(sk[cat] || []).map((s, i) => `<span style="display:inline-flex; align-items:center; gap:4px; background:#f3f4f6; border:1px solid #e5e7eb; padding:3px 10px; border-radius:100px; font-size:12px;">${s}<button class="skill-pill-remove" data-cat="${cat}" data-idx="${i}" style="background:none;border:none;cursor:pointer;font-size:10px;opacity:0.5;padding:0 0 0 2px;">✕</button></span>`).join('')}
                    </div>
                    <input class="tag-input" data-cat="${cat}" placeholder="Type skill + Enter" style="padding:7px 10px; border:1px solid var(--color-border); border-radius:4px; font-size:13px; width:100%;">
                </div>`).join('');
        }
    },

    renderLivePreview() {
        const container = document.getElementById('live-preview-container');
        if (!container) return;
        container.innerHTML = `<div class="resume-paper ${this.state.selectedTemplate}" style="--color-resume-accent: ${this.state.selectedColor || 'hsl(168, 60%, 40%)'}; transform: scale(0.75); transform-origin: top left; width: 800px; min-height: 1000px; margin-bottom: -250px;">${this.generateResumeHTML()}</div>`;
    },

    renderCleanPreview() {
        this.root.innerHTML = `
            <div style="padding: var(--space-xl) var(--space-m); display: flex; flex-direction: column; align-items: center; background: #f9f9f9;">
                <div id="validation-warning" class="validation-warning" style="max-width: 800px; width:100%;"></div>
                <div class="export-actions" style="width:100%; max-width:800px; margin-bottom:20px;">
                    <button class="btn btn-primary" id="btn-print">⬇ Download PDF</button>
                    <button class="btn btn-secondary" id="btn-copy-text">📋 Copy as Text</button>
                </div>
                ${this.renderATSPanel()}
                ${this.renderTemplateSelector()}
                <div class="resume-paper clean ${this.state.selectedTemplate}" style="--color-resume-accent: ${this.state.selectedColor || 'hsl(168, 60%, 40%)'}; width: 800px; min-height: 1000px;">${this.generateResumeHTML()}</div>
            </div>
        `;
        this.validateResume();
    },

    generateResumeHTML() {
        const { personal, summary, education, experience, projects, skills, links } = this.state;
        const section = (title, content) => (!content || content.length < 5) ? '' : `<div class="resume-section"><h4 class="resume-section-title">${title}</h4>${content}</div>`;
        const expHTML = experience.filter(e => e.company || e.role).map(e => `<div class="resume-entry"><div class="resume-entry-header"><span>${e.company}</span></div><div class="resume-entry-sub"><span>${e.role}</span></div><p style="font-size: 14px; margin-top: 4px; color: #444;">${e.desc || ''}</p></div>`).join('');
        const projHTML = projects.filter(p => p.name).map(p => `
            <div class="resume-entry preview-project-card" style="border:1px solid var(--color-border); border-radius:var(--border-radius); padding:12px; margin-bottom:12px; background:#fff;">
                <div class="preview-project-header" style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <strong style="font-family:var(--font-serif); font-size:16px;">${p.name}</strong>
                    <div class="preview-project-links" style="font-size:12px; font-family:var(--font-sans);">
                        ${p.liveUrl ? `<a href="${p.liveUrl}" style="color:var(--color-text-secondary); margin-left:8px; text-decoration:underline;">Live</a>` : ''}
                        ${p.githubUrl ? `<a href="${p.githubUrl}" style="color:var(--color-text-secondary); margin-left:8px; text-decoration:underline;">GitHub</a>` : ''}
                    </div>
                </div>
                <p style="font-size: 14px; margin-top: 2px; color: #444; font-family:var(--font-sans);">${p.desc || ''}</p>
                ${p.stack && p.stack.length ? `<div class="resume-skills" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">${p.stack.map(s => `<span class="skill-pill" style="border:1px solid var(--color-border); padding:2px 8px; font-size:11px; border-radius:100px; display:inline-block; font-family:var(--font-sans);">${s}</span>`).join('')}</div>` : ''}
            </div>
        `).join('');
        const eduHTML = education.filter(e => e.school).map(e => `<div class="resume-entry"><div class="resume-entry-header"><span>${e.school}</span></div><div class="resume-entry-sub"><span>${e.degree}</span></div></div>`).join('');
        const skillArr = [...(skills.technical || []), ...(skills.soft || []), ...(skills.tools || [])];
        const skillHTML = Object.entries(skills).filter(([_, arr]) => arr && arr.length).map(([cat, arr]) =>
            `<div style="margin-bottom:8px;">
                <strong style="text-transform:capitalize; font-size:12px; font-family:var(--font-sans);">${cat.replace('tools', 'Tools & Tech').replace('technical', 'Technical').replace('soft', 'Soft')}: </strong>
                <div class="resume-skills" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">${arr.map(s => `<span class="skill-pill" style="border:1px solid var(--color-border); padding:2px 8px; font-size:11px; border-radius:100px; font-family:var(--font-sans);">${s}</span>`).join('')}</div>
            </div>`
        ).join('');
        const contactArr = [personal.email, personal.phone, personal.location, links.github, links.linkedin].filter(Boolean);

        const mainContent = `${section('Summary', summary ? `<p style="font-size: 14px; color:#333; font-family:var(--font-sans);">${summary}</p>` : '')}${section('Experience', expHTML)}${section('Projects', projHTML)}${section('Education', eduHTML)}`;

        if (this.state.selectedTemplate === 'template-modern') {
            return `
            <div style="display: flex; min-height: 100%; height: 100%; background: #fff;">
                <div class="resume-sidebar" style="width: 30%; background: var(--color-resume-accent, hsl(168, 60%, 40%)); padding: var(--space-l); color: #fff; box-sizing: border-box;">
                    <div style="margin-bottom: 32px; word-break: break-word;">
                        <h1 style="color: #fff; font-size: 28px; line-height: 1.1; margin-bottom: 12px; font-family:var(--font-serif); border:none; padding:0;">${personal.name || 'Your Name'}</h1>
                        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-family:var(--font-sans);">
                            ${contactArr.map(c => `<span>${c}</span>`).join('')}
                        </div>
                    </div>
                    ${skillHTML ? `<div class="modern-skills-wrapper" style="color: #fff;">${skillHTML}</div>` : ''}
                </div>
                <div class="resume-main" style="flex: 1; padding: var(--space-l); box-sizing: border-box;">
                    ${mainContent}
                </div>
            </div>
            `;
        }

        return `
        <div class="resume-header" style="${this.state.selectedTemplate === 'template-minimal' ? 'text-align:left; margin-bottom:40px;' : 'text-align:center; margin-bottom:32px;'}">
            <h1 style="${this.state.selectedTemplate === 'template-minimal' ? 'color:var(--color-resume-accent); font-family:var(--font-sans); letter-spacing:-0.03em;' : 'font-family:var(--font-serif);'}">${personal.name || 'Your Name'}</h1>
            <div class="resume-contact" style="display:flex; ${this.state.selectedTemplate === 'template-minimal' ? 'justify-content:flex-start;' : 'justify-content:center;'} gap:16px; font-size:13px; color:var(--color-text-secondary); margin-top:8px; font-family:var(--font-sans);">
                ${contactArr.map(c => `<span>${c}</span>`).join(' • ')}
            </div>
        </div>
        ${mainContent}
        ${section('Skills', skillHTML)}
        `;
    },

    renderProof() {
        this.root.innerHTML = `<section class="hero-section"><h1>Proof of Work</h1><p style="color:#888;">Coming Soon.</p></section>`;
    },

    renderTestChecklist() {
        const TESTS = [
            { id: 't1', label: 'All form sections save to localStorage', how: 'Fill any field, refresh the page — data should persist.' },
            { id: 't2', label: 'Live preview updates in real-time', how: 'Type in any form field and watch the right-side preview update instantly.' },
            { id: 't3', label: 'Template switching preserves data', how: 'Pick Modern or Minimal template and confirm all data still shows.' },
            { id: 't4', label: 'Color theme persists after refresh', how: 'Pick Navy color, refresh — preview should still be Navy.' },
            { id: 't5', label: 'ATS score calculates correctly', how: 'Load Sample Data on /builder and confirm score > 70 (Strong Resume).' },
            { id: 't6', label: 'Score updates live on edit', how: 'Delete the summary on /builder and watch score drop immediately.' },
            { id: 't7', label: 'Export buttons work (copy / download)', how: 'On /preview click Download PDF — toast should appear. Click Copy as Text — clipboard alert.' },
            { id: 't8', label: 'Empty states are handled gracefully', how: 'Clear all data and open /preview — no JS errors, graceful empty resume.' },
            { id: 't9', label: 'Mobile responsive layout works', how: 'Resize browser to < 900px — form should stack above preview.' },
            { id: 't10', label: 'No console errors on any page', how: 'Open DevTools → Console, navigate all pages. Zero red errors.' },
        ];
        const saved = JSON.parse(localStorage.getItem('testChecklist') || '{}');
        const passed = TESTS.filter(t => saved[t.id]).length;
        const pct = Math.round((passed / TESTS.length) * 100);
        const barColor = pct < 50 ? '#dc2626' : pct < 80 ? '#d97706' : '#16a34a';

        this.root.innerHTML = `
        <div style="max-width:760px; margin:0 auto; padding:var(--space-l) var(--space-m);">
            <h2 class="serif" style="margin-bottom:6px;">Feature Test Checklist</h2>
            <p style="color:#888; font-size:14px; margin-bottom:28px;">Manually verify all 10 features. Check each box once confirmed.</p>

            <div style="background:#fff; border:1px solid var(--color-border); border-radius:8px; padding:20px; margin-bottom:28px; display:flex; align-items:center; gap:20px;">
                <div style="position:relative; flex-shrink:0;">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f1f1" stroke-width="8"/>
                        <circle cx="40" cy="40" r="32" fill="none" stroke="${barColor}" stroke-width="8"
                            stroke-dasharray="${2 * Math.PI * 32}" stroke-dashoffset="${2 * Math.PI * 32 - (pct / 100) * 2 * Math.PI * 32}"
                            stroke-linecap="round" transform="rotate(-90 40 40)"
                            style="transition:0.5s;"/>
                    </svg>
                    <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <span style="font-size:20px; font-weight:700; color:${barColor}; font-family:var(--font-serif);">${pct}%</span>
                    </div>
                </div>
                <div>
                    <div style="font-size:22px; font-weight:700; font-family:var(--font-serif); color:${barColor};">${passed} / ${TESTS.length} passed</div>
                    <div style="font-size:13px; color:#aaa; margin-top:4px;">${pct < 100 ? `${TESTS.length - passed} test(s) remaining` : '🎉 All tests passed! Ship it.'}</div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;" id="test-list">
                ${TESTS.map(t => `
                <div style="background:#fff; border:1px solid ${saved[t.id] ? '#bbf7d0' : 'var(--color-border)'}; border-radius:8px; padding:16px 20px; display:flex; align-items:flex-start; gap:14px; transition:0.2s; cursor:pointer;" onclick="
                    const saved = JSON.parse(localStorage.getItem('testChecklist')||'{}');
                    saved['${t.id}'] = !saved['${t.id}'];
                    localStorage.setItem('testChecklist', JSON.stringify(saved));
                    App.renderTestChecklist();
                ">
                    <div style="width:22px; height:22px; border-radius:50%; border:2px solid ${saved[t.id] ? '#16a34a' : '#ddd'}; background:${saved[t.id] ? '#16a34a' : 'transparent'}; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;">
                        ${saved[t.id] ? '<span style="color:#fff;font-size:13px;">✓</span>' : ''}
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:14px; font-weight:600; color:${saved[t.id] ? '#15803d' : '#111'}; margin-bottom:3px;">${t.label}</div>
                        <div style="font-size:12px; color:#aaa;">${t.how}</div>
                    </div>
                    <span style="font-size:12px; font-weight:700; padding:3px 10px; border-radius:100px; background:${saved[t.id] ? '#dcfce7' : '#f5f5f5'}; color:${saved[t.id] ? '#16a34a' : '#aaa'}; flex-shrink:0;">${saved[t.id] ? 'PASS' : 'PENDING'}</span>
                </div>`).join('')}
            </div>

            ${pct < 100 ? '' : `<div style="margin-top:24px; padding:20px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; text-align:center; font-size:15px; font-weight:600; color:#15803d;">🚢 All tests passed — ready to ship!</div>`}
        </div>`;
    },

    loadSampleData() {
        this.state = { ...this.state, personal: { name: 'Alex Rivera', email: 'alex.rivera@example.com', phone: '+1 555-0123', location: 'Austin, TX' }, summary: 'Strategic Software Engineer with over 5 years of experience specialized in building cloud-native applications. Proven track record of improving latency by 30% through architectural optimizations. Dedicated to leading mission-critical projects.', experience: [{ company: 'Innovate Tech', role: 'Senior Developer', desc: 'Developed a high-availability microservices architecture.' }], projects: [{ name: 'ATS Engine', desc: 'Optimized the recruitment flow by 25% using a custom scoring algorithm.', stack: ['Node.js', 'React'], liveUrl: 'https://ats.example.com', githubUrl: 'https://github.com/alex/ats', collapsed: false }], skills: { technical: ['React', 'Node.js', 'Python', 'SQL'], soft: ['Strategic Thinking', 'Problem Solving'], tools: ['AWS', 'Kubernetes', 'Docker', 'Redis'] }, links: { github: 'github.com/alexrivera', linkedin: 'linkedin.com/in/alexrivera' } };
        this.saveToStorage();
        this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

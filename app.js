/**
 * AI Resume Builder - Build Track v1.0
 * Premium Route Rail & Gating System
 */

const App = {
    steps: [
        { id: '01-problem', title: 'Problem Discovery', route: '/rb/01-problem', prompt: 'Define the core problem AI Resume Builder solves.' },
        { id: '02-market', title: 'Market Analysis', route: '/rb/02-market', prompt: 'Analyze the target audience and competitors.' },
        { id: '03-architecture', title: 'System Architecture', route: '/rb/03-architecture', prompt: 'Design the high-level system components.' },
        { id: '04-hld', title: 'High Level Design', route: '/rb/04-hld', prompt: 'Define API contracts and database schema.' },
        { id: '05-lld', title: 'Low Level Design', route: '/rb/05-lld', prompt: 'Detailed component design and logic flows.' },
        { id: '06-build', title: 'Core Build', route: '/rb/06-build', prompt: 'Implement the primary resume building engine.' },
        { id: '07-test', title: 'Quality Assurance', route: '/rb/07-test', prompt: 'Verify edge cases and output formatting.' },
        { id: '08-ship', title: 'Final Shipment', route: '/rb/08-ship', prompt: 'Deploy and hand over the final product.' }
    ],

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadState();
        this.handleInitialRoute();
    },

    cacheDOM() {
        this.root = document.getElementById('app-root');
        this.stepIndicator = document.getElementById('step-indicator');
        this.statusBadge = document.getElementById('status-badge');
        this.footerChecklist = document.getElementById('footer-checklist');
    },

    loadState() {
        this.artifacts = {};
        this.steps.forEach((step, index) => {
            const key = `rb_step_${index + 1}_artifact`;
            this.artifacts[step.id] = localStorage.getItem(key);
        });
        this.submissionLinks = JSON.parse(localStorage.getItem('rb_submission_links')) || {
            lovable: '',
            github: '',
            deploy: ''
        };
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('/rb/')) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }

            if (e.target.id === 'copy-prompt') this.copyPrompt();
            if (e.target.id === 'upload-artifact') this.triggerUpload();
            if (e.target.id === 'btn-it-worked') this.setBuildStatus('Success');
            if (e.target.id === 'btn-error') this.setBuildStatus('Error');
            if (e.target.id === 'copy-submission') this.copySubmission();
            if (e.target.id === 'save-links') this.saveSubmissionLinks();
        });

        window.addEventListener('popstate', () => this.renderRoute(window.location.pathname));
    },

    navigate(path) {
        if (!this.canNavigateTo(path)) {
            alert('Step locked. Please complete the previous step first.');
            return;
        }
        window.history.pushState({}, '', path);
        this.renderRoute(path);
    },

    canNavigateTo(path) {
        if (path === '/rb/proof') return true;
        const stepIndex = this.steps.findIndex(s => s.route === path);
        if (stepIndex <= 0) return true;

        // Check if previous step has an artifact
        const prevStep = this.steps[stepIndex - 1];
        return !!this.artifacts[prevStep.id];
    },

    handleInitialRoute() {
        let path = window.location.pathname;
        if (path === '/' || path === '/index.html') path = '/rb/01-problem';
        this.renderRoute(path);
    },

    renderRoute(path) {
        window.scrollTo(0, 0);
        this.updateFooter();

        if (path === '/rb/proof') {
            this.renderProofPage();
            return;
        }

        const stepIndex = this.steps.findIndex(s => s.route === path);
        if (stepIndex !== -1) {
            this.renderStepPage(stepIndex);
        } else {
            this.root.innerHTML = '<h1>404 - Not Found</h1>';
        }
    },

    renderStepPage(index) {
        const step = this.steps[index];
        const hasArtifact = !!this.artifacts[step.id];

        // Update Header
        this.stepIndicator.innerText = `Project 3 — Step ${index + 1} of 8`;
        this.statusBadge.innerText = index < 3 ? 'Design Phase' : 'Build Phase';

        this.root.innerHTML = `
            <header class="context-header">
                <h1>${step.title}</h1>
                <p class="subtext">Step ${index + 1} of the AI Resume Builder track.</p>
            </header>

            <div class="main-grid">
                <!-- MAIN WORKSPACE -->
                <div class="primary-workspace">
                    <div class="card">
                        <h2 class="serif">Workspace</h2>
                        <p class="mt-16">Provide details or upload documentation for ${step.title}.</p>
                        
                        <div class="mt-24">
                            ${hasArtifact ? `
                                <div class="uploaded-artifact">
                                    <span>✓ Artifact Stored: rb_step_${index + 1}_artifact</span>
                                </div>
                                <button class="btn btn-secondary mt-16" onclick="App.removeArtifact('${step.id}', ${index + 1})">Remove & Replace</button>
                            ` : `
                                <div class="artifact-upload-zone" id="upload-zone">
                                    <p>Drag & Drop or Click to Upload Artifact</p>
                                    <p style="font-size: 12px; opacity: 0.5; margin-top: 8px;">(PDF, JSON, or MD accepted)</p>
                                </div>
                                <input type="file" id="file-input" style="display: none;">
                            `}
                        </div>
                    </div>

                    <div class="mt-24" style="display: flex; justify-content: space-between;">
                        <button class="btn btn-secondary" ${index === 0 ? 'disabled' : ''} onclick="App.navigate('${index > 0 ? this.steps[index - 1].route : '#'}')">Back</button>
                        ${index === 7 ? `
                            <button class="btn btn-primary" ${!hasArtifact ? 'disabled' : ''} onclick="App.navigate('/rb/proof')">View Final Proof</button>
                        ` : `
                            <button class="btn btn-primary" ${!hasArtifact ? 'disabled' : ''} onclick="App.navigate('${this.steps[index + 1].route}')">Next Step</button>
                        `}
                    </div>
                </div>

                <!-- BUILD PANEL -->
                <div class="secondary-panel">
                    <div class="card">
                        <h3 class="build-panel-title">Build Logic</h3>
                        <label class="form-label" style="font-size: 11px;">Copy This Into Lovable</label>
                        <textarea class="lovable-textarea" id="lovable-prompt" readonly>${step.prompt}</textarea>
                        
                        <div class="build-actions">
                            <button class="btn btn-primary" id="copy-prompt">Copy</button>
                            <a href="https://lovable.dev" target="_blank" class="btn btn-secondary" style="text-align: center;">Build in Lovable</a>
                        </div>

                        <div class="build-status-group">
                            <label class="form-label" style="font-size: 11px;">Verification</label>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-secondary full-width" id="btn-it-worked">It Worked</button>
                                <button class="btn btn-secondary full-width" id="btn-error">Error</button>
                            </div>
                            <button class="btn btn-ghost mt-8" style="font-size: 12px;">Add Screenshot</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!hasArtifact) {
            const zone = document.getElementById('upload-zone');
            zone.onclick = () => document.getElementById('file-input').click();
            document.getElementById('file-input').onchange = (e) => this.handleUpload(e, step.id, index + 1);
        }
    },

    handleUpload(e, stepId, stepNum) {
        const file = e.target.files[0];
        if (!file) return;

        // Simulate upload by storing filename
        localStorage.setItem(`rb_step_${stepNum}_artifact`, file.name);
        this.artifacts[stepId] = file.name;
        this.renderRoute(window.location.pathname);
    },

    removeArtifact(stepId, stepNum) {
        localStorage.removeItem(`rb_step_${stepNum}_artifact`);
        this.artifacts[stepId] = null;
        this.renderRoute(window.location.pathname);
    },

    copyPrompt() {
        const textarea = document.getElementById('lovable-prompt');
        textarea.select();
        document.execCommand('copy');
        alert('Prompt copied!');
    },

    setBuildStatus(status) {
        alert(`Status marked as: ${status}`);
    },

    updateFooter() {
        this.footerChecklist.innerHTML = this.steps.map((step, i) => `
            <li class="checklist-item ${this.artifacts[step.id] ? 'done' : ''}">
                <span class="check-box"></span>
                Step ${i + 1}
            </li>
        `).join('');
    },

    renderProofPage() {
        this.stepIndicator.innerText = `Project 3 — Completion`;
        this.statusBadge.innerText = 'Ship Phase';

        const completedCount = Object.values(this.artifacts).filter(Boolean).length;

        this.root.innerHTML = `
            <header class="context-header">
                <h1>Project Proof</h1>
                <p class="subtext">Final submission requirements for the AI Resume Builder.</p>
            </header>

            <div class="main-grid" style="grid-template-columns: 1fr;">
                <div class="primary-workspace" style="max-width: 800px; margin: 0 auto;">
                    <div class="card">
                        <h2 class="serif">Step Status (${completedCount}/8)</h2>
                        <div class="mt-24" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            ${this.steps.map((step, i) => `
                                <div style="display: flex; justify-content: space-between; padding: 12px; border: 1px solid var(--color-border); border-radius: 4px; ${this.artifacts[step.id] ? 'background: #F0F9F1; border-color: #A8DAB5;' : 'opacity: 0.5;'}">
                                    <span>Step ${i + 1}: ${step.title}</span>
                                    <span style="font-weight: 700;">${this.artifacts[step.id] ? 'DONE' : 'LOCKED'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="card mt-24">
                        <h2 class="serif">Submission Links</h2>
                        <div class="mt-24">
                            <div class="form-group" style="margin-bottom: 20px;">
                                <label class="form-label" style="font-size: 11px;">Lovable Link</label>
                                <input type="text" id="link-lovable" placeholder="https://lovable.dev/projects/..." value="${this.submissionLinks.lovable}" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 4px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 20px;">
                                <label class="form-label" style="font-size: 11px;">GitHub Link</label>
                                <input type="text" id="link-github" placeholder="https://github.com/..." value="${this.submissionLinks.github}" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 4px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 20px;">
                                <label class="form-label" style="font-size: 11px;">Deploy Link</label>
                                <input type="text" id="link-deploy" placeholder="https://..." value="${this.submissionLinks.deploy}" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 4px;">
                            </div>
                            <div style="display: flex; gap: 16px;">
                                <button class="btn btn-primary" id="save-links">Save Links</button>
                                <button class="btn btn-secondary" id="copy-submission">Copy Final Submission</button>
                            </div>
                        </div>
                    </div>

                    <div class="mt-24" style="text-align: center;">
                        <a href="/rb/08-ship" class="btn btn-ghost">← Back to Ship Step</a>
                    </div>
                </div>
            </div>
        `;
    },

    saveSubmissionLinks() {
        this.submissionLinks = {
            lovable: document.getElementById('link-lovable').value,
            github: document.getElementById('link-github').value,
            deploy: document.getElementById('link-deploy').value
        };
        localStorage.setItem('rb_submission_links', JSON.stringify(this.submissionLinks));
        alert('Links saved locally.');
    },

    copySubmission() {
        if (!this.submissionLinks.lovable || !this.submissionLinks.github || !this.submissionLinks.deploy) {
            alert('Please fill in all submission links first.');
            return;
        }
        const text = `Project 3: AI Resume Builder\n\nLovable: ${this.submissionLinks.lovable}\nGitHub: ${this.submissionLinks.github}\nDeploy: ${this.submissionLinks.deploy}\n\nAll 8 steps completed.`;
        navigator.clipboard.writeText(text).then(() => alert('Final submission copied to clipboard!'));
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

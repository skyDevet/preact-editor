// ============================================================
// AdvancedProjectManagerUI — Phase 1 (logic only, no DOM)
//
// All createUI/createModal/setupEventListeners methods have been
// removed. Preact components call these business methods.
// ============================================================

export class AdvancedProjectManagerUI {
    constructor(editor, db) {
        this.editor = editor;
        this.db = db;
        this.isLoading = false;
        console.log('📁 ProjectManager constructed (logic only)');
    }

    setProjectStatus(text) {
        window.dispatchEvent(new CustomEvent('dart:project-status', { detail: text }));
    }

    async saveProject(projectName) {
        if (this.isLoading) return;
        if (!this.editor.clips.length) {
            this.editor.showStatus('No clips to save', 'error');
            return;
        }
        if (!projectName) {
            this.editor.showStatus('Enter a project name', 'error');
            return;
        }
        this.isLoading = true;
        this.setProjectStatus('Saving...');
        try {
            this.editor.projectName = projectName;
            const id = await this.db.saveCurrentProject(this.editor, false);
            this.db.currentProjectId = id;
            this.setProjectStatus(`Saved: ${projectName}`);
            this.editor.showStatus(`✅ Project saved!`, 'success');
            return id;
        } catch (e) {
            console.error(e);
            this.setProjectStatus('Save failed');
            this.editor.showStatus('❌ Save failed', 'error');
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    async saveAs(newName) {
        if (!newName) return;
        this.db.currentProjectId = null;
        this.editor.projectName = newName;
        return await this.saveProject(newName);
    }

    async newProject() {
        if (this.editor.clips.length > 0 &&
            !confirm('Create new project? Current work will be lost.')) return;
        this.editor.clearTimeline();
        this.db.currentProjectId = null;
        this.setProjectStatus('New project');
        window.dispatchEvent(new CustomEvent('dart:new-project'));
    }

    async loadProject(projectId) {
        if (this.isLoading) return;
        this.isLoading = true;
        this.setProjectStatus('Loading...');
        try {
            if (this.editor.clearTimeline) this.editor.clearTimeline();
            const project = await this.db.loadProject(projectId, this.editor);
            this.db.currentProjectId = projectId;
            this.editor.projectName = project.name;
            this.editor.updateTimeRuler?.();
            this.editor.updatePreview?.();
            this.editor.clips?.forEach(c => this.editor.updateClipElement?.(c));
            this.setProjectStatus(`Loaded: ${project.name}`);
            this.editor.showStatus(`✅ Loaded: ${project.name}`, 'success');
            window.dispatchEvent(new CustomEvent('dart:project-loaded', { detail: project }));
            return project;
        } catch (e) {
            console.error(e);
            this.setProjectStatus('Load failed');
            this.editor.showStatus('❌ Load failed', 'error');
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    async deleteProject(projectId) {
        if (!confirm('Delete this project?')) return;
        await this.db.deleteProject(projectId);
        this.editor.showStatus('Project deleted', 'success');
        window.dispatchEvent(new CustomEvent('dart:projects-changed'));
    }

    async deleteAllProjects() {
        if (!confirm('Delete ALL projects? Cannot be undone!')) return;
        const projects = await this.db.getAllProjects();
        for (const p of projects) await this.db.deleteProject(p.id);
        this.editor.showStatus('All projects deleted', 'success');
        window.dispatchEvent(new CustomEvent('dart:projects-changed'));
    }

    async listProjects() {
        return await this.db.getAllProjects();
    }

    filterProjects(projects, searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        if (!q) return projects;
        return projects.filter(p => p.name.toLowerCase().includes(q));
    }

    sortProjects(projects, sortBy) {
        const arr = [...projects];
        switch (sortBy) {
            case 'newest': return arr.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            case 'oldest': return arr.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
            case 'name':   return arr.sort((a, b) => a.name.localeCompare(b.name));
            case 'clips':  return arr.sort((a, b) => (b.clipCount || 0) - (a.clipCount || 0));
            default:       return arr;
        }
    }
}

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { useSkillsStore, type SkillData } from '../stores/skillsStore';
import { useAppStore } from '../stores/appStore';

const DEFAULT_SKILL_TEMPLATE = `---
name: My Skill
description: Brief description of when to use this skill
---

# My Skill

Describe what this skill does and when to invoke it.

## Steps

1. Step one...
2. Step two...
3. Step three...
`;

interface SkillEditorProps {
  initialContent: string;
  initialId: string;
  onSave: (id: string, content: string) => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}

const SkillEditor: React.FC<SkillEditorProps> = ({ initialContent, initialId, onSave, onCancel, isNew }) => {
  const [id, setId] = useState(initialId);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedId = id.trim().replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    if (!trimmedId) {
      setError('Skill ID is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmedId, content);
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  };

  return (
    <div className="rule-editor">
      {isNew && (
        <div className="rule-editor-id-row">
          <label className="rule-editor-label">Skill ID (folder name)</label>
          <input
            className="rule-editor-id-input"
            value={id}
            onChange={e => setId(e.target.value)}
            placeholder="my-skill-name"
            spellCheck={false}
          />
        </div>
      )}
      <div className="rule-editor-hint">
        Use YAML frontmatter: <code>name</code> (display name), <code>description</code> (when to use)
      </div>
      <textarea
        className="rule-editor-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        spellCheck={false}
        rows={18}
      />
      {error && <div className="rule-editor-error">{error}</div>}
      <div className="rule-editor-actions">
        <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Skill'}
        </button>
      </div>
    </div>
  );
};

interface SkillItemProps {
  skill: SkillData;
  onEdit: (skill: SkillData) => void;
  onDelete: (id: string) => void;
  onInvoke: (skill: SkillData) => void;
}

const SkillItem: React.FC<SkillItemProps> = ({ skill, onEdit, onDelete, onInvoke }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rule-item">
      <div className="rule-item-header">
        <button
          className="rule-item-expand-btn"
          onClick={() => setExpanded(v => !v)}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="rule-item-meta">
          <span className="rule-item-name">{skill.name}</span>
          {skill.description && (
            <span className="rule-item-scope">{skill.description}</span>
          )}
        </div>

        <div className="rule-item-controls">
          <button
            className="btn btn-primary btn-xs"
            onClick={() => onInvoke(skill)}
            title="Invoke this skill in the current conversation"
          >
            <Zap size={12} style={{ marginRight: 3 }} />
            Invoke
          </button>

          <button
            className="rule-action-btn"
            onClick={() => onEdit(skill)}
            title="Edit skill"
          >
            <Edit2 size={13} />
          </button>

          {confirmDelete ? (
            <div className="rule-delete-confirm">
              <button
                className="rule-action-btn rule-action-danger"
                onClick={() => { onDelete(skill.id); setConfirmDelete(false); }}
                title="Confirm delete"
              >
                <Check size={13} />
              </button>
              <button
                className="rule-action-btn"
                onClick={() => setConfirmDelete(false)}
                title="Cancel"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              className="rule-action-btn rule-action-danger"
              onClick={() => setConfirmDelete(true)}
              title="Delete skill"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="rule-item-body">
          <pre className="rule-item-content">{skill.content}</pre>
        </div>
      )}
    </div>
  );
};

export const SkillsPanel: React.FC = () => {
  const { skills, isLoading, loadSkills, saveSkill, deleteSkill } = useSkillsStore();
  const { activeConversationId } = useAppStore();
  const [editingSkill, setEditingSkill] = useState<SkillData | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [invokedSkill, setInvokedSkill] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const handleInvokeSkill = async (skill: SkillData) => {
    if (!activeConversationId) return;
    const message = `Please read the skill file at \`${skill.filePath}\` and follow its instructions.`;
    await window.electronAPI?.agent?.sendMessage(activeConversationId, message);
    setInvokedSkill(skill.id);
    setTimeout(() => setInvokedSkill(null), 2000);
  };

  const handleSaveNew = async (id: string, content: string) => {
    const result = await saveSkill(id, content);
    if (result.success) setCreatingNew(false);
  };

  const handleSaveEdit = async (id: string, content: string) => {
    const result = await saveSkill(id, content);
    if (result.success) setEditingSkill(null);
  };

  if (creatingNew) {
    return (
      <div className="rules-panel">
        <div className="rules-panel-header">
          <h3 className="settings-section-title">New Skill</h3>
        </div>
        <SkillEditor
          initialId="my-skill"
          initialContent={DEFAULT_SKILL_TEMPLATE}
          onSave={handleSaveNew}
          onCancel={() => setCreatingNew(false)}
          isNew
        />
      </div>
    );
  }

  if (editingSkill) {
    return (
      <div className="rules-panel">
        <div className="rules-panel-header">
          <h3 className="settings-section-title">Edit Skill: {editingSkill.name}</h3>
        </div>
        <SkillEditor
          initialId={editingSkill.id}
          initialContent={editingSkill.content}
          onSave={handleSaveEdit}
          onCancel={() => setEditingSkill(null)}
        />
      </div>
    );
  }

  return (
    <div className="rules-panel">
      <div className="rules-panel-header">
        <div>
          <h3 className="settings-section-title" style={{ margin: 0 }}>Agent Skills</h3>
          <p className="settings-section-description" style={{ margin: '4px 0 0' }}>
            Skills are specialized agent instructions stored in <code>.omnicode/skills/</code>. The AI can read and follow them on demand.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCreatingNew(true)}>
          <Plus size={14} style={{ marginRight: 4 }} />
          New Skill
        </button>
      </div>

      {invokedSkill && (
        <div className="rules-invoke-toast">
          <Check size={14} style={{ marginRight: 6 }} />
          Skill invoked in current conversation
        </div>
      )}

      {isLoading && <div className="rules-loading">Loading skills…</div>}

      {!isLoading && skills.length === 0 && (
        <div className="rules-empty">
          <Zap size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>No skills yet.</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>
            Skills give the AI reusable playbooks for common tasks like refactoring, code review, or deployments.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setCreatingNew(true)}>
            <Plus size={14} style={{ marginRight: 4 }} />
            Create First Skill
          </button>
        </div>
      )}

      {!isLoading && skills.length > 0 && (
        <div className="rules-list">
          {skills.map(skill => (
            <SkillItem
              key={skill.id}
              skill={skill}
              onEdit={setEditingSkill}
              onDelete={deleteSkill}
              onInvoke={handleInvokeSkill}
            />
          ))}
        </div>
      )}

      <div className="settings-info-box" style={{ marginTop: 16 }}>
        <strong>How skills work:</strong>
        <ul>
          <li>Click <strong>Invoke</strong> to send the skill to the active conversation</li>
          <li>The AI reads the <code>SKILL.md</code> file and follows its instructions</li>
          <li>Skills are listed in every system prompt so the AI knows what&apos;s available</li>
          <li>Create skills for repeated tasks: code review, refactoring, scaffolding, etc.</li>
        </ul>
      </div>
    </div>
  );
};

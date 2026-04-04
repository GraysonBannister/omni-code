import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useRulesStore, type RuleData } from '../stores/rulesStore';

const DEFAULT_RULE_TEMPLATE = `---
description: My new rule
alwaysApply: false
---

# Rule Title

Add your rule content here. Be specific and actionable.
`;

interface RuleEditorProps {
  initialContent: string;
  initialId: string;
  onSave: (id: string, content: string) => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ initialContent, initialId, onSave, onCancel, isNew }) => {
  const [id, setId] = useState(initialId);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedId = id.trim().replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    if (!trimmedId) {
      setError('Rule ID is required');
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
          <label className="rule-editor-label">Rule ID (filename)</label>
          <input
            className="rule-editor-id-input"
            value={id}
            onChange={e => setId(e.target.value)}
            placeholder="my-rule-name"
            spellCheck={false}
          />
        </div>
      )}
      <div className="rule-editor-hint">
        Use YAML frontmatter: <code>description</code>, <code>globs</code> (e.g. <code>**/*.ts</code>), <code>alwaysApply</code>
      </div>
      <textarea
        className="rule-editor-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        spellCheck={false}
        rows={16}
      />
      {error && <div className="rule-editor-error">{error}</div>}
      <div className="rule-editor-actions">
        <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Rule'}
        </button>
      </div>
    </div>
  );
};

interface RuleItemProps {
  rule: RuleData;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (rule: RuleData) => void;
  onDelete: (id: string) => void;
}

const RuleItem: React.FC<RuleItemProps> = ({ rule, onToggle, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const scopeLabel = rule.frontmatter.alwaysApply
    ? 'Always'
    : rule.frontmatter.globs
    ? `Files: ${Array.isArray(rule.frontmatter.globs) ? rule.frontmatter.globs.join(', ') : rule.frontmatter.globs}`
    : 'Manual';

  return (
    <div className={`rule-item ${rule.enabled ? '' : 'rule-item-disabled'}`}>
      <div className="rule-item-header">
        <button
          className="rule-item-expand-btn"
          onClick={() => setExpanded(v => !v)}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="rule-item-meta">
          <span className="rule-item-name">
            {rule.frontmatter.description || rule.id}
          </span>
          <span className="rule-item-scope">{scopeLabel}</span>
        </div>

        <div className="rule-item-controls">
          <label className="rule-toggle" title={rule.enabled ? 'Disable rule' : 'Enable rule'}>
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={e => onToggle(rule.id, e.target.checked)}
            />
            <span className="rule-toggle-track" />
          </label>

          <button
            className="rule-action-btn"
            onClick={() => onEdit(rule)}
            title="Edit rule"
          >
            <Edit2 size={13} />
          </button>

          {confirmDelete ? (
            <div className="rule-delete-confirm">
              <button
                className="rule-action-btn rule-action-danger"
                onClick={() => { onDelete(rule.id); setConfirmDelete(false); }}
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
              title="Delete rule"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="rule-item-body">
          <pre className="rule-item-content">{rule.content || '(empty)'}</pre>
        </div>
      )}
    </div>
  );
};

export const RulesPanel: React.FC = () => {
  const { rules, isLoading, loadRules, toggleRule, saveRule, deleteRule } = useRulesStore();
  const [editingRule, setEditingRule] = useState<RuleData | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const handleSaveEdit = async (id: string, content: string) => {
    const result = await saveRule(id, content);
    if (result.success) {
      setEditingRule(null);
    }
  };

  const handleSaveNew = async (id: string, content: string) => {
    const result = await saveRule(id, content);
    if (result.success) {
      setCreatingNew(false);
    }
  };

  if (creatingNew) {
    return (
      <div className="rules-panel">
        <div className="rules-panel-header">
          <h3 className="settings-section-title">New Rule</h3>
        </div>
        <RuleEditor
          initialId="my-rule"
          initialContent={DEFAULT_RULE_TEMPLATE}
          onSave={handleSaveNew}
          onCancel={() => setCreatingNew(false)}
          isNew
        />
      </div>
    );
  }

  if (editingRule) {
    const fullContent = [
      '---',
      editingRule.frontmatter.description ? `description: ${editingRule.frontmatter.description}` : null,
      editingRule.frontmatter.globs
        ? `globs: ${Array.isArray(editingRule.frontmatter.globs) ? `[${editingRule.frontmatter.globs.join(', ')}]` : editingRule.frontmatter.globs}`
        : null,
      editingRule.frontmatter.alwaysApply !== undefined ? `alwaysApply: ${editingRule.frontmatter.alwaysApply}` : null,
      '---',
      '',
      editingRule.content,
    ].filter(l => l !== null).join('\n');

    return (
      <div className="rules-panel">
        <div className="rules-panel-header">
          <h3 className="settings-section-title">Edit Rule: {editingRule.id}</h3>
        </div>
        <RuleEditor
          initialId={editingRule.id}
          initialContent={fullContent}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRule(null)}
        />
      </div>
    );
  }

  return (
    <div className="rules-panel">
      <div className="rules-panel-header">
        <div>
          <h3 className="settings-section-title" style={{ margin: 0 }}>Project Rules</h3>
          <p className="settings-section-description" style={{ margin: '4px 0 0' }}>
            Rules provide persistent instructions to the AI. Stored in <code>.omnicode/rules/</code> as <code>.mdc</code> files.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCreatingNew(true)}>
          <Plus size={14} style={{ marginRight: 4 }} />
          New Rule
        </button>
      </div>

      {isLoading && <div className="rules-loading">Loading rules…</div>}

      {!isLoading && rules.length === 0 && (
        <div className="rules-empty">
          <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>No rules yet.</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>
            Create a rule to give the AI persistent project-specific instructions.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setCreatingNew(true)}>
            <Plus size={14} style={{ marginRight: 4 }} />
            Create First Rule
          </button>
        </div>
      )}

      {!isLoading && rules.length > 0 && (
        <div className="rules-list">
          {rules.map(rule => (
            <RuleItem
              key={rule.id}
              rule={rule}
              onToggle={toggleRule}
              onEdit={setEditingRule}
              onDelete={deleteRule}
            />
          ))}
        </div>
      )}

      <div className="settings-info-box" style={{ marginTop: 16 }}>
        <strong>Rule frontmatter options:</strong>
        <ul>
          <li><code>description</code> — shown in the rules list</li>
          <li><code>alwaysApply: true</code> — always injected into every conversation</li>
          <li><code>globs: **/*.ts</code> — injected when matching files are open</li>
          <li>No scope fields → treated as always apply</li>
        </ul>
      </div>
    </div>
  );
};

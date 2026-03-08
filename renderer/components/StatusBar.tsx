import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, DollarSign, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import './StatusBar.css';

export const StatusBar: React.FC = () => {
  const {
    currentModel,
    currentProvider,
    availableModels,
    availableProviders,
    isProcessing,
    totalCost,
    inputTokens,
    outputTokens,
    setModel,
  } = useAppStore();

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const handleModelSwitch = useCallback(async (modelId: string, providerName: string) => {
    if (!window.electronAPI) return;
    try {
      const success = await window.electronAPI.agent.switchModel(modelId, providerName);
      if (success) {
        setModel(modelId, providerName);
        setModelDropdownOpen(false);
      }
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
  }, [setModel]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setModelDropdownOpen(false);
    if (modelDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [modelDropdownOpen]);

  const currentModelInfo = availableModels.find(m => m.id === currentModel);

  return (
    <div className="status-bar">
      {/* Left - Processing indicator */}
      <div className="status-bar-section">
        {isProcessing && (
          <div className="status-item status-processing">
            <Activity size={14} className="spinning" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Center - Model selector */}
      <div className="status-bar-section center">
        <div
          className="status-item model-selector"
          onClick={(e) => {
            e.stopPropagation();
            setModelDropdownOpen(!modelDropdownOpen);
          }}
        >
          <Cpu size={14} />
          <span>{currentModelInfo?.name || currentModel}</span>
          {modelDropdownOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </div>

        {modelDropdownOpen && (
          <div className="model-dropdown" onClick={(e) => e.stopPropagation()}>
            {availableProviders.map((provider) => (
              <div key={provider.name} className="model-group">
                <div className="model-group-header">
                  {provider.name}
                  {!provider.available && <span className="unavailable">(unconfigured)</span>}
                </div>
                {availableModels
                  .filter((m) => m.provider === provider.name)
                  .map((model) => (
                    <button
                      key={model.id}
                      className={`model-option ${model.id === currentModel ? 'active' : ''} ${!model.available ? 'disabled' : ''}`}
                      onClick={() => model.available && handleModelSwitch(model.id, model.provider)}
                      disabled={!model.available}
                    >
                      {model.name}
                      {model.id === currentModel && <span className="check">✓</span>}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right - Stats */}
      <div className="status-bar-section right">
        {totalCost > 0 && (
          <div className="status-item" title="Total cost">
            <DollarSign size={14} />
            <span>${totalCost.toFixed(4)}</span>
          </div>
        )}
        {(inputTokens > 0 || outputTokens > 0) && (
          <div className="status-item" title="Token usage">
            <span>{inputTokens.toLocaleString()} / {outputTokens.toLocaleString()} tokens</span>
          </div>
        )}
        <div className="status-item">
          <span>{currentProvider}</span>
        </div>
      </div>
    </div>
  );
};

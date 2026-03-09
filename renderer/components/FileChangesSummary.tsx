import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Minus, RefreshCw, ChevronDown, ChevronRight, FolderOpen, AlertCircle } from 'lucide-react'
import './FileChangesSummary.css'

interface FileChangeSummary {
  filePath: string
  changeType: 'added' | 'modified' | 'deleted'
  lastMessageId: string
  lastTimestamp: number
  changeCount: number
}

interface FileChangesSummaryProps {
  conversationId: string
}

export const FileChangesSummary: React.FC<FileChangesSummaryProps> = ({ conversationId }) => {
  const [changes, setChanges] = useState<FileChangeSummary[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['modified']))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChanges = useCallback(async () => {
    if (!conversationId) {
      setChanges([])
      setError(null)
      return
    }

    if (!window.electronAPI?.file?.getAllChanges) {
      setChanges([])
      setError('File changes API not available')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.file.getAllChanges(conversationId)
      if (result.error) {
        setError(result.error || 'Failed to fetch changes')
      } else {
        setChanges(result.changes || [])
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch file changes'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchChanges()
  }, [fetchChanges])

  useEffect(() => {
    if (!conversationId || !window.electronAPI?.agent?.onEvent) {
      return
    }

    return window.electronAPI.agent.onEvent((event) => {
      if (event.conversationId === conversationId && event.type === 'file_change') {
        fetchChanges()
      }
    })
  }, [conversationId, fetchChanges])

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  const handleRefresh = () => {
    fetchChanges()
  }

  const groupedChanges = {
    added: changes.filter(c => c.changeType === 'added'),
    modified: changes.filter(c => c.changeType === 'modified'),
    deleted: changes.filter(c => c.changeType === 'deleted'),
  }

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'deleted':
        return <Minus className="w-4 h-4 text-red-500" />
      case 'modified':
        return <RefreshCw className="w-4 h-4 text-blue-500" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getGroupLabel = (type: string) => {
    switch (type) {
      case 'added':
        return 'Added'
      case 'deleted':
        return 'Deleted'
      case 'modified':
        return 'Modified'
      default:
        return type
    }
  }

  if (isLoading && changes.length === 0) {
    return (
      <div className="file-changes-summary loading">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading file changes...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="file-changes-summary error">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (changes.length === 0) {
    return (
      <div className="file-changes-summary empty">
        <div className="flex items-center gap-2 text-gray-500">
          <FolderOpen className="w-4 h-4" />
          <span>No file changes yet</span>
        </div>
      </div>
    )
  }

  return (
    <div className="file-changes-summary">
      <div className="file-changes-header">
        <h3 className="text-sm font-semibold text-gray-700">
          File Changes ({changes.length})
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Refresh changes"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="file-changes-groups">
        {Object.entries(groupedChanges).map(([type, groupChanges]) => {
          if (groupChanges.length === 0) return null

          const isExpanded = expandedGroups.has(type)

          return (
            <div key={type} className={`change-group ${type}`}>
              <button
                onClick={() => toggleGroup(type)}
                className="change-group-header"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {getGroupIcon(type)}
                <span className="change-group-label">
                  {getGroupLabel(type)}
                </span>
                <span className="change-count">({groupChanges.length})</span>
              </button>

              {isExpanded && (
                <ul className="change-list">
                  {groupChanges.map((change) => (
                    <li key={change.filePath} className="change-item">
                      <FileText className="w-3 h-3 text-gray-400" />
                      <span className="change-path" title={change.filePath}>
                        {change.filePath}
                      </span>
                      {change.changeCount > 1 && (
                        <span className="change-badge">
                          {change.changeCount} changes
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

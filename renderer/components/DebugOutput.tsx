import React, { useState, useRef, useEffect } from 'react'
import { Wrench, Send, Download, X, AlertTriangle, Info, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import './DebugOutput.css'

export type DebugEventType = 'tool_call' | 'llm_request' | 'llm_response' | 'error' | 'info'

export interface DebugEvent {
  id: string
  timestamp: number
  type: DebugEventType
  title: string
  details: any
  duration?: number
}

interface DebugOutputProps {
  events: DebugEvent[]
  maxHeight?: number
  onClear?: () => void
}

export const DebugOutput: React.FC<DebugOutputProps> = ({
  events,
  maxHeight = 400,
  onClear,
}) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<DebugEventType | 'all'>('all')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  const toggleEvent = (id: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getEventIcon = (type: DebugEventType) => {
    switch (type) {
      case 'tool_call':
        return <Wrench className="w-4 h-4" />
      case 'llm_request':
        return <Send className="w-4 h-4" />
      case 'llm_response':
        return <Download className="w-4 h-4" />
      case 'error':
        return <AlertTriangle className="w-4 h-4" />
      case 'info':
        return <Info className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getEventClass = (type: DebugEventType) => {
    return `debug-event ${type}`
  }

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.type === filter)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return ''
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="debug-output">
      <div className="debug-header">
        <h4 className="debug-title">Debug Output ({events.length} events)</h4>
        <div className="debug-controls">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as DebugEventType | 'all')}
            className="debug-filter"
          >
            <option value="all">All</option>
            <option value="tool_call">Tool Calls</option>
            <option value="llm_request">LLM Requests</option>
            <option value="llm_response">LLM Responses</option>
            <option value="error">Errors</option>
            <option value="info">Info</option>
          </select>
          <button className="debug-clear" onClick={onClear} title="Clear events">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="debug-events"
        style={{ maxHeight }}
      >
        {filteredEvents.length === 0 ? (
          <div className="debug-empty">No debug events</div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={getEventClass(event.type)}
              onClick={() => toggleEvent(event.id)}
            >
              <div className="debug-event-header">
                <span className="debug-icon">{getEventIcon(event.type)}</span>
                <span className="debug-timestamp">{formatTime(event.timestamp)}</span>
                <span className="debug-event-title">{event.title}</span>
                {event.duration && (
                  <span className="debug-duration">{formatDuration(event.duration)}</span>
                )}
                <span className="debug-expand">
                  {expandedEvents.has(event.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              </div>
              {expandedEvents.has(event.id) && (
                <pre className="debug-details">
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

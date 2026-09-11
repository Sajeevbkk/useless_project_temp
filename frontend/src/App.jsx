import { useState, useEffect, useRef } from 'react'

const SUGGESTED_PROMPTS = [
  "What should we do together today?",
  "Tell me something sweet and uplifting ✨",
  "Help me plan a relaxing weekend trip",
  "Write a heartfelt note for me 💌",
]

function App() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_messages')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [selectedMode, setSelectedMode] = useState(() => {
    return localStorage.getItem('chat_mode') || 'Default'
  })
  const [isModesOpen, setIsModesOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [activeModel, setActiveModel] = useState('gemini-2.5-flash')

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const modes = [
    { name: 'Default', desc: 'Warm & intelligent companion' },
    { name: 'Roleplay', desc: 'Sweet & affectionate babe vibe' },
    { name: 'Creative', desc: 'Poetic, expressive & vivid' },
    { name: 'Concise', desc: 'Short, sweet & to the point' },
    { name: 'Coding', desc: 'Technical & programming help' },
  ]

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(messages))
    } catch (e) {
      console.warn('Could not save messages to localStorage', e)
    }
  }, [messages])

  // Persist mode to localStorage
  useEffect(() => {
    localStorage.setItem('chat_mode', selectedMode)
  }, [selectedMode])

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const handleSend = async (textToSend) => {
    const messageContent = (textToSend || prompt).trim()
    if (!messageContent || isLoading) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const updatedHistory = [...messages, userMessage]
    setMessages(updatedHistory)
    setPrompt('')
    setIsLoading(true)

    try {
      // Send conversation history to backend Gemini API
      const payload = {
        messages: updatedHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        mode: selectedMode,
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.model) setActiveModel(data.model)

        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.reply || "I'm right here with you!",
          model: data.model,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errData = await res.json().catch(() => ({}))
        const errorText = errData.detail || 'Could not connect to Gemini API.'
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: `⚠️ Error: ${errorText}`,
            isError: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: "⚠️ Failed to reach the backend. Make sure the FastAPI server is running on port 8000.",
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setPrompt('')
    localStorage.removeItem('chat_messages')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  // Format assistant messages (render code snippets and linebreaks nicely)
  const renderMessageContent = (content) => {
    if (content.includes('```')) {
      const parts = content.split(/(```[\s\S]*?```)/g)
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n')
          const language = part.slice(3, firstLineEnd).trim() || 'code'
          const code = part.slice(firstLineEnd + 1, -3)
          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden border border-outline-variant/30">
              <div className="bg-surface-container-high px-3 py-1 text-xs font-label-sm text-on-surface-variant flex justify-between items-center">
                <span>{language}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`code-${index}`, code)}
                  className="hover:text-on-surface text-[11px] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-surface-container-lowest text-on-surface font-code-block text-xs overflow-x-auto m-0">
                <code>{code}</code>
              </pre>
            </div>
          )
        }
        return (
          <p key={index} className="whitespace-pre-wrap my-1">
            {part}
          </p>
        )
      })
    }
    return <p className="whitespace-pre-wrap">{content}</p>
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body-md selection:bg-secondary-fixed">
      {/* Fixed Top Header */}
      <header className="fixed top-0 right-0 left-0 h-14 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewChat}
            title="New chat"
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">edit_square</span>
          </button>

          {hasMessages && (
            <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active Chat</span>
              <span className="text-outline-variant">•</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-[11px]">
                {selectedMode}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasMessages && (
            <button
              onClick={handleNewChat}
              className="text-xs text-on-surface-variant hover:text-error hover:bg-surface-container px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear current conversation"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">delete_outline</span>
              <span>Clear</span>
            </button>
          )}
          <span className="text-[11px] font-label-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
            {activeModel}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col pt-14 w-full">
        {/* State A: Ongoing Conversation View */}
        {hasMessages ? (
          <div className="flex-1 flex flex-col justify-between w-full max-w-[800px] mx-auto px-4 pb-4">
            {/* Scrollable Message Stream */}
            <div className="flex-1 flex flex-col gap-4 py-6 overflow-y-auto">
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group w-full`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-body-md transition-all shadow-sm ${
                        isUser
                          ? 'bg-primary text-on-primary rounded-br-xs'
                          : msg.isError
                          ? 'bg-error-container text-on-error-container rounded-bl-xs border border-error/20'
                          : 'bg-surface-container-lowest text-on-surface rounded-bl-xs border border-outline-variant/30'
                      }`}
                    >
                      {renderMessageContent(msg.content)}
                    </div>

                    {/* Meta actions (timestamp & copy) */}
                    <div
                      className={`flex items-center gap-2 mt-1 px-1 text-[11px] font-label-sm text-on-surface-variant opacity-70 group-hover:opacity-100 transition-opacity ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-on-surface flex items-center gap-0.5 cursor-pointer"
                          title="Copy response"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedId === msg.id ? 'check' : 'content_copy'}
                          </span>
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Gemini Loading / Typing indicator */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-4 py-3 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-2 text-body-md">
                    <span className="material-symbols-outlined text-[18px] text-primary animate-spin">
                      progress_activity
                    </span>
                    <span className="text-on-surface-variant text-sm">Thinking with Gemini...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Docked Sticky Bottom Input Bar */}
            <div className="sticky bottom-0 bg-surface/90 backdrop-blur-md pt-2 pb-3 w-full">
              <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full shadow-md px-space-md py-space-sm flex items-center gap-space-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
                  title="Add attachment"
                  type="button"
                  onClick={() => alert('Attachments feature ready for image & file uploads!')}
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>

                <input
                  ref={inputRef}
                  id="prompt-input"
                  className="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant"
                  placeholder="Reply to your babe..."
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  disabled={isLoading}
                />

                <div className="flex items-center gap-space-xs shrink-0">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    title="Voice input"
                    type="button"
                    onClick={() => alert('Voice input activated')}
                  >
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  </button>

                  <div className="relative">
                    <button
                      className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors font-label-sm text-label-sm cursor-pointer"
                      type="button"
                      onClick={() => setIsModesOpen(!isModesOpen)}
                    >
                      <span className="font-medium">{selectedMode}</span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        expand_more
                      </span>
                    </button>

                    {isModesOpen && (
                      <div className="absolute right-0 bottom-full mb-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl py-1.5 min-w-[170px] z-50 animate-in fade-in">
                        {modes.map((m) => (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => {
                              setSelectedMode(m.name)
                              setIsModesOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-surface-container flex flex-col cursor-pointer ${
                              selectedMode === m.name ? 'bg-surface-container-high font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-on-surface font-medium">{m.name}</span>
                              {selectedMode === m.name && (
                                <span className="material-symbols-outlined text-[14px] text-primary">
                                  check
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-on-surface-variant font-normal">
                              {m.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 ml-1 cursor-pointer ${
                      prompt.trim() && !isLoading
                        ? 'bg-primary text-on-primary hover:opacity-90 scale-100'
                        : 'bg-surface-container text-on-surface-variant opacity-40 cursor-not-allowed scale-95'
                    }`}
                    title="Send message"
                    type="button"
                    disabled={!prompt.trim() || isLoading}
                    onClick={() => handleSend()}
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* State B: Centered Initial Screen (Original Hero Layout) */
          <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center px-gutter py-space-xl">
            <div className="w-full max-w-[768px] flex flex-col items-center gap-space-lg">
              {/* Input Pill */}
              <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full shadow-sm hover:shadow-md px-space-md py-space-sm flex items-center gap-space-sm transition-all focus-within:shadow-md">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
                  title="Add attachment"
                  type="button"
                  onClick={() => alert('Attachments feature ready for image & file uploads!')}
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>

                <input
                  ref={inputRef}
                  id="prompt-input"
                  className="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant"
                  placeholder="Chat with your babe..."
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  disabled={isLoading}
                  autoFocus
                />

                <div className="flex items-center gap-space-xs shrink-0">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    title="Voice input"
                    type="button"
                    onClick={() => alert('Voice input activated')}
                  >
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  </button>

                  <div className="relative">
                    <button
                      className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors font-label-sm text-label-sm cursor-pointer"
                      type="button"
                      onClick={() => setIsModesOpen(!isModesOpen)}
                    >
                      <span className="font-medium">{selectedMode}</span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        expand_more
                      </span>
                    </button>

                    {isModesOpen && (
                      <div className="absolute right-0 bottom-full mb-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl py-1.5 min-w-[170px] z-50">
                        {modes.map((m) => (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => {
                              setSelectedMode(m.name)
                              setIsModesOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-surface-container flex flex-col cursor-pointer ${
                              selectedMode === m.name ? 'bg-surface-container-high font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-on-surface font-medium">{m.name}</span>
                              {selectedMode === m.name && (
                                <span className="material-symbols-outlined text-[14px] text-primary">
                                  check
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-on-surface-variant font-normal">
                              {m.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {prompt.trim() && (
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity shrink-0 ml-1 cursor-pointer"
                      title="Send message"
                      type="button"
                      onClick={() => handleSend()}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_upward
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-[640px] pt-2">
                {SUGGESTED_PROMPTS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 text-xs text-on-surface transition-all text-left flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

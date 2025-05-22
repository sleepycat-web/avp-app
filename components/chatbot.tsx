"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Send, X } from "lucide-react"

type Message = {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

type ChatbotProps = {
  botName?: string
  botAvatar?: string
  accentColor?: string
  initialMessages?: Message[]
  position?: "bottom-right" | "bottom-left"
}

export default function Chatbot({
  botName = "Government Assistant",
  botAvatar,
  accentColor = "#0e4174", // Deep navy blue - government style
  initialMessages = [
    {
      id: "1",
      text: "Welcome to our official assistance service. How may I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ],
  position = "bottom-right",
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInputValue("")

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello. Thank you for contacting our official service desk.\n\nI can assist you with:\n* Information about our services\n* Document submission guidance\n* Application status inquiries"
    } else if (lowerMessage.includes("help")) {
      return "I'm here to provide official assistance. Please specify what information you're seeking.\n\nCommon inquiries include:\n* Forms and applications\n* Regulatory requirements\n* Deadlines and important dates"
    } else if (lowerMessage.includes("services") || lowerMessage.includes("features")) {
      return "Our department provides several essential services:\n\n* Official document processing\n* Regulatory compliance assistance\n* Public information resources\n* Scheduled appointments with relevant officials"
    } else if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
      return "Thank you for using our official assistance service. If you require further information, please don't hesitate to return. Have a good day."
    } else {
      return "Thank you for your inquiry. To provide you with accurate information, could you please specify which department or service you're inquiring about? Our goal is to direct you to the appropriate resources efficiently."
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Enhanced markdown parser for formatting
  const parseMarkdown = (text: string) => {
    // Process bold text
    let processedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Process italic text
    processedText = processedText.replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Split text into paragraphs (double line breaks)
    const paragraphs = processedText.split("\n\n")

    return paragraphs.map((paragraph, index) => {
      // Handle bullet points
      if (paragraph.startsWith("* ")) {
        const items = paragraph.split("\n* ")
        return (
          <ul key={`ul-${index}`} className="list-disc pl-5 mb-3">
            {items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/^\* /, "") }} />
            ))}
          </ul>
        )
      }

      // Handle line breaks within a paragraph
      if (paragraph.includes("\n")) {
        return (
          <p key={`p-${index}`} className="mb-3">
            {paragraph.split("\n").map((line, i, arr) => (
              <React.Fragment key={i}>
                <span dangerouslySetInnerHTML={{ __html: line }} />
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )
      }

      // Regular paragraph
      return <p key={`p-${index}`} className="mb-3" dangerouslySetInnerHTML={{ __html: paragraph }} />
    })
  }

  // Generate initials from bot name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const positionClasses = position === "bottom-right" ? "right-4" : "left-4"

  // Dynamic styles based on accent color
  const dynamicStyles = {
    backgroundColor: accentColor,
    "--accent-color": accentColor,
    "--accent-hover": adjustColorBrightness(accentColor, -15),
  } as React.CSSProperties

  // User message style - using a complementary official color
  const userMessageStyle = {
    backgroundColor: "#1a365d", // Deep navy blue for user messages
  } as React.CSSProperties

  return (
    <div className={`fixed bottom-4 ${positionClasses} z-50`}>
      {/* Chat toggle button */}
      <motion.button
        onClick={toggleChat}
        style={dynamicStyles}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 h-[28rem] bg-white dark:bg-gray-900 rounded-md shadow-xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Chat header */}
            <div style={dynamicStyles} className="p-4 text-white font-medium flex items-center">
              <div className="flex items-center flex-1">
                {botAvatar ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-3 border-2 border-white/30 shadow-sm">
                    <img
                      src={botAvatar || "/placeholder.svg"}
                      alt={`${botName} avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center bg-white/20 text-white font-medium text-sm border-2 border-white/30 shadow-sm">
                    {getInitials(botName)}
                  </div>
                )}
                <span className="font-semibold tracking-wide">{botName}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleChat}
                className="text-white/80 hover:text-white focus:outline-none transition-colors duration-200"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Messages container */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              {messages.map((message, index) => {
                // Check if this is the first message from this sender in a sequence
                const isFirstInSequence = index === 0 || messages[index - 1].sender !== message.sender
                // Check if this is the last message from this sender in a sequence
                const isLastInSequence = index === messages.length - 1 || messages[index + 1].sender !== message.sender

                return (
                  <div
                    key={message.id}
                    className={`${isFirstInSequence ? "mt-4" : "mt-1"} ${isLastInSequence ? "mb-4" : "mb-1"} flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] ${message.sender === "user" ? "order-2" : "order-1"}`}>
                      <div
                        style={message.sender === "user" ? userMessageStyle : {}}
                        className={`p-3.5 rounded-md shadow-sm ${
                          message.sender === "user"
                            ? "text-white rounded-br-none"
                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700"
                        }`}
                      >
                        <div className="prose prose-sm dark:prose-invert">{parseMarkdown(message.text)}</div>
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          message.sender === "user"
                            ? "text-right text-gray-500 dark:text-gray-400"
                            : "text-left text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 p-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <motion.button
                onClick={handleSendMessage}
                disabled={inputValue.trim() === ""}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={dynamicStyles}
                className="p-3 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number) {
  // Convert hex to RGB
  let r = Number.parseInt(hex.substring(1, 3), 16)
  let g = Number.parseInt(hex.substring(3, 5), 16)
  let b = Number.parseInt(hex.substring(5, 7), 16)

  // Adjust brightness
  r = Math.max(0, Math.min(255, r + percent))
  g = Math.max(0, Math.min(255, g + percent))
  b = Math.max(0, Math.min(255, b + percent))

  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

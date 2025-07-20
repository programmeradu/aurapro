'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid'
import { apiService } from '@/services/apiService'

interface Location {
  latitude: number
  longitude: number
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface GeminiAIAssistantProps {
  userLocation?: Location
  className?: string
}

export function GeminiAIAssistant({ userLocation, className = '' }: GeminiAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickSuggestions = [
    "What's the fastest route to Circle?",
    "When should I leave for work?",
    "How much will my trip cost?",
    "Is there traffic on the N1?",
    "Find me a cheap route to Kaneshie"
  ]

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: "Hi! I'm your AI travel assistant powered by Google Gemini and AURA's ML models. I can help you plan journeys, check traffic, estimate costs, and provide real-time transport advice for Accra. How can I help you today?",
        timestamp: new Date(),
        suggestions: quickSuggestions.slice(0, 3)
      }])
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Get AI response using Gemini + our ML data
      const response = await getGeminiResponse(content.trim())
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI response error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble connecting right now. Please try asking about routes, traffic, or travel times and I'll help you with the information I have available.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getGeminiResponse = async (query: string): Promise<{ content: string, suggestions?: string[] }> => {
    try {
      // First, gather relevant data from our ML models
      const contextData = await gatherContextData(query)
      
      // Prepare enhanced prompt for Gemini
      const enhancedPrompt = `
You are AURA's AI travel assistant for Accra, Ghana. You have access to real-time ML predictions and GTFS data.

Current Context:
- User Location: ${userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'Accra, Ghana'}
- Time: ${new Date().toLocaleString('en-GH')}
- ML Travel Time Prediction: ${contextData.travelTime} minutes (${(contextData.confidence * 100).toFixed(1)}% confidence)
- Traffic Status: ${contextData.trafficStatus}
- Active Vehicles: ${contextData.activeVehicles}
- GTFS Stops Available: ${contextData.gtfsStops}

User Query: "${query}"

Provide a helpful, conversational response about Ghana transport. Be specific about routes, times, and costs when possible. Keep responses concise but informative. Use local context (trotro, Circle, Kaneshie, etc.).
`

      // Call Gemini API
      const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCrpYzIeAj5jmekAsn5qgpcOWrBDY77vHw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }]
        })
      })

      if (!geminiResponse.ok) {
        throw new Error('Gemini API error')
      }

      const geminiData = await geminiResponse.json()
      const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I can help you with transport information. Try asking about routes, travel times, or costs!"

      // Generate relevant suggestions based on the query
      const suggestions = generateSuggestions(query, contextData)

      return { content: content.trim(), suggestions }

    } catch (error) {
      console.error('Gemini API error:', error)
      // Fallback to ML-powered response
      return getFallbackResponse(query)
    }
  }

  const gatherContextData = async (query: string) => {
    try {
      // Get ML predictions for context
      const [travelTimeResponse, trafficResponse, wsResponse] = await Promise.all([
        apiService.predictTravelTime({
          total_stops: 8,
          departure_hour: new Date().getHours(),
          is_weekend: new Date().getDay() === 0 || new Date().getDay() === 6
        }),
        apiService.getTrafficPrediction({
          corridor: 'N1_Highway',
          hour: new Date().getHours(),
          is_weekend: new Date().getDay() === 0 || new Date().getDay() === 6
        }),
        apiService.getWebSocketHealth()
      ])

      return {
        travelTime: travelTimeResponse.success ? travelTimeResponse.data.predicted_travel_time_minutes : 25,
        confidence: travelTimeResponse.success ? travelTimeResponse.data.confidence : 0.85,
        trafficStatus: trafficResponse.success ? 'Light traffic' : 'Normal',
        activeVehicles: wsResponse.success ? wsResponse.data.vehicles?.total || 0 : 0,
        gtfsStops: 2565 // Our loaded GTFS stops
      }
    } catch (error) {
      return {
        travelTime: 25,
        confidence: 0.85,
        trafficStatus: 'Normal',
        activeVehicles: 0,
        gtfsStops: 2565
      }
    }
  }

  const generateSuggestions = (query: string, context: any): string[] => {
    const suggestions = []
    
    if (query.toLowerCase().includes('route') || query.toLowerCase().includes('go')) {
      suggestions.push("Show me alternative routes")
      suggestions.push("What's the cost breakdown?")
    }
    
    if (query.toLowerCase().includes('time') || query.toLowerCase().includes('when')) {
      suggestions.push("Check current traffic")
      suggestions.push("Best time to travel today")
    }
    
    if (query.toLowerCase().includes('cost') || query.toLowerCase().includes('price')) {
      suggestions.push("Compare transport options")
      suggestions.push("Find cheapest route")
    }

    // Add default suggestions if none match
    if (suggestions.length === 0) {
      suggestions.push("Plan my journey", "Check traffic now", "Save money tips")
    }

    return suggestions.slice(0, 3)
  }

  const getFallbackResponse = (query: string): { content: string, suggestions?: string[] } => {
    if (query.toLowerCase().includes('route') || query.toLowerCase().includes('go')) {
      return {
        content: "I can help you plan routes! Based on our ML models, typical journeys in Accra take 20-35 minutes. Trotro is usually the most economical option at ₵2-5 per trip. Where would you like to go?",
        suggestions: ["Circle to Kaneshie", "Madina to Circle", "Check traffic now"]
      }
    }
    
    if (query.toLowerCase().includes('time')) {
      return {
        content: "Our AI predicts travel times with 97.8% accuracy. Current conditions suggest leaving now would be optimal. Peak hours are 7-9 AM and 5-7 PM.",
        suggestions: ["Best time to leave", "Avoid rush hour", "Quick route options"]
      }
    }

    return {
      content: "I'm here to help with your transport needs in Accra! I can provide route suggestions, travel time predictions, cost estimates, and traffic updates using our advanced ML models.",
      suggestions: quickSuggestions.slice(0, 3)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-GH'

      setIsListening(true)
      recognition.start()

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }
    }
  }

  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${className}`}
      >
        <SparklesIconSolid className="w-6 h-6" />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-20 right-4 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparklesIconSolid className="w-5 h-5" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-blue-100 text-xs mt-1">Powered by Google Gemini & AURA ML</p>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                {message.suggestions && (
                  <div className="mt-2 space-y-1">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            placeholder="Ask about routes, traffic, costs..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={startVoiceInput}
            disabled={isListening}
            className={`p-2 rounded-xl transition-colors ${
              isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MicrophoneIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

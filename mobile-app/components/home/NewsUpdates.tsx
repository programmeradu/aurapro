'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  NewspaperIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  category: 'transport' | 'traffic' | 'infrastructure' | 'policy' | 'safety'
  publishedAt: Date
  author: string
  imageUrl?: string
  likes: number
  comments: number
  isLiked: boolean
  source: string
  readTime: number
}

const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'New Bus Rapid Transit System Launches in Accra',
    summary: 'The long-awaited BRT system begins operations with dedicated lanes and modern buses.',
    content: 'The Greater Accra Regional Minister announced the official launch of the Bus Rapid Transit system...',
    category: 'transport',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    author: 'Ghana Transport Authority',
    likes: 245,
    comments: 32,
    isLiked: false,
    source: 'GTA News',
    readTime: 3
  },
  {
    id: '2',
    title: 'Traffic Diversions on Spintex Road This Weekend',
    summary: 'Road maintenance work will cause temporary diversions affecting commuter routes.',
    content: 'Commuters are advised to use alternative routes as major maintenance work begins...',
    category: 'traffic',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    author: 'Roads Ministry',
    likes: 89,
    comments: 15,
    isLiked: true,
    source: 'Traffic Updates',
    readTime: 2
  },
  {
    id: '3',
    title: 'Digital Payment System for Trotros Pilot Program',
    summary: 'Mobile money integration being tested on select routes in Greater Accra.',
    content: 'A new digital payment system is being piloted to modernize public transport payments...',
    category: 'policy',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    author: 'Ministry of Transport',
    likes: 156,
    comments: 28,
    isLiked: false,
    source: 'Transport News',
    readTime: 4
  }
]

export function NewsUpdates() {
  const [news, setNews] = useState<NewsItem[]>(mockNews)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const categories = [
    { id: 'all', name: 'All', icon: '📰' },
    { id: 'transport', name: 'Transport', icon: '🚌' },
    { id: 'traffic', name: 'Traffic', icon: '🚦' },
    { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️' },
    { id: 'policy', name: 'Policy', icon: '📋' },
    { id: 'safety', name: 'Safety', icon: '🛡️' }
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport': return 'bg-blue-100 text-blue-800'
      case 'traffic': return 'bg-red-100 text-red-800'
      case 'infrastructure': return 'bg-orange-100 text-orange-800'
      case 'policy': return 'bg-purple-100 text-purple-800'
      case 'safety': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}m ago`
    }
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const toggleLike = (id: string) => {
    setNews(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            isLiked: !item.isLiked,
            likes: item.isLiked ? item.likes - 1 : item.likes + 1
          }
        : item
    ))
  }

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(item => item.category === selectedCategory)

  return (
    <div className="bg-white rounded-mobile shadow-mobile p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <NewspaperIcon className="h-5 w-5 mr-2 text-blue-600" />
          Transport News
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* News Items */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredNews.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{item.readTime} min read</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {item.summary}
                  </p>
                </div>
              </div>

              {expandedItem === item.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 text-sm text-gray-700 leading-relaxed"
                >
                  {item.content}
                </motion.div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {formatTime(item.publishedAt)}
                  </span>
                  <span>{item.source}</span>
                </div>
                <span>{item.author}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleLike(item.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    {item.isLiked ? (
                      <HeartIconSolid className="h-4 w-4 text-red-500" />
                    ) : (
                      <HeartIcon className="h-4 w-4" />
                    )}
                    <span className="text-sm">{item.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    <span className="text-sm">{item.comments}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
                    <ShareIcon className="h-4 w-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {expandedItem === item.id ? 'Show Less' : 'Read More'}
                  </button>
                  
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-8">
          <NewspaperIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">No news found</p>
          <p className="text-sm text-gray-500">Try selecting a different category</p>
        </div>
      )}
    </div>
  )
}

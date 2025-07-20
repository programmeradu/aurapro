'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  HeartIcon,
  ShareIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  FlagIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BellIcon,
  StarIcon,
  TrophyIcon,
  FireIcon,
  BoltIcon,
  ArrowPathIcon,
  CameraIcon,
  MicrophoneIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { unifiedDataService, apiService, Location } from '@/services'

interface CommunityPost {
  id: string
  user: {
    id: string
    name: string
    avatar: string
    reputation: number
    badge: string
  }
  type: 'report' | 'tip' | 'question' | 'update' | 'review'
  title: string
  content: string
  location?: Location
  locationName?: string
  timestamp: Date
  likes: number
  comments: number
  views: number
  isLiked: boolean
  isBookmarked: boolean
  severity?: 'low' | 'medium' | 'high'
  status?: 'active' | 'resolved' | 'verified'
  images?: string[]
  tags: string[]
}

interface CommunityStats {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  resolvedIssues: number
  averageResponseTime: number
  topContributors: Array<{
    id: string
    name: string
    avatar: string
    contributions: number
    reputation: number
  }>
}

interface CommunityFilters {
  type: 'all' | 'report' | 'tip' | 'question' | 'update' | 'review'
  location: 'all' | 'nearby' | 'route'
  timeframe: 'today' | 'week' | 'month' | 'all'
  status: 'all' | 'active' | 'resolved'
  sortBy: 'recent' | 'popular' | 'trending'
}

export function EnhancedCommunityHub() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<CommunityFilters>({
    type: 'all',
    location: 'all',
    timeframe: 'week',
    status: 'all',
    sortBy: 'recent'
  })

  const [newPost, setNewPost] = useState({
    type: 'report' as CommunityPost['type'],
    title: '',
    content: '',
    location: null as Location | null,
    locationName: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[],
    images: [] as string[]
  })

  useEffect(() => {
    initializeCommunity()
  }, [])

  useEffect(() => {
    fetchCommunityData()
  }, [filters, searchQuery])

  const initializeCommunity = async () => {
    try {
      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          },
          () => {
            // Default to Accra
            setUserLocation({ latitude: 5.6037, longitude: -0.1870 })
          }
        )
      }

      await fetchCommunityData()
    } catch (error) {
      console.error('Failed to initialize community:', error)
    }
  }

  const fetchCommunityData = async () => {
    setIsLoading(true)
    try {
      // Fetch community data using unified service
      const communityData = await unifiedDataService.getCommunityData()
      
      // Transform API data to community posts
      const transformedPosts: CommunityPost[] = generateCommunityPosts(communityData)
      const communityStats: CommunityStats = generateCommunityStats(communityData)

      // Apply filters
      const filteredPosts = applyFilters(transformedPosts)
      
      setPosts(filteredPosts)
      setStats(communityStats)
    } catch (error) {
      console.error('Failed to fetch community data:', error)
      // Fallback to mock data
      setPosts(generateMockPosts())
      setStats(generateMockStats())
    } finally {
      setIsLoading(false)
    }
  }

  const generateCommunityPosts = (data: any): CommunityPost[] => {
    const mockPosts: CommunityPost[] = [
      {
        id: '1',
        user: {
          id: 'user1',
          name: 'Kwame Asante',
          avatar: '👨🏿‍💼',
          reputation: 850,
          badge: 'Transport Expert'
        },
        type: 'report',
        title: 'Heavy Traffic on Spintex Road',
        content: 'There\'s unusual heavy traffic on Spintex Road near the Accra Mall. Multiple vehicles broken down. Consider alternative routes.',
        location: { latitude: 5.6108, longitude: -0.1821 },
        locationName: 'Spintex Road, Accra',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        likes: 24,
        comments: 8,
        views: 156,
        isLiked: false,
        isBookmarked: false,
        severity: 'high',
        status: 'active',
        tags: ['traffic', 'spintex', 'breakdown']
      },
      {
        id: '2',
        user: {
          id: 'user2',
          name: 'Ama Osei',
          avatar: '👩🏿‍🎓',
          reputation: 620,
          badge: 'Community Helper'
        },
        type: 'tip',
        title: 'Best Time to Travel to Airport',
        content: 'Based on my daily commute data, the best time to travel to Kotoka Airport is between 6:00-7:00 AM or after 10:00 AM to avoid rush hour traffic.',
        location: { latitude: 5.6052, longitude: -0.1668 },
        locationName: 'Kotoka International Airport',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        likes: 45,
        comments: 12,
        views: 289,
        isLiked: true,
        isBookmarked: true,
        status: 'verified',
        tags: ['airport', 'timing', 'traffic', 'tip']
      },
      {
        id: '3',
        user: {
          id: 'user3',
          name: 'Kofi Mensah',
          avatar: '👨🏿‍🔧',
          reputation: 420,
          badge: 'Local Guide'
        },
        type: 'update',
        title: 'New Bus Route: Circle to Tema',
        content: 'Great news! There\'s a new direct bus route from Circle to Tema starting today. Fare is ₵3.50 and runs every 20 minutes during peak hours.',
        location: { latitude: 5.5694, longitude: -0.2067 },
        locationName: 'Kwame Nkrumah Circle',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        likes: 67,
        comments: 23,
        views: 445,
        isLiked: false,
        isBookmarked: false,
        status: 'verified',
        tags: ['bus', 'route', 'circle', 'tema', 'new']
      },
      {
        id: '4',
        user: {
          id: 'user4',
          name: 'Akosua Darko',
          avatar: '👩🏿‍💻',
          reputation: 780,
          badge: 'Tech Enthusiast'
        },
        type: 'question',
        title: 'Best App for Real-time Bus Tracking?',
        content: 'I\'m looking for recommendations for apps that provide real-time bus tracking in Accra. Which ones have you found most reliable?',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        likes: 18,
        comments: 31,
        views: 203,
        isLiked: false,
        isBookmarked: false,
        status: 'active',
        tags: ['app', 'tracking', 'bus', 'recommendation']
      },
      {
        id: '5',
        user: {
          id: 'user5',
          name: 'Yaw Boateng',
          avatar: '👨🏿‍🚀',
          reputation: 950,
          badge: 'Super Contributor'
        },
        type: 'review',
        title: 'Review: Uber vs Local Taxis in Accra',
        content: 'After using both services for 6 months, here\'s my detailed comparison of costs, reliability, and safety between Uber and traditional taxis in Accra.',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        likes: 89,
        comments: 45,
        views: 678,
        isLiked: true,
        isBookmarked: true,
        status: 'verified',
        tags: ['uber', 'taxi', 'comparison', 'review', 'accra']
      }
    ]

    return mockPosts
  }

  const generateCommunityStats = (data: any): CommunityStats => {
    return {
      totalUsers: 12847,
      activeUsers: 3421,
      totalPosts: 8934,
      resolvedIssues: 6721,
      averageResponseTime: 23, // minutes
      topContributors: [
        { id: '1', name: 'Yaw Boateng', avatar: '👨🏿‍🚀', contributions: 234, reputation: 950 },
        { id: '2', name: 'Kwame Asante', avatar: '👨🏿‍💼', contributions: 189, reputation: 850 },
        { id: '3', name: 'Akosua Darko', avatar: '👩🏿‍💻', contributions: 156, reputation: 780 },
        { id: '4', name: 'Ama Osei', avatar: '👩🏿‍🎓', contributions: 134, reputation: 620 },
        { id: '5', name: 'Kofi Mensah', avatar: '👨🏿‍🔧', contributions: 98, reputation: 420 }
      ]
    }
  }

  const generateMockPosts = (): CommunityPost[] => {
    return generateCommunityPosts(null)
  }

  const generateMockStats = (): CommunityStats => {
    return generateCommunityStats(null)
  }

  const applyFilters = (allPosts: CommunityPost[]): CommunityPost[] => {
    let filtered = [...allPosts]

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(post => post.type === filters.type)
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(post => post.status === filters.status)
    }

    // Filter by timeframe
    const now = new Date()
    switch (filters.timeframe) {
      case 'today':
        filtered = filtered.filter(post => 
          post.timestamp.toDateString() === now.toDateString()
        )
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(post => post.timestamp >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(post => post.timestamp >= monthAgo)
        break
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sort posts
    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        break
      case 'popular':
        filtered.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
        break
      case 'trending':
        filtered.sort((a, b) => b.views - a.views)
        break
    }

    return filtered
  }

  const handleLikePost = async (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ))

    // In real app, send API request
    try {
      // await apiService.likePost(postId)
    } catch (error) {
      console.error('Failed to like post:', error)
    }
  }

  const handleBookmarkPost = async (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ))
  }

  const getPostTypeIcon = (type: CommunityPost['type']) => {
    switch (type) {
      case 'report': return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'tip': return <BoltIcon className="w-5 h-5" />
      case 'question': return <ChatBubbleLeftRightIcon className="w-5 h-5" />
      case 'update': return <BellIcon className="w-5 h-5" />
      case 'review': return <StarIcon className="w-5 h-5" />
      default: return <ChatBubbleLeftRightIcon className="w-5 h-5" />
    }
  }

  const getPostTypeColor = (type: CommunityPost['type']) => {
    switch (type) {
      case 'report': return 'bg-red-100 text-red-700 border-red-200'
      case 'tip': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'question': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'update': return 'bg-green-100 text-green-700 border-green-200'
      case 'review': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const submitNewPost = async () => {
    try {
      // In real app, send to API
      const post: CommunityPost = {
        id: Date.now().toString(),
        user: {
          id: 'current_user',
          name: 'You',
          avatar: '👤',
          reputation: 100,
          badge: 'New Member'
        },
        type: newPost.type,
        title: newPost.title,
        content: newPost.content,
        location: newPost.location,
        locationName: newPost.locationName,
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        views: 0,
        isLiked: false,
        isBookmarked: false,
        severity: newPost.severity,
        status: 'active',
        tags: newPost.tags
      }

      setPosts(prev => [post, ...prev])
      setShowNewPost(false)
      setNewPost({
        type: 'report',
        title: '',
        content: '',
        location: null,
        locationName: '',
        severity: 'medium',
        tags: [],
        images: []
      })
    } catch (error) {
      console.error('Failed to submit post:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-aura-primary mr-3" />
          <span className="text-gray-600">Loading community...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      {stats && (
        <div className="bg-gradient-to-r from-aura-primary to-aura-secondary rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Community Hub</h2>
              <p className="text-white/80">Connect with fellow commuters</p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-white/80" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-white/80 text-sm">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.activeUsers.toLocaleString()}</p>
              <p className="text-white/80 text-sm">Active Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.totalPosts.toLocaleString()}</p>
              <p className="text-white/80 text-sm">Total Posts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.averageResponseTime}m</p>
              <p className="text-white/80 text-sm">Avg Response</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center space-x-2 bg-aura-primary text-white px-4 py-2 rounded-xl hover:bg-aura-primary/90 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Post</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="report">Reports</option>
                    <option value="tip">Tips</option>
                    <option value="question">Questions</option>
                    <option value="update">Updates</option>
                    <option value="review">Reviews</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select
                    value={filters.timeframe}
                    onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      type: 'all',
                      location: 'all',
                      timeframe: 'week',
                      status: 'all',
                      sortBy: 'recent'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Post Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{post.user.avatar}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{post.user.name}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {post.user.badge}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{post.user.reputation} reputation</span>
                      <span>•</span>
                      <span>{formatTimeAgo(post.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border ${getPostTypeColor(post.type)}`}>
                    {getPostTypeIcon(post.type)}
                    <span className="text-xs font-medium capitalize">{post.type}</span>
                  </div>
                  {post.severity && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(post.severity)}`}>
                      {post.severity.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-700 leading-relaxed">{post.content}</p>
              </div>

              {/* Location */}
              {post.location && post.locationName && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{post.locationName}</span>
                </div>
              )}

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    {post.isLiked ? (
                      <HeartIconSolid className="w-5 h-5" />
                    ) : (
                      <HeartIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">{post.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments}</span>
                  </button>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <EyeIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.views}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBookmarkPost(post.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.isBookmarked 
                        ? 'text-yellow-600 bg-yellow-50' 
                        : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                    }`}
                  >
                    <StarIcon className="w-5 h-5" />
                  </button>
                  
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filters.type !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to share something with the community!'
              }
            </p>
            <button
              onClick={() => setShowNewPost(true)}
              className="bg-aura-primary text-white px-6 py-3 rounded-xl hover:bg-aura-primary/90 transition-colors"
            >
              Create First Post
            </button>
          </div>
        )}
      </div>

      {/* Top Contributors */}
      {stats && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {stats.topContributors.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-aura-primary text-white rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="text-2xl">{contributor.avatar}</div>
                  <div>
                    <p className="font-medium text-gray-900">{contributor.name}</p>
                    <p className="text-sm text-gray-600">{contributor.contributions} contributions</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <TrophyIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900">{contributor.reputation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewPost(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Post</h3>
                <button
                  onClick={() => setShowNewPost(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Post Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                  <select
                    value={newPost.type}
                    onChange={(e) => setNewPost(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  >
                    <option value="report">Report Issue</option>
                    <option value="tip">Share Tip</option>
                    <option value="question">Ask Question</option>
                    <option value="update">Share Update</option>
                    <option value="review">Write Review</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a descriptive title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share details about your post..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent resize-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                  <input
                    type="text"
                    value={newPost.locationName}
                    onChange={(e) => setNewPost(prev => ({ ...prev, locationName: e.target.value }))}
                    placeholder="Enter location name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  />
                </div>

                {/* Severity (for reports) */}
                {newPost.type === 'report' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                    <select
                      value={newPost.severity}
                      onChange={(e) => setNewPost(prev => ({ ...prev, severity: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                    >
                      <option value="low">Low - Minor inconvenience</option>
                      <option value="medium">Medium - Moderate impact</option>
                      <option value="high">High - Major disruption</option>
                    </select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitNewPost}
                    disabled={!newPost.title || !newPost.content}
                    className="flex-1 px-4 py-3 bg-aura-primary text-white rounded-xl hover:bg-aura-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  StarIcon,
  PlusIcon,
  MegaphoneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface CrowdsourcingReport {
  id: string
  type: 'delay' | 'breakdown' | 'route_change' | 'safety' | 'fare_change' | 'traffic'
  title: string
  description: string
  location: string
  route?: string
  severity: 'low' | 'medium' | 'high'
  timestamp: Date
  reportedBy: string
  verifications: number
  status: 'pending' | 'verified' | 'resolved'
  upvotes: number
  downvotes: number
}

interface CrowdsourcingHubProps {
  className?: string
  userLocation?: { latitude: number; longitude: number }
}

export default function CrowdsourcingHub({ className = '', userLocation }: CrowdsourcingHubProps) {
  const [reports, setReports] = useState<CrowdsourcingReport[]>([])
  const [activeTab, setActiveTab] = useState<'nearby' | 'recent' | 'my_reports'>('nearby')
  const [showReportModal, setShowReportModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [activeTab, userLocation])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      // Mock data - would integrate with real crowdsourcing service
      const mockReports: CrowdsourcingReport[] = [
        {
          id: '1',
          type: 'delay',
          title: 'Major delays on Accra-Tema route',
          description: 'Heavy traffic causing 30+ minute delays. Multiple trotros stuck.',
          location: 'Tema Station',
          route: 'Accra-Tema',
          severity: 'high',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          reportedBy: 'Kwame A.',
          verifications: 12,
          status: 'verified',
          upvotes: 15,
          downvotes: 1
        },
        {
          id: '2',
          type: 'breakdown',
          title: 'Vehicle breakdown at Circle',
          description: 'STC bus broken down, blocking one lane. Consider alternative routes.',
          location: 'Circle Interchange',
          route: 'Circle-Kaneshie',
          severity: 'medium',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          reportedBy: 'Ama S.',
          verifications: 8,
          status: 'verified',
          upvotes: 10,
          downvotes: 0
        },
        {
          id: '3',
          type: 'fare_change',
          title: 'Fare increase on Kaneshie route',
          description: 'Drivers increased fare from 3 GHS to 4 GHS due to fuel prices.',
          location: 'Kaneshie Market',
          route: 'Kaneshie-Accra Central',
          severity: 'low',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          reportedBy: 'Joseph M.',
          verifications: 5,
          status: 'pending',
          upvotes: 8,
          downvotes: 2
        }
      ]
      
      setReports(mockReports)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'delay': return <ClockIcon className="h-5 w-5" />
      case 'breakdown': return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'route_change': return <MapPinIcon className="h-5 w-5" />
      case 'safety': return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'fare_change': return <StarIcon className="h-5 w-5" />
      case 'traffic': return <ClockIcon className="h-5 w-5" />
      default: return <MegaphoneIcon className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'resolved': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const handleVote = (reportId: string, isUpvote: boolean) => {
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          upvotes: isUpvote ? report.upvotes + 1 : report.upvotes,
          downvotes: !isUpvote ? report.downvotes + 1 : report.downvotes
        }
      }
      return report
    }))
  }

  const filteredReports = reports.filter(report => {
    switch (activeTab) {
      case 'nearby':
        // Would filter by user location in real implementation
        return true
      case 'recent':
        return Date.now() - report.timestamp.getTime() < 24 * 60 * 60 * 1000
      case 'my_reports':
        // Would filter by current user in real implementation
        return report.reportedBy.includes('Kwame')
      default:
        return true
    }
  })

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Community Reports</h3>
            <p className="text-sm text-gray-600">Real-time updates from fellow commuters</p>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Report</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'nearby', label: 'Nearby', icon: MapPinIcon },
            { key: 'recent', label: 'Recent', icon: ClockIcon },
            { key: 'my_reports', label: 'My Reports', icon: UserGroupIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <MegaphoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h4>
            <p className="text-gray-600 mb-4">Be the first to share transport updates in your area</p>
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Create Report
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg p-4 ${getSeverityColor(report.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getReportIcon(report.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{report.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{report.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span className="flex items-center space-x-1">
                            <MapPinIcon className="h-3 w-3" />
                            <span>{report.location}</span>
                          </span>
                          {report.route && (
                            <span className="flex items-center space-x-1">
                              <span>Route: {report.route}</span>
                            </span>
                          )}
                          <span>{getTimeAgo(report.timestamp)}</span>
                          <span>by {report.reportedBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVote(report.id, true)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600"
                      >
                        <span>👍</span>
                        <span>{report.upvotes}</span>
                      </button>
                      <button
                        onClick={() => handleVote(report.id, false)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"
                      >
                        <span>👎</span>
                        <span>{report.downvotes}</span>
                      </button>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>{report.verifications} verified</span>
                      </div>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Verify
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Report Creation Modal */}
      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} />}
    </div>
  )
}

// Report Creation Modal Component
function ReportModal({ onClose }: { onClose: () => void }) {
  const [reportType, setReportType] = useState<string>('delay')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [route, setRoute] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium')

  const reportTypes = [
    { value: 'delay', label: 'Delay', icon: '⏰' },
    { value: 'breakdown', label: 'Breakdown', icon: '🚫' },
    { value: 'route_change', label: 'Route Change', icon: '🔄' },
    { value: 'safety', label: 'Safety Issue', icon: '⚠️' },
    { value: 'fare_change', label: 'Fare Change', icon: '💰' },
    { value: 'traffic', label: 'Traffic', icon: '🚗' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Here you would submit to the crowdsourcing service
    console.log('Submitting report:', {
      type: reportType,
      title,
      description,
      location,
      route,
      severity
    })

    // Show success message and close modal
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Create Report</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {reportTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setReportType(type.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      reportType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more details about the situation"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Circle Interchange, Kaneshie Market"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Route (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route (Optional)
              </label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="e.g., Accra-Tema, Circle-Kaneshie"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <div className="flex space-x-2">
                {[
                  { value: 'low', label: 'Low', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                  { value: 'medium', label: 'Medium', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-200' }
                ].map((sev) => (
                  <button
                    key={sev.value}
                    type="button"
                    onClick={() => setSeverity(sev.value as any)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      severity === sev.value
                        ? sev.color
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {sev.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

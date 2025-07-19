'use client'

import { JourneyMap } from '@/components/journey/JourneyMap'
import { JourneyOptions } from '@/components/journey/JourneyOptions'
import { JourneyPlanner } from '@/components/journey/JourneyPlanner'
import { MLInsights } from '@/components/ml/MLInsights'
import { SavedJourneys } from '@/components/journey/SavedJourneys'
import BudgetTracker from '@/components/budget/BudgetTracker'
import CrowdsourcingHub from '@/components/crowdsourcing/CrowdsourcingHub'
import { OfflineStatusBadge } from '@/components/ui/OfflineIndicator'
import { journeyService } from '@/services/journeyService'
import { JourneyOption, JourneyPlan, JourneyRequest, SavedJourney } from '@/types/journey'
import { GeoPoint } from '@/types/transport'
import {
    ArrowPathIcon,
    BookmarkIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    MapIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function JourneyPage() {
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null)
  const [currentPlan, setCurrentPlan] = useState<JourneyPlan | null>(null)
  const [selectedOption, setSelectedOption] = useState<JourneyOption | null>(null)
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([])
  const [viewMode, setViewMode] = useState<'planner' | 'results' | 'map' | 'saved' | 'budget' | 'community'>('planner')
  const [isPlanning, setIsPlanning] = useState(false)
  const [showSavedJourneys, setShowSavedJourneys] = useState(false)

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeoPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          }
          setUserLocation(location)
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to Accra
          setUserLocation({
            latitude: 5.6037,
            longitude: -0.1870,
            timestamp: new Date()
          })
        }
      )
    }
  }, [])

  // Load saved journeys
  useEffect(() => {
    const loadSavedJourneys = async () => {
      try {
        const journeys = await journeyService.getSavedJourneys()
        setSavedJourneys(journeys)
      } catch (error) {
        console.error('Error loading saved journeys:', error)
      }
    }

    loadSavedJourneys()
  }, [])

  const handlePlanJourney = async (request: JourneyRequest) => {
    setIsPlanning(true)
    setViewMode('results')

    try {
      const plan = await journeyService.planJourney(request)
      setCurrentPlan(plan)
      
      if (plan.options?.length > 0) {
        toast.success(`Found ${plan.options.length} route options`)
      } else {
        toast.error('No routes found for your journey')
      }
    } catch (error) {
      console.error('Error planning journey:', error)
      toast.error('Failed to plan journey. Please try again.')
      setViewMode('planner')
    } finally {
      setIsPlanning(false)
    }
  }

  const handleSelectOption = (option: JourneyOption) => {
    setSelectedOption(option)
    setViewMode('map')
    toast.success('Route selected! View on map for details.')
  }

  const handleSavedJourneySelect = async (savedJourney: SavedJourney) => {
    try {
      const request: JourneyRequest = {
        origin: savedJourney.origin.location,
        destination: savedJourney.destination.location,
        departureTime: new Date(),
        preferences: savedJourney.preferences
      }

      await handlePlanJourney(request)
      setShowSavedJourneys(false)
    } catch (error) {
      console.error('Error using saved journey:', error)
      toast.error('Failed to plan saved journey')
    }
  }

  const handleRefreshResults = () => {
    if (currentPlan?.request) {
      handlePlanJourney(currentPlan.request)
    }
  }

  const getPageTitle = () => {
    switch (viewMode) {
      case 'planner': return 'Plan Journey'
      case 'results': return 'Route Options'
      case 'map': return 'Journey Map'
      case 'saved': return 'Saved Journeys'
      case 'budget': return 'Budget Tracker'
      case 'community': return 'Community Reports'
      default: return 'Journey Planning'
    }
  }

  const getPageDescription = () => {
    switch (viewMode) {
      case 'planner': return 'Find the best routes for your trip'
      case 'results': return `${currentPlan?.options?.length || 0} options found`
      case 'map': return 'View your selected route'
      case 'saved': return 'Your frequently used journeys'
      case 'budget': return 'Track your transport spending'
      case 'community': return 'Real-time updates from commuters'
      default: return 'Smart transport planning for Ghana'
    }
  }

  return (
    <div className="min-h-screen-safe bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-mobile border-b border-ui-border safe-area-top"
      >
        <div className="px-mobile py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-responsive-xl font-bold font-display text-aura-primary truncate">
                  {getPageTitle()}
                </h1>
                <OfflineStatusBadge />
              </div>
              <p className="text-responsive-sm text-ui-text-secondary truncate">
                {getPageDescription()}
              </p>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {viewMode === 'results' && (
                <button
                  onClick={handleRefreshResults}
                  className="tap-target p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-95"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setShowSavedJourneys(!showSavedJourneys)}
                className="tap-target p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-95"
              >
                <BookmarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 overflow-x-auto">
            <button
              onClick={() => setViewMode('planner')}
              className={`flex-shrink-0 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg transition-colors ${
                viewMode === 'planner'
                  ? 'bg-white text-aura-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Plan</span>
            </button>

            {currentPlan && (
              <button
                onClick={() => setViewMode('results')}
                className={`flex-shrink-0 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg transition-colors ${
                  viewMode === 'results'
                    ? 'bg-white text-aura-primary shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                <span className="text-xs font-medium">Options</span>
              </button>
            )}

            {selectedOption && (
              <button
                onClick={() => setViewMode('map')}
                className={`flex-shrink-0 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-aura-primary shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span className="text-xs font-medium">Map</span>
              </button>
            )}

            <button
              onClick={() => setViewMode('budget')}
              className={`flex-shrink-0 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg transition-colors ${
                viewMode === 'budget'
                  ? 'bg-white text-aura-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Budget</span>
            </button>

            <button
              onClick={() => setViewMode('community')}
              className={`flex-shrink-0 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg transition-colors ${
                viewMode === 'community'
                  ? 'bg-white text-aura-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Community</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <AnimatePresence mode="wait">
          {viewMode === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <JourneyPlanner
                userLocation={userLocation || undefined}
                onPlanJourney={handlePlanJourney}
              />
            </motion.div>
          )}

          {viewMode === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Quick Stats */}
              {currentPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-4 mb-6 shadow-mobile"
                >
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-aura-primary">
                        {currentPlan.options?.length || 0}
                      </div>
                      <div className="text-xs text-gray-600">Options</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        ₵{currentPlan.options?.length > 0
                          ? Math.min(...currentPlan.options.map(o => o.totalFare)).toFixed(2)
                          : '0.00'
                        }
                      </div>
                      <div className="text-xs text-gray-600">From</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {currentPlan.options?.length > 0
                          ? Math.min(...currentPlan.options.map(o => o.totalDuration))
                          : 0
                        }m
                      </div>
                      <div className="text-xs text-gray-600">Fastest</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ML Insights */}
              {currentPlan && currentPlan.request && (
                <MLInsights
                  origin={{
                    lat: currentPlan.request.from?.lat || currentPlan.request.origin?.latitude || 5.6037,
                    lng: currentPlan.request.from?.lon || currentPlan.request.origin?.longitude || -0.1870,
                    name: currentPlan.request.from?.name || 'Origin'
                  }}
                  destination={{
                    lat: currentPlan.request.to?.lat || currentPlan.request.destination?.latitude || 5.5560,
                    lng: currentPlan.request.to?.lon || currentPlan.request.destination?.longitude || -0.1969,
                    name: currentPlan.request.to?.name || 'Destination'
                  }}
                  departureTime={currentPlan.request.departureTime || new Date()}
                  className="mb-6"
                />
              )}

              <JourneyOptions
                options={currentPlan?.options || []}
                onSelectOption={handleSelectOption}
                isLoading={isPlanning}
              />
            </motion.div>
          )}

          {viewMode === 'map' && selectedOption && (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <JourneyMap
                origin={{
                  lat: 5.6037,
                  lng: -0.1870,
                  name: 'Current Location'
                }}
                destination={{
                  lat: 5.5560,
                  lng: -0.1969,
                  name: 'Destination'
                }}
                onLocationSelect={(location) => {
                  console.log('Location selected:', location)
                }}
              />
            </motion.div>
          )}

          {viewMode === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <BudgetTracker className="mb-6" />
            </motion.div>
          )}

          {viewMode === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CrowdsourcingHub
                className="mb-6"
                userLocation={userLocation || undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Journeys Sidebar */}
        <AnimatePresence>
          {showSavedJourneys && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
              onClick={() => setShowSavedJourneys(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                  <SavedJourneys
                    onJourneySelect={(journey) => {
                      console.log('Journey selected:', journey)
                      toast.success('Journey selected')
                    }}
                    onJourneyDelete={(journeyId) => {
                      console.log('Journey deleted:', journeyId)
                      toast.success('Journey deleted')
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

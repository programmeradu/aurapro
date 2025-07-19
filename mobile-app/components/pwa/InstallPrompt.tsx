'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  DevicePhoneMobileIcon,
  ShareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptProps {
  onInstall?: () => void
  onDismiss?: () => void
}

export function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installStep, setInstallStep] = useState(0)

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isInstalled = isStandaloneMode || isIOSStandalone
      
      setIsStandalone(isStandaloneMode || isIOSStandalone)
      setIsInstalled(isInstalled)
      
      // Check if iOS
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(iOS)
    }

    checkInstallStatus()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay if not dismissed before
      setTimeout(() => {
        const dismissed = localStorage.getItem('install_prompt_dismissed')
        const lastShown = localStorage.getItem('install_prompt_last_shown')
        const now = Date.now()
        
        // Don't show if dismissed recently (7 days)
        if (dismissed && now - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
          return
        }
        
        // Don't show if shown recently (1 day)
        if (lastShown && now - parseInt(lastShown) < 24 * 60 * 60 * 1000) {
          return
        }
        
        setShowPrompt(true)
        localStorage.setItem('install_prompt_last_shown', now.toString())
      }, 30000) // Show after 30 seconds
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      onInstall?.()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [onInstall])

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS installation instructions
      setInstallStep(1)
      return
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice
        
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true)
          setShowPrompt(false)
          onInstall?.()
        }
        
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Error during installation:', error)
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setInstallStep(0)
    localStorage.setItem('install_prompt_dismissed', Date.now().toString())
    onDismiss?.()
  }

  const handleManualInstall = () => {
    setInstallStep(1)
  }

  // Don't show if already installed
  if (isInstalled || isStandalone) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center p-4"
        >
          <motion.div
            initial={{ y: '100%', scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.9 }}
            className="bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden"
          >
            {installStep === 0 ? (
              // Main install prompt
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-aura-primary rounded-xl flex items-center justify-center">
                    <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-ui-text-primary mb-2">
                  Install AURA Commuter
                </h3>
                
                <p className="text-ui-text-secondary mb-6">
                  Get the full app experience! Install AURA on your home screen for:
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">⚡</span>
                    </div>
                    <span className="text-sm text-ui-text-primary">Faster loading and better performance</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📱</span>
                    </div>
                    <span className="text-sm text-ui-text-primary">Works offline when network is poor</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm">🔔</span>
                    </div>
                    <span className="text-sm text-ui-text-primary">Real-time notifications for your routes</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm">🇬🇭</span>
                    </div>
                    <span className="text-sm text-ui-text-primary">Optimized for Ghana's mobile networks</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Maybe Later
                  </button>
                  
                  <button
                    onClick={deferredPrompt ? handleInstallClick : handleManualInstall}
                    className="flex-1 py-3 px-4 bg-aura-primary text-white rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-aura-primary/90 transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Install App</span>
                  </button>
                </div>
              </div>
            ) : (
              // iOS installation instructions
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-ui-text-primary">
                    Install on iPhone
                  </h3>
                  <button
                    onClick={handleDismiss}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-sm text-ui-text-primary">
                        Tap the <strong>Share</strong> button in Safari
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <ShareIcon className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-gray-500">(Bottom of the screen)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm text-ui-text-primary">
                        Scroll down and tap <strong>"Add to Home Screen"</strong>
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <PlusIcon className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-500">Add to Home Screen</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-sm text-ui-text-primary">
                        Tap <strong>"Add"</strong> to install AURA on your home screen
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-sm text-green-700">
                    <strong>🎉 That's it!</strong> AURA will appear on your home screen like a native app.
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  className="w-full mt-4 py-3 px-4 bg-aura-primary text-white rounded-xl font-medium"
                >
                  Got it!
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

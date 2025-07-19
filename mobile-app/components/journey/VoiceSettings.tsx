'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { voiceGuidanceService, VoiceSettings } from '../../services/voiceGuidanceService'

interface VoiceSettingsProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: VoiceSettings) => void
}

export function VoiceSettings({ isOpen, onClose, onSettingsChange }: VoiceSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettings>(voiceGuidanceService.getSettings())
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isTestingVoice, setIsTestingVoice] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAvailableVoices(voiceGuidanceService.getAvailableVoices())
    }
  }, [isOpen])

  const handleSettingChange = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    voiceGuidanceService.updateSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const testVoice = async () => {
    setIsTestingVoice(true)
    try {
      await voiceGuidanceService.testVoice()
    } catch (error) {
      console.error('Voice test failed:', error)
    } finally {
      setIsTestingVoice(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Voice Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Voice Guidance</h3>
              <p className="text-xs text-gray-500">Enable spoken navigation instructions</p>
            </div>
            <button
              onClick={() => handleSettingChange('enabled', !settings.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Language & Accent
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en-GH">Ghana English</option>
                  <option value="en-GB">British English</option>
                  <option value="en-US">American English</option>
                </select>
              </div>

              {/* Speech Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Speech Speed: {settings.rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.rate}
                  onChange={(e) => handleSettingChange('rate', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Volume: {Math.round(settings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Pitch */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Voice Pitch: {settings.pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.pitch}
                  onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>Normal</span>
                  <span>High</span>
                </div>
              </div>

              {/* Local Terms Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Use Ghana Terms</h3>
                  <p className="text-xs text-gray-500">Use local terms like "lorry station" instead of "bus stop"</p>
                </div>
                <button
                  onClick={() => handleSettingChange('useLocalTerms', !settings.useLocalTerms)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.useLocalTerms ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.useLocalTerms ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Distance Announcements */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Announce Distances</h3>
                  <p className="text-xs text-gray-500">Include distance information in instructions</p>
                </div>
                <button
                  onClick={() => handleSettingChange('announceDistance', !settings.announceDistance)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.announceDistance ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.announceDistance ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Traffic Announcements */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Traffic Alerts</h3>
                  <p className="text-xs text-gray-500">Announce traffic conditions and alerts</p>
                </div>
                <button
                  onClick={() => handleSettingChange('announceTraffic', !settings.announceTraffic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.announceTraffic ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.announceTraffic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Test Voice Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={testVoice}
                  disabled={isTestingVoice}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PlayIcon className="h-5 w-5" />
                  <span>{isTestingVoice ? 'Testing Voice...' : 'Test Voice'}</span>
                </button>
              </div>

              {/* Voice Information */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Voice Information</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• Voice guidance works best with headphones or speakers</p>
                  <p>• Ghana English uses local terms and pronunciation</p>
                  <p>• Adjust volume based on your environment</p>
                  <p>• Voice will automatically pause during phone calls</p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

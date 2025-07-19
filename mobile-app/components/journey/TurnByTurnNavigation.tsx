'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUturnLeftIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

interface TurnInstruction {
  id: string
  type: 'turn-left' | 'turn-right' | 'straight' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'u-turn' | 'arrive' | 'depart'
  instruction: string
  distance: number
  duration: number
  coordinates: [number, number]
  street_name?: string
  landmark?: string
  maneuver_type?: string
}

interface TurnByTurnNavigationProps {
  instructions: TurnInstruction[]
  currentInstructionIndex: number
  isNavigating: boolean
  voiceEnabled: boolean
  onToggleVoice: () => void
  onStopNavigation: () => void
  onNextInstruction: () => void
  onPreviousInstruction: () => void
  className?: string
}

// Get icon for turn type
const getTurnIcon = (type: TurnInstruction['type']) => {
  const iconClass = "w-8 h-8"
  
  switch (type) {
    case 'turn-left':
    case 'sharp-left':
      return <ArrowLeftIcon className={iconClass} />
    case 'turn-right':
    case 'sharp-right':
      return <ArrowRightIcon className={iconClass} />
    case 'slight-left':
      return <ArrowLeftIcon className={`${iconClass} transform -rotate-45`} />
    case 'slight-right':
      return <ArrowRightIcon className={`${iconClass} transform rotate-45`} />
    case 'straight':
      return <ArrowUpIcon className={iconClass} />
    case 'u-turn':
      return <ArrowUturnLeftIcon className={iconClass} />
    case 'arrive':
      return <MapPinIcon className={`${iconClass} text-green-600`} />
    case 'depart':
      return <ArrowUpIcon className={`${iconClass} text-blue-600`} />
    default:
      return <ArrowUpIcon className={iconClass} />
  }
}

// Format distance for display
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}

// Format duration for display
const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes}min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }
}

export function TurnByTurnNavigation({
  instructions,
  currentInstructionIndex,
  isNavigating,
  voiceEnabled,
  onToggleVoice,
  onStopNavigation,
  onNextInstruction,
  onPreviousInstruction,
  className = ''
}: TurnByTurnNavigationProps) {
  if (!isNavigating || instructions.length === 0) {
    return null
  }

  const currentInstruction = instructions[currentInstructionIndex]
  const nextInstruction = instructions[currentInstructionIndex + 1]
  const progress = ((currentInstructionIndex + 1) / instructions.length) * 100

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b ${className}`}
    >
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="p-4">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentInstructionIndex + 1} of {instructions.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Voice toggle */}
            <button
              onClick={onToggleVoice}
              className={`p-2 rounded-full ${
                voiceEnabled 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {voiceEnabled ? (
                <SpeakerWaveIcon className="w-5 h-5" />
              ) : (
                <SpeakerXMarkIcon className="w-5 h-5" />
              )}
            </button>

            {/* Stop navigation */}
            <button
              onClick={onStopNavigation}
              className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current instruction */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInstruction.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-4"
          >
            {/* Turn icon */}
            <div className={`p-3 rounded-full ${
              currentInstruction.type === 'arrive' 
                ? 'bg-green-100' 
                : currentInstruction.type === 'depart'
                ? 'bg-blue-100'
                : 'bg-gray-100'
            }`}>
              {getTurnIcon(currentInstruction.type)}
            </div>

            {/* Instruction details */}
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">
                {currentInstruction.instruction}
              </p>
              
              {currentInstruction.street_name && (
                <p className="text-sm text-gray-600">
                  on {currentInstruction.street_name}
                </p>
              )}
              
              {currentInstruction.landmark && (
                <p className="text-sm text-blue-600">
                  📍 {currentInstruction.landmark}
                </p>
              )}

              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-500">
                  {formatDistance(currentInstruction.distance)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDuration(currentInstruction.duration)}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next instruction preview */}
        {nextInstruction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-3 bg-gray-50 rounded-lg"
          >
            <p className="text-sm text-gray-600 mb-1">Next:</p>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 text-gray-400">
                {getTurnIcon(nextInstruction.type)}
              </div>
              <p className="text-sm text-gray-700">
                {nextInstruction.instruction}
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation controls */}
        <div className="flex justify-between mt-4">
          <button
            onClick={onPreviousInstruction}
            disabled={currentInstructionIndex === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            Previous
          </button>
          
          <button
            onClick={onNextInstruction}
            disabled={currentInstructionIndex === instructions.length - 1}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </div>
    </motion.div>
  )
}

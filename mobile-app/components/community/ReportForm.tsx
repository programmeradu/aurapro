'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CameraIcon,
  MicrophoneIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  EyeSlashIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ReportSubmission, ReportType, ReportCategory } from '@/types/community'
import { GeoPoint } from '@/types/transport'
import { communityService } from '@/services/communityService'
import toast from 'react-hot-toast'

interface ReportFormProps {
  userLocation?: GeoPoint
  onSubmitSuccess?: (report: any) => void
  onCancel?: () => void
  initialType?: ReportType
  initialVehicleId?: string
  initialRouteId?: string
}

export function ReportForm({
  userLocation,
  onSubmitSuccess,
  onCancel,
  initialType,
  initialVehicleId,
  initialRouteId
}: ReportFormProps) {
  const [formData, setFormData] = useState<Partial<ReportSubmission>>({
    type: initialType || 'service_issue',
    category: 'other',
    title: '',
    description: '',
    severity: 'medium',
    location: userLocation || { latitude: 5.6037, longitude: -0.1870, timestamp: new Date() },
    isAnonymous: false,
    vehicleId: initialVehicleId,
    routeId: initialRouteId,
    language: 'en'
  })
  
  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const reportTypes: { value: ReportType; label: string; icon: string; color: string }[] = [
    { value: 'service_issue', label: 'Service Issue', icon: '🚌', color: 'bg-yellow-500' },
    { value: 'safety_concern', label: 'Safety Concern', icon: '⚠️', color: 'bg-red-500' },
    { value: 'fare_dispute', label: 'Fare Dispute', icon: '💰', color: 'bg-orange-500' },
    { value: 'vehicle_condition', label: 'Vehicle Condition', icon: '🔧', color: 'bg-blue-500' },
    { value: 'driver_behavior', label: 'Driver Behavior', icon: '👨‍✈️', color: 'bg-purple-500' },
    { value: 'positive_feedback', label: 'Positive Feedback', icon: '👍', color: 'bg-green-500' },
    { value: 'suggestion', label: 'Suggestion', icon: '💡', color: 'bg-indigo-500' },
    { value: 'emergency', label: 'Emergency', icon: '🚨', color: 'bg-red-600' },
  ]

  const categories: { value: ReportCategory; label: string }[] = [
    { value: 'delay', label: 'Delay' },
    { value: 'breakdown', label: 'Breakdown' },
    { value: 'overcrowding', label: 'Overcrowding' },
    { value: 'safety', label: 'Safety Issue' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'overcharging', label: 'Overcharging' },
    { value: 'rude_behavior', label: 'Rude Behavior' },
    { value: 'poor_driving', label: 'Poor Driving' },
    { value: 'vehicle_condition', label: 'Vehicle Condition' },
    { value: 'positive', label: 'Positive Experience' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'other', label: 'Other' },
  ]

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setPhotos(prev => [...prev, ...files].slice(0, 5)) // Max 5 photos
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting audio recording:', error)
      toast.error('Could not start audio recording')
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const submission: ReportSubmission = {
        type: formData.type!,
        category: formData.category!,
        title: formData.title,
        description: formData.description,
        location: formData.location!,
        severity: formData.severity!,
        photos,
        audioNotes: audioBlob ? [audioBlob] : undefined,
        isAnonymous: formData.isAnonymous!,
        stopId: formData.stopId,
        routeId: formData.routeId,
        vehicleId: formData.vehicleId,
        language: formData.language
      }

      const report = await communityService.submitReport(submission)
      
      toast.success('Report submitted successfully!')
      onSubmitSuccess?.(report)
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">What type of report is this?</h3>
        <div className="grid grid-cols-2 gap-3">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.type === type.value
                  ? 'border-aura-primary bg-aura-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="text-sm font-medium">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ReportCategory }))}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-aura-primary"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'low', label: 'Low', color: 'bg-green-500' },
            { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
            { value: 'high', label: 'High', color: 'bg-orange-500' },
            { value: 'critical', label: 'Critical', color: 'bg-red-500' },
          ].map((severity) => (
            <button
              key={severity.value}
              onClick={() => setFormData(prev => ({ ...prev, severity: severity.value as any }))}
              className={`p-3 rounded-xl text-white text-sm font-medium ${severity.color} ${
                formData.severity === severity.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
              }`}
            >
              {severity.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Brief summary of the issue"
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-aura-primary"
          maxLength={100}
        />
        <div className="text-xs text-gray-500 mt-1">
          {formData.title?.length || 0}/100 characters
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Provide detailed information about what happened..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-aura-primary focus:border-aura-primary resize-none"
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1">
          {formData.description?.length || 0}/500 characters
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Photos (Optional)</label>
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
          >
            <CameraIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">Take or upload photos</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audio Recording */}
      <div>
        <label className="block text-sm font-medium mb-2">Voice Note (Optional)</label>
        <div className="flex items-center space-x-3">
          <button
            onClick={isRecording ? stopAudioRecording : startAudioRecording}
            className={`flex-1 p-3 rounded-xl flex items-center justify-center space-x-2 ${
              isRecording 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MicrophoneIcon className="w-5 h-5" />
            <span>{isRecording ? 'Stop Recording' : 'Record Voice Note'}</span>
          </button>
          
          {audioBlob && (
            <button
              onClick={() => setAudioBlob(null)}
              className="p-3 bg-red-100 text-red-600 rounded-xl"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {audioBlob && (
          <div className="mt-2 p-2 bg-green-100 rounded-lg text-sm text-green-700">
            ✓ Voice note recorded
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
            className="w-4 h-4 text-aura-primary border-gray-300 rounded focus:ring-aura-primary"
          />
          <div className="flex items-center space-x-2">
            <EyeSlashIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium">Submit anonymously</span>
          </div>
        </label>
        <p className="text-xs text-gray-500 mt-2 ml-7">
          Your identity will be hidden from other users, but may be visible to moderators
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl">
        <h4 className="font-medium text-blue-800 mb-2">Report Summary</h4>
        <div className="space-y-2 text-sm text-blue-700">
          <div><strong>Type:</strong> {reportTypes.find(t => t.value === formData.type)?.label}</div>
          <div><strong>Category:</strong> {categories.find(c => c.value === formData.category)?.label}</div>
          <div><strong>Severity:</strong> {formData.severity}</div>
          <div><strong>Title:</strong> {formData.title}</div>
          {photos.length > 0 && <div><strong>Photos:</strong> {photos.length} attached</div>}
          {audioBlob && <div><strong>Voice note:</strong> Attached</div>}
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-xl">
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Community Guidelines</p>
            <ul className="space-y-1 text-xs">
              <li>• Be respectful and constructive in your reports</li>
              <li>• Provide accurate and truthful information</li>
              <li>• Do not include personal attacks or offensive language</li>
              <li>• Emergency situations should be reported to authorities first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-mobile border border-ui-border p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-ui-text-primary">Submit Report</h2>
          <p className="text-sm text-ui-text-secondary">
            Step {currentStep} of 3
          </p>
        </div>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full ${
                step <= currentStep ? 'bg-aura-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex space-x-3 mt-8">
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        
        {currentStep < 3 ? (
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={currentStep === 1 && !formData.type}
            className="flex-1 py-3 px-4 bg-aura-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title || !formData.description}
            className="flex-1 py-3 px-4 bg-aura-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Report</span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

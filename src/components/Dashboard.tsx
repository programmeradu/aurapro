'use client'

import React from 'react'
import ModernDashboard from './ModernDashboard'

interface DashboardProps {
  className?: string
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  return <ModernDashboard className={className} />
}

export default Dashboard

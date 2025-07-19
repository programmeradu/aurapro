/**
 * 🎮 Gamification Service
 * User profiles, reputation, badges, leaderboards, and achievements
 */

export interface UserProfile {
  id: string
  username: string
  displayName: string
  avatar?: string
  joinDate: Date
  location?: string
  bio?: string
  stats: UserStats
  reputation: UserReputation
  badges: Badge[]
  achievements: Achievement[]
  preferences: GamificationPreferences
}

export interface UserStats {
  reportsSubmitted: number
  reportsVerified: number
  helpfulVotes: number
  journeysShared: number
  daysActive: number
  totalContributions: number
  accuracyRate: number
  responseTime: number
  streakDays: number
  level: number
}

export interface UserReputation {
  score: number
  level: ReputationLevel
  nextLevelProgress: number
  recentChanges: ReputationChange[]
  weeklyChange: number
  monthlyChange: number
}

export interface ReputationLevel {
  name: string
  minScore: number
  maxScore: number
  color: string
  icon: string
  privileges: string[]
  perks: string[]
}

export interface ReputationChange {
  amount: number
  reason: string
  timestamp: Date
  relatedContent?: string
  category: 'report' | 'verification' | 'social' | 'bonus'
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  category: 'reporting' | 'verification' | 'social' | 'journey' | 'special' | 'seasonal'
  earnedDate?: Date
  progress?: BadgeProgress
  requirements: BadgeRequirement[]
}

export interface BadgeProgress {
  current: number
  target: number
  description: string
  percentage: number
}

export interface BadgeRequirement {
  type: string
  value: number
  description: string
  completed: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedDate: Date
  shareText: string
  category: string
  rarity: string
  points: number
}

export interface Leaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  category: 'reports' | 'verifications' | 'reputation' | 'accuracy' | 'streak'
  entries: LeaderboardEntry[]
  userRank?: number
  totalParticipants: number
  lastUpdated: Date
}

export interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    username: string
    displayName: string
    avatar?: string
    level: ReputationLevel
  }
  score: number
  change: number
  trend: 'up' | 'down' | 'same'
}

export interface GamificationPreferences {
  showPublicProfile: boolean
  showLeaderboardRank: boolean
  enableNotifications: boolean
  shareAchievements: boolean
  competitiveMode: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'individual' | 'community' | 'competitive'
  startDate: Date
  endDate: Date
  participants: number
  maxParticipants?: number
  rewards: ChallengeReward[]
  progress: ChallengeProgress
  rules: string[]
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  status: 'upcoming' | 'active' | 'completed'
}

export interface ChallengeReward {
  rank: number
  badge?: Badge
  reputationBonus: number
  specialPrivileges?: string[]
  title?: string
}

export interface ChallengeProgress {
  userRank?: number
  userScore: number
  topPerformers: LeaderboardEntry[]
  timeRemaining: number
  isParticipating: boolean
  personalBest?: number
}

class GamificationService {
  private apiUrl: string
  private cache: Map<string, any> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  /**
   * 👤 Get user profile with gamification data
   */
  async getUserProfile(userId?: string): Promise<UserProfile> {
    const targetUserId = userId || 'current_user'
    const cacheKey = `user_profile_${targetUserId}`
    
    try {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await fetch(`${this.apiUrl}/api/v1/gamification/profile/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch profile')
      
      const profile = await response.json()
      this.setCache(cacheKey, profile)
      return profile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return this.getMockUserProfile()
    }
  }

  /**
   * 🏆 Get leaderboards
   */
  async getLeaderboard(category: string = 'reputation', period: string = 'weekly'): Promise<Leaderboard> {
    const cacheKey = `leaderboard_${category}_${period}`
    
    try {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await fetch(
        `${this.apiUrl}/api/v1/gamification/leaderboard?category=${category}&period=${period}`,
        { headers: { 'Authorization': `Bearer ${this.getAuthToken()}` } }
      )
      
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      
      const leaderboard = await response.json()
      this.setCache(cacheKey, leaderboard)
      return leaderboard
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      return this.getMockLeaderboard(category as any, period as any)
    }
  }

  /**
   * 🎖️ Get available and earned badges
   */
  async getBadges(userId?: string): Promise<{ available: Badge[]; earned: Badge[] }> {
    const targetUserId = userId || 'current_user'
    
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gamification/badges/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch badges')
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching badges:', error)
      return {
        available: this.getMockAvailableBadges(),
        earned: this.getMockEarnedBadges()
      }
    }
  }

  /**
   * 🎯 Get active challenges
   */
  async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gamification/challenges/active`, {
        headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch challenges')
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching challenges:', error)
      return this.getMockChallenges()
    }
  }

  /**
   * ⭐ Award reputation points
   */
  async awardReputation(action: string, context: any): Promise<{ points: number; newLevel?: ReputationLevel }> {
    const points = this.calculateReputationPoints(action, context)
    
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gamification/reputation/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ action, points, context })
      })
      
      if (!response.ok) throw new Error('Failed to award reputation')
      
      const result = await response.json()
      
      // Clear profile cache
      this.clearCachePattern('user_profile')
      
      return result
    } catch (error) {
      console.error('Error awarding reputation:', error)
      return { points }
    }
  }

  /**
   * 🏅 Check and award badges
   */
  async checkBadgeEligibility(userId?: string): Promise<Badge[]> {
    const targetUserId = userId || 'current_user'
    
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gamification/badges/check/${targetUserId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
      })
      
      if (!response.ok) throw new Error('Failed to check badge eligibility')
      
      const newBadges = await response.json()
      
      if (newBadges.length > 0) {
        this.clearCachePattern('user_profile')
        this.clearCachePattern('badges')
      }
      
      return newBadges
    } catch (error) {
      console.error('Error checking badge eligibility:', error)
      return []
    }
  }

  /**
   * 🎮 Calculate gamification rewards for actions
   */
  calculateRewards(action: string, context: any): { reputation: number; badges: string[]; achievements: string[] } {
    const rewards = { reputation: 0, badges: [] as string[], achievements: [] as string[] }

    switch (action) {
      case 'report_submitted':
        rewards.reputation = 5
        if (context.isFirstReport) rewards.badges.push('first_reporter')
        if (context.totalReports === 10) rewards.badges.push('active_reporter')
        break
        
      case 'report_verified':
        rewards.reputation = 10
        if (context.verificationCount >= 10) rewards.badges.push('trusted_verifier')
        if (context.accuracyRate >= 95) rewards.badges.push('accuracy_expert')
        break
        
      case 'helpful_vote':
        rewards.reputation = 2
        if (context.totalVotes >= 50) rewards.badges.push('community_helper')
        break
        
      case 'streak_maintained':
        rewards.reputation = context.streakDays * 2
        if (context.streakDays >= 7) rewards.badges.push('weekly_warrior')
        if (context.streakDays >= 30) rewards.badges.push('monthly_champion')
        break
        
      case 'challenge_completed':
        rewards.reputation = context.challengePoints || 25
        rewards.achievements.push(`challenge_${context.challengeId}`)
        break
    }

    return rewards
  }

  /**
   * 📊 Get user achievements
   */
  async getUserAchievements(userId?: string): Promise<Achievement[]> {
    const targetUserId = userId || 'current_user'
    
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/gamification/achievements/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch achievements')
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching achievements:', error)
      return this.getMockAchievements()
    }
  }

  // Private helper methods
  private calculateReputationPoints(action: string, context: any): number {
    const basePoints: Record<string, number> = {
      'report_submitted': 5,
      'report_verified': 10,
      'helpful_vote': 2,
      'accurate_report': 15,
      'community_helper': 8,
      'streak_bonus': 5,
      'challenge_win': 50
    }

    let points = basePoints[action] || 0

    // Apply multipliers based on context
    if (context.isHighQuality) points *= 1.5
    if (context.isUrgent) points *= 1.2
    if (context.streakMultiplier) points *= context.streakMultiplier

    return Math.round(points)
  }

  private getMockUserProfile(): UserProfile {
    return {
      id: 'user_123',
      username: 'kwame_commuter',
      displayName: 'Kwame A.',
      avatar: '👨🏿‍💼',
      joinDate: new Date('2024-01-15'),
      location: 'Accra, Ghana',
      bio: 'Daily commuter helping improve transport for everyone',
      stats: {
        reportsSubmitted: 23,
        reportsVerified: 45,
        helpfulVotes: 67,
        journeysShared: 12,
        daysActive: 89,
        totalContributions: 147,
        accuracyRate: 92.5,
        responseTime: 15,
        streakDays: 7,
        level: 3
      },
      reputation: {
        score: 1250,
        level: {
          name: 'Trusted Contributor',
          minScore: 1000,
          maxScore: 2000,
          color: '#3B82F6',
          icon: '⭐',
          privileges: ['Verify reports', 'Edit community content'],
          perks: ['Priority support', 'Beta features access']
        },
        nextLevelProgress: 25,
        recentChanges: [
          {
            amount: 15,
            reason: 'Accurate traffic report verified',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            relatedContent: 'Traffic report #456',
            category: 'verification'
          }
        ],
        weeklyChange: 45,
        monthlyChange: 180
      },
      badges: this.getMockEarnedBadges(),
      achievements: this.getMockAchievements(),
      preferences: {
        showPublicProfile: true,
        showLeaderboardRank: true,
        enableNotifications: true,
        shareAchievements: true,
        competitiveMode: false
      }
    }
  }

  private getMockEarnedBadges(): Badge[] {
    return [
      {
        id: 'first_reporter',
        name: 'First Reporter',
        description: 'Submitted your first transport report',
        icon: '🎯',
        rarity: 'common',
        category: 'reporting',
        earnedDate: new Date('2024-01-16'),
        requirements: [
          { type: 'reports_submitted', value: 1, description: 'Submit 1 report', completed: true }
        ]
      }
    ]
  }

  private getMockAvailableBadges(): Badge[] {
    return [
      {
        id: 'accuracy_expert',
        name: 'Accuracy Expert',
        description: 'Maintain 90%+ accuracy for 30 days',
        icon: '🎯',
        rarity: 'rare',
        category: 'reporting',
        progress: {
          current: 25,
          target: 30,
          description: 'Days with 90%+ accuracy',
          percentage: 83.3
        },
        requirements: [
          { type: 'accuracy_days', value: 30, description: 'Maintain 90%+ accuracy for 30 days', completed: false }
        ]
      }
    ]
  }

  private getMockLeaderboard(category: any, period: any): Leaderboard {
    return {
      period,
      category,
      entries: [
        {
          rank: 1,
          user: {
            id: 'user_456',
            username: 'ama_transport',
            displayName: 'Ama S.',
            avatar: '👩🏿‍💼',
            level: {
              name: 'Transport Expert',
              minScore: 2000,
              maxScore: 5000,
              color: '#10B981',
              icon: '🏆',
              privileges: [],
              perks: []
            }
          },
          score: 2450,
          change: 2,
          trend: 'up'
        }
      ],
      userRank: 2,
      totalParticipants: 156,
      lastUpdated: new Date()
    }
  }

  private getMockChallenges(): Challenge[] {
    return [
      {
        id: 'weekly_reporter',
        title: 'Weekly Reporter Challenge',
        description: 'Submit 5 verified reports this week',
        type: 'individual',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        participants: 89,
        rewards: [
          {
            rank: 1,
            reputationBonus: 100,
            title: 'Weekly Champion'
          }
        ],
        progress: {
          userRank: 12,
          userScore: 3,
          topPerformers: [],
          timeRemaining: 5 * 24 * 60 * 60 * 1000,
          isParticipating: true,
          personalBest: 4
        },
        rules: [
          'Reports must be verified by community',
          'Only original reports count',
          'Accuracy must be above 80%'
        ],
        difficulty: 'medium',
        status: 'active'
      }
    ]
  }

  private getMockAchievements(): Achievement[] {
    return [
      {
        id: 'level_up_trusted',
        title: 'Reached Trusted Contributor',
        description: 'You\'ve earned the trust of the community!',
        icon: '⭐',
        unlockedDate: new Date('2024-02-15'),
        shareText: 'I just became a Trusted Contributor on AURA! 🎉',
        category: 'progression',
        rarity: 'uncommon',
        points: 100
      }
    ]
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private clearCachePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || ''
  }
}

// Export singleton instance
export const gamificationService = new GamificationService()
export default gamificationService

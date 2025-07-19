// Comprehensive security configuration for AURA Command Center
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cors from 'cors'

// Rate limiting configuration
export const rateLimitConfig = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health'
    }
  }),

  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
      error: 'Too many login attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    skipSuccessfulRequests: true
  }),

  // WebSocket connection rate limiting
  websocket: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 WebSocket connections per minute
    message: {
      error: 'Too many WebSocket connection attempts.',
      code: 'WS_RATE_LIMIT_EXCEEDED'
    }
  })
}

// Helmet security configuration
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for Next.js
        "'unsafe-inline'", // Required for inline scripts
        "https://api.mapbox.com",
        "https://www.googletagmanager.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        "https://api.mapbox.com",
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://api.mapbox.com",
        "https://tiles.mapbox.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "wss://ws.aura-transport.gov.gh",
        "https://api.aura-transport.gov.gh"
      ],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: ['self'],
    payment: []
  }
})

// CORS configuration
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    const allowedOrigins = [
      'https://aura-transport.gov.gh',
      'https://staging.aura-transport.gov.gh',
      'http://localhost:3000',
      'http://localhost:3001'
    ]

    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001')
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ]
})

// Input validation schemas
export const validationSchemas = {
  // Vehicle data validation
  vehicle: {
    id: {
      type: 'string',
      pattern: '^[A-Z]{2}-[0-9]{4}-[0-9]{2}$',
      required: true
    },
    location: {
      type: 'object',
      properties: {
        lat: { type: 'number', minimum: -90, maximum: 90 },
        lng: { type: 'number', minimum: -180, maximum: 180 }
      },
      required: ['lat', 'lng']
    },
    speed: {
      type: 'number',
      minimum: 0,
      maximum: 200
    }
  },

  // User authentication validation
  auth: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
      required: true
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
      required: true
    }
  }
}

// Security middleware configuration
export const securityMiddleware = {
  // Request sanitization
  sanitizeInput: (req: any, res: any, next: any) => {
    // Remove potentially dangerous characters
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                 .replace(/javascript:/gi, '')
                 .replace(/on\w+\s*=/gi, '')
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          obj[key] = sanitize(obj[key])
        }
      }
      return obj
    }

    if (req.body) req.body = sanitize(req.body)
    if (req.query) req.query = sanitize(req.query)
    if (req.params) req.params = sanitize(req.params)

    next()
  },

  // API key validation
  validateApiKey: (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key']
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_MISSING'
      })
    }

    // Validate API key format and existence
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'API_KEY_INVALID'
      })
    }

    next()
  },

  // Request logging for security monitoring
  securityLogger: (req: any, res: any, next: any) => {
    const startTime = Date.now()
    
    res.on('finish', () => {
      const duration = Date.now() - startTime
      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('Content-Length') || 0
      }

      // Log suspicious activity
      if (res.statusCode >= 400 || duration > 5000) {
        console.warn('Security Alert:', logData)
      }

      // Log all requests in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Request:', logData)
      }
    })

    next()
  }
}

// Security headers for API responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
}

// Encryption utilities
export const encryption = {
  // Hash passwords
  hashPassword: async (password: string): Promise<string> => {
    const bcrypt = require('bcrypt')
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
    return await bcrypt.hash(password, saltRounds)
  },

  // Verify passwords
  verifyPassword: async (password: string, hash: string): Promise<boolean> => {
    const bcrypt = require('bcrypt')
    return await bcrypt.compare(password, hash)
  },

  // Generate secure tokens
  generateSecureToken: (): string => {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  }
}

// Export all security configurations
export default {
  rateLimitConfig,
  helmetConfig,
  corsConfig,
  validationSchemas,
  securityMiddleware,
  securityHeaders,
  encryption
}

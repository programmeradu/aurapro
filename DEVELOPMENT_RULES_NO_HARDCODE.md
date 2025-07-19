# 🚫 NO HARDCODE DEVELOPMENT RULES

## 📋 **MANDATORY RULES FOR ALL DEVELOPMENT**

### ❌ **ABSOLUTELY FORBIDDEN**
1. **No Hardcoded Data**: Never include static/fake data in components
2. **No Mock Values**: No placeholder numbers, names, or content
3. **No Dummy Content**: No "Lorem ipsum" or example text
4. **No Fake APIs**: All API calls must connect to real endpoints
5. **No Static Lists**: No hardcoded arrays of data

### ✅ **REQUIRED PRACTICES**

#### **1. Data Fetching**
```typescript
// ❌ WRONG - Hardcoded data
const users = [
  { name: "John Doe", email: "john@example.com" },
  { name: "Jane Smith", email: "jane@example.com" }
]

// ✅ CORRECT - Real API integration
const [users, setUsers] = useState([])
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers)
}, [])
```

#### **2. Loading States**
```typescript
// ✅ Always show loading states while fetching real data
if (loading) {
  return <LoadingSkeleton />
}

// ✅ Handle empty states gracefully
if (data.length === 0) {
  return <EmptyState message="No data available" />
}
```

#### **3. Error Handling**
```typescript
// ✅ Always handle API failures
try {
  const response = await fetch('/api/data')
  if (!response.ok) throw new Error('Failed to fetch')
  const data = await response.json()
  setData(data)
} catch (error) {
  console.error('API Error:', error)
  setError('Failed to load data')
}
```

#### **4. API Integration Requirements**
- All endpoints must return real data from databases
- Use proper authentication and authorization
- Implement proper error responses
- Include data validation
- Use TypeScript interfaces for type safety

## 🏗️ **COMPONENT ARCHITECTURE**

### **Data-Driven Components**
```typescript
// ✅ CORRECT Pattern
interface ComponentProps {
  userId?: string
  filters?: FilterOptions
  onDataChange?: (data: any) => void
}

export function DataComponent({ userId, filters }: ComponentProps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRealData(userId, filters)
  }, [userId, filters])

  const fetchRealData = async (userId, filters) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/data?userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify(filters)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Render based on real data state
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return <EmptyState />
  
  return <RealDataDisplay data={data} />
}
```

## 🔌 **API DEVELOPMENT RULES**

### **Real Data Sources Only**
```typescript
// ✅ CORRECT - Connect to real databases/services
export async function GET(request: NextRequest) {
  try {
    // Connect to your actual database
    const data = await database.query('SELECT * FROM real_table')
    
    // Or integrate with external APIs
    const externalData = await fetch('https://real-api.com/data')
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Real error message' },
      { status: 500 }
    )
  }
}
```

### **Database Integration Requirements**
- Use proper ORM/database connections
- Implement proper SQL queries or NoSQL operations
- Include data validation and sanitization
- Use environment variables for connection strings
- Implement proper indexing for performance

## 📊 **DATA VALIDATION**

### **Input Validation**
```typescript
// ✅ Validate all inputs
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = UserSchema.parse(body)
    
    // Process validated data
    const result = await processRealData(validatedData)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 400 }
    )
  }
}
```

## 🧪 **TESTING REQUIREMENTS**

### **Integration Tests**
```typescript
// ✅ Test with real API endpoints
describe('User API', () => {
  test('should fetch real user data', async () => {
    const response = await fetch('/api/users/123')
    const data = await response.json()
    
    expect(response.ok).toBe(true)
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe('123')
  })
})
```

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment Verification**
- [ ] All API endpoints return real data
- [ ] No hardcoded values in any component
- [ ] All database connections are configured
- [ ] Environment variables are set
- [ ] Error handling is implemented
- [ ] Loading states are present
- [ ] Empty states are handled
- [ ] Data validation is in place
- [ ] Authentication is working
- [ ] Performance is optimized

## 🔍 **CODE REVIEW CHECKLIST**

### **Reviewer Must Check**
- [ ] No hardcoded arrays or objects
- [ ] All data comes from API calls
- [ ] Proper error handling exists
- [ ] Loading states are implemented
- [ ] TypeScript types are defined
- [ ] API endpoints are documented
- [ ] Database queries are optimized
- [ ] Security measures are in place

## ⚠️ **REJECTION CRITERIA**

### **Code Will Be Rejected If:**
1. Contains any hardcoded data
2. Uses mock/dummy values
3. Missing error handling
4. No loading states
5. Fake API responses
6. Static content that should be dynamic
7. No data validation
8. Missing TypeScript types

## 📈 **PERFORMANCE REQUIREMENTS**

### **Optimization Standards**
- API responses < 500ms
- Database queries optimized
- Proper caching implemented
- Lazy loading for large datasets
- Pagination for lists
- Image optimization
- Bundle size optimization

## 🔐 **SECURITY REQUIREMENTS**

### **Mandatory Security Measures**
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting
- Authentication verification
- Authorization checks
- Data encryption

---

## 📝 **IMPLEMENTATION GUIDE**

### **Step 1: Plan Data Sources**
1. Identify all data requirements
2. Design database schema
3. Plan API endpoints
4. Define data relationships

### **Step 2: Implement APIs**
1. Create database models
2. Build API endpoints
3. Add validation
4. Implement error handling

### **Step 3: Build Components**
1. Create data-fetching hooks
2. Implement loading states
3. Add error boundaries
4. Build empty states

### **Step 4: Test Integration**
1. Test API endpoints
2. Verify data flow
3. Check error scenarios
4. Validate performance

### **Step 5: Deploy & Monitor**
1. Configure production database
2. Set environment variables
3. Monitor API performance
4. Track error rates

---

**Remember: Real applications use real data. No exceptions.**
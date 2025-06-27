# Open Deep Research - Codebase Architecture Documentation

## 🏗️ Overview

Open Deep Research is a Next.js application that replicates OpenAI's Deep Research experiment using Firecrawl for web search and data extraction instead of a fine-tuned o3 model. The application provides an AI-powered research assistant with real-time web search capabilities.

## 📁 Project Structure

```
open-deep-research/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (chat)/                   # Chat-related routes
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
├── lib/                          # Utility libraries
│   ├── ai/                       # AI model configuration
│   ├── db/                       # Database schema and queries
│   └── utils.ts                  # Utility functions
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
└── Configuration files
```

## 🔧 Core Technologies

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5
- **AI Integration**: Vercel AI SDK with multiple providers
- **Web Scraping**: Firecrawl API
- **State Management**: React Context + useReducer
- **Real-time**: Server-Sent Events (SSE)

## 🎯 Application Flow

### 1. Authentication System

**Files**: `app/(auth)/auth.ts`, `app/(auth)/auth.config.ts`, `middleware.ts`

- **Anonymous Access**: Users can access the app without registration
- **Credential-based Auth**: Email/password authentication with bcrypt
- **Session Management**: NextAuth.js handles session persistence
- **Middleware Protection**: Routes are protected via middleware

**Flow**:
1. User visits app → Middleware checks authentication
2. If no session → Creates anonymous user automatically
3. If authenticated → Proceeds to chat interface
4. Session persists across requests

### 2. Database Architecture

**Files**: `lib/db/schema.ts`, `lib/db/queries.ts`, `drizzle.config.ts`

**Tables**:
- `User`: User accounts (id, email, password)
- `Chat`: Chat sessions (id, title, userId, visibility, createdAt)
- `Message`: Individual messages (id, chatId, role, content, createdAt)
- `Document`: Generated documents (id, title, content, kind, userId)
- `Suggestion`: Document suggestions (id, documentId, originalText, suggestedText)
- `Vote`: Message voting system (chatId, messageId, isUpvoted)

**Relationships**:
- User → Chat (1:many)
- Chat → Message (1:many)
- User → Document (1:many)
- Document → Suggestion (1:many)

### 3. AI Model System

**Files**: `lib/ai/index.ts`, `lib/ai/models.ts`, `lib/ai/prompts.ts`

**Model Types**:
- **Chat Models**: GPT-4o, GPT-4o-mini for general conversation
- **Reasoning Models**: o1, o1-mini, o3-mini, DeepSeek-R1 for research analysis

**Provider Support**:
- OpenAI (primary)
- OpenRouter (alternative)
- TogetherAI (for DeepSeek models)

**Model Selection Logic**:
```typescript
// For general chat: Uses user-selected model
// For reasoning tasks: Automatically switches to reasoning model
const model = forReasoning ? getReasoningModel(apiIdentifier) : apiIdentifier;
```

### 4. Chat Interface Architecture

**Files**: `components/chat.tsx`, `components/multimodal-input.tsx`, `components/messages.tsx`

**Key Components**:
- **Chat**: Main chat container with message history
- **MultimodalInput**: Input field with file upload and search mode toggle
- **Messages**: Message list with streaming support
- **ChatHeader**: Model selection and chat settings

**Search Modes**:
- **Search Mode**: Basic web search with Firecrawl
- **Deep Research Mode**: Advanced multi-step research process

### 5. Deep Research System

**Files**: `app/(chat)/api/chat/route.ts` (deepResearch tool), `lib/deep-research-context.tsx`, `components/deep-research.tsx`

**Research Process**:
1. **Initialization**: Set up research parameters (maxDepth=7, timeLimit=4.5min)
2. **Search Phase**: Query web using Firecrawl search API
3. **Extract Phase**: Extract structured data from top 3 URLs
4. **Analysis Phase**: Use reasoning model to analyze findings
5. **Planning Phase**: Determine next research steps or completion
6. **Synthesis Phase**: Generate comprehensive final analysis

**State Management**:
```typescript
interface DeepResearchState {
  isActive: boolean;
  activity: ActivityItem[];      // Research steps
  sources: SourceItem[];         // Found sources
  currentDepth: number;          // Current research depth
  maxDepth: number;              // Maximum depth (7)
  completedSteps: number;        // Progress tracking
  totalExpectedSteps: number;    // Total expected steps
}
```

### 6. Firecrawl Integration

**Tools Available**:
- **search**: Web search with query and maxResults
- **extract**: Structured data extraction from URLs with custom prompts
- **scrape**: Simple page content scraping

**Usage Pattern**:
```typescript
// Search for information
const searchResult = await app.search(query);

// Extract specific data
const extractResult = await app.extract(urls, { prompt: "Extract key information about..." });

// Simple scraping
const scrapeResult = await app.scrapeUrl(url);
```

### 7. Real-time Data Streaming

**Files**: `components/data-stream-handler.tsx`, `app/(chat)/api/chat/route.ts`

**Stream Types**:
- `text-delta`: Incremental text updates
- `activity-delta`: Research activity updates
- `source-delta`: New source discoveries
- `progress-init`: Initialize progress tracking
- `depth-delta`: Research depth updates
- `finish`: Completion signal

**Implementation**:
```typescript
// Server-side streaming
dataStream.writeData({
  type: 'activity-delta',
  content: { type: 'search', status: 'pending', message: 'Searching...', timestamp: new Date().toISOString() }
});

// Client-side handling
useEffect(() => {
  dataStream.forEach(delta => {
    switch(delta.type) {
      case 'activity-delta': addActivity(delta.content); break;
      case 'source-delta': addSource(delta.content); break;
    }
  });
}, [dataStream]);
```

### 8. Document Management System

**Files**: `components/block.tsx`, `components/document.tsx`, `hooks/use-block.ts`

**Document Types**:
- **Text**: Markdown documents
- **Code**: Python code snippets with execution
- **Spreadsheet**: CSV data with editing capabilities

**Block System**:
- Documents appear in a sidebar "block" during creation
- Real-time updates during AI generation
- User can edit, save, and manage documents
- Version control with suggestions system

## 🔄 Request Flow Example

### Standard Chat Message:
1. User types message → `MultimodalInput`
2. Form submission → `handleSubmit` in `useChat`
3. POST to `/api/chat` → `route.ts`
4. AI model processes with tools → `streamText`
5. Response streams back → `DataStreamHandler`
6. UI updates in real-time → `Messages` component

### Deep Research Flow:
1. User enables deep research mode → `setSearchMode('deep-research')`
2. User submits query → triggers `deepResearch` tool
3. Research loop begins:
   - Search web → Firecrawl API
   - Extract data → Firecrawl extract
   - Analyze findings → Reasoning model
   - Plan next steps → Continue or finish
4. Progress streams to UI → `DeepResearch` component
5. Final synthesis → Comprehensive analysis

## 🛡️ Security & Rate Limiting

**Files**: `lib/rate-limit.ts`, `middleware.ts`

- **Rate Limiting**: Upstash Redis-based rate limiting
- **Authentication**: Secure session management
- **Input Validation**: Zod schemas for API inputs
- **CORS**: Configured for secure cross-origin requests

## 🚀 Deployment Configuration

**Files**: `next.config.ts`, `Dockerfile`, `docker-compose.yml`

- **Vercel Deployment**: Optimized for Vercel platform
- **Docker Support**: Container deployment option
- **Environment Variables**: Comprehensive .env configuration
- **Database Migrations**: Drizzle-based migration system

## 🔧 Development Workflow

**Scripts** (from `package.json`):
- `pnpm dev`: Development server with Turbo
- `pnpm db:migrate`: Run database migrations
- `pnpm db:studio`: Open Drizzle Studio
- `pnpm lint`: ESLint + Biome linting
- `pnpm build`: Production build

## 📊 Key Extension Points

1. **New AI Models**: Add to `lib/ai/models.ts` and update provider logic
2. **Additional Tools**: Extend tools object in `/api/chat/route.ts`
3. **New Document Types**: Add to `BlockKind` enum and implement handlers
4. **Custom Research Steps**: Modify deep research loop logic
5. **UI Components**: Add to `components/` with shadcn/ui patterns
6. **Database Schema**: Update `schema.ts` and create migrations

## 🧩 Component Architecture Deep Dive

### Core UI Components

**Layout Components**:
- `app/layout.tsx`: Root layout with theme provider and analytics
- `app/(chat)/layout.tsx`: Chat-specific layout with sidebar
- `components/app-sidebar.tsx`: Navigation sidebar with chat history

**Chat Components**:
- `components/chat.tsx`: Main chat interface coordinator
- `components/messages.tsx`: Message list with virtual scrolling
- `components/message.tsx`: Individual message rendering
- `components/multimodal-input.tsx`: Input with file upload and mode selection

**Research Components**:
- `components/deep-research.tsx`: Research progress sidebar
- `components/search-results.tsx`: Search result display
- `components/extract-results.tsx`: Extraction result display
- `components/scrape-results.tsx`: Scraping result display

**Document Components**:
- `components/block.tsx`: Document sidebar container
- `components/document.tsx`: Document viewer/editor
- `components/code-editor.tsx`: Code editing with CodeMirror
- `components/spreadsheet-editor.tsx`: CSV editing interface

### State Management Patterns

**Global State** (React Context):
```typescript
// Deep Research State
const DeepResearchContext = createContext<{
  state: DeepResearchState;
  addActivity: (activity: ActivityItem) => void;
  addSource: (source: SourceItem) => void;
  // ... other actions
}>();

// Block State (Document Management)
const useBlock = () => {
  const [block, setBlock] = useImmer<BlockData | null>(null);
  // Immer for immutable updates
};
```

**Local State** (Component-level):
- Form inputs with controlled components
- UI state (loading, errors, visibility)
- Temporary data (file uploads, drafts)

### Custom Hooks

**Files**: `hooks/use-block.ts`, `hooks/use-chat-visibility.ts`, `hooks/use-mobile.tsx`

- `useBlock`: Document/block state management
- `useChatVisibility`: Chat visibility controls
- `useUserMessageId`: Message ID tracking
- `useMobile`: Responsive design utilities

## 🔌 API Architecture

### Route Structure

```
app/(chat)/api/
├── chat/route.ts              # Main chat API with streaming
├── document/route.ts          # Document CRUD operations
├── files/upload/route.ts      # File upload handling
├── history/route.ts           # Chat history management
└── vote/route.ts              # Message voting system
```

### API Patterns

**Streaming Responses**:
```typescript
// Server-side streaming setup
const dataStream = createDataStreamResponse();
const result = streamText({
  model: customModel(modelId),
  messages: coreMessages,
  tools: { search, extract, deepResearch },
  onFinish: async ({ response }) => {
    // Save to database
    await saveMessages(response.messages);
  }
});
result.mergeIntoDataStream(dataStream);
```

**Error Handling**:
```typescript
try {
  const result = await firecrawlOperation();
  return { success: true, data: result.data };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: error.message };
}
```

### Database Query Patterns

**Files**: `lib/db/queries.ts`

**Common Patterns**:
```typescript
// User management
export async function getUser(email: string): Promise<User[]>
export async function createUser(email: string, password: string): Promise<User>

// Chat operations
export async function saveChat(chat: Chat): Promise<void>
export async function getChatById(id: string): Promise<Chat>
export async function deleteChatById(id: string): Promise<void>

// Message handling
export async function saveMessages(messages: Message[]): Promise<void>
export async function getMessagesByChatId(chatId: string): Promise<Message[]>
```

## 🎨 Styling Architecture

### Design System

**Base**: Tailwind CSS with custom configuration
**Components**: shadcn/ui component library
**Themes**: Light/dark mode with next-themes
**Icons**: Lucide React + Radix UI icons

### Component Patterns

**Consistent Styling**:
```typescript
// Using class-variance-authority for component variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
      },
    },
  }
);
```

**Responsive Design**:
- Mobile-first approach
- Breakpoint-based layouts
- Touch-friendly interactions
- Adaptive component sizing

## 🔒 Security Implementation

### Authentication Security

**Password Handling**:
```typescript
// Secure password hashing
const salt = genSaltSync(10);
const hashedPassword = hashSync(password, salt);

// Password verification
const isValid = await compare(password, hashedPassword);
```

**Session Management**:
- Secure HTTP-only cookies
- CSRF protection via NextAuth.js
- Session expiration handling
- Anonymous user support

### Input Validation

**Zod Schemas**:
```typescript
// API input validation
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  maxResults: z.number().min(1).max(20).optional(),
});

// Runtime validation
const { query, maxResults } = searchSchema.parse(request.body);
```

### Rate Limiting

**Implementation**:
```typescript
// Redis-based rate limiting
const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

const { success } = await rateLimiter.limit(identifier);
if (!success) {
  return new Response("Rate limit exceeded", { status: 429 });
}
```

## 🚀 Performance Optimizations

### Frontend Optimizations

**Code Splitting**:
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based splitting

**Caching Strategies**:
- SWR for data fetching
- Local storage for user preferences
- Browser caching for static assets

**Rendering Optimizations**:
- React Server Components (RSC)
- Streaming SSR
- Selective hydration

### Backend Optimizations

**Database**:
- Connection pooling with postgres.js
- Indexed queries for performance
- Prepared statements via Drizzle

**API Performance**:
- Streaming responses for real-time updates
- Efficient JSON parsing
- Memory-conscious data handling

## 🧪 Testing Strategy

### Testing Approach

**Unit Tests**: Component logic and utility functions
**Integration Tests**: API endpoints and database operations
**E2E Tests**: Critical user flows

**Testing Tools** (Recommended):
- Jest for unit testing
- React Testing Library for component tests
- Playwright for E2E testing
- MSW for API mocking

## 📈 Monitoring & Analytics

### Built-in Analytics

**Vercel Analytics**: Page views and performance metrics
**Console Logging**: Structured error logging
**Performance Monitoring**: Core Web Vitals tracking

### Custom Metrics

**Research Analytics**:
- Research completion rates
- Average research depth
- Tool usage statistics
- Error rate tracking

## 🔧 Configuration Management

### Environment Variables

**Required Variables**:
```bash
# Authentication
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
POSTGRES_URL=postgresql://...

# AI Providers
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
TOGETHER_API_KEY=...

# Firecrawl
FIRECRAWL_API_KEY=fc-...

# Storage
BLOB_READ_WRITE_TOKEN=...

# Rate Limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Model Configuration
REASONING_MODEL=o1-mini
BYPASS_JSON_VALIDATION=false
MAX_DURATION=300
```

### Build Configuration

**Next.js Config**:
```typescript
// next.config.ts
const config = {
  experimental: {
    ppr: true,  // Partial Prerendering
  },
  images: {
    domains: ['example.com'],
  },
};
```

This comprehensive architecture documentation provides the foundation needed to understand, maintain, and extend the Open Deep Research codebase effectively.

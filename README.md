# MentorVerse - Personalized Learning Platform

A comprehensive AI-powered learning platform with theme-based avatar companions, built with Next.js 14, TypeScript, and Gemini AI.

## 🚀 Features

- **AI-Powered Course Generation**: Create personalized courses using Google's Gemini AI
- **Theme-Based Avatars**: Choose from Batman, Naruto, or Minimal themes with interactive avatars
- **Real-time Learning Sessions**: Interactive explanations, questions, and MCQs
- **Doubt Clarification**: Ephemeral doubt handling with context-aware AI responses
- **Progress Tracking**: Save checkpoints and resume learning sessions
- **Google Authentication**: Secure login with Google OAuth
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence
- **Authentication**: NextAuth.js with Google Provider
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Google Generative AI (Gemini)
- **UI Components**: Headless UI, Lucide Icons

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aitutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.template .env.local
   ```
   
   Fill in the required environment variables:
   - `MONGODB_URI`: MongoDB connection string
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
   - `NEXTAUTH_SECRET`: Random secret for NextAuth.js
   - `GOOGLE_GEMINI_API_KEY`: Gemini AI API key

4. **Set up MongoDB**
   - Install MongoDB locally OR use MongoDB Atlas
   - Create a database named `aitutor`

5. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs

6. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your environment variables

7. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Theme System

The app supports multiple themes with custom avatars:

### Available Themes:
1. **Batman** - Dark Knight theme with Batman avatars
2. **Naruto** - Ninja theme with Naruto-style avatars  
3. **Minimal** - Clean, text-based theme

### Avatar States:
- `loading` - Shows thinking/loading animation
- `explaining` - Active teaching mode
- `asking` - Question mode
- `praising` - Success/celebration mode
- `consoling` - Encouragement mode

### Adding New Themes:
1. Create theme directory: `public/themes/theme-name/`
2. Add avatar images for each state (optional)
3. Update the theme configuration in `src/store/useStore.ts`

## 🔧 Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── Avatar.tsx      # Avatar component
│   └── ThemeSelector.tsx
├── lib/                # Utility libraries
│   ├── auth.ts         # NextAuth configuration
│   ├── gemini.ts       # Gemini AI integration
│   ├── models.ts       # MongoDB models
│   └── mongodb.ts      # Database connection
├── store/              # State management
│   └── useStore.ts     # Zustand store
└── types/              # TypeScript definitions
    └── index.ts        # Type definitions
```

## 🌟 Core Components

### Avatar Component
- Displays theme-based avatars with different states
- Handles image loading errors gracefully
- Includes animations and transitions

### Theme Selector
- Interactive theme selection interface
- Live preview of avatar states
- Audio toggle controls

### Learning Session (Coming Soon)
- Interactive course content display
- Progress tracking
- Doubt handling interface

## 🔄 Core Flow

1. **User Authentication**: Google OAuth login
2. **Theme Selection**: Choose avatar companion
3. **Course Creation**: AI generates personalized syllabus
4. **Learning Session**: Interactive explanations and questions
5. **Progress Tracking**: Save checkpoints and resume

## 📱 API Endpoints

- `POST /api/auth/[...nextauth]` - Authentication
- `POST /api/courses/generate` - Generate new course
- `POST /api/courses/[id]/doubt` - Handle doubt clarification
- `GET /api/courses/search` - Search courses
- `PUT /api/progress/[courseId]` - Update progress

## 🧪 Development

### Available Scripts:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Adding Features:
1. Create components in `src/components/`
2. Add API routes in `src/app/api/`
3. Update types in `src/types/index.ts`
4. Update state management in `src/store/useStore.ts`

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Run `npm run build` and `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues:

**MongoDB Connection Issues:**
- Verify MongoDB is running
- Check connection string format
- Ensure database permissions

**Google OAuth Issues:**
- Verify redirect URIs in Google Console
- Check client ID/secret configuration
- Ensure Google+ API is enabled

**Gemini API Issues:**
- Verify API key is valid
- Check quota limits
- Ensure proper error handling

**Build Issues:**
- Clear `.next` folder and `node_modules`
- Run `npm install` again
- Check TypeScript errors

## 🔮 Roadmap

- [ ] Learning session interface
- [ ] Course search and discovery
- [ ] User profile and dashboard
- [ ] Audio system integration
- [ ] Mobile app (React Native)
- [ ] Course sharing and collaboration
- [ ] Advanced analytics
- [ ] Multi-language support

---

**Happy Learning! 🎓**

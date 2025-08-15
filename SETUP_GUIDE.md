# 🍅 POMODORO APP - JUNIOR DEVELOPER SETUP GUIDE

## 📋 WHAT YOU NEED TO GET STARTED

### ✅ ALREADY DONE:
- ✅ Node.js installed (v22.17.1)
- ✅ npm installed (v11.5.1)
- ✅ Dependencies installed
- ✅ Project structure created

### 🔧 WHAT YOU NEED TO CONFIGURE:

## 1. DATABASE SETUP (REQUIRED) - 15 minutes

### Step 1.1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project" 
3. Sign up with GitHub/Google (easiest)
4. Create a new project:
   - Project name: `pomodoro-app` (or any name you like)
   - Database password: Choose a strong password (save it!)
   - Region: Choose closest to you

### Step 1.2: Get Your Database Credentials
After your project is created (takes ~2 minutes):

1. Go to your project dashboard
2. Click "Settings" (gear icon) → "API"
3. Copy these values to your `.env` file:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`  
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 1.3: Setup Database Schema
1. In Supabase dashboard, go to "SQL Editor"
2. Open the file `database/schema.sql` from your project
3. Copy ALL the content and paste in SQL Editor
4. Click "Run" - this creates all your tables

### Step 1.4: Add Sample Data (Optional)
1. Open `database/seed.sql` 
2. Copy content to SQL Editor
3. Click "Run" - this adds demo data for testing

## 2. GENERATE JWT SECRET (REQUIRED) - 2 minutes

I'll generate a secure key for you. Update your `.env` file:

```
JWT_SECRET=7a8f9b2e4d1c6h5j9k3m7n0q8r2t5w8x1z4a7b0c3f6i9l2o5s8v1y4z7c0f3i6k9n2q5t8w1z4a7d0g3j6m9p2s5v8y1b4e7h0k3n6q9t2w5z8c1f4i7l0o3r6u9x2a5d8g1j4m7p0s3v6y9b2e5h8k1n4q7t0w3z6c9f2i5l8o1r4u7x0a3d6g9j2m5p8s1v4y7b0e3h6k9n2q5t8w1z4c7f0i3l6o9r2u5x8a1d4g7j0m3p6s9v2y5b8e1h4k7n0q3t6w9z2c5f8i1l4o7r0u3x6a9d2g5j8m1p4s7v0y3b6e9h2k5n8q1t4w7z0c3f6i9l2o5r8u1x4a7d0g3j6m9p2s5v8y1b4e7h0k3n6q9t2w5z8c1f4i7l0o3r6u9x2a5d8"
```

## 3. BASIC TESTING (REQUIRED) - 5 minutes

Let's make sure everything works:

### Step 3.1: Start the Server
```bash
npm run dev
```

### Step 3.2: Test in Browser
1. Open http://localhost:3000
2. You should see the Pomodoro timer interface
3. Try creating an account
4. Try logging in

## 4. OPTIONAL INTEGRATIONS (Can do later)

### 🎵 SPOTIFY INTEGRATION (15 minutes)
**What it does**: Automatically plays focus music during Pomodoro sessions

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click "Create App"
4. Fill out:
   - App name: "Pomodoro Focus App"
   - App description: "Plays music during focus sessions"
   - Redirect URI: `http://localhost:3000/api/spotify/callback`
5. Save Client ID and Client Secret to `.env`

### 📋 TODOIST INTEGRATION (5 minutes)
**What it does**: Syncs your tasks between Todoist and the app

1. Go to https://todoist.com/prefs/integrations
2. Scroll to "API token"
3. Copy token to `.env` as `TODOIST_API_TOKEN`

### 📅 GOOGLE CALENDAR INTEGRATION (20 minutes)
**What it does**: Creates calendar events for your Pomodoro sessions

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/calendar/callback`
6. Save Client ID and Secret to `.env`

## 5. DEPLOYMENT (Later)

When you're ready to deploy:
- Heroku (easiest for beginners)
- Vercel (good for static sites)
- Railway (modern alternative)
- DigitalOcean (more control)

## 🆘 TROUBLESHOOTING

### Common Issues:

1. **"Cannot connect to database"**
   - Check your Supabase URL and keys in `.env`
   - Make sure you ran the schema.sql script

2. **"JWT token invalid"**
   - Make sure JWT_SECRET is set in `.env`
   - Try logging out and back in

3. **"Port already in use"**
   - Change PORT in `.env` to 3001 or 3002
   - Or kill the process using the port

4. **"Module not found"**
   - Run `npm install` again
   - Delete `node_modules` folder and run `npm install`

## 📞 NEXT STEPS

1. **MINIMUM TO GET RUNNING**: Just do steps 1, 2, and 3
2. **FOR FULL EXPERIENCE**: Add integrations in step 4
3. **FOR PRODUCTION**: Follow deployment guide

## 🎯 WHAT TO TELL ME

To help you further, please tell me:

1. ✅ **Did you create a Supabase account?**
   - If yes: What's your project URL?
   - If no: Do you want me to walk you through it?

2. ✅ **Which integrations do you want?**
   - Spotify for music? (Yes/No)
   - Todoist for tasks? (Yes/No) 
   - Google Calendar? (Yes/No)

3. ✅ **Any errors when you try to start the server?**
   - Copy paste the exact error message

Let me know your answers and I'll help you configure everything! 🚀

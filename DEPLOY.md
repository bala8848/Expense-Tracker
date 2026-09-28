# Deployment guide

## 1) Prepare the app
1. Copy `.env.example` to `.env`
2. Replace the placeholder values with your real Supabase values
3. Keep `.env` local and do not commit it to GitHub

## 2) Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## 3) Deploy to Vercel
1. Open https://vercel.com
2. Sign in with GitHub
3. Import the GitHub repository
4. Set the project root to the app folder if needed
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy

## 4) Use the app on mobile
Open the live Vercel URL from your phone.

## 5) Database
All entered data is stored in Supabase, not GitHub.

# How to Deploy "My Notepad" to Vercel

Since this is a Next.js application, **Vercel** is the easiest and best place to host it.

## Prerequisites
1.  A [GitHub](https://github.com/) account.
2.  A [Vercel](https://vercel.com/) account (you can sign up using GitHub).
3.  Your code pushed to a GitHub repository.

## Step 1: Push Code to GitHub
If you haven't already, make sure all your recent changes are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Ready for deployment"
git push
```

## Step 2: Import into Vercel
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Find your repository (`my-notepad` or whatever you named it) in the list and click **"Import"**.

## Step 3: Configure Environment Variables (Crucial!)
Vercel needs to know your Firebase keys to connect to the database. It cannot read your `.env.local` file for security reasons.

1.  On the Vercel "Configure Project" screen, look for the **"Environment Variables"** section.
2.  Expand it.
3.  Open your local `.env.local` file on your computer.
4.  Copy and paste each variable name and value into Vercel fields.

You need to add all of these:
*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`

**Note**: Make sure to paste the values exactly as they are in your `.env.local` file (without quotes usually).

## Step 4: Deploy
1.  Click the **"Deploy"** button.
2.  Wait for Vercel to build your application (usually takes about 1 minute).
3.  Once finished, you will get a live URL (e.g., `https://my-notepad-tau.vercel.app`).

## Troubleshooting
*   **Database connection fails?** Double-check that you added the Environment Variables correctly in Vercel Settings > Environment Variables. If you changed them, you must **Redeploy** for them to take effect.
*   **Styling looks wrong?** Sometimes caching issues occur. Usually, a refresh fixes this. Next.js creates optimized CSS builds automatically.

# Online Notepad & Sketchpad

A minimalist "Windows Notepad" style application with drawing capabilities and real-time Firebase syncing.

## Features

- **Minimalist Design**: Clean, monochrome interface focused on content.
- **Dual Mode**: Switch between Text Editor and Sketchpad.
- **Tools**: Pencil, Brush, Eraser, Clear Canvas.
- **Real-time Saving**: Automatically saves to Firebase (debounced).
- **Responsive**: Works on mobile and desktop.

## Setup

1. **Install Dependencies** (if not done):
   ```bash
   npm install
   ```

2. **Firebase Setup**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Create a new project.
   - Enable **Realtime Database** (start in Test Mode for development).
   - Go to Project Settings > General > Your apps > "Web" > Add app.
   - Copy the configuration keys.

3. **Environment Variables**:
   Create a `.env.local` file in the root directory and add your Firebase keys:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
   ```

4. **Database Security Rules** (Important):
   Since this app does NOT use authentication, you must set your Realtime Database rules to public.
   - Go to **Realtime Database** > **Rules**.
   - Paste the following rule (which allows anyone to read/write):
     ```json
     {
       "rules": {
         ".read": true,
         ".write": true
       }
     }
     ```
   - *Note: In a production app with sensitive data, you would add authentication rules.*

5. **Run Locally**:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: Firebase Realtime Database
- **Icons**: Lucide React
- **Drawing**: react-sketch-canvas

# Memory Vista - Digital Memorial Platform

A modern web application for creating and sharing digital memorials. Built with Next.js, Firebase, and Tailwind CSS.

## Features

- Organization-based memorial management
- Beautiful profile pages with photos and stories
- Timeline of life events
- Family tree visualization
- "Light a candle" feature for sharing memories
- Privacy controls
- Shareable links

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS, Headless UI
- **Icons:** Heroicons

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/memory-vista.git
   cd memory-vista
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project and enable:
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Storage

4. Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── [org]/             # Organization routes
│   │   ├── dashboard/     # Organization dashboard
│   │   └── profiles/      # Profile management
│   ├── signup/            # Sign up page
│   └── page.tsx           # Landing page
├── components/            # Reusable components
├── lib/                   # Utility functions
│   ├── firebase.ts       # Firebase configuration
│   └── utils.ts          # Helper functions
└── types/                # TypeScript types
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Headless UI](https://headlessui.dev/)
- [Heroicons](https://heroicons.com/)
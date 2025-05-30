# Alumni Profiles

A Next.js application for managing alumni profiles with features for viewing and editing profile changes.

## Features

- Profile creation and editing
- Draft management with auto-save
- Change diff viewing for admins
- Timeline and story answer management
- Responsive design with Tailwind CSS

## Tech Stack

- Next.js 13
- TypeScript
- Firebase (Firestore)
- Tailwind CSS
- Jest & React Testing Library

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Project Structure

```
src/
  ├── components/     # React components
  ├── hooks/         # Custom React hooks
  ├── lib/           # Utility functions and Firebase setup
  ├── pages/         # Next.js pages
  ├── styles/        # Global styles
  ├── types/         # TypeScript type definitions
  └── utils/         # Utility functions
```

## Testing

The project uses Jest and React Testing Library for testing. Run tests with:

```bash
npm test
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

MIT
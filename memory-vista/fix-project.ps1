# Remove old files
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .next
Remove-Item -Force -ErrorAction SilentlyContinue package-lock.json

# Install dependencies
npm install

# Create necessary directories
New-Item -ItemType Directory -Force -Path src/app
New-Item -ItemType Directory -Force -Path src/components/ui
New-Item -ItemType Directory -Force -Path src/components/layout
New-Item -ItemType Directory -Force -Path src/lib
New-Item -ItemType Directory -Force -Path src/types
New-Item -ItemType Directory -Force -Path public

# Create gitignore
@"
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem
.env.local
.env.development.local
.env.test.local
.env.production.local

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# typescript
*.tsbuildinfo
next-env.d.ts
"@ | Set-Content .gitignore

# Create postcss config
@"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@ | Set-Content postcss.config.js

# Create tailwind config
@"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"@ | Set-Content tailwind.config.js

# Create global CSS
New-Item -ItemType Directory -Force -Path src/app
@"
@tailwind base;
@tailwind components;
@tailwind utilities;
"@ | Set-Content src/app/globals.css

Write-Host "Project structure fixed. Please run 'npm run dev' to start the development server." 
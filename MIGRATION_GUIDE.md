# 🚀 Firebase to Supabase Migration Guide

This guide will help you migrate your Storiats application from Firebase to Supabase.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Firebase Project**: Your existing Firebase project with data
3. **Node.js**: Version 16 or higher

## 🎯 Migration Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key
3. Go to Settings → API to find your credentials

### Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL to create all tables, indexes, and security policies

### Step 3: Configure Environment Variables

Create a `.env.local` file with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Keep Firebase config for migration (remove after migration)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

### Step 4: Export Firebase Data

1. Install the migration script dependencies:
```bash
npm install firebase --legacy-peer-deps
```

2. Run the migration script:
```bash
node scripts/migrate-to-supabase.js
```

This will create:
- `firebase-export.json` - Raw exported data
- `supabase-import.sql` - SQL insert statements

### Step 5: Import Data to Supabase

1. In your Supabase SQL Editor, run the generated `supabase-import.sql`
2. Verify the data was imported correctly

### Step 6: Set Up Storage Buckets

In your Supabase dashboard:

1. Go to **Storage**
2. Create buckets:
   - `profiles` - for profile images
   - `media` - for timeline media
   - `documents` - for documents

3. Set bucket policies:
```sql
-- Allow authenticated users to upload to profiles bucket
CREATE POLICY "Users can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

-- Allow public read access to profiles bucket
CREATE POLICY "Public can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');
```

### Step 7: Update Application Code

The migration includes:

✅ **Supabase Client Setup** (`src/lib/supabase.ts`)
✅ **Service Layer** (`src/lib/supabase-services.ts`)
✅ **Database Schema** (`supabase-schema.sql`)
✅ **Migration Script** (`scripts/migrate-to-supabase.js`)

### Step 8: Test the Application

1. Start the development server:
```bash
npm run dev
```

2. Test key functionality:
   - User authentication
   - Profile creation/editing
   - University pages
   - Search functionality
   - File uploads

## 🔧 Code Updates Required

### Update Authentication Context

Replace Firebase auth with Supabase auth in `src/contexts/AuthContext.tsx`:

```typescript
import { supabase } from '@/lib/supabase';

// Replace Firebase auth with Supabase auth
const { data: { user }, error } = await supabase.auth.getUser();
```

### Update Profile Components

Replace Firebase queries with Supabase services:

```typescript
// Before (Firebase)
const { db } = await getFirebaseServices();
const profilesRef = collection(db, 'profiles');

// After (Supabase)
import { profileService } from '@/lib/supabase-services';
const profiles = await profileService.getUniversityProfiles(universityId);
```

### Update File Uploads

Replace Firebase Storage with Supabase Storage:

```typescript
// Before (Firebase)
const storageRef = ref(storage, `profiles/${file.name}`);

// After (Supabase)
import { mediaService } from '@/lib/supabase-services';
const { data } = await mediaService.uploadFile(file, 'profiles', path);
```

## 🚨 Important Notes

### Data Types
- Firebase Timestamps become PostgreSQL timestamps
- Firebase arrays become PostgreSQL arrays
- Firebase maps become PostgreSQL JSONB

### Authentication
- Supabase Auth is compatible with Firebase Auth
- User IDs will be preserved during migration
- Email/password authentication works the same

### Real-time Features
- Supabase real-time is more powerful than Firestore
- Use `realtimeService` for subscriptions

### Storage
- Supabase Storage is S3-compatible
- File URLs will change during migration
- Update existing file references

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Supabase URL and anon key
   - Verify RLS policies are correct

2. **Data Import Errors**
   - Check for special characters in data
   - Verify data types match schema

3. **File Upload Issues**
   - Check bucket permissions
   - Verify file size limits

4. **Real-time Not Working**
   - Check subscription setup
   - Verify channel permissions

### Performance Optimization

1. **Database Indexes**
   - All necessary indexes are created in schema
   - Monitor query performance in Supabase dashboard

2. **Connection Pooling**
   - Supabase handles this automatically
   - No additional configuration needed

3. **Caching**
   - Implement client-side caching for frequently accessed data
   - Use Supabase's built-in caching

## ✅ Migration Checklist

- [ ] Create Supabase project
- [ ] Run database schema
- [ ] Configure environment variables
- [ ] Export Firebase data
- [ ] Import data to Supabase
- [ ] Set up storage buckets
- [ ] Update authentication
- [ ] Update profile components
- [ ] Update file uploads
- [ ] Test all functionality
- [ ] Remove Firebase dependencies
- [ ] Deploy to production

## 🎉 Benefits After Migration

1. **Better Performance**: PostgreSQL queries are faster than Firestore
2. **Advanced Search**: Full-text search with PostgreSQL
3. **Complex Queries**: SQL joins and aggregations
4. **Better Analytics**: SQL-based reporting
5. **Cost Savings**: Supabase pricing is often more favorable
6. **Open Source**: PostgreSQL is open source

## 📞 Support

If you encounter issues during migration:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [Supabase Discord](https://discord.supabase.com)
3. Check the generated error logs
4. Verify all environment variables are set correctly

## 🚀 Next Steps

After successful migration:

1. **Optimize Queries**: Use PostgreSQL-specific features
2. **Add Analytics**: Implement SQL-based reporting
3. **Scale Storage**: Configure CDN for global access
4. **Monitor Performance**: Use Supabase dashboard metrics
5. **Backup Strategy**: Set up automated backups

---

**Happy migrating! 🎉** 
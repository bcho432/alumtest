const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase configuration (you'll need to add your Firebase config here)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Migration functions
async function exportFirestoreData() {
  console.log('🚀 Starting Firebase to Supabase migration...');
  
  const exportData = {
    users: [],
    universities: [],
    profiles: [],
    timeline_events: [],
    story_answers: [],
    media_files: [],
    comments: [],
    support_tickets: [],
    admin_settings: []
  };

  try {
    // Export users
    console.log('📤 Exporting users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      exportData.users.push({
        id: doc.id,
        email: data.email || '',
        display_name: data.displayName || data.displayUsername || '',
        email_verified: data.emailVerified || false,
        photo_url: data.photoURL || data.photoUrl || '',
        created_at: data.createdAt?.toDate?.() || new Date(),
        updated_at: data.updatedAt?.toDate?.() || new Date(),
        preferences: data.preferences || { receiveUpdates: true },
        is_platform_admin: data.isPlatformAdmin || false
      });
    });

    // Export universities
    console.log('📤 Exporting universities...');
    const universitiesSnapshot = await getDocs(collection(db, 'universities'));
    universitiesSnapshot.forEach(doc => {
      const data = doc.data();
      exportData.universities.push({
        id: doc.id,
        name: data.name || '',
        domain: data.domain || '',
        logo_url: data.logoUrl || data.logo || '',
        description: data.description || '',
        location: data.location || '',
        website: data.website || '',
        contact_email: data.contact?.email || '',
        contact_phone: data.contact?.phone || '',
        settings: data.settings || {
          allowPublicProfiles: true,
          requireApproval: false,
          defaultVisibility: 'public',
          allowMedia: true,
          allowComments: true
        },
        branding: data.branding || {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF'
        },
        is_active: data.isActive !== false,
        created_at: data.createdAt?.toDate?.() || new Date(),
        updated_at: data.updatedAt?.toDate?.() || new Date()
      });
    });

    // Export profiles
    console.log('📤 Exporting profiles...');
    const profilesSnapshot = await getDocs(collection(db, 'profiles'));
    profilesSnapshot.forEach(doc => {
      const data = doc.data();
      exportData.profiles.push({
        id: doc.id,
        university_id: data.universityId || null,
        user_id: data.userId || data.createdBy || null,
        type: data.type || 'personal',
        status: data.status || 'draft',
        visibility: data.visibility || data.isPublic ? 'public' : 'private',
        full_name: data.name || data.fullName || '',
        bio: data.bio || data.description || '',
        photo_url: data.photoURL || data.photoUrl || '',
        cover_image_url: data.coverImageUrl || data.coverImage || '',
        department: data.department || '',
        graduation_year: data.graduationYear || null,
        location: data.location || '',
        contact: data.contact || {},
        date_of_birth: data.dateOfBirth?.toDate?.() || data.basicInfo?.dateOfBirth?.toDate?.() || null,
        date_of_death: data.dateOfDeath?.toDate?.() || data.basicInfo?.dateOfDeath?.toDate?.() || null,
        birth_location: data.birthLocation || data.basicInfo?.birthLocation || '',
        death_location: data.deathLocation || data.basicInfo?.deathLocation || '',
        tags: data.tags || data.metadata?.tags || [],
        metadata: data.metadata || {},
        is_featured: data.isFeatured || false,
        created_at: data.createdAt?.toDate?.() || new Date(),
        updated_at: data.updatedAt?.toDate?.() || new Date(),
        published_at: data.publishedAt?.toDate?.() || null,
        published_by: data.publishedBy || null
      });
    });

    // Export timeline events
    console.log('📤 Exporting timeline events...');
    for (const profile of exportData.profiles) {
      try {
        const timelineSnapshot = await getDocs(collection(db, `profiles/${profile.id}/timeline`));
        timelineSnapshot.forEach(doc => {
          const data = doc.data();
          exportData.timeline_events.push({
            id: doc.id,
            profile_id: profile.id,
            type: data.type || 'event',
            title: data.title || '',
            description: data.description || '',
            start_date: data.startDate || data.start_date || '',
            end_date: data.endDate || data.end_date || null,
            location: data.location || '',
            institution: data.institution || data.metadata?.institution || '',
            degree: data.degree || data.metadata?.degree || '',
            field_of_study: data.fieldOfStudy || data.metadata?.fieldOfStudy || '',
            company: data.company || data.metadata?.company || '',
            position: data.position || data.metadata?.position || '',
            media_urls: data.mediaUrls || [],
            importance: data.importance || data.metadata?.importance || 'medium',
            visibility: data.visibility || data.metadata?.visibility || 'public',
            tags: data.tags || data.metadata?.tags || [],
            created_at: data.createdAt?.toDate?.() || new Date(),
            updated_at: data.updatedAt?.toDate?.() || new Date(),
            created_by: data.createdBy || profile.user_id
          });
        });
      } catch (error) {
        console.log(`⚠️ No timeline found for profile ${profile.id}`);
      }
    }

    // Export story answers
    console.log('📤 Exporting story answers...');
    for (const profile of exportData.profiles) {
      try {
        const storiesSnapshot = await getDocs(collection(db, `profiles/${profile.id}/stories`));
        storiesSnapshot.forEach(doc => {
          const data = doc.data();
          exportData.story_answers.push({
            id: doc.id,
            profile_id: profile.id,
            question_id: data.questionId || doc.id,
            answer: data.answer || '',
            is_private: data.isPrivate || false,
            created_at: data.createdAt?.toDate?.() || new Date(),
            updated_at: data.updatedAt?.toDate?.() || new Date(),
            created_by: data.authorId || data.createdBy || profile.user_id
          });
        });
      } catch (error) {
        console.log(`⚠️ No stories found for profile ${profile.id}`);
      }
    }

    // Export media files
    console.log('📤 Exporting media files...');
    for (const profile of exportData.profiles) {
      try {
        const mediaSnapshot = await getDocs(collection(db, `profiles/${profile.id}/media`));
        mediaSnapshot.forEach(doc => {
          const data = doc.data();
          exportData.media_files.push({
            id: doc.id,
            profile_id: profile.id,
            file_name: data.fileName || data.name || '',
            file_url: data.url || data.fileUrl || '',
            file_type: data.fileType || data.type || 'image',
            file_size: data.fileSize || data.size || null,
            mime_type: data.mimeType || data.mime_type || '',
            width: data.width || null,
            height: data.height || null,
            thumbnail_url: data.thumbnailUrl || data.thumbnail || '',
            duration: data.duration || null,
            caption: data.caption || '',
            tags: data.tags || [],
            is_header_image: data.isHeaderImage || data.isHeader || false,
            uploaded_at: data.uploadedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
            uploaded_by: data.uploadedBy || data.createdBy || profile.user_id
          });
        });
      } catch (error) {
        console.log(`⚠️ No media found for profile ${profile.id}`);
      }
    }

    // Export comments
    console.log('📤 Exporting comments...');
    for (const profile of exportData.profiles) {
      try {
        const commentsSnapshot = await getDocs(collection(db, `profiles/${profile.id}/comments`));
        commentsSnapshot.forEach(doc => {
          const data = doc.data();
          exportData.comments.push({
            id: doc.id,
            profile_id: profile.id,
            parent_comment_id: data.parentCommentId || data.parentId || null,
            content: data.content || data.message || '',
            is_approved: data.isApproved !== false,
            created_at: data.createdAt?.toDate?.() || new Date(),
            updated_at: data.updatedAt?.toDate?.() || new Date(),
            created_by: data.createdBy || data.userId || null
          });
        });
      } catch (error) {
        console.log(`⚠️ No comments found for profile ${profile.id}`);
      }
    }

    // Export support tickets
    console.log('📤 Exporting support tickets...');
    const ticketsSnapshot = await getDocs(collection(db, 'support_tickets'));
    ticketsSnapshot.forEach(doc => {
      const data = doc.data();
      exportData.support_tickets.push({
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        subject: data.subject || '',
        message: data.message || '',
        status: data.status || 'new',
        priority: data.priority || 'medium',
        type: data.type || 'contact',
        created_by: data.createdBy || null,
        created_at: data.createdAt?.toDate?.() || new Date(),
        updated_at: data.updatedAt?.toDate?.() || new Date()
      });
    });

    // Export admin settings
    console.log('📤 Exporting admin settings...');
    try {
      const settingsSnapshot = await getDocs(collection(db, 'adminSettings'));
      settingsSnapshot.forEach(doc => {
        const data = doc.data();
        exportData.admin_settings.push({
          id: doc.id,
          key: doc.id,
          value: data,
          created_at: data.createdAt?.toDate?.() || new Date(),
          updated_at: data.updatedAt?.toDate?.() || new Date()
        });
      });
    } catch (error) {
      console.log('⚠️ No admin settings found');
    }

    // Save export data
    const exportPath = path.join(__dirname, '../firebase-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Export completed! Data saved to: ${exportPath}`);
    console.log(`📊 Export summary:`);
    console.log(`   - Users: ${exportData.users.length}`);
    console.log(`   - Universities: ${exportData.universities.length}`);
    console.log(`   - Profiles: ${exportData.profiles.length}`);
    console.log(`   - Timeline Events: ${exportData.timeline_events.length}`);
    console.log(`   - Story Answers: ${exportData.story_answers.length}`);
    console.log(`   - Media Files: ${exportData.media_files.length}`);
    console.log(`   - Comments: ${exportData.comments.length}`);
    console.log(`   - Support Tickets: ${exportData.support_tickets.length}`);
    console.log(`   - Admin Settings: ${exportData.admin_settings.length}`);

    return exportData;

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

// Generate SQL insert statements
function generateSQLInserts(exportData) {
  console.log('🔧 Generating SQL insert statements...');
  
  const sqlStatements = [];
  
  // Insert users
  if (exportData.users.length > 0) {
    sqlStatements.push('-- Insert users');
    sqlStatements.push('INSERT INTO public.users (id, email, display_name, email_verified, photo_url, created_at, updated_at, preferences, is_platform_admin) VALUES');
    const userValues = exportData.users.map(user => 
      `('${user.id}', '${user.email}', '${user.display_name}', ${user.email_verified}, '${user.photo_url}', '${user.created_at.toISOString()}', '${user.updated_at.toISOString()}', '${JSON.stringify(user.preferences)}', ${user.is_platform_admin})`
    );
    sqlStatements.push(userValues.join(',\n') + ';');
    sqlStatements.push('');
  }

  // Insert universities
  if (exportData.universities.length > 0) {
    sqlStatements.push('-- Insert universities');
    sqlStatements.push('INSERT INTO public.universities (id, name, domain, logo_url, description, location, website, contact_email, contact_phone, settings, branding, is_active, created_at, updated_at) VALUES');
    const universityValues = exportData.universities.map(uni => 
      `('${uni.id}', '${uni.name}', '${uni.domain}', '${uni.logo_url}', '${uni.description}', '${uni.location}', '${uni.website}', '${uni.contact_email}', '${uni.contact_phone}', '${JSON.stringify(uni.settings)}', '${JSON.stringify(uni.branding)}', ${uni.is_active}, '${uni.created_at.toISOString()}', '${uni.updated_at.toISOString()}')`
    );
    sqlStatements.push(universityValues.join(',\n') + ';');
    sqlStatements.push('');
  }

  // Insert profiles
  if (exportData.profiles.length > 0) {
    sqlStatements.push('-- Insert profiles');
    sqlStatements.push('INSERT INTO public.profiles (id, university_id, user_id, type, status, visibility, full_name, bio, photo_url, cover_image_url, department, graduation_year, location, contact, date_of_birth, date_of_death, birth_location, death_location, tags, metadata, is_featured, created_at, updated_at, published_at, published_by) VALUES');
    const profileValues = exportData.profiles.map(profile => 
      `('${profile.id}', ${profile.university_id ? `'${profile.university_id}'` : 'NULL'}, ${profile.user_id ? `'${profile.user_id}'` : 'NULL'}, '${profile.type}', '${profile.status}', '${profile.visibility}', '${profile.full_name}', '${profile.bio}', '${profile.photo_url}', '${profile.cover_image_url}', '${profile.department}', ${profile.graduation_year || 'NULL'}, '${profile.location}', '${JSON.stringify(profile.contact)}', ${profile.date_of_birth ? `'${profile.date_of_birth.toISOString()}'` : 'NULL'}, ${profile.date_of_death ? `'${profile.date_of_death.toISOString()}'` : 'NULL'}, '${profile.birth_location}', '${profile.death_location}', '${JSON.stringify(profile.tags)}', '${JSON.stringify(profile.metadata)}', ${profile.is_featured}, '${profile.created_at.toISOString()}', '${profile.updated_at.toISOString()}', ${profile.published_at ? `'${profile.published_at.toISOString()}'` : 'NULL'}, ${profile.published_by ? `'${profile.published_by}'` : 'NULL'})`
    );
    sqlStatements.push(profileValues.join(',\n') + ';');
    sqlStatements.push('');
  }

  // Insert timeline events
  if (exportData.timeline_events.length > 0) {
    sqlStatements.push('-- Insert timeline events');
    sqlStatements.push('INSERT INTO public.timeline_events (id, profile_id, type, title, description, start_date, end_date, location, institution, degree, field_of_study, company, position, media_urls, importance, visibility, tags, created_at, updated_at, created_by) VALUES');
    const eventValues = exportData.timeline_events.map(event => 
      `('${event.id}', '${event.profile_id}', '${event.type}', '${event.title}', '${event.description}', '${event.start_date}', ${event.end_date ? `'${event.end_date}'` : 'NULL'}, '${event.location}', '${event.institution}', '${event.degree}', '${event.field_of_study}', '${event.company}', '${event.position}', '${JSON.stringify(event.media_urls)}', '${event.importance}', '${event.visibility}', '${JSON.stringify(event.tags)}', '${event.created_at.toISOString()}', '${event.updated_at.toISOString()}', ${event.created_by ? `'${event.created_by}'` : 'NULL'})`
    );
    sqlStatements.push(eventValues.join(',\n') + ';');
    sqlStatements.push('');
  }

  // Save SQL file
  const sqlPath = path.join(__dirname, '../supabase-import.sql');
  fs.writeFileSync(sqlPath, sqlStatements.join('\n'));
  
  console.log(`✅ SQL statements generated! Saved to: ${sqlPath}`);
  return sqlStatements;
}

// Main execution
async function main() {
  try {
    const exportData = await exportFirestoreData();
    generateSQLInserts(exportData);
    console.log('🎉 Migration preparation completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Create a Supabase project at https://supabase.com');
    console.log('2. Run the schema SQL in your Supabase SQL editor');
    console.log('3. Run the generated supabase-import.sql file');
    console.log('4. Update your environment variables');
    console.log('5. Test the application');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { exportFirestoreData, generateSQLInserts }; 
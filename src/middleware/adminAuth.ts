import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { analytics } from '@/services/analytics';

export async function adminAuthMiddleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const db = getFirestore();
    
    // Extract university ID from the URL
    const url = new URL(request.url);
    const universityId = url.pathname.split('/admin/universities/')[1];
    
    if (!universityId) {
      return NextResponse.json({ error: 'University ID required' }, { status: 400 });
    }

    // Check if user is admin for this university
    const universityDoc = await db.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    const universityData = universityDoc.data();
    if (!universityData?.adminIds?.includes(decodedToken.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Log analytics event
    analytics.trackEvent({
      name: 'admin_dashboard_viewed',
      properties: {
        universityId,
        userId: decodedToken.uid,
      }
    });

    return NextResponse.next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
} 
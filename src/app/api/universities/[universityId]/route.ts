import { NextResponse } from 'next/server';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { universityId: string } }
) {
  console.log('=== API ROUTE START ===');
  console.log('API route called for university:', params.universityId);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const services = await getFirebaseServices();
    const universitiesRef = collection(services.db, 'universities');
    const decodedName = decodeURIComponent(params.universityId).replace(/-/g, ' ');
    console.log('Decoded name:', decodedName);
    
    // First try exact match
    let q = query(universitiesRef, where('name', '==', decodedName));
    let querySnapshot = await getDocs(q);
    console.log('Exact match query results:', {
      found: !querySnapshot.empty,
      count: querySnapshot.size,
      name: decodedName
    });
    
    // If no exact match, try case-insensitive match
    if (querySnapshot.empty) {
      console.log('No exact match found, trying case-insensitive match');
      const allUniversities = await getDocs(universitiesRef);
      console.log('All universities:', allUniversities.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })));
      
      const matchingUniversity = allUniversities.docs.find(doc => 
        doc.data().name.toLowerCase() === decodedName.toLowerCase()
      );
      
      if (matchingUniversity) {
        console.log('Found case-insensitive match:', {
          id: matchingUniversity.id,
          name: matchingUniversity.data().name
        });
        querySnapshot = {
          empty: false,
          docs: [matchingUniversity]
        } as any;
      }
    }
    
    if (querySnapshot.empty) {
      console.error('University not found:', decodedName);
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    const university = querySnapshot.docs[0];
    console.log('Found university:', {
      id: university.id,
      name: university.data().name
    });
    return NextResponse.json({
      id: university.id,
      ...university.data()
    });
  } catch (error) {
    console.error('Error fetching university:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
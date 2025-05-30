import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');

// Mock Firestore
jest.mock('@/lib/firebase', () => ({
  db: {
    doc: jest.fn()
  }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn()
}));

describe('Memorial Redirect Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to profile page if profile exists', async () => {
    // Mock profile exists
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true
    });

    const request = new NextRequest('http://localhost:3000/memorials/123');
    const response = await middleware(request);

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/profiles/123');
  });

  it('should show 404 if profile does not exist', async () => {
    // Mock profile does not exist
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false
    });

    const request = new NextRequest('http://localhost:3000/memorials/123');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    // Check if URL was rewritten to 404
    expect(response.url).toContain('/404');
  });

  it('should show 404 on error', async () => {
    // Mock error
    (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

    const request = new NextRequest('http://localhost:3000/memorials/123');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    // Check if URL was rewritten to 404
    expect(response.url).toContain('/404');
  });

  it('should not process non-memorial routes', async () => {
    const request = new NextRequest('http://localhost:3000/profiles/123');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });
}); 
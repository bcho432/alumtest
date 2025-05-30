jest.mock('firebase/firestore');
import { auditLogService } from '../auditLogService';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

describe('AuditLogService', () => {
  const mockOrgId = 'test-org';
  const mockActedBy = 'actor-123';
  const mockTargetUserId = 'target-456';
  const mockRole = 'admin';

  beforeEach(() => {
    jest.clearAllMocks();
    (addDoc as jest.Mock).mockResolvedValue({ id: 'log-123' });
  });

  it('logs role addition', async () => {
    await auditLogService.logRoleAdded(
      mockOrgId,
      mockActedBy,
      mockTargetUserId,
      mockRole
    );

    expect(collection).toHaveBeenCalledWith(db, 'logs/permissions');
    expect(addDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'role_added',
        orgId: mockOrgId,
        actedBy: mockActedBy,
        targetUserId: mockTargetUserId,
        role: mockRole,
        timestamp: expect.any(Date),
      })
    );
  });

  it('logs role removal', async () => {
    await auditLogService.logRoleRemoved(
      mockOrgId,
      mockActedBy,
      mockTargetUserId,
      mockRole
    );

    expect(collection).toHaveBeenCalledWith(db, 'logs/permissions');
    expect(addDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'role_removed',
        orgId: mockOrgId,
        actedBy: mockActedBy,
        targetUserId: mockTargetUserId,
        role: mockRole,
        timestamp: expect.any(Date),
      })
    );
  });

  it('falls back to console log in development', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const errorSpy = jest.spyOn(console, 'error');

    // Mock process.env.NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
    });

    (addDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

    await expect(
      auditLogService.logRoleAdded(
        mockOrgId,
        mockActedBy,
        mockTargetUserId,
        mockRole
      )
    ).rejects.toThrow('Firestore error');

    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to write audit log:',
      expect.any(Error)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Role change:',
      expect.objectContaining({
        type: 'role_added',
        orgId: mockOrgId,
        actedBy: mockActedBy,
        targetUserId: mockTargetUserId,
        role: mockRole,
        timestamp: expect.any(String),
      })
    );

    // Restore original NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    });
  });
}); 
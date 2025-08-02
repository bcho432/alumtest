'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EditorRequest, EditorRequestStats, EDITOR_REQUEST_LIMITS } from '@/types/requests';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';

interface EditorRequestButtonProps {
  profileId: string;
  className?: string;
}

export function EditorRequestButton({ profileId, className }: EditorRequestButtonProps) {
  const { user } = useAuth();
  const { isAdmin, roles, isLoading } = useUserRoles();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [requestStats, setRequestStats] = useState<EditorRequestStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (!db) {
      toast.error('Database not initialized');
      setIsLoadingStats(false);
      return;
    }
    const dbInstance = db as import('firebase/firestore').Firestore;
    const loadRequestStats = async () => {
      try {
        const statsRef = doc(dbInstance, 'users', user.uid, 'editorRequestStats', 'stats');
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          setRequestStats(statsDoc.data() as EditorRequestStats);
        } else {
          // Initialize stats if they don't exist
          const initialStats: EditorRequestStats = {
            userId: user.uid,
            totalRequests: 0,
            pendingRequests: 0,
            lastRequestAt: Timestamp.now()
          };
          await setDoc(statsRef, initialStats);
          setRequestStats(initialStats);
        }
      } catch (error) {
        console.error('Error loading request stats:', error);
        toast.error('Failed to load request statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };
    loadRequestStats();
  }, [user, db]);

  // Don't show the button if:
  // 1. User is not authenticated
  // 2. User is already an admin
  // 3. User already has a role for this profile
  // 4. User is in cooldown period
  if (!user || isAdmin || roles[profileId] === 'editor' || isLoading || isLoadingStats) {
    return null;
  }

  const isInCooldown = requestStats?.cooldownUntil && 
    requestStats.cooldownUntil.toDate() > new Date();

  const canRequest = requestStats && 
    requestStats.pendingRequests < EDITOR_REQUEST_LIMITS.MAX_PENDING_REQUESTS &&
    !isInCooldown;

  const handleRequest = async () => {
    if (!user || !canRequest) return;
    if (!db) {
      toast.error('Database not initialized');
      return;
    }
    const dbInstance = db as import('firebase/firestore').Firestore;
    setIsRequesting(true);
    try {
      // Create an editor request
      const requestRef = doc(collection(dbInstance, 'profiles', profileId, 'editorRequests'));
      const request: EditorRequest = {
        id: requestRef.id,
        userId: user.uid,
        userEmail: user.email || '',
        profileId,
        status: 'pending',
        reason: reason.trim(),
        requestedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(requestRef, request);

      // Update request stats
      const statsRef = doc(dbInstance, 'users', user.uid, 'editorRequestStats', 'stats');
      const newStats: EditorRequestStats = {
        ...requestStats!,
        totalRequests: requestStats!.totalRequests + 1,
        pendingRequests: requestStats!.pendingRequests + 1,
        lastRequestAt: serverTimestamp() as Timestamp,
        cooldownUntil: Timestamp.fromDate(
          new Date(Date.now() + EDITOR_REQUEST_LIMITS.COOLDOWN_PERIOD_DAYS * 24 * 60 * 60 * 1000)
        )
      };

      await setDoc(statsRef, newStats);
      setRequestStats(newStats);

      toast.success('Editor request sent successfully');
      setShowRequestDialog(false);
      setReason('');
    } catch (error) {
      console.error('Error requesting editor role:', error);
      toast.error('Failed to send editor request');
    } finally {
      setIsRequesting(false);
    }
  };

  if (isInCooldown) {
    const cooldownDate = requestStats?.cooldownUntil?.toDate();
    return (
      <Button
        disabled
        className={className}
        variant="outline"
        title={`You can request again after ${cooldownDate?.toLocaleDateString()}`}
      >
        Request Editor Access (Cooldown)
      </Button>
    );
  }

  if (!canRequest) {
    return (
      <Button
        disabled
        className={className}
        variant="outline"
        title="You have reached the maximum number of pending requests"
      >
        Request Editor Access (Limit Reached)
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowRequestDialog(true)}
        className={className}
        variant="outline"
      >
        Request Editor Access
      </Button>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Editor Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Please provide a reason for requesting editor access to this profile.
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want to be an editor for this profile?"
              rows={4}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRequestDialog(false);
                  setReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequest}
                disabled={isRequesting || !reason.trim()}
              >
                {isRequesting ? 'Sending Request...' : 'Send Request'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 
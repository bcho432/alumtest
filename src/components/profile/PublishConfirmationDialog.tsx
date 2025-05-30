import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PublishConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPublishing: boolean;
  profileCompleteness: {
    required: number;
    completed: number;
  };
}

export const PublishConfirmationDialog: React.FC<PublishConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPublishing,
  profileCompleteness,
}) => {
  if (!isOpen) return null;

  const completenessPercentage = Math.round((profileCompleteness.completed / profileCompleteness.required) * 100);
  const isComplete = completenessPercentage === 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50"
          >
            <h3 className="text-lg font-semibold mb-2">Publish Profile</h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Profile Completeness</span>
                <span className="text-sm font-medium">{completenessPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    isComplete ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${completenessPercentage}%` }}
                />
              </div>
            </div>

            {!isComplete && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Your profile is {completenessPercentage}% complete. Consider adding:
                </p>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  {!profileCompleteness.completed && <li>Basic information</li>}
                  {profileCompleteness.completed < 2 && <li>Contact details</li>}
                  {profileCompleteness.completed < 4 && <li>Education history</li>}
                  {profileCompleteness.completed < 6 && <li>Work experience</li>}
                  {profileCompleteness.completed < 7 && <li>Story answers</li>}
                </ul>
                <p className="mt-2 text-sm text-blue-600">
                  You can still publish and add these details later.
                </p>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              Are you sure you want to publish this profile? Once published, it will be visible to all users.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isPublishing}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isPublishing}
                className="btn btn-primary"
              >
                {isPublishing ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Publishing...
                  </>
                ) : (
                  'Confirm Publish'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 
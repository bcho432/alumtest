import React, { useState } from 'react';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePermissions } from '@/hooks/usePermissions';
import { TimelineEntryType, TimelineEntry } from '@/types/profile';
import { useToast } from '@/hooks/useToast';
import { EducationFormValues, JobFormValues, EventFormValues, TimelineEntryFormValues } from '@/types/timeline';

const educationSchema = z.object({
  type: z.literal('education'),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

const jobSchema = z.object({
  type: z.literal('job'),
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

const eventSchema = z.object({
  type: z.literal('event'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
});

const getSchema = (type: TimelineEntryType) => {
  switch (type) {
    case 'education':
      return educationSchema;
    case 'job':
      return jobSchema;
    case 'event':
      return eventSchema;
  }
};

interface TimelineEntryFormProps {
  profileId: string;
  currentCount: number;
  onEntryAdded?: (entry: TimelineEntry) => void;
}

export const TimelineEntryForm: React.FC<TimelineEntryFormProps> = ({
  profileId,
  currentCount,
  onEntryAdded,
}) => {
  const [type, setType] = useState<TimelineEntryType>('education');
  const { isEditor, isLoading } = usePermissions();
  const { showToast } = useToast();

  const form = useForm<TimelineEntryFormValues>({
    resolver: zodResolver(getSchema(type)),
    defaultValues: {
      type,
    } as TimelineEntryFormValues,
  });

  const onSubmit = async (values: TimelineEntryFormValues) => {
    if (!isEditor) {
      showToast({
        title: 'Permission Denied',
        description: 'You do not have permission to add entries.',
        status: 'error'
      });
      return;
    }
    if (currentCount >= 100) {
      showToast({
        title: 'Limit Reached',
        description: 'Maximum number of timeline entries reached.',
        status: 'error'
      });
      return;
    }
    try {
      if (!db) {
        showToast({
          title: 'Error',
          description: 'Database is not initialized.',
          status: 'error'
        });
        return;
      }
      const timelineRef = collection(db, 'profiles', profileId, 'timeline');
      const entryData: any = {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(timelineRef, entryData);
      if (onEntryAdded) {
        onEntryAdded({ id: docRef.id, ...entryData });
      }
      showToast({
        title: 'Success',
        description: 'Entry added successfully!',
        status: 'success'
      });
      form.reset({ type } as TimelineEntryFormValues);
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to add entry.',
        status: 'error'
      });
    }
  };

  const getErrorMessage = (field: string) => {
    const errors = form.formState.errors;
    if (type === 'education') {
      return (errors as FieldErrors<EducationFormValues>)[field as keyof EducationFormValues]?.message;
    } else if (type === 'job') {
      return (errors as FieldErrors<JobFormValues>)[field as keyof JobFormValues]?.message;
    } else if (type === 'event') {
      return (errors as FieldErrors<EventFormValues>)[field as keyof EventFormValues]?.message;
    }
    return undefined;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Type</label>
        <select
          className="input"
          value={type}
          onChange={e => setType(e.target.value as TimelineEntryType)}
          disabled={isLoading || !isEditor}
        >
          <option value="education">Education</option>
          <option value="job">Job</option>
          <option value="event">Event</option>
        </select>
      </div>
      {type === 'education' && (
        <>
          <div>
            <label className="label">Institution</label>
            <input className="input" {...form.register('institution')} />
            {getErrorMessage('institution') && (
              <div className="text-red-600 text-sm">{getErrorMessage('institution')}</div>
            )}
          </div>
          <div>
            <label className="label">Degree</label>
            <input className="input" {...form.register('degree')} />
            {getErrorMessage('degree') && (
              <div className="text-red-600 text-sm">{getErrorMessage('degree')}</div>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label">Start Date</label>
              <input className="input" type="date" {...form.register('startDate')} />
              {getErrorMessage('startDate') && (
                <div className="text-red-600 text-sm">{getErrorMessage('startDate')}</div>
              )}
            </div>
            <div className="flex-1">
              <label className="label">End Date</label>
              <input className="input" type="date" {...form.register('endDate')} />
              {getErrorMessage('endDate') && (
                <div className="text-red-600 text-sm">{getErrorMessage('endDate')}</div>
              )}
            </div>
          </div>
        </>
      )}
      {type === 'job' && (
        <>
          <div>
            <label className="label">Title</label>
            <input className="input" {...form.register('title')} />
            {getErrorMessage('title') && (
              <div className="text-red-600 text-sm">{getErrorMessage('title')}</div>
            )}
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" {...form.register('company')} />
            {getErrorMessage('company') && (
              <div className="text-red-600 text-sm">{getErrorMessage('company')}</div>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label">Start Date</label>
              <input className="input" type="date" {...form.register('startDate')} />
              {getErrorMessage('startDate') && (
                <div className="text-red-600 text-sm">{getErrorMessage('startDate')}</div>
              )}
            </div>
            <div className="flex-1">
              <label className="label">End Date</label>
              <input className="input" type="date" {...form.register('endDate')} />
              {getErrorMessage('endDate') && (
                <div className="text-red-600 text-sm">{getErrorMessage('endDate')}</div>
              )}
            </div>
          </div>
        </>
      )}
      {type === 'event' && (
        <>
          <div>
            <label className="label">Title</label>
            <input className="input" {...form.register('title')} />
            {getErrorMessage('title') && (
              <div className="text-red-600 text-sm">{getErrorMessage('title')}</div>
            )}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" {...form.register('description')} />
            {getErrorMessage('description') && (
              <div className="text-red-600 text-sm">{getErrorMessage('description')}</div>
            )}
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" {...form.register('date')} />
            {getErrorMessage('date') && (
              <div className="text-red-600 text-sm">{getErrorMessage('date')}</div>
            )}
          </div>
        </>
      )}
      <button type="submit" className="btn btn-primary" disabled={isLoading || !isEditor || currentCount >= 100}>
        Add Entry
      </button>
      {currentCount >= 100 && (
        <div className="text-red-600 text-sm">Entry limit reached (100).</div>
      )}
    </form>
  );
}; 
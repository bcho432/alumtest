import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimelineEvent } from '../../types/profile';
import { useToast } from '../../hooks/useToast';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { DatePicker } from '../ui/DatePicker';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { TimelineMediaUpload } from '../media/TimelineMediaUpload';

const formSchema = z.object({
  type: z.enum(['education', 'job', 'event']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Date is required'),
  location: z.string().optional(),
  institution: z.string().optional(),
  company: z.string().optional(),
  degree: z.string().optional(),
  position: z.string().optional(),
  importance: z.enum(['high', 'medium', 'low']).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  tags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TimelineEntryFormProps {
  event?: TimelineEvent;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TimelineEntryForm: React.FC<TimelineEntryFormProps> = ({
  event,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: event?.type || 'event',
      title: event?.title || '',
      description: event?.description || '',
      startDate: event?.startDate ? new Date(event.startDate).toISOString() : new Date().toISOString(),
      location: event?.location || '',
      institution: event?.metadata?.institution || '',
      company: event?.metadata?.company || '',
      degree: event?.metadata?.degree || '',
      position: event?.metadata?.position || '',
      importance: event?.metadata?.importance || 'medium',
      visibility: event?.metadata?.visibility || 'public',
      tags: event?.metadata?.tags || [],
      mediaUrls: event?.mediaUrls || [],
    },
  });

  const eventType = watch('type');

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      trackEvent('timeline_event_updated', {
        eventType: data.type,
        hasLocation: !!data.location,
        hasDescription: !!data.description,
        hasMedia: !!data.mediaUrls?.length,
      });
      showToast({
        title: 'Success',
        description: 'Event saved successfully',
        status: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save event',
        status: 'error',
      });
      trackEvent('timeline_event_update_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Event Type</label>
          <Select
            id="type"
            value={watch('type') ?? 'event'}
            onChange={(value: string) => setValue('type', value as 'education' | 'job' | 'event')}
            options={[
              { value: 'education', label: 'Education' },
              { value: 'job', label: 'Job' },
              { value: 'event', label: 'Event' }
            ]}
          >
          </Select>
          {errors.type?.message && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Title</label>
          <Input
            id="title"
            {...register('title')}
            error={errors.title?.message}
          />
        </div>
      </div>

      {eventType === 'education' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label htmlFor="institution" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Institution</label>
          <Input
            id="institution"
            {...register('institution')}
            error={errors.institution?.message}
          />
          <label htmlFor="degree" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Degree</label>
          <Input
            id="degree"
            {...register('degree')}
            error={errors.degree?.message}
          />
        </div>
      )}

      {eventType === 'job' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label htmlFor="company" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Company</label>
          <Input
            id="company"
            {...register('company')}
            error={errors.company?.message}
          />
          <label htmlFor="position" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Position</label>
          <Input
            id="position"
            {...register('position')}
            error={errors.position?.message}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Date</label>
        <DatePicker
          value={watch('startDate') ? new Date(watch('startDate')) : null}
          onChange={date => setValue('startDate', date ? date.toISOString() : '')}
        />
        <label htmlFor="location" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Location</label>
        <Input
          id="location"
          {...register('location')}
          error={errors.location?.message}
        />
      </div>

      <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Description</label>
      <Textarea
        id="description"
        {...register('description')}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label htmlFor="importance" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Importance</label>
        <Select
          id="importance"
          value={watch('importance') ?? 'medium'}
          onChange={(value: string) => setValue('importance', value as 'high' | 'medium' | 'low')}
          options={[
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ]}
        >
        </Select>
        {errors.importance?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.importance.message}</p>
        )}
        <label htmlFor="visibility" className="block text-sm font-medium leading-6 text-gray-900 mb-1">Visibility</label>
        <Select
          id="visibility"
          value={watch('visibility') ?? 'public'}
          onChange={(value: string) => setValue('visibility', value as 'public' | 'private')}
          options={[
            { value: 'public', label: 'Public' },
            { value: 'private', label: 'Private' }
          ]}
        >
        </Select>
        {errors.visibility?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.visibility.message}</p>
        )}
      </div>

      {event && (
        <TimelineMediaUpload
          eventId={event.id}
          existingMedia={event.mediaUrls || []}
          onMediaChange={(urls) => setValue('mediaUrls', urls)}
        />
      )}

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Icon name="save" className="mr-2" />
              Save Event
            </>
          )}
        </Button>
      </div>
    </form>
  );
}; 
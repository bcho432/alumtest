import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { LifeEvent } from '@/types/profile';

const eventSchema = z.object({
  type: z.enum(['education', 'work', 'other']),
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  institution: z.string().optional(),
  degree: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => void;
  event?: LifeEvent;
  defaultType?: 'education' | 'work' | 'other';
}

export function EventForm({ isOpen, onClose, onSubmit, event, defaultType }: EventFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          type: event.type,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          description: event.description,
          institution: event.metadata?.institution,
          degree: event.metadata?.degree,
          company: event.metadata?.company,
          position: event.metadata?.position,
        }
      : {
          type: defaultType || 'other',
        },
  });

  const eventType = watch('type');

  const handleFormSubmit = (data: EventFormData) => {
    onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <Select
              value={eventType}
              onChange={(value) => register('type').onChange({ target: { value } })}
              options={[
                { value: 'education', label: 'Education' },
                { value: 'work', label: 'Work' },
                { value: 'other', label: 'Other' }
              ]}
            />
            {errors.type?.message && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <Input
              label="Title"
              {...register('title')}
              error={errors.title?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="date"
                label="Start Date"
                {...register('startDate')}
                error={errors.startDate?.message}
              />
            </div>
            <div>
              <Input
                type="date"
                label="End Date"
                {...register('endDate')}
                error={errors.endDate?.message}
              />
            </div>
          </div>

          <div>
            <Input
              label="Location"
              {...register('location')}
              error={errors.location?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              {...register('description')}
              className={errors.description?.message ? 'border-red-500' : ''}
            />
            {errors.description?.message && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {eventType === 'education' && (
            <>
              <div>
                <Input
                  label="Institution"
                  {...register('institution')}
                  error={errors.institution?.message}
                />
              </div>
              <div>
                <Input
                  label="Degree"
                  {...register('degree')}
                  error={errors.degree?.message}
                />
              </div>
            </>
          )}

          {eventType === 'work' && (
            <>
              <div>
                <Input
                  label="Company"
                  {...register('company')}
                  error={errors.company?.message}
                />
              </div>
              <div>
                <Input
                  label="Position"
                  {...register('position')}
                  error={errors.position?.message}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
import { sortTimelineEntries } from '../timeline';
import { TimelineEntry } from '@/types/profile';

describe('sortTimelineEntries', () => {
  const createEducationEntry = (startDate: Date, endDate?: Date): TimelineEntry => ({
    id: '1',
    type: 'education',
    institution: 'Test University',
    degree: 'Test Degree',
    startDate,
    endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createJobEntry = (startDate: Date, endDate?: Date): TimelineEntry => ({
    id: '2',
    type: 'job',
    title: 'Test Job',
    company: 'Test Company',
    startDate,
    endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createEventEntry = (date: Date): TimelineEntry => ({
    id: '3',
    type: 'event',
    title: 'Test Event',
    date,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('sorts entries chronologically by start date', () => {
    const entries: TimelineEntry[] = [
      createEducationEntry(new Date('2022-01-01'), new Date('2022-12-31')),
      createJobEntry(new Date('2021-01-01'), new Date('2021-12-31')),
      createEventEntry(new Date('2023-01-01')),
    ];

    const sorted = sortTimelineEntries(entries);

    expect(sorted[0].type).toBe('job');
    expect(sorted[1].type).toBe('education');
    expect(sorted[2].type).toBe('event');
  });

  it('places entries without dates at the end', () => {
    const entries: TimelineEntry[] = [
      createEducationEntry(new Date('2022-01-01')),
      createJobEntry(new Date('2021-01-01')),
      createEventEntry(new Date('2023-01-01')),
      // @ts-ignore - Testing invalid data
      { id: '4', type: 'education', institution: 'No Date', degree: 'No Date', createdAt: new Date(), updatedAt: new Date() },
    ];

    const sorted = sortTimelineEntries(entries);

    expect(sorted[0].type).toBe('job');
    expect(sorted[1].type).toBe('education');
    expect(sorted[2].type).toBe('event');
    expect(sorted[3].type).toBe('education');
    expect(sorted[3].institution).toBe('No Date');
  });

  it('handles empty array', () => {
    const sorted = sortTimelineEntries([]);
    expect(sorted).toEqual([]);
  });
}); 
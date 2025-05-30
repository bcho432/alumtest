import { DiffResult } from '@/utils/diff';
import { cn } from '@/lib/utils';

interface DiffSectionProps {
  title: string;
  diff: DiffResult;
  className?: string;
}

interface DiffChange {
  type: 'deletion' | 'addition' | 'unchanged';
  text: string;
}

export const DiffSection = ({ title, diff, className }: DiffSectionProps) => {
  return (
    <div className={cn('mb-6', className)}>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        {diff.changes.map((change: DiffChange, index: number) => (
          <div
            key={index}
            className={cn(
              'whitespace-pre-wrap break-words',
              {
                'bg-red-100 text-red-800': change.type === 'deletion',
                'bg-green-100 text-green-800': change.type === 'addition',
                'text-gray-800': change.type === 'unchanged',
              }
            )}
          >
            {change.type === 'deletion' && '− '}
            {change.type === 'addition' && '+ '}
            {change.text}
          </div>
        ))}
      </div>
    </div>
  );
}; 
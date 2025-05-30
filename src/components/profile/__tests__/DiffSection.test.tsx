import { render, screen } from '@testing-library/react';
import { DiffSection } from '../DiffSection';
import { DiffResult } from '@/utils/diff';

describe('DiffSection', () => {
  const mockDiff: DiffResult = {
    oldText: 'old text',
    newText: 'new text',
    changes: [
      { type: 'deletion', text: 'old text' },
      { type: 'addition', text: 'new text' },
    ],
  };

  it('should render the title', () => {
    render(<DiffSection title="Test Section" diff={mockDiff} />);
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('should render deletions with red background', () => {
    render(<DiffSection title="Test Section" diff={mockDiff} />);
    const deletion = screen.getByText((content, element) => {
      return element?.textContent === '− old text';
    });
    expect(deletion).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should render additions with green background', () => {
    render(<DiffSection title="Test Section" diff={mockDiff} />);
    const addition = screen.getByText((content, element) => {
      return element?.textContent === '+ new text';
    });
    expect(addition).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should render unchanged text with default styling', () => {
    const unchangedDiff: DiffResult = {
      oldText: 'same text',
      newText: 'same text',
      changes: [{ type: 'unchanged', text: 'same text' }],
    };

    render(<DiffSection title="Test Section" diff={unchangedDiff} />);
    const unchanged = screen.getByText('same text');
    expect(unchanged).toHaveClass('text-gray-800');
    expect(unchanged).not.toHaveTextContent('−');
    expect(unchanged).not.toHaveTextContent('+');
  });

  it('should apply custom className', () => {
    const customClass = 'custom-class';
    render(<DiffSection title="Test Section" diff={mockDiff} className={customClass} />);
    expect(screen.getByText('Test Section').parentElement).toHaveClass(customClass);
  });

  it('should handle multiple changes in sequence', () => {
    const complexDiff: DiffResult = {
      oldText: 'old text',
      newText: 'new text',
      changes: [
        { type: 'unchanged', text: 'common ' },
        { type: 'deletion', text: 'old' },
        { type: 'addition', text: 'new' },
        { type: 'unchanged', text: ' text' },
      ],
    };

    render(<DiffSection title="Test Section" diff={complexDiff} />);
    
    const unchanged1 = screen.getByText((content, element) => {
      return element?.textContent === 'common ';
    });
    const deletion = screen.getByText((content, element) => {
      return element?.textContent === '− old';
    });
    const addition = screen.getByText((content, element) => {
      return element?.textContent === '+ new';
    });
    const unchanged2 = screen.getByText((content, element) => {
      return element?.textContent === ' text';
    });

    expect(unchanged1).toHaveClass('text-gray-800');
    expect(deletion).toHaveClass('bg-red-100', 'text-red-800');
    expect(addition).toHaveClass('bg-green-100', 'text-green-800');
    expect(unchanged2).toHaveClass('text-gray-800');
  });
}); 
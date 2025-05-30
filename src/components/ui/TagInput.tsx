import React, { useState, KeyboardEvent } from 'react';
import { Input } from './Input';
import { Badge } from './Badge';
import { Icon } from './Icon';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ value, onChange, placeholder = 'Add tags...', maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const tag = inputValue.trim();
    if (tag && !value.includes(tag) && value.length < maxTags) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={value.length >= maxTags}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!inputValue.trim() || value.length >= maxTags}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="plus" className="w-4 h-4" />
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <Icon name="x" className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {value.length >= maxTags && (
        <p className="text-sm text-gray-500">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
} 
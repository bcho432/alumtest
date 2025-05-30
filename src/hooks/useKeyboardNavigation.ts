import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyMap {
  [key: string]: KeyHandler;
}

export function useKeyboardNavigation(keyMap: KeyMap) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const handler = keyMap[event.key];
      if (handler) {
        handler(event);
      }
    },
    [keyMap]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Example usage:
// useKeyboardNavigation({
//   'Escape': () => setIsOpen(false),
//   'Enter': () => handleSubmit(),
//   'ArrowUp': () => selectPrevious(),
//   'ArrowDown': () => selectNext(),
// }); 
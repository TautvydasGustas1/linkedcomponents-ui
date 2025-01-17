import { useEffect } from 'react';

import useMountedState from './useMountedState';

function useDebounce<V>(value: V, delay: number): V {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useMountedState(value);

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [delay, setDebouncedValue, value] // Only re-call effect if value or delay changes
  );

  return debouncedValue;
}

export default useDebounce;

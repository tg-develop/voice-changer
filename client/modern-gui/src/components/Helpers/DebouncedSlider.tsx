import React, { useState, useEffect, useCallback, useRef, InputHTMLAttributes } from 'react';

interface DebouncedSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number; // Controlled component value
  onChange: (value: number) => void; // Debounced change callback
  onImmediateChange?: (value: number) => void; // Optional: Callback for immediate value change
  // id, name, min, max, step, className, disabled, etc., will be inherited from InputHTMLAttributes
}

export const useDebouncedCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) => {
  const timeoutRef = useRef<number>();

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    []
  );

  return debouncedFn;
};

const DebouncedSlider: React.FC<DebouncedSliderProps> = ({
  value,
  onChange,
  onImmediateChange,
  ...rest
}) => {
  const [internalValue, setInternalValue] = useState<number>(value);
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const debouncedChange = useDebouncedCallback((val: number) => {
    onChange(val);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.valueAsNumber;
    setInternalValue(val);
    if (onImmediateChange) onImmediateChange(val);
    debouncedChange(val);
  };

  return (
    <input
      type="range"
      {...rest} // Spread all other native input attributes
      value={internalValue} // Controlled internal value
      onChange={handleChange} // Internal handler
    />
  );
};

export default DebouncedSlider;

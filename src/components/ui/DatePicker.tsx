import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Input } from './Input';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  required?: boolean;
}

export const DatePicker = ({ value, onChange, minDate, maxDate, placeholder = 'Select date', required }: DatePickerProps) => {
  return (
    <ReactDatePicker
      selected={value}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      placeholderText={placeholder}
      required={required}
      dateFormat="MMMM d, yyyy"
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      wrapperClassName="w-full"
      customInput={<Input />}
    />
  );
}; 
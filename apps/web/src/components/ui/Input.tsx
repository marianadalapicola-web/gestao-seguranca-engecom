import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { inputClasses } from './Field';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, hasError, ...props }, ref) => (
  <input ref={ref} className={inputClasses(hasError) + (className ? ` ${className}` : '')} {...props} />
));
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, hasError, ...props }, ref) => (
  <textarea ref={ref} className={inputClasses(hasError) + ' min-h-20' + (className ? ` ${className}` : '')} {...props} />
));
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, hasError, children, ...props }, ref) => (
  <select ref={ref} className={inputClasses(hasError) + ' bg-white' + (className ? ` ${className}` : '')} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

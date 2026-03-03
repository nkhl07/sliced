'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={1}
      className={cn(
        'flex w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});
ChatInput.displayName = 'ChatInput';

export { ChatInput };

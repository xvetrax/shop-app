import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function Button({ children, className = "", ...rest }: Props) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-md bg-cocoa-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cocoa-700 disabled:opacity-60 " +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}

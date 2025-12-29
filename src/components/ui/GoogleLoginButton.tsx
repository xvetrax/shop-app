"use client";

import React from "react";

interface GoogleLoginButtonProps {
  onClick: () => void;
}

export function GoogleLoginButton({ onClick }: GoogleLoginButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
    >
      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M12.24 10.27v3.29h5.18c-.22 1.25-.87 2.27-1.87 2.94-.99.67-2.3.93-3.31.93-2.58 0-4.72-1.74-5.49-4.08h-2.1v-.01h-.01c-.1-.28-.16-.58-.16-.91 0-.33.06-.63.16-.91V10.27H5.25v-.01h-.01c.77-2.34 2.91-4.08 5.49-4.08 1.48 0 2.76.5 3.79 1.46L16.29 5.8C14.86 4.34 13.06 3.73 11.24 3.73c-3.1 0-5.74 1.77-7.1 4.38H2.1v3.29h3.14V14.1H2.1v3.29h3.14c1.36 2.61 4 4.38 7.1 4.38 2.05 0 3.82-.57 5.09-1.55 1.27-.98 2.1-2.31 2.37-3.9H12.24z"/>
      </svg>
      Sign in with Google
    </button>
  );
}

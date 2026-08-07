import React from 'react';

export default function Logo({ size = 32, className = '' }) {
  return (
    <div className={`opticode-logo-brand ${className}`}>
      {/*
        SVG replicating the OptiCode logo:
        - Blue-outlined arrow/cursor pointer (hollow, matching the logo image)
        - Slash mark inside the pointer body
      */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-svg-icon"
      >
        {/* Cursor arrow outline - matches the blue pointer in the logo */}
        <path
          d="M8 4L8 42L18 32L26 48L32 45L24 29L38 29L8 4Z"
          fill="#3B82F6"
          stroke="#2563EB"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Inner highlight / slash element */}
        <path
          d="M14 12L14 30L19 25"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="logo-text-group">
        <span className="logo-opti">OPTI</span>
        <span className="logo-code">CODE</span>
      </div>
    </div>
  );
}

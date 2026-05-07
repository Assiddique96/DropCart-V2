import React from "react";

const CartUploadLogo = (props) => {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Drop shadow */}
      <defs>
        <filter id="cartShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="4"
            dy="6"
            stdDeviation="4"
            floodColor="#000000"
            floodOpacity="0.4"
          />
        </filter>
      </defs>

      <g
        fill="#d8e8e9"
        filter="url(#cartShadow)"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Cart body */}
        <path d="M15 40h20l6 32h54l6-28H40" strokeWidth="0" />

        {/* Cart handle */}
        <rect x="10" y="32" width="30" height="8" rx="4" />

        {/* Cart bottom chevron */}
        <path d="M35 72 L55 96 L75 72" strokeWidth="0" />

        {/* Wheels */}
        <circle cx="35" cy="96" r="6" />
        <circle cx="55" cy="96" r="6" />

        {/* Up arrow */}
        <path d="M60 16 L60 48" strokeWidth="8" />
        <path d="M48 28 L60 16 L72 28" strokeWidth="8" />
      </g>
    </svg>
  );
};

export default ShpinxLogo;

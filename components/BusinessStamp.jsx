// BusinessStamp.jsx
import React from "react";

const stampBase = {
  wrapper: {
    position: "relative",
    width: "96px",
    height: "96px",
  },
  outerCircle: accent => ({
    position: "absolute",
    inset: "4px",
    borderRadius: "999px",
    border: `2px solid ${accent}`,
    opacity: 0.85,
  }),
  innerCircle: accent => ({
    position: "absolute",
    inset: "12px",
    borderRadius: "999px",
    border: `1px solid ${accent}`,
    opacity: 0.85,
  }),
  topText: accent => ({
    position: "absolute",
    top: "22px",
    width: "100%",
    textAlign: "center",
    fontSize: "9px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: accent,
    whiteSpace: "nowrap",
  }),
  middleText: accent => ({
    position: "absolute",
    top: "40px",
    width: "100%",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.26em",
    textTransform: "uppercase",
    color: accent,
    whiteSpace: "nowrap",
  }),
  bottomText: accent => ({
    position: "absolute",
    bottom: "20px",
    width: "100%",
    textAlign: "center",
    fontSize: "8px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: accent,
    whiteSpace: "nowrap",
  }),
};

const BusinessStamp = ({
  accent = "#053C6E",
  companyText = "Nova Commerce",
  statusText = "Paid",
  footerText = "Verified · Secure · Digital",
  size = 96,
  ring = "double", // "double" | "single" | "none"
  opacity = 0.9,
  thickness = 2,
  shape = "circle", // "circle" | "rounded-rect"
}) => {
  const wrapper = {
    ...stampBase.wrapper,
    width: `${size}px`,
    height: `${size}px`,
  };

  const makeBorder = inset => ({
    position: "absolute",
    inset: `${inset}px`,
    borderRadius: shape === "circle" ? "999px" : "12px",
    border: `${thickness}px solid ${accent}`,
    opacity,
  });

  return (
    <div style={wrapper}>
      {/* Rings */}
      {ring !== "none" && (
        <div style={makeBorder(4)} />
      )}
      {ring === "double" && (
        <div style={makeBorder(12)} />
      )}

      {/* Texts */}
      <div style={stampBase.topText(accent)}>{companyText}</div>
      <div style={stampBase.middleText(accent)}>{statusText}</div>
      <div style={stampBase.bottomText(accent)}>{footerText}</div>
    </div>
  );
};

export default BusinessStamp;

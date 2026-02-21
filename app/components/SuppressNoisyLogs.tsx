"use client";

import { useEffect } from "react";

export default function SuppressNoisyLogs() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const origLog = console.log;
    const origWarn = console.warn;
    const skip = (args: unknown[]): boolean => {
      const msg = typeof args[0] === "string" ? args[0] : String(args[0] ?? "");
      return (
        msg.includes("React DevTools") ||
        msg.includes("react.dev/link/react-devtools") ||
        msg.includes("[HMR]") ||
        msg.includes("preloaded using link preload but not used") ||
        msg.includes("_next/static/chunks") && msg.includes("preload")
      );
    };
    console.log = (...args: unknown[]) => {
      if (skip(args)) return;
      origLog.apply(console, args);
    };
    console.warn = (...args: unknown[]) => {
      if (skip(args)) return;
      origWarn.apply(console, args);
    };
    return () => {
      console.log = origLog;
      console.warn = origWarn;
    };
  }, []);
  return null;
}

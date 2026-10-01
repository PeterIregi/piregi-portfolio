"use client";

import { useEffect } from "react";

export function PageViewBeacon() {
  useEffect(() => {
    const sendPageView = () => {
      fetch("/api/analytics/viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: window.location.pathname }),
        keepalive: true,
      }).catch(() => {}); // Silently fail
    };

    sendPageView();

    // Also track navigation changes
    const handleRouteChange = () => sendPageView();
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  return null;
}
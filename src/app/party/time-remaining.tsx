"use client";

import { useEffect, useRef, useState } from "react";

export function TimeRemaining({ endTime }: { endTime: number }) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const timeRemaining = endTime - Date.now();
      setTimeRemaining(timeRemaining);
    }, 100);

    return () => {
      clearInterval(intervalRef.current);
    };
  });

  const secondsRemaining = Math.max(0, Math.floor(timeRemaining / 1000));

  return <p>{secondsRemaining} seconds remaining</p>;
}

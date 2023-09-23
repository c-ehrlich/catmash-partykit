"use client";

import { useEffect, useRef, useState } from "react";

export function TimeRemaining({
  endTime,
  totalVotes,
}: {
  endTime: number;
  totalVotes: number;
}) {
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

  return (
    <p className="text-purple-600 text-xl text-bold">
      {totalVotes} vote{totalVotes !== 1 && "s"}. {secondsRemaining} seconds
      remaining.
    </p>
  );
}

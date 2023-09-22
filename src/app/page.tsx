"use client";

import dynamic from "next/dynamic";

const NoSsrParty = dynamic(() => import("./party/no-ssr-party"), {
  ssr: false,
});

export default function Home() {
  return <NoSsrParty />;
}

"use client";

import dynamic from "next/dynamic";

const NoSSRCatVoting = dynamic(() => import("./party/cat-voting"), {
  ssr: false,
});

export default function Home() {
  return <NoSSRCatVoting />;
}

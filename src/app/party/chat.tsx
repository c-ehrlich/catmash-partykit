"use client";

import { useMultiplayer } from "../providers/multiplayer-context";
import { observer } from "mobx-react-lite";
import { party } from "./party-store";
import { useState } from "react";
import { ChatMessage } from "@/partykit/server";

export const Chat = observer(function Chat() {
  const [input, setInput] = useState("");

  const { socket } = useMultiplayer();

  if (!socket) {
    return <h1>no socket</h1>;
  }

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socket.send(JSON.stringify({ type: "chat", message: input }));
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2">
      <form className="flex gap-2" onSubmit={handleSendMessage}>
        <input
          className="border-2 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-slate-600 p-1" type="submit">
          Send
        </button>
      </form>
      <ul suppressHydrationWarning>
        {party.messages.map((message) => (
          <Message key={message.id} message={message} sessionId={socket.id} />
        ))}
      </ul>
    </div>
  );
});

function Message({
  message,
  sessionId,
}: {
  message: ChatMessage;
  sessionId: string;
}) {
  const inner =
    message.type === "info" ? (
      <span className="text-red-500">Info: {message.message}</span>
    ) : message.user === sessionId ? (
      <span className="text-green-500">You: {message.message}</span>
    ) : (
      <span>Someone: {message.message}</span>
    );

  return <li suppressHydrationWarning>{inner}</li>;
}
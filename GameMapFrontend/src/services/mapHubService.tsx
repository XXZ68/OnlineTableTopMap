// src/hooks/useMapHub.ts
import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

interface UseMapHubProps {
  sessionId: string;
  playerId: string;
  playerName: string;
  onTokenMoved: (tokenId: string, x: number, y: number) => void;
  onPlayerJoined: (id: string, name: string) => void;
}

export function useMapHub({
  sessionId,
  playerId,
  playerName,
  onTokenMoved,
  onPlayerJoined,
}: UseMapHubProps) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    // 1. Build connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/map") // Adjust to your backend URL or proxy route
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // 2. Register backend event listeners (from IMapClient.cs)
    connection.on("TokenMoved", onTokenMoved);
    connection.on("PlayerJoined", onPlayerJoined);

    // 3. Connect and join the session room
    async function connect() {
      try {
        await connection.start();
        await connection.invoke("JoinSession", sessionId, playerId, playerName);
      } catch (err) {
        console.error("SignalR connection failed: ", err);
      }
    }

    connect();

    // 4. Cleanup on unmount (leave session & disconnect)
    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("LeaveSession", sessionId, playerId)
          .catch(() => {})
          .finally(() => connection.stop());
      } else {
        connection.stop();
      }
    };
  }, [sessionId, playerId, playerName]);

  // Methods to trigger hub actions (from MapHub.cs)
  const moveToken = async (tokenId: string, targetX: number, targetY: number) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke("MoveToken", sessionId, tokenId, targetX, targetY);
    }
  };

  return { moveToken };
}

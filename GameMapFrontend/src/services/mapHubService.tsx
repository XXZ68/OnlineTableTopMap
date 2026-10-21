// src/services/mapHubService.tsx
import * as signalR from "@microsoft/signalr";
import type {
  MapTokenDto,
  PlaceCharacterTokenDto,
  SpawnMonsterTokenDto,
  CastSpellDto,
  SpellCastEventDto,
  GridDto,
  UpdateGridDto,
} from "../model";

export interface MapHubEvents {
  onTokenSpawned?: (token: MapTokenDto) => void;
  onTokenMoved?: (tokenId: string, newGridX: number, newGridY: number) => void;
  onTokenHpChanged?: (tokenId: string, newHp: number) => void;
  onTokenRemoved?: (tokenId: string) => void;
  onGridUpdated?: (grid: GridDto) => void;
  onMapChanged?: (newMapId: string) => void;
  onSpellCasted?: (spellEvent: SpellCastEventDto) => void;
  onSpellDismissed?: (activeSpellEffectId: string) => void;
  onPlayerJoined?: (playerId: string, playerName: string) => void;
  onPlayerLeft?: (playerId: string) => void;
}

class MapHubService {
  private connection: signalR.HubConnection | null = null;
  private currentSessionId: string | null = null;
  private currentPlayerId: string | null = null;

  // Uses VITE_API_URL (http://localhost:5089/hubs/map) directly!
  private getHubUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5089";
    return `${baseUrl.replace(/\/$/, "")}/hubs/map`;
  }

  public async connect(
    sessionId: string,
    playerId: string,
    playerName: string,
    events: MapHubEvents
  ): Promise<void> {
    if (this.connection) {
      await this.disconnect();
    }

    if (!sessionId) return;

    this.currentSessionId = sessionId;
    this.currentPlayerId = playerId;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.getHubUrl())
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Register Server -> Client listeners (IMapClient.cs)
    this.connection.on("TokenSpawned", (token: MapTokenDto) => events.onTokenSpawned?.(token));
    this.connection.on("TokenMoved", (id: string, x: number, y: number) => events.onTokenMoved?.(id, x, y));
    this.connection.on("TokenHpChanged", (id: string, hp: number) => events.onTokenHpChanged?.(id, hp));
    this.connection.on("TokenRemoved", (id: string) => events.onTokenRemoved?.(id));
    this.connection.on("GridUpdated", (grid: GridDto) => events.onGridUpdated?.(grid));
    this.connection.on("MapChanged", (mapId: string) => events.onMapChanged?.(mapId));
    this.connection.on("SpellCasted", (ev: SpellCastEventDto) => events.onSpellCasted?.(ev));
    this.connection.on("SpellDismissed", (id: string) => events.onSpellDismissed?.(id));
    this.connection.on("PlayerJoined", (id: string, name: string) => events.onPlayerJoined?.(id, name));
    this.connection.on("PlayerLeft", (id: string) => events.onPlayerLeft?.(id));

    this.connection.onreconnected(async () => {
      if (this.currentSessionId && this.currentPlayerId) {
        await this.connection?.invoke("JoinSession", this.currentSessionId, this.currentPlayerId, playerName);
      }
    });

    await this.connection.start();
    await this.connection.invoke("JoinSession", sessionId, playerId, playerName);
    console.log(`✅ Connected to MapHub at ${this.getHubUrl()} (Session: ${sessionId})`);
  }

  public async disconnect(): Promise<void> {
    if (!this.connection) return;

    try {
      if (
        this.connection.state === signalR.HubConnectionState.Connected &&
        this.currentSessionId &&
        this.currentPlayerId
      ) {
        await this.connection.invoke("LeaveSession", this.currentSessionId, this.currentPlayerId);
      }
    } catch (err) {
      console.warn("Error leaving session:", err);
    } finally {
      await this.connection.stop();
      this.connection = null;
    }
  }

  private isReady(): boolean {
    return (
      this.connection?.state === signalR.HubConnectionState.Connected &&
      Boolean(this.currentSessionId)
    );
  }

  // --- Client -> Server Invocations (MapHub.cs) ---

  public async placeCharacterToken(mapId: string, dto: PlaceCharacterTokenDto): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("PlaceCharacterToken", this.currentSessionId, mapId, dto);
    }
  }

  public async spawnMonsterToken(mapId: string, dto: SpawnMonsterTokenDto): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("SpawnMonsterToken", this.currentSessionId, mapId, dto);
    }
  }

  public async moveToken(tokenId: string, targetX: number, targetY: number): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("MoveToken", this.currentSessionId, tokenId, targetX, targetY);
    }
  }

  public async updateTokenHp(tokenId: string, newHp: number): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("UpdateTokenHp", this.currentSessionId, tokenId, newHp);
    }
  }

  public async removeToken(tokenId: string): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("RemoveToken", this.currentSessionId, tokenId);
    }
  }

  public async castSpell(mapId: string, dto: CastSpellDto): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("CastSpell", this.currentSessionId, mapId, dto);
    }
  }

  public async dismissSpell(activeSpellEffectId: string): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("DismissSpell", this.currentSessionId, activeSpellEffectId);
    }
  }

  public async updateGrid(mapId: string, dto: UpdateGridDto): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("UpdateGrid", this.currentSessionId, mapId, dto);
    }
  }

  public async changeMap(newMapId: string): Promise<void> {
    if (this.isReady()) {
      await this.connection!.invoke("ChangeMap", this.currentSessionId, newMapId);
    }
  }
}

export const mapHubService = new MapHubService();

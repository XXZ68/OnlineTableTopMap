# Systemarchitektur

```mermaid
flowchart LR
    user["Dungeon Master / Spieler"]

    subgraph frontend["Frontend: React + TypeScript"]
        spa["React SPA<br/>React Router, Pages, Layouts, Components"]
        apiClient["API-Client<br/>Orval-Module, Axios, TanStack Query"]
        hubClient["MapHubService<br/>SignalR Client"]
        dto["Frontend-Modelle<br/>DTOs"]

        spa --> apiClient
        spa --> hubClient
        apiClient -. verwendet .-> dto
        hubClient -. verwendet .-> dto
    end

    subgraph backend["Backend: ASP.NET Core"]
        controllers["REST-Controller<br/>Auth, Character, GameSession, Map,<br/>Grid, Token, Spell, Compendium"]
        mapHub["MapHub<br/>SignalR: /hubs/map"]
        userService["UserService"]
        services["Fachservices<br/>Character, GameSession, Map, Grid,<br/>Token, Spell, Compendium"]
        passwordHasher["ASP.NET PasswordHasher"]
        dbContext["AppDbContext<br/>Entity Framework Core"]
        sqlite[("SQLite<br/>Database.db")]
        staticFiles["Static Files<br/>wwwroot"]

        controllers --> userService
        controllers --> services
        mapHub -->|"Token-, Grid- und Zauberaktionen"| services
        userService --> dbContext
        services --> dbContext
        userService --> passwordHasher
        dbContext --> sqlite
    end

    user --> spa
    apiClient -->|"REST / JSON"| controllers
    hubClient <-->|"SignalR / WebSocket"| mapHub

    classDef client fill:#E8F3F2,stroke:#26736F,color:#173B39
    classDef backendNode fill:#EEF1F5,stroke:#526579,color:#263442
    classDef storage fill:#FFF4D6,stroke:#9A6B16,color:#49350F
    class user,spa,apiClient,hubClient,dto client
    class controllers,mapHub,userService,services,passwordHasher,dbContext,staticFiles backendNode
    class sqlite storage
```

Im lokalen Entwicklungsbetrieb leitet der Vite-Proxy API- und Hub-Aufrufe an das Backend weiter. `VITE_API_URL` bestimmt die Backend-Adresse. Swagger ist im Backend nur in der Development-Umgebung aktiviert.
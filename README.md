# D&D Game Map Tool

Diese Anleitung beschreibt die lokale Einrichtung des Frontends und Backends.

## Voraussetzungen

- [Node.js](https://nodejs.org/) 20.19 oder neuer (alternativ 22.12 oder neuer)
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- Git

## Repository klonen

Im Beispiel liegt das Frontend im Ordner `GameMapFrontend` und das Backend daneben im Ordner `GameMapBackend`:

```powershell
git clone <Repository-URL>
cd OnlineGameMapTool
```

Falls Frontend und Backend in getrennten Repositories liegen, beide Repositories in denselben übergeordneten Ordner klonen.

## Backend einrichten und starten

In einem Terminal:

```powershell
cd GameMapBackend
dotnet restore
dotnet tool install --version 10.0.12
dotnet ef database update
dotnet run --urls http://localhost:5089
```

Die EF-Core-Migrationen legen die SQLite-Datenbank `Database.db` im Backend-Ordner an bzw. aktualisieren sie. Die Verbindungszeichenfolge kann in `GameMapBackend/appsettings.json` angepasst werden.

Im Entwicklungsmodus ist die API-Dokumentation unter [http://localhost:5089/swagger](http://localhost:5089/swagger) erreichbar.

## Frontend einrichten und starten

Öffne ein zweites Terminal im Projektordner und führe aus:

```powershell
cd GameMapFrontend
npm install
```

Erstelle im Ordner `GameMapFrontend` eine Datei namens `.env` mit folgendem Inhalt:

```dotenv
VITE_API_URL=http://localhost:5089
```

Starte danach den Entwicklungsserver:

```powershell
npm run dev
```

Das Frontend ist anschließend unter [http://localhost:5173](http://localhost:5173) erreichbar. Das Backend muss gleichzeitig unter Port `5089` laufen; das Frontend verwendet diese Adresse für API-Aufrufe und SignalR.

## Build und Prüfung

Im Frontend-Ordner:

```powershell
npm run build
npm run lint
```

Im Backend-Ordner:

```powershell
dotnet build
```

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## API docs

https://5e-bits.github.io/docs/api
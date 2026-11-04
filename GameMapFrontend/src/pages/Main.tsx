import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import NavBar from '../components/layoutComponents/NavBar'
import Button from '../components/atoms/Button'
import CreateGame from '../components/userActions/CreateGame'
import AddMap from '../components/userActions/addMap'
import { useGetApiGameSessionByDungeonMasterDungeonMasterId } from '../api'

function Main() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const userId = state?.userId
  const username = state?.username
  const [addMap, setAddMap] = useState(false)
  const [createGame, setCreateGame] = useState(false)
  const sessionsQuery = useGetApiGameSessionByDungeonMasterDungeonMasterId(
    userId ?? '',
    { query: { enabled: Boolean(userId) } },
  )
  const sessions = sessionsQuery.data?.data ?? []

  return (
    <>
      <NavBar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-8">
        <header className="mb-8 text-left">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent-special">
            Game Map Tool
          </p>
          <h1 className="mb-2 mt-0 text-3xl font-bold text-primary-text sm:text-4xl">
            Your next adventure starts here
          </h1>
          <p className="text-base text-secondary-text">
            {username ? `Welcome back, ${username}. ` : ''}
            Set up a session or prepare the maps for your table.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SimpleSectionCard className="flex h-full flex-col items-start text-left">
            <p className="mb-2 text-sm font-semibold uppercase text-accent-special">
              Play
            </p>
            <h2 className="mb-2 text-xl font-bold text-primary-text">
              Create a game
            </h2>
            <p className="mb-6 flex-1 text-sm text-secondary-text">
              Open a new session, choose a starting map, and invite your players.
            </p>
            <Button
              variant="primary"
              className="mt-auto"
              onClick={() => setCreateGame(true)}
            >
              Create Game
            </Button>
          </SimpleSectionCard>

          <SimpleSectionCard className="flex h-full flex-col items-start text-left">
            <p className="mb-2 text-sm font-semibold uppercase text-accent-special">
              Prepare
            </p>
            <h2 className="mb-2 text-xl font-bold text-primary-text">
              Add a map
            </h2>
            <p className="mb-6 flex-1 text-sm text-secondary-text">
              Add another battlefield to your collection for a future session.
            </p>
            <Button
              variant="secondary"
              className="mt-auto"
              onClick={() => setAddMap(true)}
            >
              Add Map
            </Button>
          </SimpleSectionCard>
        </div>

        <SimpleSectionCard className="text-left">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase text-accent-special">
                Your library
              </p>
              <h2 id="sessions-heading" className="text-xl font-bold text-primary-text">
                Your game sessions
              </h2>
            </div>
            {userId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => sessionsQuery.refetch()}
                disabled={sessionsQuery.isFetching}
              >
                {sessionsQuery.isFetching ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
          </div>

          {!userId && (
            <p className="text-sm text-secondary-text">
              Sign in to view the sessions you created.
            </p>
          )}

          {userId && sessionsQuery.isLoading && (
            <p className="text-sm text-secondary-text">Loading your sessions...</p>
          )}

          {userId && sessionsQuery.isError && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-red-500" role="alert">
                Your sessions could not be loaded.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => sessionsQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          {userId && !sessionsQuery.isLoading && !sessionsQuery.isError && sessions.length === 0 && (
            <p className="text-sm text-secondary-text">
              You have not created any game sessions yet.
            </p>
          )}

          {sessions.length > 0 && (
            <ul className="divide-y divide-secondary-bg overflow-hidden rounded-md border border-secondary-bg">
              {sessions.map((session) => {
                const sessionId = session.id

                if (!sessionId) return null

                return (
                  <li key={sessionId}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/game/${sessionId}`, {
                          state: {
                            session,
                            sessionId,
                            currentUser: { userId, username },
                          },
                        })
                      }
                      className="flex w-full flex-wrap items-center justify-between gap-3 bg-primary-bg px-4 py-4 text-left transition-colors hover:bg-secondary-bg sm:px-5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-primary-text">
                          {session.sessionName?.trim() || 'Untitled session'}
                        </span>
                        <span className="mt-1 block text-sm text-secondary-text">
                          {session.participants?.length ?? 0} players
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs uppercase text-secondary-text">
                          Join code
                        </span>
                        <span className="font-mono font-semibold tracking-wider text-accent-special">
                          {session.joinCode || 'Unavailable'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </SimpleSectionCard>
      </main>

      {createGame && (
        <CreateGame
          onClose={() => setCreateGame(false)}
          isOpen={createGame}
          currentUser={userId ? { userId, username } : null}
        />
      )}
      {addMap && <AddMap onClose={() => setAddMap(false)} isOpen={addMap} />}
    </>
  )
}

export default Main

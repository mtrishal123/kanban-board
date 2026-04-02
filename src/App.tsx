import { useAuth } from './hooks/useAuth'
import { Board } from './components/Board'
import styles from './App.module.css'

function App() {
  const { loading, userId } = useAuth()

  if (loading) {
    return (
      <div className={styles.loading}>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className={styles.loading}>
        <p className={styles.loadingText}>Authentication failed. Please refresh.</p>
      </div>
    )
  }

  return <Board userId={userId} />
}

export default App
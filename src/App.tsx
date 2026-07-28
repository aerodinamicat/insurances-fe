import { AuthProvider } from './auth'
import { AppRouter } from './routes'

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App

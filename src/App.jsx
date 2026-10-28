import ToastProvider from '@/components/Toast/ToastProvider'
import HomePage from '@/pages/home/HomePage'

function App() {
  return (
    <ToastProvider>
      <HomePage />
    </ToastProvider>
  )
}

export default App

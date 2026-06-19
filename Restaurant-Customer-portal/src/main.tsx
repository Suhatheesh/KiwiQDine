import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import store from './app/store.ts'
import RestaurantContextProvider from './context/RestaurantContext.tsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RestaurantContextProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RestaurantContextProvider>
    </Provider>
  </StrictMode>,
)

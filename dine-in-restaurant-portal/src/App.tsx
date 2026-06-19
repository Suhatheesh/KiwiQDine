import { BrowserRouter } from 'react-router-dom';
import WebRouter from './routers/WebRouter';
import { ThemeProvider } from '@mui/material';
import { muiTheme } from './utils/muiTheme';
import { useEffect } from 'react';
import { tokenStorage } from './utils/token';
import { useAuth } from './hooks/useAuth';
import { CustomToastContainer } from './components/CustomToastContainer';
import SocketService from './services/SocketService';

function App() {

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const socketManager = SocketService.getInstance();
    const token = tokenStorage.getAccessToken() ?? "";

    socketManager.connect("order-status", token);
    socketManager.connect("order-alerts", token);

    socketManager.emit("order-status", "subscribe_restaurant_orders", {
      restaurantId: user.restaurantId,
    });

    socketManager.emit("order-alerts", "subscribe_restaurant_alerts", {
      restaurantId: user.restaurantId,
      userId: user.id,
      role: user.role,
    });

    socketManager.on("order-status", 'subscribed_to_restaurant', (data) => {
      console.log('Subscribed to restaurant:', data.restaurantId);
    });

  }, [user]);


  return (
    <>
      <BrowserRouter>
        <ThemeProvider theme={muiTheme}>
          <WebRouter />
        </ThemeProvider>
      </BrowserRouter>
      <CustomToastContainer />
    </>
  );
}

export default App;

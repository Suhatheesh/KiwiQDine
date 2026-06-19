import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import WebRouter from './routers/WebRouter';
import { CustomToastContainer } from './components/CustomToastContainer';
import { ThemeProvider } from '@mui/material';
import { muiTheme } from './utils/muiTheme';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider theme={muiTheme}>
          <WebRouter />
        </ThemeProvider>
      </BrowserRouter>
      <CustomToastContainer />
    </AuthProvider>
  );
}

export default App;

import WebRouter from "./routers/WebRouter"
import { CustomToastContainer } from "./components/CustomToastContainer"
import { useLayoutEffect } from "react";
import { setTenantIdGetter } from "./api/axiosClient";
import useRestaurant from "./hooks/useRestaurant";

function App() {

  const { tenantId } = useRestaurant();

  useLayoutEffect(() => {
    setTenantIdGetter(() => tenantId);
  }, [tenantId]);

  return (
    <>
      <WebRouter />
      <CustomToastContainer />
    </>
  )
}

export default App


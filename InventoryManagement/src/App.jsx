import { createBrowserRouter,RouterProvider } from "react-router-dom"
import Routes from "./routes"
function App() {
   const Router=createBrowserRouter(Routes);
  return (
    <>
    <RouterProvider router={Router}/>    
    </>
  )
}

export default App
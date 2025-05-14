import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Login from "./Pages/Login/Login"
import ClientDashboard from "./Pages/Client/ClientDashboard"
import DistributorDashboard from "./Pages/Distributor/DistributorDashboard"
import Product from "./Pages/Client/Components/Product"
import NotFound from "./Pages/NotFound"
import Registro from "./Pages/Login/Registro"
import HomeClient from "./Pages/Client/HomeClient"
import ContactClient from "./Pages/Client/ContactClient"
function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/dashboard-cliente" element={<ClientDashboard />}>
          <Route index element={<HomeClient />} />
          <Route path="home" element={<HomeClient />} />
          <Route path="products" element={<Product />} />
          <Route path="contact" element={<ContactClient />} />
        </Route>


        <Route path="/dashboard-distribuidor" element={<DistributorDashboard />}>

        </Route>
         <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Login from "./Pages/Login/Login"
import ClientDashboard from "./Pages/Client/ClientDashboard"
import DistributorDashboard from "./Pages/Distributor/DistributorDashboard"
import Product from "./Pages/Client/Components/Product"
import NotFound from "./Pages/NotFound"
import Registro from "./Pages/Login/Registro"
import HomeClient from "./Pages/Client/HomeClient"
import ContactClient from "./Pages/Client/ContactClient"

import BuyComponent from "./Pages/Client/Components/BuyComponent"

import HomeDistributor from "./Pages/Distributor/HomeDistributor"
import ClientDistributor from "./Pages/Distributor/ClientDistributor"
import DeliveryDistributor from "./Pages/Distributor/DeliveryDistributor"
import HistoryDistributor from "./Pages/Distributor/HistoryDistributor"
import OrdersDistributor from "./Pages/Distributor/OrdersDistributor"

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
          <Route path="products" element={<Product clienteId={1} />} />
          <Route path="contact" element={<ContactClient />} />
          
        </Route>


        <Route path="/dashboard-distribuidor" element={<DistributorDashboard />}>
          <Route index element={<HomeDistributor />} />
          <Route path="home" element={<HomeDistributor />} />
          <Route path="sales" element={<OrdersDistributor />} />
          <Route path="clients" element={<ClientDistributor />} />
          <Route path="delivery" element={<DeliveryDistributor />} />
          <Route path="history" element={<HistoryDistributor />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App

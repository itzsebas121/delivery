import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Login from "./Pages/Login/Login"
import ClientDashboard from "./Pages/Client/ClientDashboard"
import DistributorDashboard from "./Pages/Distributor/DistributorDashboard"
import { DeliveryDashboard } from "./Pages/DeliveryPerson/DeliveryDashboard"
import Product from "./Pages/Client/Components/Product"
import NotFound from "./Pages/NotFound"
import Registro from "./Pages/Login/Registro"
import HomeClient from "./Pages/Client/HomeClient"
import ContactClient from "./Pages/Client/ContactClient"
import OrderHistory from "./Pages/Client/History/order-history"
import CheckoutPage from "./Pages/Client/Payment/CheckoutPage"

import HomeDistributor from "./Pages/Distributor/HomeDistributor"
import ClientDistributor from "./Pages/Distributor/ClientDistributor"
import DeliveryDistributor from "./Pages/Distributor/DeliveryDistributor/DeliveryPersonDistributors"
import HistoryDistributor from "./Pages/Distributor/HistoryDistributor"
import OrdersDistributor from "./Pages/Distributor/Orders/OrdersDistributor"
import ProductsDistributor from "./Pages/Distributor/ProductsDistributor/ProductsDistributor"

import { HomeDeliveryPerson } from "./Pages/DeliveryPerson/HomeDeliveryPerson/HomeDeliveryPerson"
import { OrdersDeliveryPerson } from "./Pages/DeliveryPerson/OrdersDeliveryPerson/OrdersDeliveryPerson"
import './StylesGeneral/Pagination.css'
import './StylesGeneral/ProfesionalHeader.css'
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
          <Route path="products" element={<Product/>} />
          <Route path="contact" element={<ContactClient />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="payment" element={<CheckoutPage />} />
        </Route>


        <Route path="/dashboard-distribuidor" element={<DistributorDashboard />}>
          <Route index element={<HomeDistributor />} />
          <Route path="home" element={<HomeDistributor />} />
          <Route path="sales" element={<OrdersDistributor />} />
          <Route path="clients" element={<ClientDistributor />} />
          <Route path="delivery" element={<DeliveryDistributor />} />
          <Route path="products" element={<ProductsDistributor />} />
          <Route path="history" element={<HistoryDistributor />} />
        </Route>
        <Route path="/dashboard-delivery" element={<DeliveryDashboard />}>
          <Route index element={<HomeDeliveryPerson />} />
          <Route path="home" element={<HomeDeliveryPerson />} />
          <Route path="sales" element={<OrdersDeliveryPerson />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App

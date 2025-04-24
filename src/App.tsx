import './StylesGeneral/style.css';
import Navbar from './components/Navbar';
import { Route, Routes } from 'react-router-dom';
import Home from './Pages/HomePage/Home';
import Page from './Pages/Login/page';
import Product from './Pages/ProductPage/Product';
function App() {
  return (
      <div>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/Login" element={<Page/>} />
          <Route path="/products" element={<Product/>} />
        </Routes>
      </div>
  );
}

export default App;

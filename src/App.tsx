import {  Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Page from './Pages/Login/page';

function App() {
  return (
      <div>
        <Link to="/login">
          <button>Login</button>
        </Link>

        <Routes>
          <Route path="/login" element={<Page />} />
        </Routes>
      </div>
  );
}

export default App;

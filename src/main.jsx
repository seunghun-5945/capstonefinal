import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css';
import { BrowserRouter,Routes, Route } from 'react-router-dom';
import Callback from './components/Callback';
import Dashboard from './components/Dashboard';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <React.StrictMode>
      <Routes>
        <Route path="/" element={< App/>}/>
        <Route path="/Dashboard" element={< Dashboard/>}/>
        <Route path="/Callback" element={< Callback/>}/>
      </Routes>
    </React.StrictMode>,
  </BrowserRouter>
)
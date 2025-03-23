import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Sidebar from './components/Layout/Sidebar';
import MainContent from './components/Layout/MainContent';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import './styles/main.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <div className="app">
            <Routes>
              <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
              <Route 
                path="/*" 
                element={
                  isAuthenticated ? (
                    <div className="app-container">
                      <Sidebar />
                      <MainContent />
                    </div>
                  ) : (
                    <Navigate to="/login" />
                  )
                } 
              />
            </Routes>
          </div>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
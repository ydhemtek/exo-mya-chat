import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

export const AuthContext = createContext();


const SOCKET_URL = 'http://localhost:5001';
let socket;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
      

      initializeSocket();
    }
    setLoading(false);
  }, []);


  const initializeSocket = () => {
    if (!socket) {
      try {
        socket = io(SOCKET_URL);
        
        socket.on('connect', () => {
          console.log('Socket connecté dans AuthContext:', socket.id);
        });
        
        socket.on('connect_error', (err) => {
          console.error('Erreur de connexion socket dans AuthContext:', err);
        });
      } catch (err) {
        console.error('Erreur lors de l\'initialisation du socket:', err);
      }
    }
  };

  const registerUser = async (username, email, password) => {
    try {
      setError(null);
      console.log('Tentative d\'inscription avec:', { username, email });
      

      const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
      const userExists = existingUsers.some(
        user => user.email === email || user.username === username
      );
      
      if (userExists) {
        console.error('Utilisateur déjà existant');
        throw new Error('Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà.');
      }
      

      const newUser = {
        id: 'user_' + Date.now().toString(),
        username,
        email,
        password,
        token: 'fake-jwt-token-' + Date.now()
      };
      

      existingUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(existingUsers));
      

      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('token', newUser.token);
      
      console.log('Inscription réussie:', username);
      

      initializeSocket();
      

      if (socket && socket.connected) {
        socket.emit('register', userWithoutPassword);
      } else {
        console.log('Socket non connecté, inscription uniquement en local');
      }
      
      return userWithoutPassword;
    } catch (error) {
      console.error('Erreur d\'inscription détaillée:', error);
      setError(error.message);
      throw error;
    }
  };

  const loginUser = async (email, password) => {
    try {
      setError(null);
      console.log('Tentative de connexion avec:', email);
      

      const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
      const user = existingUsers.find(user => user.email === email && user.password === password);
      
      if (!user) {
        console.error('Identifiants incorrects');
        throw new Error('Email ou mot de passe incorrect.');
      }
      

      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('token', user.token);
      
      console.log('Connexion réussie:', user.username);
      

      initializeSocket();
      

      if (socket && socket.connected) {
        socket.emit('register', userWithoutPassword);
      } else {
        console.log('Socket non connecté, connexion uniquement en local');
      }
      
      return userWithoutPassword;
    } catch (error) {
      console.error('Erreur de connexion détaillée:', error);
      setError(error.message);
      throw error;
    }
  };

  const logoutUser = () => {
    console.log('Déconnexion...');
    

    if (socket) {
      socket.disconnect();
      socket = null;
    }

    setCurrentUser(null);

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    console.log('Déconnexion terminée');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        registerUser,
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
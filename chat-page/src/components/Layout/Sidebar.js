import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { ChatContext } from '../../contexts/ChatContext';
import UserItem from '../Chat/UserItem';

const Sidebar = () => {
  const { currentUser, logoutUser } = useContext(AuthContext);
  const { onlineUsers, fetchUsers, setSelectedUser } = useContext(ChatContext);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await fetchUsers();
        setAllUsers(users || []);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        setAllUsers([]);
      }
    };
    
    loadUsers();

    const interval = setInterval(loadUsers, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const handleLogout = () => {
    console.log("Déconnexion en cours...");
    

    localStorage.removeItem('user');
    localStorage.removeItem('token');

    logoutUser();
    

    window.location.href = '/login';
  };


  const filteredUsers = searchTerm && Array.isArray(allUsers) 
    ? allUsers.filter(user => 
        user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allUsers || [];
  

  const usersWithOnlineStatus = Array.isArray(filteredUsers) 
    ? filteredUsers.map(user => ({
        ...user,
        isOnline: Array.isArray(onlineUsers) && onlineUsers.some(onlineUser => 
          onlineUser.id === user.id
        )
      }))
    : [];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="avatar">
            {currentUser?.username?.charAt(0) || '?'}
          </div>
          <div className="user-info">
            <h3>{currentUser?.username || 'Utilisateur'}</h3>
            <span className="status online">En ligne</span>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="users-list">
        {usersWithOnlineStatus.length > 0 ? (
          usersWithOnlineStatus.map((user) => (
            <UserItem
              key={user.id}
              user={user}
              onClick={() => setSelectedUser(user)}
            />
          ))
        ) : (
          <div className="no-users">
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
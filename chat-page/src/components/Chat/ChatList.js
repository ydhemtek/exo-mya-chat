import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { ChatContext } from '../../contexts/ChatContext';
import { getConversations } from '../../services/chatService';
import UserItem from './UserItem';

const ChatList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const { setSelectedUser } = useContext(ChatContext);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (currentUser) {
          setLoading(true);
          const data = await getConversations();
          setConversations(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };

    fetchConversations();


    const interval = setInterval(fetchConversations, 10000);
    
    return () => clearInterval(interval);
  }, [currentUser]);


  const filteredConversations = searchTerm
    ? conversations.filter(conversation => 
        conversation.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  return (
    <div className="chat-list">
      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher une conversation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="conversations-list">
        {loading ? (
          <div className="loading-conversations">
            <div className="spinner"></div>
            <p>Chargement des conversations...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <UserItem
              key={conversation.id}
              user={conversation}
              onClick={() => setSelectedUser({
                id: conversation.id,
                username: conversation.username,
                isOnline: conversation.isOnline
              })}
            />
          ))
        ) : (
          <div className="no-conversations">
            <p>Aucune conversation trouvée</p>
            {searchTerm ? (
              <p>Essayez avec un autre terme de recherche.</p>
            ) : (
              <p>Commencez une nouvelle conversation en sélectionnant un utilisateur.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
import React, { useContext, useEffect, useRef } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import { AuthContext } from '../../contexts/AuthContext';
import Message from './Message';

const ChatWindow = () => {
  const { messages, loading } = useContext(ChatContext);
  const { currentUser } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };
  
  const messageGroups = groupMessagesByDate(messages);
  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  return (
    <div className="chat-window">
      {loading ? (
        <div className="loading-messages">
          <div className="spinner"></div>
          <p>Chargement des messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="no-messages">
          <p>Aucun message. Commencez la conversation!</p>
        </div>
      ) : (
        <div className="messages-container">
          {Object.entries(messageGroups).map(([date, messagesGroup]) => (
            <div key={date} className="message-group">
              <div className="date-separator">
                <span>{formatDate(date)}</span>
              </div>
              
              {messagesGroup.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender === currentUser.id}
                />
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
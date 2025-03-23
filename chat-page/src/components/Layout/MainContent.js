import React, { useContext } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import ChatWindow from '../Chat/ChatWindow';
import MessageInput from '../Chat/MessageInput';

const MainContent = () => {
  const { selectedUser, handleSendMessage } = useContext(ChatContext);

  return (
    <div className="main-content">
      {selectedUser ? (
        <>
          <div className="chat-header">
            <div className="user-avatar">
              {selectedUser.username.charAt(0).toUpperCase()}
              {selectedUser.isOnline && <span className="online-indicator"></span>}
            </div>
            <div className="user-info">
              <h3>{selectedUser.username}</h3>
              <span className="status">
                {selectedUser.isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
          
          <ChatWindow />
          
          <MessageInput onSendMessage={handleSendMessage} />
        </>
      ) : (
        <div className="no-chat-selected">
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h2>Sélectionnez un utilisateur pour commencer une conversation</h2>
            <p>Choisissez un utilisateur dans la liste à gauche pour démarrer une conversation.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
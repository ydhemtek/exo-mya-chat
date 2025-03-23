import React from 'react';

const UserItem = ({ user, onClick }) => {
  const { username, isOnline, lastMessage, unreadCount } = user;
  

  const firstLetter = username.charAt(0).toUpperCase();
  

  const truncatedMessage = lastMessage && lastMessage.length > 30
    ? `${lastMessage.substring(0, 30)}...`
    : lastMessage;
  
  return (
    <div className={`user-item ${isOnline ? 'online' : ''}`} onClick={onClick}>
      <div className="user-avatar">
        {firstLetter}
        {isOnline && <span className="online-indicator"></span>}
      </div>
      
      <div className="user-details">
        <div className="user-name-container">
          <h4 className="user-name">{username}</h4>
          {lastMessage && (
            <span className="last-message-time">
              {new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        {lastMessage && (
          <p className="last-message">{truncatedMessage}</p>
        )}
      </div>
      
      {unreadCount > 0 && (
        <div className="unread-badge">
          {unreadCount}
        </div>
      )}
    </div>
  );
};

export default UserItem;
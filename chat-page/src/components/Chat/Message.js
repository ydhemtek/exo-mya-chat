import React, { useState, useContext } from 'react';
import { ChatContext } from '../../contexts/ChatContext';
import { AuthContext } from '../../contexts/AuthContext';

const Message = ({ message, isOwnMessage }) => {
  const { handleAddReaction, handleReplyToMessage } = useContext(ChatContext);
  const { currentUser } = useContext(AuthContext);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  

  const hasUserReacted = (reactionType) => {
    return message.reactions && message.reactions.some(
      r => r.userId === currentUser.id && r.reaction === reactionType
    );
  };

  const onAddReaction = (reaction) => {
    if (!hasUserReacted(reaction)) {
      handleAddReaction(message.id, reaction);
    }
    setShowReactionMenu(false);
  };
  

  const onSendReply = () => {
    if (replyContent.trim()) {
      handleReplyToMessage(message.id, replyContent);
      setReplyContent('');
      setShowReplyInput(false);
    }
  };
  

  const getReactionCounts = () => {
    const counts = {};
    if (message.reactions) {
      message.reactions.forEach(r => {
        counts[r.reaction] = (counts[r.reaction] || 0) + 1;
      });
    }
    return counts;
  };
  
  const reactionCounts = getReactionCounts();
  
  return (
    <div className={`message-wrapper ${isOwnMessage ? 'own-message' : ''}`}>
      <div className="message">

        {message.parentId && message.parentMessage && (
          <div className="replied-message">
            <p>{message.parentMessage.content}</p>
          </div>
        )}
        
        <div className="message-content">
          <p>{message.content}</p>
        </div>
        
        <div className="message-meta">
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {isOwnMessage && message.status && (
            <span className="message-status">{message.status}</span>
          )}
        </div>
        

        {message.reactions && message.reactions.length > 0 && (
          <div className="reactions-container">
            {Object.entries(reactionCounts).map(([reaction, count]) => (
              <div 
                key={reaction} 
                className={`reaction ${hasUserReacted(reaction) ? 'user-reacted' : ''}`}
              >
                <span className="reaction-emoji">{reaction}</span>
                <span className="reaction-count">{count}</span>
              </div>
            ))}
          </div>
        )}
        

        <div className="message-actions">
          <button 
            className="action-button reply"
            onClick={() => setShowReplyInput(!showReplyInput)}
            title="Répondre"
          >
            ↩️
          </button>
          <button 
            className="action-button react"
            onClick={() => setShowReactionMenu(!showReactionMenu)}
            title="Réagir"
          >
            😊
          </button>
        </div>
        

        {showReactionMenu && (
          <div className="reaction-menu">
            <button onClick={() => onAddReaction('👍')} className="reaction-button">👍</button>
            <button onClick={() => onAddReaction('❤️')} className="reaction-button">❤️</button>
            <button onClick={() => onAddReaction('😄')} className="reaction-button">😄</button>
            <button onClick={() => onAddReaction('😮')} className="reaction-button">😮</button>
            <button onClick={() => onAddReaction('😢')} className="reaction-button">😢</button>
            <button onClick={() => onAddReaction('👏')} className="reaction-button">👏</button>
          </div>
        )}
        

        {message.replies && message.replies.length > 0 && (
          <div className="message-replies">
            {message.replies.map((reply, index) => (
              <div key={index} className="reply-message">
                <div className="reply-content">
                  <p>{reply.content}</p>
                </div>
                <div className="reply-meta">
                  <span className="reply-time">{formatTime(reply.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
   
        {showReplyInput && (
          <div className="reply-input-container">
            <input
              type="text"
              className="reply-input"
              placeholder="Répondre à ce message..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSendReply()}
            />
            <button className="send-reply-button" onClick={onSendReply}>
              Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
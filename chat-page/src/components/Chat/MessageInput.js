import React, { useState, useRef, useEffect } from 'react';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  

  const popularEmojis = [
    '😊', '😂', '❤️', '👍', '🎉', '🔥', '🤔', '😎', '👏', '😢'
  ];
  

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setIsEmojiPickerVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };
  
  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setIsEmojiPickerVisible(false);
    inputRef.current?.focus();
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-form">
        <button 
          type="button" 
          className="emoji-button"
          onClick={() => setIsEmojiPickerVisible(!isEmojiPickerVisible)}
        >
          😊
        </button>
        
        {isEmojiPickerVisible && (
          <div className="emoji-picker" ref={emojiPickerRef}>
            {popularEmojis.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="emoji-item"
                onClick={() => addEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        
        <textarea
          ref={inputRef}
          className="message-input"
          placeholder="Écrivez un message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          autoFocus
        />
        
        <button 
          type="submit" 
          className="send-button"
          disabled={!message.trim()}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
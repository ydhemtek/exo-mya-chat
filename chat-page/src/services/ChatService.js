
const API_URL = 'http://localhost:5000/api';


const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};


const getStoredUsers = () => {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
};


const getStoredMessages = () => {
  const messages = localStorage.getItem('messages');
  return messages ? JSON.parse(messages) : [];
};


const saveMessages = (messages) => {
  localStorage.setItem('messages', JSON.stringify(messages));
};


export const getUsers = async () => {

  await new Promise(resolve => setTimeout(resolve, 300));
  
  const users = getStoredUsers();
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
  

  return users
    .filter(user => user.id !== currentUserId)
    .map(({ password, ...userWithoutPassword }) => userWithoutPassword);
};


export const getMessages = async (receiverId) => {

  await new Promise(resolve => setTimeout(resolve, 500));
  
  const messages = getStoredMessages();
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
  
  if (!currentUserId) {
    throw new Error('Utilisateur non authentifié.');
  }
  

  return messages.filter(
    message => 
      (message.sender === currentUserId && message.receiver === receiverId) ||
      (message.sender === receiverId && message.receiver === currentUserId)
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

export const sendMessage = async (messageData) => {

  await new Promise(resolve => setTimeout(resolve, 300));
  
  const messages = getStoredMessages();
  const newMessage = {
    ...messageData,
    id: generateId(),
    status: 'sent',
  };
  
  messages.push(newMessage);
  saveMessages(messages);
  
  return newMessage;
};


export const addReaction = async (messageId, reaction) => {

  await new Promise(resolve => setTimeout(resolve, 200));
  
  const messages = getStoredMessages();
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
  
  if (!currentUserId) {
    throw new Error('Utilisateur non authentifié.');
  }
  

  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  
  if (messageIndex !== -1) {

    if (!messages[messageIndex].reactions) {
      messages[messageIndex].reactions = [];
    }
    

    const existingReactionIndex = messages[messageIndex].reactions.findIndex(
      r => r.userId === currentUserId && r.reaction === reaction
    );
    
    if (existingReactionIndex === -1) {

      messages[messageIndex].reactions.push({
        userId: currentUserId,
        reaction,
        timestamp: new Date().toISOString()
      });
      
      saveMessages(messages);
    }
  }
  
  return messages[messageIndex];
};


export const replyToMessage = async (messageId, content) => {

  await new Promise(resolve => setTimeout(resolve, 300));
  
  const messages = getStoredMessages();
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
  
  if (!currentUserId) {
    throw new Error('Utilisateur non authentifié.');
  }
  

  const parentMessage = messages.find(msg => msg.id === messageId);
  
  if (!parentMessage) {
    throw new Error('Message introuvable.');
  }
  

  const reply = {
    id: generateId(),
    parentId: messageId,
    sender: currentUserId,
    receiver: parentMessage.sender === currentUserId ? parentMessage.receiver : parentMessage.sender,
    content,
    timestamp: new Date().toISOString(),
    status: 'sent',
    reactions: []
  };
  

  reply.parentMessage = {
    id: parentMessage.id,
    content: parentMessage.content
  };
  

  messages.push(reply);
  saveMessages(messages);
  
  return reply;
};


export const markMessageAsRead = async (messageId) => {

  await new Promise(resolve => setTimeout(resolve, 100));
  
  const messages = getStoredMessages();
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  
  if (messageIndex !== -1) {
    messages[messageIndex].status = 'read';
    saveMessages(messages);
  }
  
  return true;
};


export const getConversations = async () => {

  await new Promise(resolve => setTimeout(resolve, 400));
  
  const messages = getStoredMessages();
  const users = getStoredUsers();
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
  
  if (!currentUserId) {
    throw new Error('Utilisateur non authentifié.');
  }
  

  const conversationUserIds = [...new Set(
    messages
      .filter(msg => msg.sender === currentUserId || msg.receiver === currentUserId)
      .map(msg => msg.sender === currentUserId ? msg.receiver : msg.sender)
  )];
  

  return conversationUserIds.map(userId => {
    const user = users.find(u => u.id === userId);
    
    if (!user) return null;
    

    const conversationMessages = messages.filter(
      msg => 
        (msg.sender === currentUserId && msg.receiver === userId) ||
        (msg.sender === userId && msg.receiver === currentUserId)
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const lastMessage = conversationMessages[0];
    

    const unreadCount = conversationMessages.filter(
      msg => msg.sender === userId && msg.status !== 'read'
    ).length;
    
    return {
      id: userId,
      username: user.username,
      lastMessage: lastMessage ? lastMessage.content : null,
      lastMessageTime: lastMessage ? lastMessage.timestamp : null,
      unreadCount
    };
  }).filter(Boolean);
};
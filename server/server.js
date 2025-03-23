
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


let users = [];
let messages = [];


const broadcastUsersList = () => {
  io.emit('users_update', users);
  console.log('Liste des utilisateurs diffusée:', users.length, 'utilisateurs');
};

io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);
  

  socket.on('register', (userData) => {
    if (!userData || !userData.id) {
      console.error('Données utilisateur invalides:', userData);
      return;
    }

    const user = {
      ...userData,
      socketId: socket.id,
      isOnline: true
    };
    

    const existingUserIndex = users.findIndex(u => u.id === user.id);
    
    if (existingUserIndex !== -1) {

      console.log('Mise à jour de l\'utilisateur:', user.username);
      users[existingUserIndex] = {
        ...users[existingUserIndex],
        ...user,
        isOnline: true
      };
    } else {

      console.log('Nouvel utilisateur enregistré:', user.username);
      users.push(user);
    }
    
 
    socket.emit('registration_success', user);
    

    broadcastUsersList();
  });
  

  socket.on('get_users', () => {
    socket.emit('users_update', users);
    console.log('Liste des utilisateurs envoyée à', socket.id);
  });
  

  socket.on('send_message', (messageData) => {
    if (!messageData || !messageData.sender || !messageData.receiver) {
      console.error('Données de message invalides:', messageData);
      return;
    }

    const message = {
      ...messageData,
      id: messageData.id || Date.now().toString(),
      timestamp: messageData.timestamp || new Date().toISOString(),
      status: 'sent'
    };
    

    messages.push(message);
    
    console.log(`Message de ${message.sender} à ${message.receiver}: ${message.content.substring(0, 30)}...`);
    

    const receiver = users.find(user => user.id === message.receiver);
    

    if (receiver && receiver.socketId) {
      console.log('Envoi du message au destinataire:', receiver.username);
      io.to(receiver.socketId).emit('new_message', message);
    } else {
      console.log('Destinataire hors ligne ou introuvable');
    }
    

    socket.emit('message_sent', {
      ...message,
      status: receiver && receiver.socketId ? 'delivered' : 'sent'
    });
  });
  

  socket.on('get_messages', (data) => {
    if (!data || !data.sender || !data.receiver) {
      console.error('Données de récupération de messages invalides:', data);
      return;
    }
    

    const filteredMessages = messages.filter(msg => 
      (msg.sender === data.sender && msg.receiver === data.receiver) ||
      (msg.sender === data.receiver && msg.receiver === data.sender)
    );
    
    console.log(`Envoi de ${filteredMessages.length} messages pour la conversation entre ${data.sender} et ${data.receiver}`);
    

    socket.emit('previous_messages', filteredMessages);
  });
  

  socket.on('add_reaction', (data) => {
    if (!data || !data.messageId || !data.reaction || !data.userId) {
      console.error('Données de réaction invalides:', data);
      return;
    }
    
    const { messageId, reaction, userId } = data;
    

    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      if (!messages[messageIndex].reactions) {
        messages[messageIndex].reactions = [];
      }
      
   
      messages[messageIndex].reactions.push({
        userId,
        reaction,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Réaction ${reaction} ajoutée au message ${messageId} par ${userId}`);

      const message = messages[messageIndex];
      const sender = users.find(user => user.id === message.sender);
      const receiver = users.find(user => user.id === message.receiver);
      

      if (sender && sender.socketId) {
        io.to(sender.socketId).emit('new_reaction', data);
      }
      
      if (receiver && receiver.socketId && receiver.id !== sender.id) {
        io.to(receiver.socketId).emit('new_reaction', data);
      }
    } else {
      console.error('Message introuvable pour la réaction:', messageId);
    }
  });
  

  socket.on('reply_to_message', (data) => {
    if (!data || !data.messageId || !data.reply) {
      console.error('Données de réponse invalides:', data);
      return;
    }
    
    const { messageId, reply } = data;
    

    const originalMessage = messages.find(msg => msg.id === messageId);
    
    if (!originalMessage) {
      console.error('Message original introuvable pour la réponse:', messageId);
      return;
    }
    
 
    const replyMessage = {
      ...reply,
      id: reply.id || `reply_${Date.now()}`,
      timestamp: reply.timestamp || new Date().toISOString(),
      parentId: messageId,
      status: 'sent'
    };
    

    messages.push(replyMessage);
    
    console.log(`Réponse au message ${messageId} par ${reply.sender}`);
    

    const sender = users.find(user => user.id === originalMessage.sender);
    const receiver = users.find(user => user.id === originalMessage.receiver);
    
 
    if (sender && sender.socketId) {
      io.to(sender.socketId).emit('new_reply', { messageId, reply });
    }
    
    if (receiver && receiver.socketId && receiver.id !== sender.id) {
      io.to(receiver.socketId).emit('new_reply', { messageId, reply });
    }
  });
  

  socket.on('mark_as_read', (data) => {
    if (!data || !data.messageId) {
      console.error('Données de marquage comme lu invalides:', data);
      return;
    }
    
    const { messageId } = data;
    

    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      messages[messageIndex].status = 'read';
      

      const senderSocket = users.find(user => user.id === messages[messageIndex].sender)?.socketId;
      
      if (senderSocket) {
        io.to(senderSocket).emit('message_read', { messageId });
      }
    }
  });
  

  socket.on('disconnect', () => {
    console.log('Déconnexion:', socket.id);
    

    const userIndex = users.findIndex(user => user.socketId === socket.id);
    
    if (userIndex !== -1) {

      users[userIndex].isOnline = false;
      users[userIndex].lastSeen = new Date().toISOString();
      
      console.log('Utilisateur déconnecté:', users[userIndex].username);
      

      broadcastUsersList();
    }
  });
});


app.get('/', (req, res) => {
  res.send('Serveur de messagerie en ligne');
});


app.get('/stats', (req, res) => {
  res.json({
    users: users.length,
    onlineUsers: users.filter(u => u.isOnline).length,
    messages: messages.length
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
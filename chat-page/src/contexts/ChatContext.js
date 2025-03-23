import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import io from 'socket.io-client';

export const ChatContext = createContext();


const SOCKET_URL = 'http://localhost:5001';
let socket;

export const ChatProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);


  const connectSocket = useCallback(() => {
    if (!socket) {
      console.log('Initialisation de la connexion socket...');
      socket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });


      socket.on('connect', () => {
        console.log('Connecté au serveur socket avec id:', socket.id);
        setConnected(true);
      });


      socket.on('connect_error', (error) => {
        console.error('Erreur de connexion socket:', error);
      });


      socket.on('disconnect', (reason) => {
        console.log('Déconnecté du serveur socket. Raison:', reason);
        setConnected(false);
      });
    }
  }, []);


  useEffect(() => {
    if (currentUser) {

      connectSocket();
      
      if (socket) {

        console.log('Enregistrement de l\'utilisateur:', currentUser);
        socket.emit('register', {
          ...currentUser,
          socketId: socket.id
        });
        

        socket.on('users_update', (users) => {
          console.log('Utilisateurs en ligne reçus:', users);
          
          if (Array.isArray(users)) {

            const otherUsers = users.filter(user => 
              user.id !== currentUser.id && user.isOnline
            );
            console.log('Autres utilisateurs filtrés:', otherUsers);
            setOnlineUsers(otherUsers);
          } else {
            console.error('Format incorrect pour users_update, attendu tableau, reçu:', typeof users);
          }
        });
        

        socket.on('new_message', (message) => {
          console.log('Nouveau message reçu:', message);
          setMessages(prevMessages => [...prevMessages, message]);
        });
        

        socket.on('message_sent', (message) => {
          console.log('Confirmation de message envoyé:', message);
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === message.id ? message : msg
            )
          );
        });
        

        socket.on('new_reaction', (data) => {
          console.log('Nouvelle réaction reçue:', data);
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === data.messageId 
                ? { 
                    ...msg, 
                    reactions: [...(msg.reactions || []), { 
                      reaction: data.reaction, 
                      userId: data.userId 
                    }] 
                  } 
                : msg
            )
          );
        });
        

        socket.on('new_reply', (data) => {
          console.log('Nouvelle réponse reçue:', data);
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === data.messageId 
                ? { 
                    ...msg, 
                    replies: [...(msg.replies || []), data.reply] 
                  } 
                : msg
            )
          );
        });
      }
    }
    
    return () => {
      if (socket) {
        console.log('Nettoyage des écouteurs d\'événements socket');
        socket.off('users_update');
        socket.off('new_message');
        socket.off('message_sent');
        socket.off('new_reaction');
        socket.off('new_reply');
      }
    };
  }, [currentUser, connectSocket]);


  useEffect(() => {
    if (selectedUser) {
      console.log('Utilisateur sélectionné:', selectedUser);
      setLoading(true);
      setMessages([]);
      

      if (socket && connected) {
        socket.emit('get_messages', {
          sender: currentUser.id,
          receiver: selectedUser.id
        });
      }
      
      setLoading(false);
    }
  }, [selectedUser, currentUser, socket, connected]);


  const fetchUsers = useCallback(async () => {
    console.log('Récupération des utilisateurs...');
    if (socket && connected) {
      socket.emit('get_users');
      console.log('Demande de liste d\'utilisateurs envoyée');
    }
    return onlineUsers;
  }, [onlineUsers, socket, connected]);


  const handleSendMessage = useCallback(async (content) => {
    if (!selectedUser || !currentUser) {
      console.error('Impossible d\'envoyer un message: pas d\'utilisateur sélectionné ou courant');
      return;
    }
    
    console.log('Envoi d\'un message à:', selectedUser.username);
    
    try {
      const newMessage = {
        id: `m${Date.now()}`,
        sender: currentUser.id,
        receiver: selectedUser.id,
        content,
        timestamp: new Date().toISOString(),
        status: 'sending'
      };
      

      setMessages(prevMessages => [...prevMessages, newMessage]);
      

      if (socket && connected) {
        console.log('Émission du message via socket');
        socket.emit('send_message', newMessage);
      } else {
        console.error('Socket non connecté, impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  }, [selectedUser, currentUser, socket, connected]);


  const handleAddReaction = useCallback(async (messageId, reaction) => {
    console.log('Ajout d\'une réaction:', reaction, 'au message:', messageId);
    
    try {
      if (!currentUser) {
        console.error('Impossible d\'ajouter une réaction: pas d\'utilisateur courant');
        return;
      }
      

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                reactions: [...(msg.reactions || []), { 
                  reaction, 
                  userId: currentUser.id,
                  timestamp: new Date().toISOString()
                }] 
              } 
            : msg
        )
      );
      

      if (socket && connected) {
        console.log('Émission de la réaction via socket');
        socket.emit('add_reaction', { 
          messageId, 
          reaction, 
          userId: currentUser.id 
        });
      } else {
        console.error('Socket non connecté, impossible d\'envoyer la réaction');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réaction:', error);
    }
  }, [currentUser, socket, connected]);


  const handleReplyToMessage = useCallback(async (messageId, content) => {
    console.log('Réponse au message:', messageId);
    
    try {
      if (!currentUser || !selectedUser) {
        console.error('Impossible de répondre: pas d\'utilisateur courant ou sélectionné');
        return;
      }
      
      const parentMessage = messages.find(msg => msg.id === messageId);
      
      if (!parentMessage) {
        console.error('Message parent introuvable');
        return;
      }
      
      const reply = {
        id: `reply_${Date.now()}`,
        sender: currentUser.id,
        receiver: selectedUser.id,
        content,
        timestamp: new Date().toISOString(),
        parentId: messageId,
        parentMessage: {
          id: parentMessage.id,
          content: parentMessage.content
        }
      };
      

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                replies: [...(msg.replies || []), reply] 
              } 
            : msg
        )
      );
      

      if (socket && connected) {
        console.log('Émission de la réponse via socket');
        socket.emit('reply_to_message', { messageId, reply });
      } else {
        console.error('Socket non connecté, impossible d\'envoyer la réponse');
      }
    } catch (error) {
      console.error('Erreur lors de la réponse au message:', error);
    }
  }, [currentUser, selectedUser, messages, socket, connected]);


  const reconnect = useCallback(() => {
    console.log('Tentative de reconnexion au serveur socket...');
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    connectSocket();
    

    if (currentUser) {
      setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('register', currentUser);
        }
      }, 1000);
    }
  }, [connectSocket, currentUser]);

  return (
    <ChatContext.Provider
      value={{
        onlineUsers,
        fetchUsers,
        selectedUser,
        setSelectedUser,
        messages,
        loading,
        handleSendMessage,
        handleAddReaction,
        handleReplyToMessage,
        socketConnected: connected,
        reconnect
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
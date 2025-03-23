


const API_URL = 'http://localhost:5001/api';


const getUsers = () => {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
};


const saveUsers = (users) => {
  localStorage.setItem('users', JSON.stringify(users));
};


const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};


const generateToken = (user) => {
  return `fake-jwt-token.${btoa(JSON.stringify({ id: user.id, username: user.username }))}.signature`;
};


export const register = async (username, email, password) => {

  await new Promise(resolve => setTimeout(resolve, 500));
  
  const users = getUsers();
  

  if (users.find(user => user.email === email)) {
    throw new Error('Cet email est déjà utilisé.');
  }
  

  if (users.find(user => user.username === username)) {
    throw new Error('Ce nom d\'utilisateur est déjà pris.');
  }
  

  const newUser = {
    id: generateId(),
    username,
    email,
    password,
    createdAt: new Date().toISOString()
  };
  

  users.push(newUser);
  saveUsers(users);
  

  const { password: _, ...userWithoutPassword } = newUser;
  return {
    ...userWithoutPassword,
    token: generateToken(newUser)
  };
};


export const login = async (email, password) => {

  await new Promise(resolve => setTimeout(resolve, 500));
  
  const users = getUsers();
  

  const user = users.find(user => user.email === email && user.password === password);
  
  if (!user) {
    throw new Error('Email ou mot de passe incorrect.');
  }
  

  const { password: _, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    token: generateToken(user)
  };
};


export const logout = () => {

};


export const getUserById = (userId) => {
  const users = getUsers();
  const user = users.find(user => user.id === userId);
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
};
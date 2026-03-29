import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/auth`, // Base URL for the authentication API
    withCredentials: true, // Include cookies for authentication
});


// register a new user
export const register = async ({ username, email, password }) => {
    const response = await api.post('/register', { username, email, password });
    return response.data;
}

// login a user
export const login = async ({ email, password }) => {
    const response = await api.post('/login', { email, password });
    return response.data;
}

// profile of the logged in user
export const getProfile = async () => {
    const response = await api.get('/profile');
    return response.data;
}
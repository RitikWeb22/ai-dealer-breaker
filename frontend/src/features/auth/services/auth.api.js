import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/auth`, // Base URL for the authentication API
    withCredentials: true, // Include cookies for authentication
});

const extractApiErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;

    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
        return responseData.errors[0].msg || fallbackMessage;
    }

    return responseData?.message || fallbackMessage;
};


// register a new user
export const register = async ({ username, email, password }) => {
    try {
        const response = await api.post('/register', { username, email, password });
        return response.data;
    } catch (error) {
        const message = extractApiErrorMessage(error, 'Registration failed');
        throw new Error(message);
    }
}

// login a user
export const login = async ({ email, password }) => {
    try {
        const response = await api.post('/login', { email, password });
        return response.data;
    } catch (error) {
        const message = extractApiErrorMessage(error, 'Login failed');
        throw new Error(message);
    }
}

// profile of the logged in user
export const getProfile = async () => {
    const response = await api.get('/profile');
    return response.data;
}
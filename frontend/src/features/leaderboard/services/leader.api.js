
import axios from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/vapi`,
    withCredentials: true, // Cookies ke liye
});

export const fetchLeaderboard = async () => {
    try {
        const res = await api.get("/leaderboard");
        return res.data.data; // Assuming backend se { data: [...] } format mein aa raha hai
    } catch (err) {
        console.error("Leaderboard fetch error:", err);
        throw err; // Error ko upar throw kar dein taaki component handle kar sake
    }
};


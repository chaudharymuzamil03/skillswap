const API_BASE_URL = 'http://35.172.194.189:5000/api';

export const authAPI = {
    register: async (userData) => {
        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Network error - Backend not reachable' };
        }
    },

    login: async (userData) => {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Network error - Backend not reachable' };
        }
    }
};

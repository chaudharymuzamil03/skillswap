const API_BASE_URL = 'http://204.236.211.198:5000/api';

export const authAPI = {
    register: async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
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
            const response = await fetch(`${API_BASE_URL}/login`, {
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
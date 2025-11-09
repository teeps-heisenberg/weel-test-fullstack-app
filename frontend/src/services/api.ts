const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: Record<string, unknown>;
}

const request = async (endpoint: string, options: RequestOptions = {}) => {
    const token = localStorage.getItem("authToken");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    };


    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || "Request failed") as Error & {
            status: number;
            data: unknown;
        };
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    return response.json();
};

export const api = {
    auth: {
        login: async (email: string, password: string) => {
            const data = await request("/auth/login", {
                method: "POST",
                body: { email, password },
            });
            if (data.token) {
                localStorage.setItem("authToken", data.token);
            }
            return data;
        },

        getMe: async () => {
            return request("/me");
        },
    },

    orders: {
        create: async (orderData: Record<string, unknown>) => {
            const data = await request("/orders", {
                method: "POST",
                body: orderData,
            });
            if (data.order?.id) {
                localStorage.setItem("currentOrderId", data.order.id);
            }
            return data;
        },

        getById: async (orderId: string) => {
            const data = await request(`/orders/${orderId}`);
            if (data.order?.id) {
                localStorage.setItem("currentOrderId", data.order.id);
            }
            return data;
        },

        update: async (orderId: string, updateData: Record<string, unknown>) => {
            return request(`/orders/${orderId}`, {
                method: "PUT",
                body: updateData,
            });
        },
    },

    ai: {
        getSummary: async (orderId: string) => {
            return request(`/ai/summary/${orderId}`, {
                method: "POST",
            });
        },
    },
};


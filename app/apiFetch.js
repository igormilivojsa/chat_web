import { getTostify } from '@/app/tostify'
import { log } from 'next/dist/server/typescript/utils'

const refresh = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (! refreshToken) return null;

    const refreshResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + `/token/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `refresh_token=${refreshToken}`,
    });

    if (! refreshResponse.ok) {
        getTostify('error', 'Session expired, please login again')
        return null;
    }

    const { token: newToken , refresh_token: newRefreshToken } = await refreshResponse.json();
    localStorage.setItem('token', newToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    return newToken;
}

export const apiFetch = async (url, options = {}, router = null) => {
    const token = localStorage.getItem('token');
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    })

    if (response.ok) return response.json();
    if (response.status !== 401) return null;

    const newToken = await refresh();

    if (! newToken) {
        getTostify('error', 'Session expired, please login again')
        if (router) router.push('/login')
        return null;
    }

    const retryData = await fetch(process.env.NEXT_PUBLIC_API_URL + url, {
        ...options,
        headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (! retryData.ok) {
        getTostify('error', 'Session expired, please login again.')
        if (router) router.push('/login')
        return null;
    }

    return await retryData.json();
}
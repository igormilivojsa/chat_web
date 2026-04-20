import { getTostify } from '@/app/tostify'

const refresh = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + `/token/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `refresh_token=${refreshToken}`,
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
    }

    return true;
};

export const apiFetch = async (url, options = {}, router = null) => {
    const isFormData = options.body instanceof FormData;

    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + url, {
        ...options,
        credentials: 'include',
        headers: {
            ...(!isFormData && { 'Content-Type': 'application/json' }),
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
        credentials: 'include',
        headers: {
            ...(!isFormData && { 'Content-Type': 'application/json' }),
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
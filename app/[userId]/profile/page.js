'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getTostify } from '@/app/tostify'

export default function Settings() {
    const params = useParams();
    const userId = params.userId;
    const { register, handleSubmit } = useForm();
    const router = useRouter();
    const [user, setUser] = useState();
    const [token, setToken] = useState(null);
    const [ loader, setLoader] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);

        const fetchUser = async () => {
            try {
                setLoader(true)
                const response = await fetch(process.env.NEXT_PUBLIC_API_URL + `/user/${ userId }`, {
                    headers: {
                        Authorization: `Bearer ${ storedToken }`,
                        'Content-Type': 'application/json',
                    },
                });

                if (! response.ok) {
                    setLoader(false)
                    getTostify('error', 'Failed to fetch user data, check credentials')
                    return;
                }

                const data = await response.json();
                setUser(data);
            } catch (error) {
                getTostify('error', error.message)
            }
        }

        fetchUser();
    }, [])

    const onSubmit = async (data) => {
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + `/user/${userId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.status === 401) {
                getTostify('error', 'Unauthenticated')
                router.push('/login');
                return;
            }

            if (!response.ok) {
                getTostify('error', 'Failed to update profile, check credentials')
                return;
            }

            getTostify('success', 'Profile updated successfully')

            router.push(`/${userId}/chats`);
        } catch (error) {
            getTostify('error', error.message)
        }
    }

    if (!user || loader) {
        return <div>Loading...</div>;
    }
    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="w-50 card text-center">
                <div className="card-header bg-white border-0">
                    Edit profile
                </div>
                <div className="card-body text-center">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                {...register("username")}
                                type="text"
                                required
                                placeholder={user.username}
                                className="form-control m-3 w-50 mx-auto"
                            />

                            <label>Password</label>
                            <input
                                {...register("password")}
                                type="password"
                                required
                                placeholder="Enter new password"
                                className="form-control m-3 w-50 mx-auto"
                            />

                            <button className="m-3 w-50 mx-auto" type="submit">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
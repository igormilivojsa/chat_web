'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'

export default function Settings() {
    const params = useParams();
    const userId = params.userId;
    const { register, handleSubmit } = useForm();
    const router = useRouter();
    const [user, setUser] = useState();
    const [ loader, setLoader] = useState(false);

    useEffect(() => {

        const fetchUser = async () => {
            try {
                setLoader(true)
                const userData = await apiFetch(`/user/${ userId }`, router);

                setUser(userData);
            } catch (error) {
                getTostify('error', error.message)
            } finally {
                setLoader(false)
            }
        }

        fetchUser();
    }, [])

    const onSubmit = async (data) => {
        try {
            const updateUserData = await apiFetch(`/user/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }, router);
            if (!updateUserData) {
                getTostify('error', 'Failed to update profile')
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
'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'

export default function Settings() {
    const params = useParams();
    const userId = params.userId;
    const router = useRouter();
    const [user, setUser] = useState();
    const [ loader, setLoader] = useState(false);
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            username: '',
            password: '',
            icon: '',
        }
    });

    useEffect(() => {

        const fetchUser = async () => {
            try {
                setLoader(true)
                const userData = await apiFetch(`/user/${ userId }`, {method: 'GET'}, router);

                setUser(userData);
            } catch (error) {
                getTostify('error', error.message)
            } finally {
                setLoader(false)
            }
        }

        fetchUser();
    }, [])

    useEffect(() => {
        if (user) {
            reset({
                username: user.username,
                password: '',
                icon: '',
            })
        }
    }, [user]);

    const onSubmit = async (data) => {
        try {
            if (data.icon[0] instanceof File && data.icon[0].size > 0) {
                const formData = new FormData();
                formData.append('icon', data.icon[0]);
                await apiFetch(`/user/${userId}/avatar`, {
                    'method': 'PATCH',
                    body: formData
                }, router);
            }

            const updateUserData = await apiFetch(`/user/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ username: data.username, password: data.password }),
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
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow-sm border-0 p-4" style={{ width: "420px", borderRadius: "16px" }}>

                <div className="text-center mb-4">
                    <div className="mb-3">
                        <div
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white mx-auto"
                            style={{ width: "72px", height: "72px", fontSize: "28px" }}
                        >
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                    </div>

                    <h5 className="mb-0 fw-semibold">Edit profile</h5>
                    <small className="text-muted">Update your account details</small>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>

                    <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                            {...register("username")}
                            type="text"
                            className="form-control rounded-3"
                            placeholder="Username"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">New password</label>
                        <input
                            {...register("password")}
                            type="password"
                            className="form-control rounded-3"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Profile picture</label>
                        <input
                            {...register("icon")}
                            type="file"
                            className="form-control rounded-3"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 rounded-3 py-2 fw-semibold"
                    >
                        Save changes
                    </button>

                </form>
            </div>
        </div>
    );
}
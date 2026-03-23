'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'


export default function Settings() {
    const params = useParams();
    const userId = params.userId;
    const { register, handleSubmit } = useForm();
    const router = useRouter();

    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);
    }, []);

    const onSubmit = async (data) => {
        try {
            await fetch(`http://localhost/api/user/${userId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            alert('Profile updated');

            router.push(`/${userId}/chats`);
        } catch (error) {
            console.error(error);
        }
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
                                className="form-control m-3 w-50 mx-auto"
                            />

                            <label>Password</label>
                            <input
                                {...register("password")}
                                type="password"
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
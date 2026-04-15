'use client'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { getTostify } from '@/app/tostify'
import { useState } from 'react'
import { apiFetch } from '@/app/apiFetch'
import { GoogleLogin } from '@react-oauth/google'

export default function Register() {
    const {register, handleSubmit} = useForm();
    const router = useRouter();
    const [loader, setLoader] = useState(false);

    const onSubmit = async(data) => {
        try {
            setLoader(true);
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/register', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                setLoader(false);
                getTostify('error', 'Registration failed, check credentials')
                return;
            }

            const result = await response.json();

            localStorage.setItem('token', result.token)

            setLoader(false);
            getTostify('success', 'Registration successful');

            router.push(`/me/chats`)
        } catch (error) {
            console.log(error.message, 'error')
        } finally {
            setLoader(false);
        }
    }

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            setLoader(true);

            const result = await apiFetch('/login/google', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify({
                    credential: credentialResponse.credential
                }),
            }, router)

            localStorage.setItem('token', result.token)
            localStorage.setItem('refresh_token', result.refresh_token)
            getTostify('success', 'Google login successful');
            router.push(`/me/chats`);
        } catch (error) {
            console.log(error)
        } finally {
            setLoader(false);
        }
    }

    if (loader) {
        return <div>Loading...</div>
    }
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow-sm border-0 p-4" style={{ width: "420px", borderRadius: "16px" }}>

                <div className="text-center mb-4">
                    <h5 className="mb-0 fw-semibold">Register</h5>
                    <small className="text-muted">Create your account</small>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                            {...register("username")}
                            type="text"
                            className="form-control rounded-3"
                            placeholder="Username"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            {...register("email")}
                            type="email"
                            className="form-control rounded-3"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            {...register("password")}
                            type="password"
                            className="form-control rounded-3"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 rounded-3 py-2 fw-semibold"
                    >
                        Submit
                    </button>
                </form>

                <div className="mt-4 d-flex justify-content-center">
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => getTostify('error', 'Google login failed')}
                    />
                </div>
            </div>
        </div>
    )
}

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
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="w-50 card text-center">
                <div className="card-header bg-white border-0">
                    Register
                </div>
                <div className="card-body text-center">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <label>
                            Username
                        </label>
                        <input {...register("username")} type="text" className="form-control m-3 w-50 mx-auto"/>
                        <label>
                            Email
                        </label>
                        <input {...register("email")} type="email" className="form-control m-3 w-50 mx-auto"/>
                        <label>
                            Password
                        </label>
                        <input {...register("password")} type="password" className="form-control m-3 w-50 mx-auto"/>

                        <button className="m-3 w-50 mx-auto" type="submit">
                            Submit
                        </button>
                    </form>
                    <div className="mt-4 w-50 mx-auto">
                        <GoogleLogin
                            onSuccess={handleGoogleLogin}
                            onError={() => getTostify('error', 'Google login failed')}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

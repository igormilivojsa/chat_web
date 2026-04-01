'use client'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getTostify } from '@/app/tostify'
import { GoogleLogin } from '@react-oauth/google'
import { apiFetch } from '@/app/apiFetch'

export default function Login() {
    const {register, handleSubmit} = useForm();
    const router = useRouter();
    const [ loader, setLoader] = useState(false);

    const onSubmit = async(data) => {
        try {
            setLoader(true);
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/login_check', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                getTostify('error', 'Login failed, check credentials');
                setLoader(false);
                return;
            }

            const result = await response.json();

            localStorage.setItem('token', result.token)
            localStorage.setItem('refresh_token', result.refresh_token)

            getTostify('success', 'Login successful');

            router.push(`/${ result.user.id }/chats`)
        } catch(error) {
            console.log(error)
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
            if (!result) {
                setLoader(false);
                getTostify('error', 'Google login failed');
                return;
            }
            localStorage.setItem('token', result.token)
            localStorage.setItem('refresh_token', result.refresh_token)
            getTostify('success', 'Google login successful');
            router.push(`/${result.user.id}/chats`);
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
                <div className="card-header bg-white border-0">Login</div>
                <div className="card-body text-center">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <label>Email</label>
                        <input {...register("email")} type="email" className="form-control m-3 w-50 mx-auto"/>
                        <label>Password</label>
                        <input {...register("password")} type="password" className="form-control m-3 w-50 mx-auto"/>
                        <button className="m-3 w-50 mx-auto" type="submit">Submit</button>
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

'use client'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

export default function Login() {
    const {register, handleSubmit} = useForm();
    const router = useRouter();

    const onSubmit = async(data) => {
        try {
            const response = await fetch('http://localhost/api/login', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error('Login failed')
            }

            const result = await response.json();

            localStorage.setItem('token', result.token)

            router.push(`/${ result.user.id }/chats`)
        } catch(error) {
            console.log(error)
            alert('Check credentials')
        }
    }

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="w-50 card text-center">
                <div className="card-header bg-white border-0">
                    Login
                </div>
                <div className="card-body text-center">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <label>
                            Email
                        </label>
                        <input {...register("email")} type="email" className="form-control m-3 w-50 mx-auto"/>
                        <label>
                            Password
                        </label>
                        <input {...register("password")} type="password" className="form-control m-3 w-50 mx-auto"/>

                        <button className="m-3 w-50 mx-auto" type="submit" onKeyDown={e => handleSubmit()}>
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

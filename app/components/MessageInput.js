'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

export default function MessageInput({userId, chatId}) {
    const {register, handleSubmit, reset} = useForm({
        defaultValues: {
            body: '',
        }
    })
    const token = localStorage.getItem('token')
    const router = useRouter()
    const onSubmit = async(data) => {
        try {
            const response = await fetch(`http://localhost/api/user/${userId}/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error('Message failed')
            }

            reset({body: ''});
        } catch(error) {
            console.log(error)
            alert('Check credentials')
        }
    }

    return (
        <div>
            <form className="d-flex w-100 mb-4" onSubmit={handleSubmit(onSubmit)}>
                <input type="text" {...register("body")} className="flex-grow-1 border border-radius" />
                <button type="submit">Send</button>
            </form>
        </div>
    )
}

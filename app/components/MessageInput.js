'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/app/library/socket'

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

            const socket = getSocket(token);
            socket.emit("join_chat", chatId)
        } catch(error) {
            console.log(error)
            alert('Check credentials')
        }
    }

    return (
        <div className="composer">
            <form className="d-flex w-100 mb-0" onSubmit={handleSubmit(onSubmit)}>
                <input type="text" {...register("body")} className="flex-grow-1" />
                <button type="submit">Send</button>
            </form>
        </div>
    )
}

'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSocket } from '@/app/socket'

export default function MessageInput({userId, chatId}) {
    const {register, handleSubmit, reset, watch} = useForm({
        defaultValues: {
            body: '',
        }
    })
    const [ token, setToken] = useState(null);

    useEffect(() => {
        setToken(localStorage.getItem('token'));
    }, [])

    const bodyValue = watch('body');

    const socket = token ? getSocket(token) : null;

    useEffect(() => {
        if (!socket) return;

        if (bodyValue.trim().length > 0) {
            socket.emit('typing', { userId, chatId });
        } else {
            socket.emit('stop_typing', { userId, chatId });
        }
    }, [bodyValue, socket, userId, chatId]);


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

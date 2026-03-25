'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { getSocket } from '@/app/socket'
import { toast } from 'react-toastify'
import { getTostify } from '@/app/tostify'

export default function MessageInput({userId, chatId}) {
    const {register, handleSubmit, reset, watch} = useForm({
        defaultValues: {
            body: '',
        }
    })
    const [ token, setToken] = useState(null);
    const [loader, setLoader] = useState(false);

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

    const onSubmit = async(data) => {
        setLoader(true);
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + `/user/${userId}/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                setLoader(false);
                getTostify('error', 'Failed to send message, check credentials')
                return;
            }

            setLoader(false);
            getTostify('success', 'Message sent successfully')

            reset({body: ''});
        } catch(error) {
            getTostify('error', error.message)
        } finally {
            setLoader(false);
        }
    }

    if (loader) {
        return <div>Loading...</div>
    }

   return (
        <div className="composer">
            <form className="d-flex w-100 mb-0" onSubmit={handleSubmit(onSubmit)}>
                <input type="text" {...register("body")} required className="flex-grow-1" />
                <button type="submit">Send</button>
            </form>
        </div>
    )
}

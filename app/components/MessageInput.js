'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'

export default function MessageInput({userId, chatId}) {
    const {register, handleSubmit, reset, watch} = useForm({
        defaultValues: {
            body: '',
        }
    })
    const [loader, setLoader] = useState(false);

    const bodyValue = watch('body');

    const socket = getSocket(localStorage.getItem('token'));

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
            const newMessageData = await apiFetch(`/user/${userId}/chats/${chatId}/messages`, {
                method: 'POST',
                body: JSON.stringify(data)
            }, null);


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
        <>
            <form className="d-flex w-100 mb-0" onSubmit={handleSubmit(onSubmit)}>
                <input type="text" {...register("body")} required className="flex-grow-1" />
                <button type="submit">Send</button>
            </form>
        </>
    )
}

import { useEffect, useState } from 'react'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'

export default function Message({user, authId, message, setMessage}) {
    const isSender = Number(user.id) === Number(authId);

    useEffect(() => {
        const socket = getSocket(localStorage.getItem('token'));

        const messageDeleteHandler = (data) => {
            setMessage(prev => prev.filter(m => m.id !== data.messageId))
        }

        socket.on('message_delete', messageDeleteHandler);

        return () => {
            socket.off('message_delete', messageDeleteHandler)
        }
    }, [setMessage])

    async function handleDeleteMessage() {
        const chatId = message?.chatId ?? message.chat.id;

        if (!confirm('Are you sure?')) return;

        try {
            const deleteResponse = await apiFetch(`/user/${ user.id }/chats/${ chatId }/messages/${ message.id }`, {
                method: 'DELETE',
            }, null);

            getTostify('success', 'Message deleted successfully')
            setMessage(prev => prev.filter(m => m.id !== message.id))
        } catch (error) {
            getTostify('error', error.message)
        }
    }

    function formatTime(message) {
        const messageTime = new Date(message.createdAt);
        const now = new Date();
        const difference = now - messageTime;
        const differenceInMinutes = Math.floor(difference/60000);

        if (!differenceInMinutes) {
            return 'Just now'
        }

        if (differenceInMinutes < 60) {
            return `${ differenceInMinutes } minutes ago`
        }

        if (differenceInMinutes < 1440) {
            return `${ Math.floor(differenceInMinutes / 60) } hours ago`
        }

        return `${Math.floor(differenceInMinutes / 1440)} days ago`;
    }

    return (
        <div className="message-content">
            <div className={isSender ? "message-sender" : "message-receiver"} onClick={isSender ? handleDeleteMessage : null}>
                <div className={ isSender ? "message-sender-body" : "message-receiver-body" }>
                    { ! isSender && <div className="message-meta">{ message.user.username }</div> }
                    <div className="message-text">{ message.body }</div>
                    <div className="message-time">{formatTime(message)}</div>
                </div>
            </div>
        </div>
    );
}

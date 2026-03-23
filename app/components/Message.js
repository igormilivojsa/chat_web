import { useEffect, useState } from 'react'
import { getSocket } from '@/app/socket'
import ErrorMessage from '@/app/components/ErrorMessage'

export default function Message({user, authId, message, setMessage}) {
    const isSender = Number(user.id) === Number(authId);
    const [ token, setToken] = useState(null);
    const [error, setError] = useState('')

    useEffect(() => {
        const t = localStorage.getItem('token')
        setToken(t);

        const socket = getSocket(t);

        const messageDeleteHandler = (data) => {
            setMessage(prev => prev.filter(m => m.id !== data.messageId))
        }

        socket.on('message_delete', messageDeleteHandler);

        return () => {
            socket.off('message_delete', messageDeleteHandler)
        }
    }, [setMessage, token])

    async function handleDeleteMessage() {
        const chatId = message?.chatId ?? message.chat.id;

        try {
            const deleteResponse = await fetch(`http://localhost/api/user/${ user.id }/chats/${ chatId }/messages/${ message.id }`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${ token }`,
                    'Content-Type': 'application/json',
                },
            })


            if (! deleteResponse.ok) {
                const resData = await deleteResponse.json()
                setError(resData.message || 'Failed to delete message')
            } else {
                setMessage(prev => prev.filter(m => m.id !== message.id))
            }
        } catch (error) {
            setError(error.message || 'Delete message failed in Message')
        }

        setTimeout(() => setError(''), 5000)
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
            {error && <ErrorMessage error={error} />}
            <div className={isSender ? "message-sender" : "message-receiver"} onMouseDown={isSender ? handleDeleteMessage : null}>
                <div className={ isSender ? "message-sender-body" : "message-receiver-body" }>
                    { ! isSender && <div className="message-meta">{ message.user.username }</div> }
                    <div className="message-text">{ message.body }</div>
                    <div>{formatTime(message)}</div>
                </div>
            </div>
        </div>
    );
}

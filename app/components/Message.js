import { useEffect, useRef, useState } from 'react'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'

export default function Message({user, authId, message, setMessage}) {
    const isSender = Number(user.id) === Number(authId);
    const [holdProgress, setHoldProgress] = useState(0);
    const pressStartRef = useRef(null);
    const intervalRef = useRef(null);

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

    const startCounter = () => {
        pressStartRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - pressStartRef.current;
            const progress = Math.min(elapsed / 500, 1);

            setHoldProgress(progress);

            if (progress >= 1) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                setHoldProgress(1);
                handleDeleteMessage();
            }
        }, 16);
    }

    async function handleDeleteMessage() {
        const chatId = message?.chatId ?? message.chat.id;

        try {
            await apiFetch(`/user/me/chats/${ chatId }/messages/${ message.id }`, {
                method: 'DELETE',
            }, null);

            getTostify('success', 'Message deleted successfully')
            setMessage(prev => prev.filter(m => m.id !== message.id))
        } catch (error) {
            getTostify('error', error.message)
        }
    }

    const stopCounter = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setHoldProgress(0);
        pressStartRef.current = null;
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
            <div
                className={isSender ? "message-sender" : "message-receiver"}
                onMouseDown={isSender ? startCounter : null}
                onMouseUp={isSender ? stopCounter : null }
                onMouseLeave={isSender ? stopCounter : null}
                >
                <div
                    className={`${isSender ? "message-sender-body" : "message-receiver-body"} ${holdProgress > 0 ? "holding" : ""}`}
                    style={{ "--hold": holdProgress }}
                >
                    { ! isSender && <div className="message-meta">{ message.user.username }</div> }
                    <div className="message-text">{ message.body }</div>
                    <div className="message-time">{formatTime(message)}</div>
                </div>
            </div>
        </div>
    );
}

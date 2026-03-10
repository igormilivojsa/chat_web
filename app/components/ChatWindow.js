'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Message from '@/app/components/Message'
import MessageInput from '@/app/components/MessageInput'
import { getSocket } from '@/app/library/socket'

export function ChatWindow({chat}) {
    const params = useParams();
    const userId = params.userId;
    const [messages, setMessages] = useState([]);
    const token = localStorage.getItem('token');
    const router = useRouter();
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!chat) {
            return
        }

        if (!token) {
            router.push('/login')
        }

        const fetchMessages = async () => {
            try {
                const response = await fetch(
                    `http://localhost/api/user/${userId}/chats/${chat.id}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Unauthenticated or fetch failed');
                }

                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        setMessages([]);
        fetchMessages();
    }, [chat, userId]);

    useEffect(() => {
        if (!chat) {
            return;
        }
        const socket = getSocket(token);

        socket.emit('join_chat', chat.id)

        const handler = (payload) => {
            if (payload.chatId === chat.id) {
                setMessages(prev => {
                    const updated = [...prev, payload];
                    return updated;
                });
            }
        };

        socket.on('new_message', handler);
        return () => {
            socket.off("new_message", handler);
            socket.emit("leave_chat", chat.id);
        }
    }, [chat?.id])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" })
    }, [messages])

    if (!chat) return null;

    return (
        <div className="col-10 bg-light d-flex flex-column chat-column" style={{ paddingLeft: '10%', paddingRight: '10%', height: '100vh' }}>
            <div className="messages-container">
                {messages.map(message => (
                    <Message key={message.id} user={message.user} authId={userId} message={message} />
                ))}
                <div ref={bottomRef}></div>
            </div>
            <div className="composer">
                <MessageInput userId={userId} chatId={chat.id} />
            </div>
        </div>
    )
}
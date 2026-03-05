'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Message from '@/app/components/Message'
import MessageInput from '@/app/components/MessageInput'

export function ChatWindow({chat}) {
    const params = useParams();
    const userId = params.userId;
    const [messages, setMessages] = useState([]);
    const token = localStorage.getItem('token');
    const router = useRouter();

    useEffect(() => {
        if (!chat) {
            return
        }

        if (!token) {
            router.push('login')
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

        fetchMessages();
    }, [chat, userId]);

    if (!chat) return null;

    return (
        <div className="col-10 bg-light d-flex flex-column" style={{ paddingLeft: '5%', paddingRight: '5%', height: '100vh' }}>
            <div className="row flex-grow-1 overflow-y-auto">
                {messages.map(message => (
                    <Message key={message.id} user={message.user} authId={userId} message={message} />
                ))}
            </div>
            <MessageInput userId={userId} chatId={chat.id} />
        </div>
    )
}
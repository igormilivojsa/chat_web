'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Message from '@/app/components/Message'
import MessageInput from '@/app/components/MessageInput'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'

export function ChatWindow({setChats, chat, setSelectedChat, selectedChat}) {
    const params = useParams();
    const userId = params.userId;
    const [ messages, setMessages] = useState([]);
    const [ token , setToken ] = useState(null);
    const router = useRouter();
    const bottomRef = useRef(null);
    const [ willParticipate, setWillParticipate] = useState(null);
    const [ isTyping, setIsTyping] = useState(false);
    const [ isRead, setIsRead] = useState(false);

    //Fetch messages
    useEffect(() => {
        if (!chat) {
            router.push(
                `/${userId}/chats`
            )
            return;
        }

        const storedToken = localStorage.getItem('token');
        setToken(storedToken);

        if (!storedToken) {
            getTostify('error', 'Unauthenticated')
            router.push('/login');
            return;
        }

        const fetchMessages = async () => {
            try {
                const response = await fetch(
                    process.env.NEXT_PUBLIC_API_URL + `/user/${userId}/chats/${chat.id}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${storedToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    getTostify('error', 'Failed to fetch messages, check credentials')
                }

                const data = await response.json();
                setMessages(data);

                const myMessages = data.filter(message => Number(message.user.id) === Number(userId));
                const myLatestMessage = myMessages[myMessages.length - 1];
                setIsRead(myLatestMessage?.isRead ?? false);

                try {
                    await fetch(
                        process.env.NEXT_PUBLIC_API_URL + `/user/${userId}/chats/${chat.id}/messages/read`,
                        {
                            method: 'PATCH',
                            headers: {
                                Authorization: `Bearer ${storedToken}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                } catch (error) {
                    getTostify('error', error.message)
                }

                const isCreator = Number(chat.creator) === Number(userId);
                const userHasMessages = data.some(message => message.user.id == userId)
                setWillParticipate(isCreator || userHasMessages)
            } catch (error) {
                getTostify('error', error.message)
            }
        };

        setMessages([]);
        setWillParticipate(null);
        setIsRead(false);
        fetchMessages();
    }, [chat, userId]);

    //Join chat
    useEffect(() => {
        if (!chat) {
            return;
        }

        const socket = getSocket(token);

        socket.emit('join_chat', chat.id)

        const handleNewMessage = (payload) => {
            if (payload.chat.id === chat.id) {
                if (Number(payload.user.id) === Number(userId)) {
                    setWillParticipate(true)
                    setIsRead(false);
                }

                setMessages(prev => {
                    const updated = [...prev, payload];
                    return updated;
                });
            }
        };

        const handleReadMessage = ({ userId: readerId }) => {
            if (Number(readerId) === Number(userId)) return;

            setIsRead(true);

            setMessages(prev =>
                prev.map(message =>
                    Number(message.user.id) === Number(userId)
                    ? { ...message, isRead: true }
                    : message
                )
            );
        }

        socket.on('message_read', handleReadMessage);
        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('message_read', handleReadMessage);
            socket.off("new_message", handleNewMessage);
            socket.emit("leave_chat", chat.id);
        }
    }, [chat?.id])

    //Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    //Handle typing
    useEffect(() => {
        if (!chat) {
            return;
        }

        const socket = getSocket(token);

        const handleTyping = ({ userId: typingUserId }) => {
            if (Number(typingUserId) === Number(userId)) return;

            setIsTyping(true);
        };

        const handleStopTyping = ({ userId: typingUserId }) => {
            if (Number(typingUserId) === Number(userId)) return;

            setIsTyping(false);
        };

        socket.on('user_typing', handleTyping);
        socket.on('user_stop_typing', handleStopTyping);

        return () => {
            socket.off('user_typing', handleTyping);
            socket.off('user_stop_typing', handleStopTyping);
        };
    }, [chat?.id, token]);

    async function handleDelete() {
        try {
            const response = await fetch(
                process.env.NEXT_PUBLIC_API_URL + `/user/${userId}/chats/${chat.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                getTostify('error', 'Failed to delete chat, check credentials')
            }

            getTostify('success', 'Chat deleted successfully')
        } catch (error) {
            getTostify('error', error.message)
        }
    }

    if (!chat) return null;

    return (
        <div className="col-10 bg-light d-flex flex-column chat-column" style={{ paddingLeft: '10%', paddingRight: '10%', height: '100vh' }}>
            <div className="messages-container">
                {messages.map((message, index) => {
                    const isLastMessage =
                        Number(message.user.id) === Number(userId) &&
                        messages.findLastIndex(m => Number(m.user.id) === Number(userId)) === index;
                    return (
                        <div key={message.id}>
                            <Message setMessage={setMessages} user={message.user} authId={userId} message={message} />
                            {isLastMessage && isRead && (
                                <div className="text-end text-muted small">Seen</div>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef}></div>
            </div>
            <div className="row">
                { willParticipate === null ? null : (
                        willParticipate
                            ? <div></div>
                            : <button onClick={handleDelete}>User wants to chat, write message if you want to continue or delete this chat</button>
                    )
                }
                {
                    isTyping &&
                    <div>Typing</div>
                }
                <div className="composer">
                    <MessageInput userId={userId} chatId={chat.id} />
                </div>
            </div>
        </div>
    )
}
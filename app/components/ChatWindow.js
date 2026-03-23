'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Message from '@/app/components/Message'
import MessageInput from '@/app/components/MessageInput'
import { getSocket } from '@/app/socket'
import ErrorMessage from '@/app/components/ErrorMessage'

export function ChatWindow({setChats, chat, setSelectedChat, selectedChat}) {
    const params = useParams();
    const userId = params.userId;
    const [ messages, setMessages] = useState([]);
    const [ token , setToken ] = useState(null);
    const router = useRouter();
    const bottomRef = useRef(null);
    const [ willParticipate, setWillParticipate] = useState(null);
    const [ error, setError] = useState('');
    const [ isTyping, setIsTyping] = useState(false);
    const [ isRead, setIsRead] = useState(false);
    //Fetch messages
    useEffect(() => {
        if (!chat) {
            return;
        }

        const storedToken = localStorage.getItem('token');
        setToken(storedToken);

        if (!storedToken) {
            router.push('/login');
            return;
        }

        const fetchMessages = async () => {
            try {
                const response = await fetch(
                    `http://localhost/api/user/${userId}/chats/${chat.id}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${storedToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Unauthenticated or fetch failed');
                }

                const data = await response.json();
                setMessages(data);

                const myMessages = data.filter(message => Number(message.user.id) === Number(userId));
                const myLatestMessage = myMessages[myMessages.length - 1];
                setIsRead(myLatestMessage?.isRead ?? false);

                const unreadMessages = data.filter(message => !message.isRead && Number(message.user.id) !== Number(userId));
                const latestUnreadMessage = unreadMessages[unreadMessages.length - 1];

                if (!latestUnreadMessage) {
                    return;
                }

                try {
                    await fetch(
                        `http://localhost/api/user/${userId}/chats/${chat.id}/messages/${latestUnreadMessage.id}/read`,
                        {
                            method: 'PATCH',
                            headers: {
                                Authorization: `Bearer ${storedToken}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                } catch (err) {
                    console.error('Read failed', err);
                }

                const isCreator = Number(chat.creator) === Number(userId);
                const userHasMessages = data.some(message => message.user.id == userId)
                setWillParticipate(isCreator || userHasMessages)
            } catch (error) {
                setError(error?.message || 'Messages fetch failed in ChatWindow')
            }
        };

        setMessages([]);
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

        const handleReadMessage = ({userId: readerId, messageId}) => {
            if (Number(readerId) === Number(userId)) return;

            setIsRead(true);

            setMessages(prev => {
                const updated = prev.map(message => {
                    if (message.id === messageId) {
                        return {...message, isRead: true}
                    }
                    return message;
                })
                return updated;
            })
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
        if (!chat) return;

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
                `http://localhost/api/user/${userId}/chats/${chat.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Delete failed');
            }

        } catch (error) {
            setError(error?.message || 'Message delete failed in ChatWindow')
        }
    }

    if (!chat) return null;

    return (
        <div className="col-10 bg-light d-flex flex-column chat-column" style={{ paddingLeft: '10%', paddingRight: '10%', height: '100vh' }}>
            {error && <ErrorMessage error={error} /> }
            <div className="messages-container">
                {messages.map((message, index) => {
                    const isLastMessage =
                        Number(message.user.id) === Number(userId) &&
                        messages.findLastIndex(m => Number(m.user.id) === Number(userId)) === index;
                    console.log(isLastMessage)
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
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Message from '@/app/components/Message'
import MessageInput from '@/app/components/MessageInput'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'

export function ChatWindow({setChats, chat, setSelectedChat, selectedChat}) {
    const params = useParams();
    const userId = params.userId;
    const [ messages, setMessages] = useState([]);
    const router = useRouter();
    const bottomRef = useRef(null);
    const [ willParticipate, setWillParticipate] = useState(null);
    const [ isTyping, setIsTyping] = useState(false);
    const [ isRead, setIsRead] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const isInitialLoad = useRef(false);

    //Fetch messages
    useEffect(() => {
        if (!chat) {
            router.push(
                `/${userId}/chats`
            )
            return;
        }

        const fetchMessages = async () => {
            try {
                const messagesData = await apiFetch(`/user/${userId}/chats/${chat.id}/messages`, {},     router);

                if (!messagesData) {
                    return null;
                }

                isInitialLoad.current = true;
                setMessages(messagesData);

                const myMessages = messagesData.filter(message => Number(message.user.id) === Number(userId));
                const myLatestMessage = myMessages[myMessages.length - 1];
                setIsRead(myLatestMessage?.isRead ?? false);

                try {
                    await apiFetch(`/user/${userId}/chats/${chat.id}/messages/read`,
                        {
                            method: 'PATCH',
                        },
                        router
                    );
                } catch (error) {
                    getTostify('error', error.message)
                }

                const isCreator = Number(chat.creator) === Number(userId);
                const userHasMessages = messagesData.some(message => message.user.id == userId)
                setWillParticipate(isCreator || userHasMessages)
            } catch (error) {
                getTostify('error', error.message)
            }
        };

        setMessages([]);
        setWillParticipate(null);
        setIsRead(false);
        isInitialLoad.current = false; // add this
        fetchMessages();
    }, [chat, userId]);

    useEffect(() => {
        if (isInitialLoad.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
            isInitialLoad.current = false;
        } else if (isAtBottom()) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    //Join chat
    useEffect(() => {
        if (!chat) {
            return;
        }

        const socket = getSocket(localStorage.getItem('token'));

        socket.emit('join_chat', chat.id)

        const handleNewMessage = (payload) => {
            if (payload.chat.id === chat.id) {
                if (Number(payload.user.id) === Number(userId)) {
                    setWillParticipate(true)
                    setIsRead(false);
                }

                setMessages(prev => {
                    if (prev.some(m => m.id === payload.id)) return prev;
                    return [...prev, payload];
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

    //Handle typing
    useEffect(() => {
        if (!chat) {
            return;
        }

        const socket = getSocket(localStorage.getItem('token'));

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
    }, [chat?.id]);

    async function handleDelete() {
        try {
            const response = await apiFetch( `/user/${userId}/chats/${chat.id}`,
                {
                    method: 'DELETE',
                }, router
            );

            getTostify('success', 'Chat deleted successfully')
        } catch (error) {
            getTostify('error', error.message)
        }
    }

    const handleScroll = async (e) => {
        if (e.target.scrollTop === 0) {
            const container = e.target;
            const prevHeight = container.scrollHeight;

            await loadMore();

            setTimeout(() => {
                container.scrollTop = container.scrollHeight - prevHeight;
            }, 0);
        }
    };

    const isAtBottom = () => {
        const el = bottomRef.current?.parentElement;
        if (!el) return true;

        return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    };


    const loadMore = async () => {
        if (!messages.length || loadingMore) return;

        setLoadingMore(true);

        const oldest = messages[0];

        const data = await apiFetch(
            `/user/${userId}/chats/${chat.id}/messages?beforeId=${oldest.id}`,
            {},
            router
        );

        if (data.length > 0) {
            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const fresh = data.filter(m => !existingIds.has(m.id));
                return [...fresh, ...prev];
            });
        }

        setLoadingMore(false);
    };

    if (!chat) return null;

    return (
        <div className="col-10 bg-light d-flex flex-column chat-column" style={{ paddingLeft: '10%', paddingRight: '10%', height: '100vh' }}>
            <div className="messages-container" onScroll={handleScroll}>
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
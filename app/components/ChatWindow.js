'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Message from '@/app/components/Message'
import MessageInput from '@/app/components/MessageInput'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'
import { BsThreeDots } from 'react-icons/bs'
import { TiDeleteOutline } from 'react-icons/ti'

export function ChatWindow({chat, selectedChat, auth}) {
    const userId = auth.id;
    const [messages, setMessages] = useState([]);
    const router = useRouter();
    const bottomRef = useRef(null);
    const [willParticipate, setWillParticipate] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isRead, setIsRead] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const isInitialLoad = useRef(false);
    const receiver = selectedChat?.participant.find(participant => Number(participant.id) !== Number(userId));
    const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);

    //Fetch messages
    useEffect(() => {
        if (! chat) {
            router.push(
                `/me/chats`
            )
            return;
        }

        const fetchMessages = async () => {
            try {
                const messagesData = await apiFetch(`/user/me/chats/${ chat.id }/messages`, {}, router);

                if (! messagesData) {
                    return null;
                }

                isInitialLoad.current = true;
                setMessages(messagesData);

                const myMessages = messagesData.filter(message => Number(message.user.id) === Number(userId));
                const myLatestMessage = myMessages[myMessages.length - 1];
                setIsRead(myLatestMessage?.isRead ?? false);

                try {
                    await apiFetch(`/user/me/chats/${ chat.id }/messages/read`,
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
            bottomRef.current?.scrollIntoView({behavior: 'instant'});
            isInitialLoad.current = false;
        } else if (isAtBottom()) {
            bottomRef.current?.scrollIntoView({behavior: 'smooth'});
        }
    }, [messages]);

    //Join chat
    useEffect(() => {
        if (! chat) {
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

        const handleReadMessage = ({userId: readerId}) => {
            if (Number(readerId) === Number(userId)) return;

            setIsRead(true);

            setMessages(prev =>
                prev.map(message =>
                    Number(message.user.id) === Number(userId)
                    ? {...message, isRead: true}
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
        if (! chat) {
            return;
        }

        const socket = getSocket(localStorage.getItem('token'));

        const handleTyping = ({userId: typingUserId}) => {
            if (Number(typingUserId) === Number(userId)) return;

            setIsTyping(true);
        };

        const handleStopTyping = ({userId: typingUserId}) => {
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
            const response = await apiFetch(`/user/me/chats/${ chat.id }`,
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
        if (! el) return true;

        return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    };

    const loadMore = async () => {
        if (! messages.length || loadingMore) return;

        setLoadingMore(true);

        const oldest = messages[0];

        const data = await apiFetch(
            `/user/me/chats/${ chat.id }/messages?beforeId=${ oldest.id }`,
            {},
            router
        );

        if (data.length > 0) {
            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const fresh = data.filter(m => ! existingIds.has(m.id));
                return [...fresh, ...prev];
            });
        }

        setLoadingMore(false);
    };

    const handleOpenChatInfo = () => {
        setIsChatInfoOpen(prev => ! prev);
    }

    if (! chat) return null;

    return (
        <div className="col-10 d-flex p-0" style={ {height: '100vh'} }>

            <div
                className="d-flex flex-column flex-grow-1"
                style={ {minWidth: 0, paddingLeft: '1%', paddingRight: '1%'} }
            >
                <div className="row mw-100" id="chat-header">
                    <div className="col d-flex align-items-center gap-2" id="chat-title">
                        {receiver.icon.length === 1 ? (
                            <div className="avatar">
                                {receiver.icon}
                            </div>
                        ) : (
                             <img className="avatar" src={receiver.icon} alt="profile icon" />
                         )}

                        { receiver.username }
                    </div>
                    <div className="col mw-100 text-end" id="chat-title">
                        <button onClick={ handleOpenChatInfo } id="more-button">
                            <BsThreeDots/>
                        </button>
                    </div>
                </div>
                <hr/>
                <div className="messages-container" onScroll={ handleScroll }>
                    { messages.map((message, index) => {
                        const isLastMessage =
                            Number(message.user.id) === Number(userId) &&
                            messages.findLastIndex(m => Number(m.user.id) === Number(userId)) === index;
                        return (
                            <div key={ message.id }>
                                <Message
                                    setMessage={ setMessages } user={ message.user } authId={ userId }
                                    message={ message }
                                />
                                { isLastMessage && isRead && (
                                    <div className="text-end text-muted small">Seen</div>
                                ) }
                            </div>
                        );
                    }) }
                    <div ref={ bottomRef }></div>
                </div>
                <div className="row">
                    { willParticipate === null ? null : (
                        willParticipate
                        ? <div></div>
                        : <button onClick={ handleDelete }>User wants to chat, write message if you want to continue or
                                                           delete this chat</button>
                    ) }
                    { isTyping && <div>Typing</div> }
                    <div className="composer">
                        <MessageInput userId={ userId } chatId={ chat.id }/>
                    </div>
                </div>
            </div>

            {/*new component chat info*/}
            { isChatInfoOpen && (
                <div
                    className="border-start bg-white d-flex flex-column"
                    style={{ width: "25%", height: "100vh", overflowY: "auto" }}
                >
                    <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                        <h6 className="mb-0 fw-semibold">Chat Info</h6>
                        <button className="btn btn-light btn-sm rounded-circle">
                            <TiDeleteOutline size={20} />
                        </button>
                    </div>

                    <div className="text-center p-4">
                        <div className="big-avatar-wrapper mx-auto mb-3">
                            {receiver.icon.length === 1 ? (
                                <div className="big-avatar">
                                    {receiver.icon}
                                </div>
                            ) : (
                                 <img
                                     className="big-avatar"
                                     src={receiver.icon}
                                     alt={receiver.username}
                                 />
                             )}
                            <span
                                className={`chat-info-online-dot ${
                                    receiver.isOnline ? "online" : "offline"
                                }`}
                            ></span>
                        </div>
                        <h5 className="mb-1 fw-bold">{receiver.username}</h5>
                        <small className="text-muted">
                            {receiver.isOnline ? "Online" : "Offline"}
                        </small>
                    </div>

                    <hr className="my-0" />

                    <div className="p-3">
                        <h6 className="text-muted mb-3">Shared Images</h6>
                        <div className="row g-2">
                            <div className="col-4">
                                Image
                            </div>
                        </div>
                    </div>
                </div>
            ) }

        </div>
    )
}
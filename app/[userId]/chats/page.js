'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarList from '@/app/components/SidebarList'
import { ChatWindow } from '@/app/components/ChatWindow'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'

export default function Chats() {
    const params = useParams();
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [chats, setChats] = useState([])
    const [loader, setLoader] = useState(true)
    const [selectedChat, setSelectedChat] = useState(null);
    const [ onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        const token = localStorage.getItem('token')

        if (! token) {
            getTostify('error', 'Unauthenticated')
            router.push('/login')
            return;
        }


        const fetchData = async () => {
            try {
                const userResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + `/user/${ params.userId }`, {
                    headers: {
                        Authorization: `Bearer ${ token }`,
                        'Content-Type': 'application/json'
                    }
                });

                if (userResponse.status === 401) {
                    getTostify('error', 'Unauthenticated')
                    router.push('/login');
                    return
                }

                if (! userResponse.ok) {
                    getTostify('error', 'Failed to fetch user data, check credentials')
                    router.push('/login')
                }

                const userData = await userResponse.json();
                setUser(userData);

                const chatsResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + `/user/${params.userId}/chats`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (!chatsResponse.ok) {
                    setLoader(false)
                    getTostify('error', 'Failed to fetch chats, check credentials')
                    return;
                }

                const chatsData = await chatsResponse.json()
                setChats(chatsData)
            } catch (error) {
                getTostify('error', error.message)
            } finally {
                setLoader(false)
            }
        }
        fetchData();

        const socket = getSocket(token);

        const newChatHandler = async (data) => {
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + `/user/${params.userId}/chats/${data.chatId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const fullChat = await response.json();
            setChats(prev => [...prev, fullChat]);
        }

        const chatDeleteHandler = (data) => {
            setChats(prev => prev.filter(c => c.id !== data.chatId));

            setSelectedChat(prev => {
                if (prev?.id === data.chatId) return null;
                return prev;
            });
        };

        const handleOnlineUsers = (data) => {
            setOnlineUsers(prev => {
                const updated = new Set(prev).add(data.userId)
                return updated;
            })
        }

        const handleOfflineUsers = (data) => {
            setOnlineUsers(prev => {
                const updated = new Set(prev);
                updated.delete(data.userId);
                return updated;
            })
        }

        const handleCurrentOnlineUsers = (data) => {
            setOnlineUsers(new Set(data.userIds))
        }

        const joinUser = () => socket.emit('join_user', params.userId)

        if (socket.connected) {
            joinUser()
        } else {
            socket.on('connect', joinUser)
        }

        socket.on('new_chat', newChatHandler);
        socket.on('chat_delete', chatDeleteHandler);

        socket.on('online_user', handleOnlineUsers)
        socket.on('current_online_users', handleCurrentOnlineUsers)
        socket.on('offline_user', handleOfflineUsers)

        return () => {
            socket.off('connect', joinUser);
            socket.off('new_chat', newChatHandler);
            socket.off('chat_delete', chatDeleteHandler);
            socket.off('online_user', handleOnlineUsers);
            socket.off('offline_user', handleOfflineUsers );
            socket.off('current_online_users', handleCurrentOnlineUsers)
        };
    }, [params.userId, router])

    if (loader) {
        return <div>Loading...</div>
    }

    return (
        <div className="d-flex row mw-100 vh-100">
            <SidebarList setSelectedChat={setSelectedChat} onlineUsers={onlineUsers} selectedChat={selectedChat} user={user} chats={chats} setChats={setChats}  />
            <ChatWindow setSelectedChat={setSelectedChat} setChats={setChats} chat={selectedChat} selectedChat={selectedChat}/>
        </div>
    )
}

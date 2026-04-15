'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarList from '@/app/components/SidebarList'
import { ChatWindow } from '@/app/components/ChatWindow'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'

export default function Chats() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [chats, setChats] = useState([])
    const [loader, setLoader] = useState(true)
    const [selectedChat, setSelectedChat] = useState(null);
    const [ onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {

        const fetchData = async () => {
            try {
                setLoader(true)
                const userData = await apiFetch(`/user/me`, {}, router)

                setUser(userData);

                const chatsData = await apiFetch(`/user/me/chats`, {}, router);

                setChats(chatsData)
            } catch (error) {
                getTostify('error', error.message)
            } finally {
                setLoader(false)
            }
        }
        fetchData();

        const socket = getSocket(localStorage.getItem('token'));

        const newChatHandler = async (data) => {
            const chatResponse = await apiFetch(`/user/me/chats/${ data.chatId }`, {}, router);
            setChats(prev => [...prev, chatResponse]);
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

        const joinUser = () => socket.emit('join_user', user?.id)

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
            socket.off('offline_user', handleOfflineUsers);
            socket.off('current_online_users', handleCurrentOnlineUsers)
        };
    }, [user?.id, router])

    if (loader) {
        return <div>Loading...</div>
    }

    return (
        <div className="d-flex row mw-100 vh-100">
            <SidebarList setSelectedChat={setSelectedChat} onlineUsers={onlineUsers} selectedChat={selectedChat} auth={user} chats={chats} setChats={setChats}  />
            <ChatWindow setSelectedChat={setSelectedChat} setChats={setChats} chat={selectedChat} auth={user} selectedChat={selectedChat}/>
        </div>
    )
}

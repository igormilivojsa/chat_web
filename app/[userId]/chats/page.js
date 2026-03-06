'use client'


import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarList from '@/app/components/SidebarList'
import { ChatWindow } from '@/app/components/ChatWindow'

export default function Chats() {
    const params = useParams();
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [chats, setChats] = useState([])
    const [loader, setLoader] = useState(true)
    const [selectedChat, setSelectedChat] = useState(null);

    useEffect(() => {

        const token = localStorage.getItem('token')


        if (! token) {
            router.push('/login')
            return;
        }


        const fetchData = async () => {
            try {
                const userResponse = await fetch(`http://localhost/api/user/${ params.userId }`, {
                    headers: {
                        Authorization: `Bearer ${ token }`,
                        'Content-Type': 'application/json'
                    }
                });

                if (userResponse.status === 401) {
                    router.push('/login');
                    return
                }

                if (! userResponse.ok) {
                    throw new Error('Unauthorised')
                }

                const userData = await userResponse.json();
                setUser(userData);

                const chatsResponse = await fetch(`http://localhost/api/user/${params.userId}/chats`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (!chatsResponse.ok) throw new Error('Unauthorized')

                const chatsData = await chatsResponse.json()
                setChats(chatsData)

            } catch (error) {
                console.error(error)
            } finally {
                setLoader(false)
            }
        }
        fetchData();
    }, [params.userId, router])

    if (loader) {
        return <div>Loading...</div>
    }

    return (
        <div className="d-flex row mw-100 vh-100">
            <SidebarList setSelectedChat={setSelectedChat} user={user} chats={chats}  />
            <ChatWindow chat={selectedChat} />
        </div>
    )
}

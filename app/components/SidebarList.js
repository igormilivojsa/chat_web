import SidebarListItem from '@/app/components/SidebarListItem'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSocket, resetSocket } from '@/app/socket'

export default function SidebarList({setSelectedChat, user, chats, setChats, selectedChat, onlineUsers}) {
    const {register, handleSubmit, reset} = useForm({
        defaultValues: {
            body: '',
        }
    })
    const [ token, setToken] = useState(null);
    const router = useRouter();
    const isOnline = user && onlineUsers.has(user.id.toString());

    useEffect(() => {
        setToken(localStorage.getItem('token'));

    }, [])

    const onSubmit = async(data) => {
        try {
            const response = await fetch(`http://localhost/api/user/${user.id}/chats`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error('Chat exists')
            }

            const newChat = await response.json()

            setChats(prev => [...prev, newChat])

            reset({body: ''});

            alert('Chat created');
        } catch(error) {
            console.error(error)
            alert('Check credentials')
        }
    }

    function handleLogout() {
        const token = localStorage.getItem('token');
        const socket = getSocket(token)

        socket.disconnect();
        resetSocket();

        localStorage.removeItem('token');

        setToken(null);
        setChats([]);
        setSelectedChat(null);

        router.push('/login')
    }

    return (
        <div className="col-2 bg-light border-end sidebar-vh">
            <div className="sidebar-20 p-2">
                Logo
                <hr className="my-1" />
            </div>

            <div className="sidebar-70 px-2 list-group">
                <div className="card border-1 m-1 shadow-lg">
                    <button className="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#testModal">
                        Add chat
                    </button>
                </div>
                <div className="modal fade" id="testModal" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-body">
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <input {...register('email')} type="email" name="email" id="email"/>
                                    <button type='submit'>Create chat</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                { chats.map(chat => (
                    <SidebarListItem onClick={ () => setSelectedChat(chat) } onlineUsers={onlineUsers} isSelected={selectedChat?.id === chat.id} key={ chat.id } chat={ chat }/>
                )) }
            </div>

            <div className="sidebar-10 p-2 border-top">
                <div className="dropdown">
                    <button
                        className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        aria-expanded="true"
                    >
                        {
                            !user ?
                            ""
                            : user.username
                        }
                        {isOnline ? <span className="badge bg-success ms-2">Online</span> : <span className="badge bg-danger ms-2">Offline</span>}
                    </button>
                    <ul className="dropdown-menu">
                        <li>
                            <a className="dropdown-item" href="#">Settings</a>
                        </li>
                        <li>
                            <Link className="dropdown-item" onClick={handleLogout} href="/">Logout</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

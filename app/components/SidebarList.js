import SidebarListItem from '@/app/components/SidebarListItem'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'
import { useEffect, useState } from 'react'

export default function SidebarList({setSelectedChat, auth, chats, setChats, selectedChat, onlineUsers}) {
    const router = useRouter();
    const isOnline = auth && onlineUsers.has(auth.id.toString());
    const userId = auth?.id;
    const [ users, setUsers] = useState([]);
    const [ filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            const usersData = await apiFetch(`/user/search`, {}, router);
            if (!usersData) return;
            if (usersData.length === 0) return;
            setUsers(usersData);
            setFilteredUsers(usersData);
        }
        fetchUsers();
    }, []);

    const handleSearch = async(e) => {
        setSearchTerm(e.target.value);
    }

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchTerm.length < 2) {
                setFilteredUsers([]);
                return;
            }

            const filtered = users.filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase())
            );

            setFilteredUsers(filtered);
        }, 500);

        return () => clearTimeout(timeout);
    }, [searchTerm, users]);

    useEffect(() => {
        const socket = getSocket();

        const handleChatUpdated = ({chatId, latestMessage, latestMessageBy}) => {
            setChats(prevChats => {
                const updatedChats = prevChats.map(chat => {
                    if (chat.id === chatId) {
                        return {
                            ...chat,
                            latestMessage: latestMessage,
                            latestMessageBy: latestMessageBy,
                        };
                    }
                    return chat;
                });

                const updatedChat = updatedChats.find(chat => chat.id === chatId);
                const others = updatedChats.filter(chat => chat.id !== chatId);

                return [updatedChat, ...others];
            })
        }

        socket.on('chat_updated', handleChatUpdated)

        return () => {
            socket.off('chat_updated', handleChatUpdated);
        }
    }, [setChats])

    const onSubmit = async(data) => {
        const existingChat = chats.find(chat =>
            chat.participant.some(p => p.id === data.id)
        );
        if (existingChat) {
            setSelectedChat(existingChat);
            setSearchTerm('');
            setFilteredUsers([]);
        } else {
            try {
                const newChat = await apiFetch(`/user/me/chats`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                }, null)

                setChats(prev => {
                    const filtered = prev.filter(c => c.id !== newChat.id);
                    return [...filtered, newChat];
                });

                setSearchTerm('');
                setSelectedChat(newChat);
                setFilteredUsers([]);

                getTostify('success', 'Chat created successfully!')
            } catch(error) {
                getTostify('error', error.message)
            }
        }
    }

    useEffect(() => {
        const socket = getSocket();

        socket.on('new_chat', async (data) => {
            const { chatId } = data;

            socket.emit('join_chat', chatId);

            const chat = await apiFetch(`/user/me/chats/${chatId}`, {}, router);
            if (!chat) return;

            setChats(prev => {
                const filtered = prev.filter(c => c.id !== chat.id);
                return [chat, ...filtered];
            });
        });

        return () => {
            socket.off('new_chat');
        };
    }, [userId]);

    async function handleLogout() {
        await apiFetch('/logout', { method: 'POST' }, router);

        localStorage.removeItem('refresh_token');

        const socket = getSocket();
        socket.disconnect();

        setChats([]);
        setSelectedChat(null);

        router.push('/login');
    }

    return (
        <div className="col-2 bg-light border-end sidebar-vh">
            {/*Logo*/}
            <div className="sidebar-20 p-2">
                Logo
                <hr className="my-1" />
            </div>

            {/*Chats*/}
            <div className="sidebar-70 px-2 list-group">
                <input type="text" placeholder="Search" className="form-control mb-3" value={searchTerm} onChange={handleSearch}/>
                { searchTerm.length >= 2 && filteredUsers.map(filteredUser => (
                    <div className="card" key={filteredUser.id} onClick={() => onSubmit({id: filteredUser.id,  email: filteredUser.email })}>
                        <p className="card-header">{ filteredUser.isActive === 1 ? 'online ' : 'offline '}{ filteredUser.username }</p>
                    </div>
                ))}

                {searchTerm.length < 2 && chats.map(chat => (
                    <SidebarListItem onClick={ () => setSelectedChat(chat) } onlineUsers={onlineUsers} isSelected={chat.id === selectedChat?.id} key={ chat.id } auth={auth} chat={ chat }/>
                )) }
            </div>

            {/*Profile*/}
            <div className="sidebar-10 p-2 border-top">
                <div className="dropdown">
                    <button
                        type="button"
                        className="btn dropdown-toggle d-flex align-items-center gap-2 position-relative"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >

                        <div className="avatar-wrapper">
                            {auth.icon.length === 1 ? (
                                <div className="avatar">{auth.icon}</div>
                            ) : (
                                 <img className="avatar" src={auth.icon} />
                             )}

                            <span className={`online-dot ${isOnline ? 'online' : 'offline'}`} />
                        </div>

                        {auth && <span>{auth.username}</span>}
                    </button>

                    <ul className="dropdown-menu">
                        <li>
                            <Link className="dropdown-item" href={`/me/profile`}>
                                Settings
                            </Link>
                        </li>
                        <li>
                            <Link className="dropdown-item" onClick={handleLogout} href="/">
                                Logout
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

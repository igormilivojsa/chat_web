import SidebarListItem from '@/app/components/SidebarListItem'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSocket, resetSocket } from '@/app/socket'
import { getTostify } from '@/app/tostify'
import { apiFetch } from '@/app/apiFetch'
import { useEffect, useState } from 'react'

export default function SidebarList({setSelectedChat, user, chats, setChats, selectedChat, onlineUsers}) {
    const router = useRouter();
    const isOnline = user && onlineUsers.has(user.id.toString());
    const params = useParams();
    const userId = params.userId;
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

    const onSubmit = async(data) => {
        try {
            const newChat = await apiFetch(`/user/${userId}/chats`, {
                method: 'POST',
                body: JSON.stringify(data)
            }, null)

            // if (newChat === undefined) {
            //     const existingChat = chats.find(chat =>
            //         chat.participant.some(p => p.email === data.email)
            //     );
            //     console.log(existingChat)
            //     setSelectedChat(existingChat);
            //     getTostify('error', 'Chat already exists')
            //     return;
            // }

            setChats(prev => [...prev, newChat])

            setSearchTerm('');
            setSelectedChat(newChat);
            setFilteredUsers([]);

            getTostify('success', 'Chat created successfully!')
        } catch(error) {
            getTostify('error', error.message)
        }
    }

    useEffect(() => {
        const socket = getSocket(localStorage.getItem('token'));

        socket.on('new_chat', async (data) => {
            const { chatId } = data;

            socket.emit('join_chat', chatId);

            const chat = await apiFetch(`/user/${userId}/chats/${chatId}`, {}, router);
            if (!chat) return;

            setChats(prev => {
                const exists = prev.some(c => c.id === chat.id);
                if (exists) return prev;
                return [chat, ...prev];
            });
        });

        return () => {
            socket.off('new_chat');
        };
    }, [userId]);

    function handleLogout() {
        const socket = getSocket(localStorage.getItem('token'))

        socket.disconnect();
        resetSocket();

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        setChats([]);
        setSelectedChat(null);

        getTostify('success', 'Logged out successfully')

        router.push('/login')
    }

    return (
        <div className="col-2 bg-light border-end sidebar-vh">
            <div className="sidebar-20 p-2">
                Logo
                <hr className="my-1" />
            </div>
            <div className="sidebar-70 px-2 list-group">
                <input type="text" placeholder="Search" className="form-control" value={searchTerm} onChange={handleSearch}/>
                { searchTerm.length >= 2 && filteredUsers.map(filteredUser => (
                    <div className="card" key={filteredUser.id} onClick={() => onSubmit({ email: filteredUser.email })}>
                        <p className="card-header">{ filteredUser.isActive === 1 ? 'online ' : 'offline '}{ filteredUser.username }</p>
                    </div>
                ))}

                {searchTerm.length < 2 && chats.map(chat => (
                    <SidebarListItem onClick={ () => setSelectedChat(chat) } onlineUsers={onlineUsers} isSelected={selectedChat?.id === chat.id} key={ chat.id } chat={ chat }/>
                )) }
            </div>

            <div className="sidebar-10 p-2 border-top">
                <div className="dropdown">
                    <button
                        type="button"
                        className="btn dropdown-toggle d-flex align-items-center gap-2 position-relative"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >

                        <img
                            id="user-profile-image"
                            src="data:image/png;base64,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"
                            alt="User icon"
                        />

                        {user && <span>{user.username}</span>}

                        <span
                            className={`position-absolute top-0 start-100 translate-middle p-2 border border-light rounded-circle ${
                                isOnline ? "bg-success" : "bg-danger"
                            }`}
                        >
                            <span className="visually-hidden">status</span>
                        </span>
                    </button>

                    <ul className="dropdown-menu">
                        <li>
                            <Link className="dropdown-item" href={`/${userId}/profile`}>
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

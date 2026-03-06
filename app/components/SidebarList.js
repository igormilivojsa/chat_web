import SidebarListItem from '@/app/components/SidebarListItem'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

export default function SidebarList({setSelectedChat, user, chats}) {
    const {register, handleSubmit, reset} = useForm({
        defaultValues: {
            body: '',
        }
    })
    const [isOpen, setIsOpen] = useState(false);
    const token = localStorage.getItem('token')
    const router = useRouter();

    function handleOpenModal() {
        if (isOpen === false) {
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }

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

            reset({body: ''});
            alert('Chat created');
        } catch(error) {
            console.error(error)
            alert('Check credentials')
        }
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
                    <SidebarListItem onClick={ () => setSelectedChat(chat) } key={ chat.id } chat={ chat }/>
                )) }
            </div>

            <div className="sidebar-10 p-2 border-top">
            <div className="dropdown">
                    <button
                        className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        aria-expanded="true"
                    >
                        {user.username}
                    </button>
                    <ul className="dropdown-menu">
                        <li>
                            <a className="dropdown-item" href="#">Settings</a>
                        </li>
                        <li>
                            <a className="dropdown-item" href="#">Logout</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

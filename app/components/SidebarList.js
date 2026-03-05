import SidebarListItem from '@/app/components/SidebarListItem'

export default function SidebarList({setSelectedChat, user, chats}) {
    return (
        <div className="col-2 bg-light border-end sidebar-vh">
            <div className="sidebar-20 p-2">
                Logo
                <hr className="my-1" />
            </div>

            <div className="sidebar-70 px-2 list-group">
                {chats.map(chat => (
                    <SidebarListItem onClick={() => setSelectedChat(chat)} key={chat.id} chat={chat}/>
                ))}
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

import { useParams } from 'next/navigation'
import { log } from 'next/dist/server/typescript/utils'


export default function SidebarListItem({onClick, chat, isSelected, onlineUsers}) {
    const params = useParams();
    const userId = params.userId;
    const receiver = chat.participant.find(participant => participant.id != userId);
    const isOnline = onlineUsers.has(receiver.id.toString());

    return (
        <div className="card border-1 m-1 shadow-lg" onClick={onClick}>
            <div className={isSelected ? "bg-secondary-subtle" : ""} key={ chat.id }>
                <div className="card-body bg-light">
                    { receiver ? receiver.username : 'You' } { isOnline ? 'online' : 'offline' }
                </div>
                <div className="card-body">
                    {chat.latestMessage.length < 20 ? chat.latestMessage : 'To long'}
                </div>
            </div>
        </div>
    )
}
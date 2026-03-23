import { useParams } from 'next/navigation'
import { log } from 'next/dist/server/typescript/utils'


export default function SidebarListItem({onClick, chat, isSelected, onlineUsers}) {
    const params = useParams();
    const userId = params.userId;
    const receiver = chat.participant.find(participant => participant.id != userId);
    const isOnline = onlineUsers.has(receiver.id.toString());

    function shortenMessage(message) {
        if (!message) return '';
        if (message.length < 20) return message;
        return message.slice(0, 20) + '...';
    }

    return (
        <div className="card border-1 m-1 shadow-lg" onClick={onClick}>
            <div className={isSelected ? "bg-secondary-subtle" : ""} key={ chat.id }>
                <div className="card-body bg-light">
                    { receiver ? receiver.username : 'You' } { isOnline ? <span className="badge rounded bg-success">Online</span> : <span className="badge rounded bg-danger">Offline</span> }
                </div>
                <div className="card-body">
                    { shortenMessage(chat?.latestMessage) }
                </div>
            </div>
        </div>
    )
}
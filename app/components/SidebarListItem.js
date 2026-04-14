import { useParams } from 'next/navigation'


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

    function shorten(username) {
        if (!username) return '';
        if (username.length < 20) return username;
        return username.slice(0, 20) + '...';
    }

    return (
        <div
            onClick={onClick}
            className={`chat-item ${isSelected ? 'active' : ''}`}
        >
            <div className="avatar-wrapper">
                {receiver.icon.length === 1 ? (
                    <div className="avatar">{receiver.icon}</div>
                ) : (
                     <img className="avatar" src={receiver.icon} />
                 )}

                <span className={`online-dot ${isOnline ? 'online' : 'offline'}`} />
            </div>

            <div className="chat-content">
                <div className="top-row">
                    <span className="name">
                        {shorten(receiver?.username || 'You', 22)}
                    </span>
                </div>

                <div className="bottom-row">
                    <span className="preview">
                        <strong>
                            {chat?.latestMessageBy === receiver.username ? receiver.username : 'You'}:
                        </strong>{' '}
                        {shorten(chat?.latestMessage, 32)}
                    </span>
                </div>
            </div>
        </div>
    )
}
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

    function shortenUsername(username) {
        if (!username) return '';
        if (username.length < 20) return username;
        return username.slice(0, 20) + '...';
    }

    return (
        <div className="card border-1 m-1 shadow-lg" onClick={onClick}>
            <div className={isSelected ? "bg-secondary-subtle row m-1" : " row m-1" }>
                <div style={{ position: 'relative', display: 'inline-block' }} className="col-2">
                    <img
                        src="user.png"
                        className="rounded-circle"
                        alt="user image"
                        style={{ width: '50px', height: '50px' }}
                    />
                    <span
                        className={`rounded-circle ${isOnline ? "bg-success" : "bg-danger"}`}
                        style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            width: '13px',
                            height: '13px',
                            border: '2px solid white',
                        }}
                    ></span>
                </div>
                    <div className="col-10">
                        <span style={{ fontWeight: 'initial' , marginTop: '1px' }}>
                            {receiver ? shortenUsername(receiver.username) : 'You'}
                        </span>
                        <hr/>
                        <span>
                            { chat?.latestMessageBy === receiver.username ? shortenUsername(receiver.username) + ' :' : 'You :'}
                            { shortenMessage(chat?.latestMessage) }
                        </span>
                    </div>
                </div>
        </div>
    )
}
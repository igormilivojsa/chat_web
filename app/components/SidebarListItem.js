import { useParams } from 'next/navigation'
import Link from 'next/link'


export default function SidebarListItem({onClick, chat}) {
    const params = useParams();
    const userId = params.userId;
    const receiver = chat.participant.find(participant => participant.id !== userId);

    return (
        <div className="card border-1 m-1 shadow-lg" onClick={onClick}>
            <div key={ chat.id }>
                <div className="card-header bg-light">
                    { receiver.username }
                </div>
                <div className="card-body">
                    Latest message
                </div>
            </div>
        </div>
    )
}
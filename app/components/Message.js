export default function Message({user, authId, message}) {
    const isSender = user.id == authId;

    return (
        <div className="message-content">
            <div className={isSender ? "message-sender" : "message-receiver"}>
                <div className={isSender ? "message-sender-body" : "message-receiver-body"}>
                    {!isSender && <div className="message-meta">{message.user.username}</div>}
                    <div className="message-text">{message.body}</div>
                </div>
            </div>
        </div>
    );
}

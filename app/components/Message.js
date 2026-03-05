export default function Message({user, authId, message}) {
    const isSender = user.id == authId;

    return (
        <div className={isSender ? "message-sender" : "message-receiver"}>
            <p>{message.user.username}</p>
            <p className={isSender ? "message-sender-body" : "message-receiver-body"}>
                {message.body}
            </p>
        </div>
    );
}

import React, { useState } from 'react';
import ChatList from "../components/chat/ChatList";
import ChatRoom from "../components/chat/ChatRoom";


const Messages = ({ user, onBack }) => {
    const [selectedChat, setSelectedChat] = useState(null);

    return (
        <div className="messages-page">
            {!selectedChat ? (
                <div className="messages-container">
                    <div className="messages-header">
                        <button className="back-button" onClick={onBack}>
                            ← Back
                        </button>
                        <h2>Messages</h2>
                    </div>
                    <ChatList 
                        currentUser={user} 
                        onSelectChat={setSelectedChat} 
                    />
                </div>
            ) : (
                <ChatRoom
                    chat={selectedChat}
                    currentUser={user}
                    onBack={() => setSelectedChat(null)}
                />
            )}
        </div>
    );
};

export default Messages;

import React, { useState, useEffect, useRef } from 'react';
import '../styles/App.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Chat = () => {
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Load history list from local storage
        const storedHistory = JSON.parse(localStorage.getItem('chat_history_list') || '[]');
        setHistoryList(storedHistory);

        // Initialize Session
        const initSession = async () => {
            try {
                const storedSession = localStorage.getItem('chat_session_id');
                if (storedSession) {
                    setSessionId(storedSession);
                    fetchHistory(storedSession);
                } else {
                    createSession();
                }
            } catch (error) {
                console.error('Error initializing session:', error);
            }
        };
        initSession();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const createSession = async () => {
        try {
            const res = await fetch(`${API_URL}/session`, { method: 'POST' });
            const data = await res.json();
            const newSessionId = data.sessionId;

            setSessionId(newSessionId);
            localStorage.setItem('chat_session_id', newSessionId);
            setMessages([{ role: 'assistant', content: 'Hello! I am your news assistant. Ask me anything about the latest news.' }]);

            // Add to history list
            const newHistoryItem = { id: newSessionId, date: new Date().toLocaleString() };
            const updatedList = [newHistoryItem, ...historyList];
            setHistoryList(updatedList);
            localStorage.setItem('chat_history_list', JSON.stringify(updatedList));

        } catch (error) {
            console.error('Error creating session:', error);
        }
    };

    const fetchHistory = async (id) => {
        try {
            const res = await fetch(`${API_URL}/history/${id}`);
            const data = await res.json();
            if (data.history && data.history.length > 0) {
                setMessages(data.history);
            } else {
                setMessages([{ role: 'assistant', content: 'Hello! I am your news assistant. Ask me anything about the latest news.' }]);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleNewChat = () => {
        createSession();
    };

    const handleLoadSession = (id) => {
        if (id === sessionId) return;
        setSessionId(id);
        localStorage.setItem('chat_session_id', id);
        fetchHistory(id);
    };

    const handleDeleteSession = async (e, id) => {
        e.stopPropagation(); // Prevent triggering loadSession

        if (historyList.length <= 1) {
            alert("You cannot delete the last active session. Please create a new chat first.");
            return;
        }

        if (window.confirm("Are you sure you want to delete this chat?")) {
            try {
                // Call API to delete session data
                await fetch(`${API_URL}/session/${id}`, { method: 'DELETE' });

                // Update local state
                const updatedList = historyList.filter(item => item.id !== id);
                setHistoryList(updatedList);
                localStorage.setItem('chat_history_list', JSON.stringify(updatedList));

                // If deleted session was active, switch to the first available one
                if (id === sessionId) {
                    const nextSession = updatedList[0];
                    handleLoadSession(nextSession.id);
                }
            } catch (error) {
                console.error('Error deleting session:', error);
            }
        }
    };

    const handleResetChat = async () => {
        if (!sessionId) return;

        if (window.confirm("Are you sure you want to clear this chat's history? This will delete all messages in the current conversation.")) {
            try {
                // Call API to delete session data
                await fetch(`${API_URL}/session/${sessionId}`, { method: 'DELETE' });

                // Reset messages to initial state
                setMessages([{ role: 'assistant', content: 'Hello! I am your news assistant. Ask me anything about the latest news.' }]);
            } catch (error) {
                console.error('Error resetting chat:', error);
            }
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message: input })
            });
            const data = await res.json();

            const botMessage = {
                role: 'assistant',
                content: data.answer,
                sources: data.sources
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="logo-area">
                    <h1>Voosh<span>.AI</span></h1>
                </div>
                <button className="new-chat-btn" onClick={handleNewChat}>
                    + New Chat
                </button>
                <div className="history-list">
                    <h3>Recent Chats</h3>
                    <ul>
                        {historyList.map((item) => (
                            <li
                                key={item.id}
                                className={item.id === sessionId ? 'active' : ''}
                                onClick={() => handleLoadSession(item.id)}
                            >
                                <span>Chat {item.date}</span>
                                <button
                                    className="delete-btn"
                                    onClick={(e) => handleDeleteSession(e, item.id)}
                                    title="Delete Chat"
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-wrapper">
                <header>
                    <h2>News Assistant</h2>
                    <button className="reset-chat-btn" onClick={handleResetChat} title="Clear chat history">
                        🔄 Reset Chat
                    </button>
                </header>

                <div className="messages-area">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            <div className="content">{msg.content}</div>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="sources">
                                    <strong>Sources:</strong>
                                    <ul>
                                        {msg.sources.map((source, idx) => (
                                            <li key={idx}>
                                                <a href={source.link} target="_blank" rel="noopener noreferrer">
                                                    {source.source}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && <div className="loading">Thinking...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <form className="input-area" onSubmit={sendMessage}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the news..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>Send</button>
                </form>
            </div>
        </div>
    );
};

export default Chat;

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot } from "lucide-react";


type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
};

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Hello! How can I assist you today?",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!inputValue.trim()) return;
        
        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: "user",
            timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);
        
        // Connect to WebSocket for streaming responses
        try {
            const ws = new WebSocket("ws://localhost:8002/chat");
            let accumulatedText = "";
            
            ws.onopen = () => {
            ws.send(JSON.stringify({ message: inputValue }));
            };
            
            ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            console.log(response)
            
            if (response.type === "stream") {
                const formattedText = response.text
                
                // Accumulate the streaming text
                accumulatedText += formattedText;
                
                // Update the bot message as it streams
                setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages.find(msg => 
                    msg.sender === "bot" && msg.id === "streaming-message");
                    
                if (lastMessage) {
                    lastMessage.text = accumulatedText;
                    return newMessages;
                } else {
                    return [...prev, {
                    id: "streaming-message",
                    text: accumulatedText,
                    sender: "bot",
                    timestamp: new Date(),
                    }];
                }
                });
            } else if (response.type === "done") {
                // Finalize the message with a permanent ID
                setMessages(prev => {
                const newMessages = prev.filter(msg => msg.id !== "streaming-message");
                return [...newMessages, {
                    id: (Date.now() + 1).toString(),
                    text: accumulatedText,
                    sender: "bot",
                    timestamp: new Date(),
                }];
                });
                setIsLoading(false);
                ws.close();
            }
            };
            
            ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "Error connecting to chat service. Please try again later.",
                sender: "bot",
                timestamp: new Date(),
            }]);
            setIsLoading(false);
            };
        } catch (error) {
            console.error("Failed to connect:", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 px-36">
            <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Hey SOL</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${
                            message.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`flex max-w-[80%] items-start gap-2.5 ${
                                message.sender === "user" ? "flex-row-reverse" : ""
                            }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    message.sender === "user"
                                        ? "bg-blue-600"
                                        : "bg-gray-200 dark:bg-gray-700"
                                }`}
                            >
                                {message.sender === "user" ? (
                                    <User className="w-5 h-5 text-white" />
                                ) : (
                                    <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                )}
                            </div>
                            <div
                                className={`px-4 py-2 rounded-lg ${
                                    message.sender === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                                }`}
                            >
                                <p>{message.text}</p>
                                <p className="text-xs text-right mt-1 opacity-70">
                                    {new Intl.DateTimeFormat("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }).format(message.timestamp)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex max-w-[80%] items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
            >
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-blue-600 text-white rounded-full p-2.5 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
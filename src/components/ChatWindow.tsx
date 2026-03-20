import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Paperclip, Phone, Video, MoreVertical, Smile } from 'lucide-react';
import { User, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChatWindowProps {
  currentUser: User;
  targetUser: User;
  messages: Message[];
  onSendMessage: (text: string, type: 'text' | 'image') => void;
  onStartCall: (type: 'voice' | 'video') => void;
}

export default function ChatWindow({ currentUser, targetUser, messages, onSendMessage, onStartCall }: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim(), 'text');
      setInputText('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage(reader.result as string, 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-dark">
      {/* Header */}
      <div className="p-4 bg-brand-blue border-b border-brand-accent flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-light">
            <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full" />
          </div>
          <div>
            <h3 className="font-bold text-brand-white">{targetUser.name}</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onStartCall('voice')}
            className="p-2 hover:bg-brand-accent rounded-full text-brand-light transition-colors"
          >
            <Phone size={20} />
          </button>
          <button 
            onClick={() => onStartCall('video')}
            className="p-2 hover:bg-brand-accent rounded-full text-brand-light transition-colors"
          >
            <Video size={20} />
          </button>
          <button className="p-2 hover:bg-brand-accent rounded-full text-brand-light transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center mb-4">
              <Smile size={40} />
            </div>
            <p className="text-sm italic">Say hi to {targetUser.name}!</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                  "flex flex-col max-w-[80%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "px-4 py-3 rounded-2xl shadow-sm",
                  isMe 
                    ? "bg-brand-light text-brand-white rounded-tr-none" 
                    : "bg-brand-blue text-brand-white rounded-tl-none border border-brand-accent"
                )}>
                  {msg.type === 'text' ? (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  ) : (
                    <img src={msg.mediaUrl} alt="Shared media" className="rounded-lg max-w-full h-auto" />
                  )}
                </div>
                <span className="text-[9px] text-brand-light mt-1 opacity-50 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-brand-blue border-t border-brand-accent">
        <form onSubmit={handleSend} className="flex items-center gap-3 bg-brand-dark rounded-2xl p-2 border border-brand-accent focus-within:border-brand-light transition-all">
          <label className="p-2 hover:bg-brand-accent rounded-xl text-brand-light cursor-pointer transition-colors">
            <Image size={20} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <button type="button" className="p-2 hover:bg-brand-accent rounded-xl text-brand-light transition-colors">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none text-brand-white focus:outline-none text-sm py-2"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={cn(
              "p-2 rounded-xl transition-all",
              inputText.trim() 
                ? "bg-brand-light text-brand-white shadow-lg scale-105" 
                : "text-brand-light opacity-50"
            )}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

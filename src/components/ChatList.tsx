import { User, MessageSquare, Users, Phone, Video } from 'lucide-react';
import { User as UserType, Room } from '../types';
import { cn } from '../lib/utils';

interface ChatListProps {
  currentUser: UserType;
  onlineUsers: UserType[];
  onSelectUser: (user: UserType) => void;
  selectedUserId?: string;
}

export default function ChatList({ currentUser, onlineUsers, onSelectUser, selectedUserId }: ChatListProps) {
  const otherUsers = onlineUsers.filter(u => u.id !== currentUser.id);

  return (
    <div className="flex flex-col h-full bg-brand-blue border-r border-brand-accent w-80">
      <div className="p-6 border-bottom border-brand-accent">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-light">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full" />
          </div>
          <div>
            <h2 className="font-bold text-brand-white">{currentUser.name}</h2>
            <p className="text-xs text-brand-light">Online</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 bg-brand-accent hover:bg-brand-light transition-colors py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
            <MessageSquare size={14} />
            Chats
          </button>
          <button className="flex-1 bg-brand-dark hover:bg-brand-accent transition-colors py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
            <Users size={14} />
            Groups
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4">
        <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-brand-light mb-4 opacity-50">
          Online Friends ({otherUsers.length})
        </h3>
        
        {otherUsers.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-brand-light opacity-50 italic">No friends online yet...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {otherUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group",
                  selectedUserId === user.id 
                    ? "bg-brand-light text-brand-white shadow-lg" 
                    : "hover:bg-brand-accent text-brand-light hover:text-brand-white"
                )}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-dark border border-brand-accent">
                    <img src={user.avatar} alt={user.name} className="w-full h-full" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-brand-blue rounded-full"></div>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-sm truncate">{user.name}</h4>
                  <p className="text-[10px] opacity-70 truncate">Tap to chat</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

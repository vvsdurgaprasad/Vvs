export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Message {
  id: string;
  roomId: string;
  text?: string;
  mediaUrl?: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'image' | 'video';
  timestamp: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'private' | 'group';
  members: string[];
  lastMessage?: string;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message } from './types';
import Login from './components/Login';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import CallWindow from './components/CallWindow';
import { Phone, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const socket: Socket = io();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  
  // Call State
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incoming' | 'active'>('idle');
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callTarget, setCallTarget] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<any>(null);

  const pc = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    socket.on('users_list', (users: User[]) => {
      setOnlineUsers(users);
    });

    socket.on('receive_message', (msg: Message) => {
      const roomId = msg.roomId;
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), msg]
      }));
    });

    socket.on('incoming_call', async ({ from, offer, type }) => {
      const fromUser = onlineUsers.find(u => u.id === from);
      if (fromUser) {
        setCallTarget(fromUser);
        setCallType(type);
        setIncomingOffer(offer);
        setCallStatus('incoming');
      }
    });

    socket.on('call_answered', async ({ answer }) => {
      if (pc.current) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('active');
      }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      if (pc.current && candidate) {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('call_ended', () => {
      endCall();
    });

    return () => {
      socket.off('users_list');
      socket.off('receive_message');
      socket.off('incoming_call');
      socket.off('call_answered');
      socket.off('ice_candidate');
      socket.off('call_ended');
    };
  }, [onlineUsers]);

  const handleLogin = (name: string, avatar: string) => {
    const newUser = { id: socket.id!, name, avatar };
    setUser(newUser);
    socket.emit('join', { name, avatar });
  };

  const getRoomId = (u1: string, u2: string) => [u1, u2].sort().join('--');

  const handleSendMessage = (text: string, type: 'text' | 'image') => {
    if (!user || !selectedUser) return;
    const roomId = getRoomId(user.id, selectedUser.id);
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId,
      senderId: user.id,
      senderName: user.name,
      type,
      text: type === 'text' ? text : undefined,
      mediaUrl: type === 'image' ? text : undefined,
      timestamp: new Date().toISOString(),
    };
    socket.emit('send_message', message);
  };

  const initPeerConnection = (targetId: string) => {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    pc.current = new RTCPeerConnection(configuration);

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { to: targetId, candidate: event.candidate });
      }
    };

    pc.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.current?.addTrack(track, localStream));
    }
  };

  const startCall = async (type: 'voice' | 'video') => {
    if (!selectedUser || !user) return;
    setCallType(type);
    setCallTarget(selectedUser);
    setCallStatus('calling');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      setLocalStream(stream);
      
      initPeerConnection(selectedUser.id);
      
      const offer = await pc.current!.createOffer();
      await pc.current!.setLocalDescription(offer);
      
      socket.emit('call_user', { to: selectedUser.id, offer, from: user.id, type });
    } catch (err) {
      console.error('Failed to get media stream', err);
      setCallStatus('idle');
    }
  };

  const acceptCall = async () => {
    if (!callTarget || !user || !incomingOffer) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      setLocalStream(stream);

      initPeerConnection(callTarget.id);
      
      await pc.current!.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.current!.createAnswer();
      await pc.current!.setLocalDescription(answer);
      
      socket.emit('answer_call', { to: callTarget.id, answer });
      setCallStatus('active');
    } catch (err) {
      console.error('Failed to accept call', err);
      endCall();
    }
  };

  const endCall = () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (callTarget) {
      socket.emit('end_call', { to: callTarget.id });
    }
    setCallStatus('idle');
    setCallTarget(null);
    setIncomingOffer(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const currentRoomId = selectedUser ? getRoomId(user.id, selectedUser.id) : null;

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      <ChatList
        currentUser={user}
        onlineUsers={onlineUsers}
        onSelectUser={(u) => {
          setSelectedUser(u);
          socket.emit('join_room', getRoomId(user.id, u.id));
        }}
        selectedUserId={selectedUser?.id}
      />
      
      <div className="flex-1 relative">
        {selectedUser ? (
          <ChatWindow
            currentUser={user}
            targetUser={selectedUser}
            messages={currentRoomId ? (messages[currentRoomId] || []) : []}
            onSendMessage={handleSendMessage}
            onStartCall={startCall}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-brand-light opacity-30">
            <div className="w-32 h-32 bg-brand-blue rounded-full flex items-center justify-center mb-6 border-4 border-brand-accent">
              <Phone size={64} />
            </div>
            <h2 className="text-2xl font-bold">Select a friend to start chatting</h2>
            <p className="text-sm mt-2">SnapBlue - Your private social space</p>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {callStatus === 'incoming' && callTarget && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 z-[60] bg-brand-blue p-6 rounded-3xl shadow-2xl border-2 border-brand-light flex flex-col items-center gap-4 w-72"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-brand-light animate-bounce">
              <img src={callTarget.avatar} alt={callTarget.name} className="w-full h-full" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg">{callTarget.name}</h3>
              <p className="text-xs text-brand-light uppercase tracking-widest font-bold">Incoming {callType} Call</p>
            </div>
            <div className="flex gap-4 w-full">
              <button
                onClick={endCall}
                className="flex-1 bg-red-500 hover:bg-red-600 p-3 rounded-xl text-white transition-all"
              >
                <X size={24} className="mx-auto" />
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 p-3 rounded-xl text-white transition-all"
              >
                {callType === 'video' ? <Video size={24} className="mx-auto" /> : <Phone size={24} className="mx-auto" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outgoing Call Modal */}
      <AnimatePresence>
        {callStatus === 'calling' && callTarget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[60] bg-brand-dark/90 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-light mb-6 animate-pulse">
              <img src={callTarget.avatar} alt={callTarget.name} className="w-full h-full" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{callTarget.name}</h2>
            <p className="text-brand-light uppercase tracking-[0.3em] text-xs font-bold mb-12">Calling...</p>
            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 p-6 rounded-full text-white transition-all shadow-xl"
            >
              <PhoneOff size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Call Window */}
      {callStatus === 'active' && callTarget && (
        <CallWindow
          type={callType}
          targetUser={callTarget}
          onEndCall={endCall}
          localStream={localStream}
          remoteStream={remoteStream}
        />
      )}
    </div>
  );
}

function PhoneOff(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.04 19.79 19.79 0 0 1-6.11-6.11A19.79 19.79 0 0 1 2 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}

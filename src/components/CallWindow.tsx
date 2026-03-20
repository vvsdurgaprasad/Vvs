import { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2 } from 'lucide-react';
import { User } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface CallWindowProps {
  type: 'voice' | 'video';
  targetUser: User;
  onEndCall: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export default function CallWindow({ type, targetUser, onEndCall, localStream, remoteStream }: CallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && type === 'video') {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 bg-brand-dark flex flex-col items-center justify-center p-6"
    >
      <div className="relative w-full max-w-4xl aspect-video bg-brand-blue rounded-3xl overflow-hidden shadow-2xl border border-brand-accent">
        {/* Remote Video */}
        {type === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-light mb-6">
              <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full" />
            </div>
            <h2 className="text-2xl font-bold text-brand-white">{targetUser.name}</h2>
            <p className="text-brand-light animate-pulse">On Voice Call...</p>
          </div>
        )}

        {/* Local Video (Picture in Picture) */}
        {type === 'video' && (
          <div className="absolute top-6 right-6 w-48 aspect-video bg-brand-dark rounded-2xl overflow-hidden border-2 border-brand-light shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-brand-dark/80 backdrop-blur-md px-8 py-4 rounded-full border border-brand-accent">
          <button
            onClick={toggleMute}
            className={cn(
              "p-4 rounded-full transition-all",
              isMuted ? "bg-red-500 text-white" : "bg-brand-accent text-brand-white hover:bg-brand-light"
            )}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {type === 'video' && (
            <button
              onClick={toggleVideo}
              className={cn(
                "p-4 rounded-full transition-all",
                isVideoOff ? "bg-red-500 text-white" : "bg-brand-accent text-brand-white hover:bg-brand-light"
              )}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          <button
            onClick={onEndCall}
            className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg"
          >
            <PhoneOff size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="absolute top-6 left-6 flex items-center gap-3 bg-brand-dark/40 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full" />
          </div>
          <span className="text-sm font-bold text-brand-white">{targetUser.name}</span>
        </div>
      </div>
    </motion.div>
  );
}

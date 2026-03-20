import React, { useState } from 'react';
import { Camera, User } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (name: string, avatar: string) => void;
}

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
];

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim(), avatar);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-blue p-8 rounded-3xl shadow-2xl w-full max-w-md border border-brand-accent"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-brand-light rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden">
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-brand-white tracking-tight">SnapBlue</h1>
          <p className="text-brand-light text-sm">Connect with friends</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-light mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-brand-dark border border-brand-accent rounded-xl px-4 py-3 text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-light transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-light mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    avatar === av ? 'border-brand-light scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av} alt="Avatar option" className="w-full h-full bg-brand-dark" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-light hover:bg-opacity-90 text-brand-white font-bold py-4 rounded-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <User size={20} />
            Join Chat
          </button>
        </form>
      </motion.div>
    </div>
  );
}

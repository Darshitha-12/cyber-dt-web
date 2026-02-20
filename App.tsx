
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import Login from './components/Login';
import PasscodeLock from './components/PasscodeLock';
import GroupPreview from './components/GroupPreview';
import { Chat, Message, UserProfile } from './types';
import { getAIResponse } from './services/geminiService';

const MOCK_CHATS: Chat[] = [
  {
    id: 'ai-bot',
    name: 'Gemini AI Assistant',
    avatar: 'https://picsum.photos/seed/gemini/100',
    lastMessage: 'Hello! I am your bot',
    lastTimestamp: '9:00 AM',
    unreadCount: 0,
    online: true,
    messages: [
      { id: 'a1', text: 'Hello! I am your bot. How can I help you today?', sender: 'them', timestamp: '9:00 AM', status: 'read' },
    ],
    type: 'private'
  },
  {
    id: 'amila',
    name: 'Amila',
    avatar: 'https://picsum.photos/seed/amila/100',
    lastMessage: 'How are you?',
    lastTimestamp: '12:05 PM',
    unreadCount: 2,
    messages: [
      { id: 'm1', text: 'How are you?', sender: 'them', timestamp: '12:05 PM', status: 'delivered' },
    ],
    type: 'private'
  },
  {
    id: 'nimal',
    name: 'Nimal',
    avatar: 'https://picsum.photos/seed/nimal/100',
    lastMessage: 'See you tomorrow',
    lastTimestamp: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'n1', text: 'See you tomorrow', sender: 'them', timestamp: 'Yesterday', status: 'read' },
    ],
    type: 'private'
  },
  {
    id: 'sl-tech',
    name: 'Sri Lanka Tech 🇱🇰',
    avatar: 'https://picsum.photos/seed/sl/100',
    lastMessage: 'Sahan: Gemini is amazing!',
    lastTimestamp: '11:50 AM',
    unreadCount: 5,
    messages: [
      { id: 'g1', text: 'Welcome!', sender: 'them', senderName: 'Admin', timestamp: '10:00 AM', status: 'read' },
    ],
    type: 'group',
    memberCount: 1450
  }
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('is_auth') === 'true');
  const [isLocked, setIsLocked] = useState(true);
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode for the aesthetic
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deepLinkGroup, setDeepLinkGroup] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('tele_profile');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      handle: '@username',
      avatar: 'https://picsum.photos/seed/default/100',
      isPasscodeEnabled: false
    };
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinGroup = params.get('join');
    if (joinGroup) {
      setDeepLinkGroup(joinGroup.replace(/_/g, ' '));
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tele_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const activeChat = useMemo(() => chats.find(c => c.id === selectedChatId), [chats, selectedChatId]);

  const handleSendMessage = useCallback(async (text: string, imageData?: string) => {
    if (!selectedChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: text || "Image Attached",
      image: imageData,
      sender: 'me',
      senderName: userProfile.name,
      senderAvatar: userProfile.avatar,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: text || "Sent an image",
          lastTimestamp: 'Just now'
        };
      }
      return chat;
    }));

    if (selectedChatId === 'ai-bot' || (activeChat?.type === 'group' && text.toLowerCase().includes('gemini'))) {
      setIsAiTyping(true);
      try {
        const aiResponseText = await getAIResponse(text, activeChat?.messages || [], imageData);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          sender: 'them',
          senderName: 'Gemini Bot',
          senderAvatar: 'https://picsum.photos/seed/gemini/100',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered'
        };

        setChats(prev => prev.map(chat => {
          if (chat.id === selectedChatId) {
            return {
              ...chat,
              messages: [...chat.messages, aiMessage],
              lastMessage: aiResponseText,
              lastTimestamp: 'Just now'
            };
          }
          return chat;
        }));
      } catch (e) {
        console.error("AI Error:", e);
      } finally {
        setIsAiTyping(false);
      }
    }
  }, [selectedChatId, activeChat, userProfile]);

  const handleLogout = () => {
    sessionStorage.removeItem('is_auth');
    setIsLoggedIn(false);
    setSelectedChatId(null);
  };

  const handleJoinGroup = (groupName: string) => {
    const newGroupId = `group_${Date.now()}`;
    const newGroup: Chat = {
      id: newGroupId,
      name: groupName,
      avatar: `https://picsum.photos/seed/${groupName}/100`,
      lastMessage: 'Broadcasting started...',
      lastTimestamp: 'Just now',
      unreadCount: 0,
      messages: [],
      type: 'group',
      memberCount: Math.floor(Math.random() * 5000) + 100
    };
    setChats(prev => [newGroup, ...prev]);
    setSelectedChatId(newGroupId);
    setDeepLinkGroup(null);
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => {
      sessionStorage.setItem('is_auth', 'true');
      setIsLoggedIn(true);
      if (userProfile.isPasscodeEnabled) setIsLocked(true);
      else setIsLocked(false);
    }} />;
  }

  if (userProfile.isPasscodeEnabled && isLocked) {
    return <PasscodeLock correctPasscode={userProfile.passcode || ''} onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden p-0 sm:p-4 gap-4 bg-[#f0f2f5] dark:bg-[#000428]">
      <div className="glass flex w-full h-full rounded-none sm:rounded-[40px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] transition-all duration-700 ease-in-out relative border border-white/10">
        <Sidebar 
          chats={chats} 
          selectedId={selectedChatId} 
          onSelect={setSelectedChatId}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          userProfile={userProfile}
          onOpenSettings={() => setShowSettings(true)}
          onJoinGroup={handleJoinGroup}
          onLockApp={() => setIsLocked(true)}
        />
        <main className="flex-1 flex flex-col relative bg-white/5 dark:bg-black/20 backdrop-blur-md">
          {activeChat ? (
            <ChatWindow 
              chat={activeChat} 
              onSendMessage={handleSendMessage} 
              isAiTyping={isAiTyping}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-8 text-center animate-in fade-in zoom-in duration-700">
               <div className="w-40 h-40 rounded-[48px] bg-blue-500/10 flex items-center justify-center mb-8 shadow-inner border border-white/5">
                  <svg className="w-20 h-20 text-blue-500/20" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
               </div>
               <h2 className="text-3xl font-black text-white/40 mb-3 tracking-tighter">DT Chat Cloud</h2>
               <p className="max-w-xs text-sm opacity-30 font-bold uppercase tracking-widest">Select a broadcast to begin</p>
            </div>
          )}
        </main>
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        onLogout={handleLogout}
      />

      {deepLinkGroup && (
        <GroupPreview 
          groupName={deepLinkGroup} 
          onJoin={() => handleJoinGroup(deepLinkGroup)} 
          onCancel={() => setDeepLinkGroup(null)} 
        />
      )}
    </div>
  );
};

export default App;

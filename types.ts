
export type Role = 'user' | 'assistant' | 'system';
export type ChatType = 'private' | 'group' | 'channel';

export interface Message {
  id: string;
  text: string;
  image?: string; // Base64 or URL
  sender: 'me' | 'them' | 'ai';
  senderName?: string; // Name for group displays
  senderAvatar?: string; // Avatar for group displays
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  online?: boolean;
  messages: Message[];
  type: ChatType;
  memberCount?: number;
}

export interface UserProfile {
  name: string;
  handle: string;
  avatar: string;
  passcode?: string;
  isPasscodeEnabled: boolean;
}

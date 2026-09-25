import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ArrowLeft, Check, CheckCheck, Loader2, MessageSquare, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { triggerUnreadCountUpdate } from '@/hooks/useUnreadMessagesCount';
import { Link } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  ad_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  ad_id: string;
  user1: string;
  user2: string;
  lastMessage: string;
  lastMessageDate: string;
  otherUserName: string;
  adTitle: string;
  adImage: string;
}

interface ChatToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

interface ProfileName {
  id: string;
  full_name: string | null;
  nickname?: string | null;
}

const getFallbackUserName = (userId: string) => {
  const numericId = Array.from(userId).reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) % 9000,
    0
  ) + 1000;

  return `کاربر ${numericId}`;
};

interface ChatModuleProps {
  user: User;
  toast: (options: ChatToastOptions) => unknown;
  initialAdId?: string;
  initialReceiverId?: string;
  onClose?: () => void;
}

const ChatModule: React.FC<ChatModuleProps> = ({ user, toast, initialAdId, initialReceiverId, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ ad_id: string, user1: string, user2: string, adTitle?: string, otherUserName?: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [pendingMessageIds, setPendingMessageIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const returnedToListRef = useRef(false);
  // Store userMap for profile names
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [otherUserProfile, setOtherUserProfile] = useState<ProfileName | null>(null);

  // Fetch conversations (aggregate by ad_id and both user IDs, sorted)
  useEffect(() => {
    // فقط یک بار هنگام ورود به صفحه (mount)
    const fetchConversations = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('messages')
        .select('ad_id, sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const convMap = new Map();
        data.forEach(msg => {
          const users = [msg.sender_id, msg.receiver_id].sort();
          const key = msg.ad_id + '-' + users[0] + '-' + users[1];
          if (!convMap.has(key)) {
            // نمایش نام کاربر مقابل
            convMap.set(key, {
              ad_id: msg.ad_id,
              user1: users[0],
              user2: users[1],
              lastMessage: msg.content,
              lastMessageDate: msg.created_at,
              otherUserName: users[0] === user.id ? users[1] : users[0],
              adTitle: '',
              adImage: '',
            });
          }
        });
        // Fetch ad titles and user names
        const adIds = Array.from(new Set(Array.from(convMap.values()).map(c => c.ad_id)));
        const userIds = Array.from(new Set(Array.from(convMap.values()).map(c => [c.user1, c.user2]).flat()));
        // Fetch ad titles
        if (adIds.length > 0) {
          const { data: adsData } = await supabase
            .from('ads')
            .select('id, title, images')
            .in('id', adIds);
          if (adsData) {
            const adMap = new Map(adsData.map(ad => [ad.id, ad.title]));
            const imageMap = new Map(adsData.map(ad => [ad.id, ad.images?.[0] || '']));
            convMap.forEach(conv => {
              conv.adTitle = adMap.get(conv.ad_id) || conv.ad_id;
              conv.adImage = imageMap.get(conv.ad_id) || '';
            });
          }
        }
        // Fetch user names
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, nickname' as never)
            .in('id', userIds) as unknown as { data: ProfileName[] | null; error: Error | null };
          
          if (usersError) {
            console.error('Error fetching user profiles:', usersError);
          } else if (usersData && Array.isArray(usersData)) {
            const map: Record<string, string> = {};
            usersData.forEach(u => {
              map[u.id] = u.nickname || getFallbackUserName(u.id);
            });
            setUserMap(map);
            convMap.forEach(conv => {
              const otherUserId = conv.user1 === user.id ? conv.user2 : conv.user1;
              conv.otherUserName = map[otherUserId] || otherUserId;
            });
          }
        }
        setConversations(Array.from(convMap.values()));
      } else {
        setConversations([]);
      }
    };
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // باز شدن خودکار چت با آگهی‌دهنده (در صورت وجود prop)
  useEffect(() => {
    if (!user || !initialAdId || !initialReceiverId) return;
    if (returnedToListRef.current) return;
    // اگر گفتگو وجود دارد، آن را پیدا کن
    const conv = conversations.find(
      c => c.ad_id === initialAdId &&
        ([c.user1, c.user2].includes(user.id) && [c.user1, c.user2].includes(initialReceiverId))
    );
    if (conv) {
      setSelectedChat({
        ad_id: conv.ad_id,
        user1: conv.user1,
        user2: conv.user2,
        adTitle: conv.adTitle,
        otherUserName: conv.otherUserName,
      });
    } else {
      // اگر گفتگو وجود ندارد، یک گفتگو جدید با این دو کاربر و ad_id بساز
      const users = [user.id, initialReceiverId].sort();
      setSelectedChat({
        ad_id: initialAdId,
        user1: users[0],
        user2: users[1],
        adTitle: '',
        otherUserName: '',
      });
    }
    // فقط یک بار پس از mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialAdId, initialReceiverId, conversations.length]);

  // تابع واکشی پیام‌ها (برای استفاده مجدد)
  const fetchChatMessages = useCallback(async () => {
    if (!user || !selectedChat) return;
    setChatLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*') // فقط پیام‌ها را بگیر، join نکن
      .eq('ad_id', selectedChat.ad_id)
      .in('sender_id', [selectedChat.user1, selectedChat.user2])
      .in('receiver_id', [selectedChat.user1, selectedChat.user2])
      .order('created_at', { ascending: true });
    if (!error && data) {
      setChatMessages(data);
      setPendingMessageIds(new Set());
      // پیام‌های دریافتی و خوانده نشده را خوانده شده کن
      const unreadIds = data
        .filter(msg => msg.receiver_id === user.id && !msg.is_read)
        .map(msg => msg.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
        triggerUnreadCountUpdate(); // فوراً هوک را به‌روزرسانی کن
      }
      // دریافت پروفایل مخاطب
      const otherUserId = selectedChat.user1 === user.id ? selectedChat.user2 : selectedChat.user1;
      if (otherUserId) {
          const { data: profileData, error: profileError } = await supabase
          .from('profiles')
            .select('id, full_name, nickname' as never)
            .eq('id', otherUserId)
            .single() as unknown as { data: ProfileName | null; error: Error | null };
        
        if (profileError) {
          console.error('Error fetching other user profile:', profileError);
          setOtherUserProfile(null);
        } else {
          setOtherUserProfile(profileData || null);
        }
      } else {
        setOtherUserProfile(null);
      }
    } else if (error) {
      setOtherUserProfile(null);
    }
    setChatLoading(false);
    // اسکرول به آخرین پیام
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [selectedChat, user]);

  // استفاده از تابع جدید در useEffect
  useEffect(() => {
    // فقط هنگام باز شدن مودال فوکوس کن (رفرش پیام‌ها را اینجا انجام نده)
    setTimeout(() => {
      if (selectedChat && inputRef.current) inputRef.current.focus();
    }, 200);
  }, [selectedChat]);

  // واکشی پیام‌ها هنگام تغییر چت انتخاب‌شده
  useEffect(() => {
    if (selectedChat) {
      fetchChatMessages();
      // فوکوس روی input هنگام باز شدن چت جدید
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 200);
    }
  }, [fetchChatMessages, selectedChat]);

  // Auto-scroll to last message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Real-time new message
  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (
          (payload.new.sender_id === selectedChat.user1 && payload.new.receiver_id === selectedChat.user2) ||
          (payload.new.sender_id === selectedChat.user2 && payload.new.receiver_id === selectedChat.user1)
        ) {
          // پیام جدید دریافت شد، پیام‌ها را واکشی کن و اسکرول کن
          fetchChatMessages();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchChatMessages, selectedChat]);

  // Send reply (always include ad_id)
  const handleSendReply = async () => {
    if (!user || !selectedChat || !replyText.trim()) return;
    // تعیین گیرنده: کاربری که شما نیستید
    const receiverId = selectedChat.user1 === user.id ? selectedChat.user2 : selectedChat.user1;
    // Debug log
    console.log('SEND', {
      ad_id: selectedChat.ad_id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: replyText.trim(),
    });
    if (!selectedChat.ad_id || !user.id || !receiverId || !replyText.trim()) {
      toast({ title: 'خطا: اطلاعات پیام ناقص است.' });
      setReplySending(false);
      return;
    }
    setReplySending(true);
    const { data: sentMessage, error } = await supabase
      .from('messages')
      .insert([{
        ad_id: selectedChat.ad_id,
        sender_id: user.id,
        receiver_id: receiverId,
        content: replyText.trim(),
      }])
      .select()
      .single();
    setReplySending(false);
    if (!error && sentMessage) {
      setReplyText('');
      setChatMessages(previousMessages => [...previousMessages, sentMessage]);
      setPendingMessageIds(previousIds => new Set(previousIds).add(sentMessage.id));
      // پس از ارسال موفق، پیام‌ها را مجدداً واکشی کن و اسکرول کن
      fetchChatMessages();
      // فوکوس مجدد روی input
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    } else {
      toast({ title: 'خطا در ارسال پیام' });
    }
  };

  // Conversation list UI
  return (
    <div
      className={initialAdId && initialReceiverId && !selectedChat
      ? 'fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 md:static md:block md:bg-transparent md:p-0'
      : 'mb-4'}
      onClick={event => {
        if (event.target === event.currentTarget && initialAdId && initialReceiverId && !selectedChat && onClose) {
          onClose();
        }
      }}
    >
      <div className={initialAdId && initialReceiverId && !selectedChat
        ? 'max-h-[88vh] w-full max-w-[520px] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl md:max-h-none md:max-w-none md:overflow-visible md:rounded-lg md:p-0 md:shadow-sm'
        : 'mb-4 rounded-lg bg-white shadow-sm'}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4">
          <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-teal-600" />
          <h2 className="font-bold">گفتگوهای من</h2>
          </div>
          {initialAdId && initialReceiverId && !selectedChat && onClose && (
            <button
              type="button"
              aria-label="بستن فهرست گفتگوها"
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {conversations.length === 0 ? (
          <div className="p-4 text-gray-400">گفتگویی وجود ندارد.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conversations.map(conv => (
              <li
                key={conv.ad_id + '-' + conv.user1 + '-' + conv.user2}
                className={`cursor-pointer p-3 transition-colors hover:bg-gray-50 md:p-4 ${selectedChat && selectedChat.ad_id === conv.ad_id && ((selectedChat.user1 === conv.user1 && selectedChat.user2 === conv.user2) || (selectedChat.user1 === conv.user2 && selectedChat.user2 === conv.user1)) ? 'bg-teal-50' : ''}`}
                onClick={() => {
                  const users = [conv.user1, conv.user2].sort();
                  setSelectedChat({ ad_id: conv.ad_id, user1: users[0], user2: users[1], adTitle: conv.adTitle, otherUserName: conv.otherUserName });
                }}
              >
                <div className="flex min-w-0 items-center gap-3" dir="rtl">
                  {conv.adImage ? (
                    <img src={conv.adImage} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-bold text-gray-800">{conv.adTitle}</div>
                      <div className="shrink-0 text-[10px] text-gray-400">{new Date(conv.lastMessageDate).toLocaleDateString('fa-IR')}</div>
                    </div>
                    <div className="mt-1 truncate text-xs font-medium text-teal-700">{conv.otherUserName}</div>
                    <div className="mt-1 truncate text-xs text-gray-500">{conv.lastMessage}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* نمایش پیام‌های یک چت در مودال */}
      {selectedChat && (
        <>
          {/* Modal overlay */}
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40"
            onClick={e => {
              // فقط اگر روی خود overlay کلیک شد (نه داخل مودال)
              if (e.target === e.currentTarget) {
                setSelectedChat(null);
                if (onClose) onClose();
              }
            }}
          >
            {/* Chat modal */}
            <div
              className="relative z-[70] flex h-[88vh] w-[96vw] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl md:flex-row md:h-[min(780px,88vh)] md:w-[min(1100px,92vw)]"
              style={{ direction: 'rtl', boxShadow: '0 8px 32px 0 rgba(15, 118, 110, 0.2)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Chat list sidebar, matching the right-to-left chat layout */}
              <aside className="hidden max-h-[170px] w-full shrink-0 overflow-y-auto border-b border-gray-200 bg-white md:block md:max-h-none md:w-[34%] md:min-w-[230px] md:max-w-[340px] md:border-b-0 md:border-l" style={{ direction: 'rtl' }}>
                <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 md:px-4 md:py-4">
                  <div>
                    <div className="text-base font-bold text-teal-600 md:text-lg">چی کو</div>
                    <div className="text-[11px] text-gray-500 md:text-xs">گفتگوها و تماس‌ها</div>
                  </div>
                  <MessageSquare className="h-4 w-4 text-teal-500 md:h-5 md:w-5" />
                </div>
                <div className="flex min-h-0 flex-row gap-2 overflow-x-auto bg-gray-50 p-2 md:min-h-full md:flex-col md:overflow-x-hidden md:gap-2 md:p-3">
                {conversations.map(conv => {
                  const users = [conv.user1, conv.user2].sort();
                  return (
                    <button
                      key={conv.ad_id + '-' + conv.user1 + '-' + conv.user2}
                      className={`w-[132px] shrink-0 rounded-lg px-2 py-2 text-[11px] font-medium leading-5 transition-all md:w-full md:py-3 md:text-xs ${selectedChat.ad_id === conv.ad_id && ((selectedChat.user1 === conv.user1 && selectedChat.user2 === conv.user2) || (selectedChat.user1 === conv.user2 && selectedChat.user2 === conv.user1)) ? 'bg-teal-100 text-teal-700' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setSelectedChat({ ad_id: conv.ad_id, user1: users[0], user2: users[1], adTitle: conv.adTitle, otherUserName: conv.otherUserName })}
                    >
                      <span className="flex items-center gap-2 text-right">
                        {conv.adImage ? (
                          <img src={conv.adImage} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                            <MessageSquare className="h-4 w-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block w-full overflow-hidden font-bold">{conv.adTitle}</span>
                          <span className="block w-full truncate">{conv.otherUserName}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
                </div>
              </aside>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {/* Chat header */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-3 shadow-sm md:gap-3 md:px-6 md:py-4">
                <div className="flex items-center justify-center rounded-full bg-teal-100 p-1.5 md:p-2">
                  <MessageSquare className="h-5 w-5 text-teal-600 md:h-6 md:w-6" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="truncate text-sm font-bold text-gray-800 md:text-base">
                    {otherUserProfile?.nickname || userMap[selectedChat.user1 === user.id ? selectedChat.user2 : selectedChat.user1] || getFallbackUserName(selectedChat.user1 === user.id ? selectedChat.user2 : selectedChat.user1)}
                  </span>
                  <Link
                    to={`/ad/${selectedChat.ad_id}`}
                    className="mt-1 block truncate text-[11px] font-bold text-teal-700 underline hover:text-teal-900 md:text-xs"
                  >
                    {selectedChat.adTitle}
                  </Link>
                </div>
                <button
                  type="button"
                  aria-label="بازگشت به فهرست گفتگوها"
                  className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-teal-600 md:hidden"
                  onClick={() => {
                    returnedToListRef.current = true;
                    setSelectedChat(null);
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="بستن گفتگو"
                  className="hidden shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 md:block"
                  onClick={() => {
                    setSelectedChat(null);
                    if (onClose) onClose();
                  }}
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
              <div ref={messagesContainerRef} className="relative flex-1 overflow-y-auto bg-teal-50 px-4 py-4 scrollbar-hide">
                <ul className="flex flex-col gap-2">
                    {chatMessages.map(msg => (
                      <li key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative px-4 py-2 rounded-2xl max-w-[75%] shadow-sm ${msg.sender_id === user.id ? 'bg-teal-500 text-white self-end' : 'bg-white text-gray-800 border border-gray-200 self-start'}`} style={{ wordBreak: 'break-word' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs">
                              {msg.sender_id === user.id
                                ? (userMap[msg.sender_id] || 'شما')
                                : (otherUserProfile?.nickname || userMap[msg.sender_id] || getFallbackUserName(msg.sender_id))}
                            </span>
                          </div>
                          <div className="text-sm leading-relaxed">{msg.content}</div>
                          <div className={`mt-1 flex items-center justify-end gap-1 text-left text-xs ${msg.sender_id === user.id ? 'text-teal-100' : 'text-gray-500'}`}>
                            {msg.sender_id === user.id && (
                              pendingMessageIds.has(msg.id) ? (
                                  <Check className="h-3.5 w-3.5" aria-label="ارسال شد" />
                              ) : msg.is_read ? (
                                <CheckCheck className="h-3.5 w-3.5 font-bold text-blue-600" strokeWidth={3} aria-label="دیده شد" />
                              ) : (
                                <CheckCheck className="h-3.5 w-3.5" aria-label="دریافت شد" />
                              )
                            )}
                            <span>{new Date(msg.created_at).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                    <div ref={messagesEndRef} />
                </ul>
                {chatLoading && chatMessages.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-teal-50/80">
                    <Loader2 className="h-5 w-5 animate-spin text-teal-400" aria-label="در حال بارگذاری" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t bg-white p-2.5 md:p-4">
                <input
                  type="text"
                  className="min-w-0 flex-1 rounded-xl border border-teal-200 bg-gray-50 p-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 md:p-3 md:text-base"
                  placeholder="پیام خود را بنویسید..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  disabled={replySending}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }}
                  ref={inputRef}
                />
                <button
                  className="shrink-0 rounded-xl bg-teal-500 px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-teal-600 disabled:opacity-50 md:px-6"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || replySending}
                >
                  ارسال
                </button>
              </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatModule; 
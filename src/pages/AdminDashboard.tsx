import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader,
  Archive,
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  Eye,
  Check,
  X,
  Clock,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  MessageSquare,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import {
  getAdsNeedingArchive,
  archiveAd,
  getArchivedAdsCount,
  getActiveAdsCount
} from '@/hooks/useAds';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Ad {
  id: string;
  title: string;
  user_id: string;
  status: string;
  created_at: string;
  categories?: { name: string };
}

interface User {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  city?: string;
  created_at: string;
  role?: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [archivingAds, setArchivingAds] = useState<Set<string>>(new Set());
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ads');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);

  // Archive queries
  const { data: adsNeedingArchive, isLoading: archiveLoading, refetch: refetchArchive } = useQuery({
    queryKey: ['ads-needing-archive'],
    queryFn: getAdsNeedingArchive,
    enabled: !!user,
  });

  const { data: archivedCount } = useQuery({
    queryKey: ['archived-ads-count'],
    queryFn: getArchivedAdsCount,
    enabled: !!user,
  });

  const { data: activeCount } = useQuery({
    queryKey: ['active-ads-count'],
    queryFn: getActiveAdsCount,
    enabled: !!user,
  });

  const fetchAds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ads')
      .select(`
        *,
        categories(name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAds(data);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      // First, let's check if messages table exists and get basic data
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } else if (data) {
        // For now, just use basic message data without joins
        setMessages(data);
      }
    } catch (err) {
      console.error('Exception in fetchMessages:', err);
      setMessages([]);
    }
    setMessagesLoading(false);
  };

  // Fetch data on load
  useEffect(() => {
    fetchAds();
    fetchUsers();
    fetchMessages();
  }, []);

  const handleArchiveAd = async (adId: string) => {
    setArchivingAds(prev => new Set(prev).add(adId));

    try {
      await archiveAd(adId);
      toast({
        title: "آگهی آرشیو شد",
        description: "آگهی با موفقیت آرشیو شد.",
      });
      refetchArchive();
      fetchAds();
    } catch (error) {
      toast({
        title: "خطا در آرشیو کردن",
        description: "متأسفانه در آرشیو کردن آگهی مشکلی پیش آمد.",
        variant: "destructive",
      });
    } finally {
      setArchivingAds(prev => {
        const newSet = new Set(prev);
        newSet.delete(adId);
        return newSet;
      });
    }
  };

  const handleBulkArchive = async () => {
    if (!adsNeedingArchive || adsNeedingArchive.length === 0) return;

    setBulkArchiving(true);

    try {
      for (const ad of adsNeedingArchive) {
        await archiveAd(ad.id);
      }

      toast({
        title: "آرشیو گروهی انجام شد",
        description: `${adsNeedingArchive.length} آگهی با موفقیت آرشیو شدند.`,
      });
      refetchArchive();
      // Refresh ads list
      fetchAds();
    } catch (error) {
      toast({
        title: "خطا در آرشیو گروهی",
        description: "متأسفانه در آرشیو گروهی مشکلی پیش آمد.",
        variant: "destructive",
      });
    } finally {
      setBulkArchiving(false);
    }
  };

  const handleStatusChange = async (adId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "وضعیت آگهی تغییر کرد",
        description: `وضعیت آگهی به ${newStatus} تغییر کرد.`,
      });

      fetchAds();
    } catch (error) {
      toast({
        title: "خطا در تغییر وضعیت",
        description: "متأسفانه در تغییر وضعیت آگهی مشکلی پیش آمد.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این آگهی را حذف کنید؟')) return;

    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "آگهی حذف شد",
        description: "آگهی با موفقیت حذف شد.",
      });

      fetchAds();
    } catch (error) {
      toast({
        title: "خطا در حذف آگهی",
        description: "متأسفانه در حذف آگهی مشکلی پیش آمد.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این پیام را حذف کنید؟')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }

      toast({
        title: "پیام حذف شد",
        description: "پیام با موفقیت حذف شد.",
      });

      // Refresh messages list
      fetchMessages();
    } catch (error) {
      console.error('Error in handleDeleteMessage:', error);
      toast({
        title: "خطا در حذف پیام",
        description: "متأسفانه در حذف پیام مشکلی پیش آمد.",
        variant: "destructive",
      });
    }
  };

  const handleAddTestMessage = async () => {
    try {
      const testMessage = {
        ad_id: '00000000-0000-0000-0000-000000000000',
        sender_id: '00000000-0000-0000-0000-000000000000',
        receiver_id: '00000000-0000-0000-0000-000000000000',
        content: 'پیام تست از پنل مدیریت',
        is_read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert([testMessage]);

      if (error) {
        console.error('Error adding test message:', error);
        throw error;
      }

      toast({
        title: "پیام تست اضافه شد",
        description: "پیام تست با موفقیت اضافه شد.",
      });

      fetchMessages();
    } catch (error) {
      console.error('Error in handleAddTestMessage:', error);
      toast({
        title: "خطا در اضافه کردن پیام تست",
        description: "متأسفانه در اضافه کردن پیام تست مشکلی پیش آمد.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">فعال</Badge>;
      case 'pending':
        return <Badge variant="outline">در انتظار</Badge>;
      case 'rejected':
        return <Badge variant="destructive">رد شده</Badge>;
      case 'archived':
        return <Badge variant="secondary">آرشیو شده</Badge>;
      case 'expired':
        return <Badge variant="destructive">منقضی شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAds = ads.filter(ad => {
    if (statusFilter !== 'all' && ad.status !== statusFilter) return false;
    if (userFilter !== 'all' && ad.user_id !== userFilter) return false;
    return true;
  });

  const conversationMap = new Map<string, { key: string; adId: string; user1: string; user2: string; messages: any[] }>();
  messages.forEach(message => {
    const [user1, user2] = [message.sender_id, message.receiver_id].sort();
    const key = `${message.ad_id}-${user1}-${user2}`;
    const conversation = conversationMap.get(key);

    if (conversation) {
      conversation.messages.push(message);
    } else {
      conversationMap.set(key, {
        key,
        adId: message.ad_id,
        user1,
        user2,
        messages: [message],
      });
    }
  });

  const groupedConversations = Array.from(conversationMap.values()).sort(
    (conversationA, conversationB) =>
      new Date(conversationB.messages[0].created_at).getTime() -
      new Date(conversationA.messages[0].created_at).getTime()
  );

  const getUserLabel = (userId: string) => {
    const profile = users.find(profileItem => profileItem.id === userId);
    return profile?.full_name || profile?.phone || userId;
  };

  const getAdLabel = (adId: string) => ads.find(ad => ad.id === adId)?.title || adId;

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              برای دسترسی به این صفحه باید وارد شوید.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-primary text-white" dir="rtl">
        <div className="container mx-auto px-4 py-6 text-right relative">
          <h1 className="text-2xl font-bold">پنل مدیریت</h1>
          <div className="md:hidden absolute left-4 top-1/2 -translate-y-1/2">
            <button
              type="button"
              className="p-2 rounded-lg bg-teal-700 text-white shadow-md hover:bg-teal-800 transition-colors"
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              aria-label="منوی مدیریت"
              aria-expanded={adminMenuOpen}
            >
              {adminMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {adminMenuOpen && (
              <div dir="rtl" className="absolute left-0 top-full mt-2 w-56 rounded-lg bg-white p-2 text-right shadow-xl ring-1 ring-black/10 z-50">
                {[
                  { value: 'ads', label: 'مدیریت آگهی‌ها', icon: FileText },
                  { value: 'archive', label: 'مدیریت آرشیو', icon: Archive },
                  { value: 'users', label: 'مدیریت کاربران', icon: Users },
                  { value: 'chats', label: 'مدیریت چت‌ها', icon: MessageSquare },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    dir="rtl"
                    className="flex w-full items-center justify-start gap-2 rounded-md px-3 py-2.5 text-right text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setActiveTab(value);
                      setAdminMenuOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 text-right" dir="rtl">
        {/* Statistics Cards */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2 text-right">
              <CardTitle className="text-sm font-medium">کل آگهی‌ها</CardTitle>
            </CardHeader>
            <CardContent className="text-right">
              <div className="text-2xl font-bold">
                {ads.length}
              </div>
              <p className="text-xs text-muted-foreground">
                تمام آگهی‌های ثبت شده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 text-right">
              <CardTitle className="text-sm font-medium">آگهی‌های فعال</CardTitle>
            </CardHeader>
            <CardContent className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {activeCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                آگهی‌های فعال
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 text-right">
              <CardTitle className="text-sm font-medium">آگهی‌های آرشیو شده</CardTitle>
            </CardHeader>
            <CardContent className="text-right">
              <div className="text-2xl font-bold text-gray-600">
                {archivedCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                آگهی‌های آرشیو شده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 text-right">
              <CardTitle className="text-sm font-medium">کاربران</CardTitle>
            </CardHeader>
            <CardContent className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {users.length}
              </div>
              <p className="text-xs text-muted-foreground">
                تعداد کاربران
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList dir="rtl" className="hidden md:grid md:grid-cols-4 text-right">
            <TabsTrigger dir="rtl" value="ads" className="flex items-center justify-start gap-2 text-right">
              <FileText className="w-4 h-4" />
              مدیریت آگهی‌ها
            </TabsTrigger>
            <TabsTrigger dir="rtl" value="archive" className="flex items-center justify-start gap-2 text-right">
              <Archive className="w-4 h-4" />
              مدیریت آرشیو
            </TabsTrigger>
            <TabsTrigger dir="rtl" value="users" className="flex items-center justify-start gap-2 text-right">
              <Users className="w-4 h-4" />
              مدیریت کاربران
            </TabsTrigger>
            <TabsTrigger dir="rtl" value="chats" className="flex items-center justify-start gap-2 text-right">
              <MessageSquare className="w-4 h-4" />
              مدیریت چت‌ها
            </TabsTrigger>
          </TabsList>

          {/* Ads Management Tab */}
          <TabsContent value="ads" dir="rtl" className="space-y-4">
            <Card dir="rtl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
                  <CardTitle>مدیریت آگهی‌ها</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 text-right">
                        <SelectValue placeholder="فیلتر وضعیت" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                        <SelectItem value="active">فعال</SelectItem>
                        <SelectItem value="pending">در انتظار</SelectItem>
                        <SelectItem value="rejected">رد شده</SelectItem>
                        <SelectItem value="archived">آرشیو شده</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="w-40 text-right">
                        <SelectValue placeholder="فیلتر کاربر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه کاربران</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8 text-right">
                    <Loader className="animate-spin w-8 h-8 text-violet-600" />
                    <span className="mr-2">در حال بارگذاری...</span>
                  </div>
                ) : (
                  <Table className="text-right [&_th]:text-right">
                    <TableHeader>
                      <TableRow className="text-right">
                        <TableHead>عنوان</TableHead>
                        <TableHead>کاربر</TableHead>
                        <TableHead>دسته‌بندی</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>تاریخ ثبت</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAds.map((ad) => (
                        <TableRow key={ad.id} className="text-right">
                          <TableCell className="font-medium">{ad.title}</TableCell>
                          <TableCell>
                            {users.find(u => u.id === ad.user_id)?.full_name ||
                              users.find(u => u.id === ad.user_id)?.email ||
                              ad.user_id}
                          </TableCell>
                          <TableCell>{ad.categories?.name || '-'}</TableCell>
                          <TableCell>{getStatusBadge(ad.status)}</TableCell>
                          <TableCell>{new Date(ad.created_at).toLocaleDateString('fa-IR')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 justify-end">
                              <Link to={`/ad/${ad.id}`} target="_blank">
                                <Button size="sm" variant="outline" title="مشاهده آگهی">
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(ad.id, 'active')}
                                disabled={ad.status === 'active'}
                                title="تایید آگهی"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(ad.id, 'rejected')}
                                disabled={ad.status === 'rejected'}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(ad.id, 'pending')}
                                disabled={ad.status === 'pending'}
                              >
                                <Clock className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteAd(ad.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Archive Management Tab */}
          <TabsContent value="archive" dir="rtl" className="space-y-4">
            <Card dir="rtl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="w-5 h-5" />
                      مدیریت آرشیو آگهی‌ها
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      آگهی‌هایی که بیش از یک ماه از ثبت آنها گذشته و نیاز به آرشیو شدن دارند
                    </p>
                  </div>
                  {adsNeedingArchive && adsNeedingArchive.length > 0 && (
                    <Button
                      onClick={handleBulkArchive}
                      disabled={bulkArchiving}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {bulkArchiving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin mr-2" />
                          در حال آرشیو...
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 mr-2" />
                          آرشیو همه ({adsNeedingArchive.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {archiveLoading ? (
                  <div className="flex justify-center items-center py-8 text-right">
                    <Loader className="animate-spin w-8 h-8 text-violet-600" />
                    <span className="mr-2">در حال بارگذاری...</span>
                  </div>
                ) : !adsNeedingArchive || adsNeedingArchive.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      هیچ آگهی‌ای برای آرشیو کردن وجود ندارد. همه آگهی‌ها به‌روز هستند.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {adsNeedingArchive.length} آگهی بیش از یک ماه از ثبت آنها گذشته و نیاز به آرشیو شدن دارند.
                      </AlertDescription>
                    </Alert>

                    <Table className="text-right [&_th]:text-right">
                      <TableHeader>
                        <TableRow className="text-right">
                          <TableHead>عنوان آگهی</TableHead>
                          <TableHead>کاربر</TableHead>
                          <TableHead>تاریخ ثبت</TableHead>
                          <TableHead>سن آگهی</TableHead>
                          <TableHead>عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adsNeedingArchive.map((ad) => {
                          const createdDate = new Date(ad.created_at);
                          const now = new Date();
                          const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

                          return (
                            <TableRow key={ad.id} className="text-right">
                              <TableCell className="font-medium">{ad.title}</TableCell>
                              <TableCell>{ad.user_id}</TableCell>
                              <TableCell>{createdDate.toLocaleDateString('fa-IR')}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {ageInDays} روز
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleArchiveAd(ad.id)}
                                    disabled={archivingAds.has(ad.id)}
                                  >
                                    {archivingAds.has(ad.id) ? (
                                      <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Archive className="w-4 h-4" />
                                    )}
                                    آرشیو
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" dir="rtl" className="space-y-4">
            <Card dir="rtl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <Users className="w-5 h-5" />
                  مدیریت کاربران
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="text-right [&_th]:text-right">
                  <TableHeader>
                    <TableRow className="text-right">
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">تلفن</TableHead>
                      <TableHead className="text-right">شهر</TableHead>
                      <TableHead className="text-right">تاریخ عضویت</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="text-right">
                        <TableCell className="font-medium">
                          {user.full_name || 'نامشخص'}
                        </TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.city || '-'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="outline">
                              <UserCheck className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <UserX className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Management Tab */}
          <TabsContent value="chats" dir="rtl" className="space-y-4">
            <Card dir="rtl">
              <CardHeader>
                <div className="flex justify-between items-center text-right">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    مدیریت چت‌ها و پیام‌ها
                  </CardTitle>

                </div>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="flex justify-center items-center py-8 text-right">
                    <Loader className="animate-spin w-8 h-8 text-violet-600" />
                    <span className="mr-2">در حال بارگذاری...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-right">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">هنوز پیامی در سیستم ثبت نشده است.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupedConversations.map(conversation => {
                      const isExpanded = expandedConversation === conversation.key;
                      const conversationMessages = [...conversation.messages].sort(
                        (messageA, messageB) =>
                          new Date(messageA.created_at).getTime() - new Date(messageB.created_at).getTime()
                      );

                      return (
                        <div key={conversation.key} className="overflow-hidden rounded-lg border text-right">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-4 bg-white p-4 text-right hover:bg-teal-50"
                            onClick={() => setExpandedConversation(isExpanded ? null : conversation.key)}
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">{getAdLabel(conversation.adId)}</p>
                              <p className="mt-1 text-sm text-gray-500">
                                {getUserLabel(conversation.user1)} و {getUserLabel(conversation.user2)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                              <span>{conversation.messages.length} پیام</span>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="space-y-3 border-t bg-gray-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-gray-500">
                                  مکالمه درباره آگهی: {getAdLabel(conversation.adId)}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`/ad/${conversation.adId}`, '_blank')}
                                >
                                  <Eye className="ml-2 h-3 w-3" />
                                  مشاهده آگهی
                                </Button>
                              </div>
                              {conversationMessages.map(message => (
                                <div key={message.id} className="rounded-md border bg-white p-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                                    <span className="font-medium text-gray-700">{getUserLabel(message.sender_id)}</span>
                                    <span>{new Date(message.created_at).toLocaleString('fa-IR')}</span>
                                  </div>
                                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">{message.content}</p>
                                  <div className="mt-3 flex items-center justify-between gap-2">
                                    <Badge variant={message.is_read ? 'default' : 'secondary'}>
                                      {message.is_read ? 'خوانده شده' : 'خوانده نشده'}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteMessage(message.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

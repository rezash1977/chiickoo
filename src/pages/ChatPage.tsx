import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Layout from '../components/layout/Layout';
import ChatModule from '../components/chat/ChatModule';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              برای دسترسی به چت باید وارد حساب کاربری شوید.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">چت‌های من</h1>
          <p className="text-gray-600">مدیریت گفتگوها و پیام‌های شما</p>
        </div>
        
        <ChatModule user={user} toast={toast} />
      </div>
    </Layout>
  );
};

export default ChatPage; 
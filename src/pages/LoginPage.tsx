import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Phone, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const phoneSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, { message: "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود" }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "کد تایید باید ۶ رقم باشد" }),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    console.log("Submitting phone:", data.phone);
    try {
      // Convert 09xx to +989xx standard format
      const formattedPhone = data.phone.replace(/^0/, '+98');
      console.log("Formatted phone:", formattedPhone);

      const { data: responseData, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms'
        }
      });

      console.log("SignInWithOtp result:", { responseData, error });

      if (error) {
        console.error('OTP Send error:', error);
        toast({
          title: "خطا در ارسال کد",
          description: error.message || "خطایی رخ داد",
          variant: "destructive",
        });
        return;
      }

      console.log("OTP sent successfully, switching to OTP step");
      setPhone(data.phone);
      setStep('OTP');
      setTimer(60);
      toast({
        title: "کد ارسال شد",
        description: "کد تایید به شماره شما ارسال شد",
        variant: "default",
      });
    } catch (error) {
      console.error('Unexpected error in onPhoneSubmit:', error);
      toast({
        title: "خطا",
        description: "خطای غیرمنتظره‌ای رخ داد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
    setIsLoading(true);
    try {
      // Convert 09xx to +989xx standard format
      const formattedPhone = phone.replace(/^0/, '+98');

      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: data.otp,
        type: 'sms',
      });

      if (error) {
        console.error('Verification error:', error);
        toast({
          title: "کد نامعتبر",
          description: "کد وارد شده صحیح نیست یا منقضی شده است",
          variant: "destructive",
        });
        return;
      }
      // ... (rest of function remains same, I should be careful with ReplacementContent) ...
      // Ideally using MultiReplace is safer here because `onOtpSubmit` is large.


      if (authData.user) {
        // چک نقش ادمین
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .eq('role', 'admin')
          .single();

        if (roleData && !roleError) {
          toast({
            title: "ورود موفقیت‌آمیز",
            description: "به پنل مدیریت خوش آمدید",
            variant: "default",
          });
          navigate("/admin");
        } else {
          toast({
            title: "ورود موفقیت‌آمیز",
            description: "به چی کو خوش آمدید",
            variant: "default",
          });
          navigate("/");
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "خطا در ورود",
        description: "خطای غیرمنتظره‌ای رخ داد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;
    setIsLoading(true);
    try {
      const formattedPhone = phone.replace(/^0/, '+98');
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      setTimer(60);
      toast({
        title: "کد مجددا ارسال شد",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "خطا در ارسال مجدد",
        description: "لطفا بعدا تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-violet-600">
            {step === 'PHONE' ? 'ورود به چی کو' : 'تایید شماره موبایل'}
          </CardTitle>
          <CardDescription className="text-gray-500">
            {step === 'PHONE'
              ? 'برای ورود یا ثبت‌نام شماره موبایل خود را وارد کنید'
              : `کد تایید به شماره ${phone} ارسال شد`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'PHONE' ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-fuchsia-600" />
                        شماره موبایل
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="09123456789"
                          className="text-left ltr placeholder:text-right"
                          type="tel"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-lg py-6"
                  disabled={isLoading}
                >
                  {isLoading ? "در حال ارسال..." : "دریافت کد تایید"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center justify-center">
                      <FormLabel className="sr-only">کد تایید</FormLabel>
                      <FormControl>
                        <InputOTP
                          maxLength={6}
                          {...field}
                          disabled={isLoading}
                        >
                          <InputOTPGroup dir="ltr">
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-lg py-6"
                    disabled={isLoading}
                  >
                    {isLoading ? "در حال بررسی..." : "تایید و ورود"}
                  </Button>

                  <div className="flex justify-between items-center text-sm">
                    <button
                      type="button"
                      onClick={() => setStep('PHONE')}
                      className="text-gray-500 hover:text-violet-600 flex items-center gap-1"
                      disabled={isLoading}
                    >
                      <ArrowRight className="h-4 w-4" />
                      ویرایش شماره
                    </button>

                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={timer > 0 || isLoading}
                      className={`font-medium ${timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-violet-600 hover:text-violet-500'}`}
                    >
                      {timer > 0 ? `ارسال مجدد (${timer})` : "ارسال مجدد کد"}
                    </button>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-gray-500 text-sm">
            ورود شما به معنای پذیرش <a href="#" className="text-violet-600">قوانین و مقررات</a> چی کو است
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;

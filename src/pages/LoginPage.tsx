import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const toEnglishDigits = (str: string) => {
  return str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

const phoneSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, { message: "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود" }),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  // OTP value — managed with useState, NOT react-hook-form (for compatibility with input-otp)
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // ─── Step 1: send OTP ─────────────────────────────────────────────────────
  const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    try {
      const cleanPhone = toEnglishDigits(data.phone);
      const formattedPhone = cleanPhone.replace(/^0/, '+98');
      console.log("Sending OTP to:", formattedPhone);

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { channel: 'sms' },
      });

      if (error) {
        console.error("OTP error:", error);
        toast({ title: "خطا در ارسال کد", description: error.message, variant: "destructive" });
        return;
      }

      setPhone(data.phone);
      setOtpValue("");
      setOtpError("");
      setStep('OTP');
      setTimer(120);
      toast({ title: "کد ارسال شد ✓", description: "کد تایید به شماره شما ارسال شد" });
    } catch (err) {
      console.error("Unexpected:", err);
      toast({ title: "خطا", description: "خطای غیرمنتظره‌ای رخ داد", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: verify OTP ───────────────────────────────────────────────────
  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (otpValue.length !== 6) {
      setOtpError("کد تایید باید ۶ رقم باشد");
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = phone.replace(/^0/, '+98');
      console.log("Verifying OTP:", otpValue, "for", formattedPhone);

      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpValue,
        type: 'sms',
      });

      if (error) {
        console.error("Verify error:", error);
        setOtpError("کد وارد شده صحیح نیست یا منقضی شده است");
        return;
      }

      if (authData.user) {
        // Check admin role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .eq('role', 'admin')
          .single();

        if (roleData && !roleError) {
          toast({ title: "ورود موفقیت‌آمیز", description: "به پنل مدیریت خوش آمدید" });
          navigate("/admin");
        } else {
          toast({ title: "ورود موفقیت‌آمیز", description: "به چی کو خوش آمدید" });
          navigate("/");
        }
      }
    } catch (err) {
      console.error("Unexpected:", err);
      toast({ title: "خطا در ورود", description: "خطای غیرمنتظره‌ای رخ داد", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendCode = async () => {
    if (timer > 0) return;
    setIsLoading(true);
    try {
      const formattedPhone = phone.replace(/^0/, '+98');
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { channel: 'sms' },
      });
      if (error) throw error;
      setOtpValue("");
      setOtpError("");
      setTimer(60);
      toast({ title: "کد مجددا ارسال شد" });
    } catch {
      toast({ title: "خطا در ارسال مجدد", description: "لطفا بعدا تلاش کنید", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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
            /* ── Phone form ── */
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
                          inputMode="numeric"
                          {...field}
                          onChange={(e) => field.onChange(toEnglishDigits(e.target.value))}
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
            /* ── OTP form — no react-hook-form for InputOTP ── */
            <form onSubmit={onOtpSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <label className="sr-only">کد تایید</label>
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  autoFocus
                  onChange={(val) => {
                    const cleaned = toEnglishDigits(val);
                    console.log("OTP changed:", cleaned);
                    setOtpValue(cleaned);
                    setOtpError("");
                  }}
                  disabled={isLoading}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  containerClassName="flex justify-center w-full"
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
                {otpError && (
                  <p className="text-red-500 text-sm text-center">{otpError}</p>
                )}
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-lg py-6"
                  disabled={isLoading || otpValue.length !== 6}
                >
                  {isLoading ? "در حال بررسی..." : "تایید و ورود"}
                </Button>

                <div className="flex justify-between items-center text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep('PHONE'); setOtpValue(""); setOtpError(""); }}
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

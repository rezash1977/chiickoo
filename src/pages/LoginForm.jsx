// LoginForm.jsx
import { useState } from 'react';
import axios from 'axios';

export default function LoginForm() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const sendOtp = async () => {
    await axios.post('/api/send-otp', { phone });
    setStep(2);
  };

  const verifyOtp = async () => {
    const res = await axios.post('/api/verify-otp', { phone, otp });
    if (res.data.success) {
      alert('ورود موفقیت‌آمیز!');
      // می‌تونی به داشبورد هدایتش کنی
    } else {
      alert('کد اشتباه است.');
    }
  };

  return (
    <div>
      {step === 1 ? (
        <div>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="شماره تلفن" />
          <button onClick={sendOtp}>ارسال کد</button>
        </div>
      ) : (
        <div>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="کد ارسال‌شده" />
          <button onClick={verifyOtp}>تأیید</button>
        </div>
      )}
    </div>
  );
}

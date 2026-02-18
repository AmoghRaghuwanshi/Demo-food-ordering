
import React, { useState } from 'react';
import { Button } from '../components/Shared';

interface AuthViewProps {
  onLogin: (phone: string) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.length === 10) {
      setIsLoading(true);
      // Simulating a network delay for OTP sending
      setTimeout(() => {
        setIsLoading(false);
        setStep('otp');
      }, 1000);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length === 6) {
      setIsLoading(true);
      // Simulating verification delay
      setTimeout(() => {
        setIsLoading(false);
        onLogin(phone);
      }, 1000);
    } else {
      setError('Please enter a valid 6-digit code.');
    }
  };

  const handleDemoLogin = (type: 'owner' | 'customer') => {
    const demoPhone = type === 'owner' ? '9876543210' : '0000000000';
    onLogin(demoPhone);
  };

  const inputBase = "block w-full border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-900 transition-all shadow-sm rounded-2xl p-4";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-2xl shadow-orange-100">B</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">BistroFlow</h1>
          <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">
            {step === 'phone' ? 'Demo Access' : 'Verification Simulation'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-in shake duration-300">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-8">
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="text-slate-400 font-black text-sm">+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Enter any 10 digits"
                    className={`${inputBase} pl-14 text-lg font-bold`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={isLoading}
                  />
                </div>
                
                <p className="text-[10px] text-slate-400 font-medium px-2 leading-relaxed text-center">
                  Enter any 10 digit number to continue the simulation.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full py-5 text-lg font-black shadow-2xl shadow-orange-100" 
                disabled={phone.length < 10 || isLoading}
              >
                {isLoading ? 'Simulating SMS...' : 'Continue to OTP'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="px-4 bg-white text-slate-400">Direct Access</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="text-xs !py-3 bg-slate-50 border-none" onClick={() => handleDemoLogin('customer')}>
                Customer Demo
              </Button>
              <Button variant="outline" className="text-xs !py-3 bg-slate-50 border-none" onClick={() => handleDemoLogin('owner')}>
                Owner Demo
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-slate-500 font-medium">Simulation for <span className="font-bold text-slate-900">+91 {phone}</span></p>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                className={`${inputBase} text-3xl tracking-[0.5em] text-center font-black`}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isLoading}
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-orange-600 font-black hover:underline py-2 uppercase tracking-wider"
              >
                Change Phone Number
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full py-5 text-lg font-black shadow-2xl shadow-orange-100" 
              disabled={otp.length !== 6 || isLoading}
            >
              {isLoading ? 'Verifying...' : 'Finish Login'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthView;

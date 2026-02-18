
import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ 
  children, 
  color = 'bg-blue-100 text-blue-700' 
}) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
    {children}
  </span>
);

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, className = '', variant = 'primary', disabled = false, type = 'button' }) => {
  const baseStyles = "ripple px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 select-none";
  const variants = {
    primary: "bg-orange-500 text-white shadow-lg shadow-orange-100 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none",
    secondary: "bg-slate-900 text-white shadow-lg shadow-slate-100 hover:bg-black disabled:bg-slate-400",
    outline: "border-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50",
    danger: "bg-red-500 text-white shadow-lg shadow-red-100 hover:bg-red-600 disabled:bg-red-300"
  };

  const handleClick = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10); // Light haptic feedback for Android
    }
    if (onClick) onClick();
  };

  return (
    <button 
      type={type}
      onClick={handleClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

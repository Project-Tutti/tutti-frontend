import { AlertCircle } from "lucide-react";

interface FormInputProps {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  placeholder: string;
  rightLabel?: React.ReactNode;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const FormInput = ({ 
  id, 
  label, 
  type, 
  placeholder, 
  rightLabel, 
  error,
  value,
  onChange,
  onBlur 
}: FormInputProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label 
          className="block text-[13px] font-bold text-gray-500 uppercase tracking-widest" 
          htmlFor={id}
        >
          {label}
        </label>
        {rightLabel}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`
          w-full bg-[#0f1218] border rounded-xl px-4 py-3 text-[14px] text-white 
          focus:ring-2 focus:border-transparent transition-all placeholder-gray-600
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-[#2d4a6a] focus:ring-[#3b82f6]'
          }
        `}
      />
      {error && (
        <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1.5">
          <AlertCircle className="size-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;

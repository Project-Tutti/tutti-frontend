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
          className="block text-xs font-bold text-gray-500 uppercase tracking-widest" 
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
          w-full bg-[#0f1218] border rounded-xl px-3.5 py-2.5 text-[13px] text-white 
          focus:ring-2 focus:border-transparent transition-all placeholder-gray-600
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-[#1e293b] focus:ring-[#3b82f6]'
          }
        `}
      />
      {error && (
        <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined leading-none" style={{ fontSize: "15px" }}>error</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;

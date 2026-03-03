import { COMMON_STYLES } from '@/constants/styles';

const footerLinks = [
  { label: 'Documentation', href: '#' },
  { label: 'Support', href: '#' },
  { label: 'Terms', href: '#' },
];

const Footer = () => {
  return (
    <footer className="w-full py-6 text-center border-t border-[#1e293b] bg-[#0f1218]/50 mt-auto">
      <div className="flex justify-center gap-6 md:gap-8 mb-3">
        {footerLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={COMMON_STYLES.link}
          >
            {link.label}
          </a>
        ))}
      </div>
      <p className="text-[10px] md:text-xs text-gray-600 uppercase tracking-tighter">
        © 2024 Harmonix AI System. Engine v2.4.0
      </p>
    </footer>
  );
};

export default Footer;

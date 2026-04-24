interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  labelColor?: string;
}

export default function SectionHeader({
  label,
  title,
  description,
  align = 'center',
  labelColor = 'text-[#7B4DB5]',
}: SectionHeaderProps) {
  const alignmentClass = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div data-aos="fade-up" className={`mb-16 ${alignmentClass}`}>
      {label && (
        <p className={`${labelColor} text-5xl md:text-6xl font-bold tracking-wider uppercase mb-8`}>
          {label}
        </p>
      )}
      <h2 className="text-2xl md:text-3xl font-black text-black mb-6 leading-tight">
        {title}
      </h2>
      {description && (
        <p className={`text-slate-600 text-xl font-normal ${align === 'center' ? 'max-w-3xl mx-auto' : 'max-w-3xl'}`}>
          {description}
        </p>
      )}
    </div>
  );
}

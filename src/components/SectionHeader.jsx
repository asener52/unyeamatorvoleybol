export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1 w-8 bg-gold-500 rounded" />
          <span className="text-gold-600 text-xs font-bold uppercase tracking-widest">{subtitle}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-primary-900">{title}</h2>
      </div>
      {action && action}
    </div>
  )
}

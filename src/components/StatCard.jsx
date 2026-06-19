export default function StatCard({ title, value, accent = '', icon = '♞', hint }) {
  return (
    <div className="stat-card glass-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{title}</p>
        <h3 className={accent}>{value}</h3>
        {hint && <span>{hint}</span>}
      </div>
    </div>
  )
}

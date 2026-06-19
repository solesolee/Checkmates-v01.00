import { useNavigate } from 'react-router-dom'
import { Calendar, CalendarDays, CheckCircle2, ChevronRight, Clock } from 'lucide-react'
import { daysLeft, formatDate } from '../utils/dateHelpers'
import { getCategory } from '../utils/taskHelpers'
import { getPriorityClass } from '../utils/priorityHelpers'

function priorityKey(label) {
  return String(label || 'rendah')
    .toLowerCase()
    .replaceAll(' ', '-')
}

export default function TaskCard({
  row,
  mode = 'kegiatan',
  showDeadline = true,
  showStatus = true,
  showDayBox = true,
  clickable = true,
  onClick,
}) {
  const navigate = useNavigate()

  const title = row?.judul || ''
  const deadline = row?.deadline_at
  const priorityScore = Number(row?.total_priority_score || 0)
  const category = getCategory(row)
  const priorityClass = getPriorityClass(priorityScore)
  const left = daysLeft(deadline)
  const isPriorityMode = mode === 'priority'

  let badgeLabel = priorityClass
  let badgeKey = priorityKey(priorityClass)
  if (!isPriorityMode && category === 'selesai') {
    badgeLabel = 'SELESAI'
    badgeKey = 'selesai'
  }
  if (!isPriorityMode && category === 'terlambat') {
    badgeLabel = 'TERLAMBAT'
    badgeKey = 'terlambat'
  }

  const handleClick = (e) => {
    if (!clickable) return
    if (onClick) onClick(e)
    else if (row?.id) navigate(`/dashboard/detail/${row.id}`)
  }

  const handleKeyDown = (e) => {
    if (clickable && e.key === 'Enter') handleClick(e)
  }

  const icon = category === 'selesai' ? '✓' : isPriorityMode ? '♞' : '♞'
  const cardClass = `item-card glass-card ${isPriorityMode ? 'featured' : ''} ${category}`

  return (
    <article
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      className={cardClass}
    >
      <button className="item-main" type="button" tabIndex={-1}>
        <div className="item-chess">{icon}</div>
        <div className="item-info">
          <span className="eyebrow">{isPriorityMode ? 'Prioritas' : 'Kegiatan'}</span>
          <h3>{title}</h3>

          {showDeadline && (
            <div className="item-meta">
              <span>
                <Clock size={isPriorityMode ? 18 : 15} />
                {left === null
                  ? '-'
                  : left < 0
                    ? `Terlewat ${Math.abs(left)} hari`
                    : `Sisa ${left} hari`}
              </span>
              <span>
                {isPriorityMode ? <CalendarDays size={18} /> : <Calendar size={15} />}
                Deadline: {formatDate(deadline, 'short')}
              </span>
            </div>
          )}
        </div>
      </button>

      <div className="item-side">
        {showStatus && (
          <span className={`priority-badge priority-${badgeKey}`}>{badgeLabel}</span>
        )}

        {showDayBox && (
          <div className={`task-daybox priority-${category === 'selesai' ? 'selesai' : category === 'terlambat' ? 'terlambat' : badgeKey}`}>
            {category === 'selesai' && !isPriorityMode ? (
              <>
                <CheckCircle2 size={28} strokeWidth={2.6} />
                <small>selesai</small>
              </>
            ) : (
              <>
                <strong>{left === null ? '?' : Math.abs(left)}</strong>
                <small>{left !== null && left < 0 ? 'terlambat' : 'hari'}</small>
              </>
            )}
          </div>
        )}

        {!isPriorityMode && <ChevronRight size={18} className="chevron" />}
      </div>
    </article>
  )
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ListChecks, Trophy } from "lucide-react";
import { supabase } from "../lib/supabase";
import StatCard from "../components/StatCard";
import TaskCard from "../components/TaskCard";
import { daysLeft } from "../utils/dateHelpers";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("view_priority_tasks")
        .select("*")
        .not("status", "eq", "selesai")
        .eq("user_id", user.id)
        .order("total_priority_score", { ascending: false, nullsFirst: false });

      if (!alive) return;

      if (error) {
        setError(error.message || "Gagal mengambil data dashboard");
        setRows([]);
      } else {
        setRows(data || []);
      }

      setLoading(false);
    };

    load();
    return () => {
      alive = false;
    };
  }, [navigate, rows.length]);

  const stats = useMemo(() => {
    const total = rows.length;
    const urgent = rows.filter((row) => Number(row.total_priority_score || 0) > 85).length;
    const lateAssignments = rows.filter((row) => {
      const left = daysLeft(row["deadline_at"]);
      return left !== null && left < 0;
    }).length;

    return { total, urgent, lateAssignments };
  }, [rows]);

  const topPriorityRows = useMemo(
    () => rows
      .slice()
      .sort((a, b) => Number(b.total_priority_score || 0) - Number(a.total_priority_score || 0))
      .slice(0, 5),
    [rows]
  );

  return (
    <section className="page-transition">
      <div className="page-header">
        <div>
          <span className="eyebrow">♔ CheckMates Priority</span>
          <h1>Dashboard</h1>
          <p>Ringkasan prioritas tugas anda.</p>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard
          title="Total Kegiatan"
          value={stats.total}
          icon={<span className="chess-stat-icon chess-rook">♖</span>}
        />

        <StatCard
          title="Terlambat"
          value={stats.lateAssignments}
          icon={<span className="chess-stat-icon chess-knight">♘</span>}
        />

        <StatCard
          title="Prioritas Sangat Tinggi"
          value={stats.urgent}
          icon={<span className="chess-stat-icon chess-king">♔</span>}
        />
      </div>

      <div className="page-header row-header section-gap">
        <div>
          <span className="eyebrow">Daftar utama</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Kegiatan Prioritas</h1>
          <p>Urutan kegiatan kamu, kerjakan dari prioritas tertinggi.</p>
        </div>

        <button onClick={() => navigate("/dashboard/semua")} className="ghost-button" type="button">
          Lihat Semua →
        </button>
      </div>

      <div className="stack">
        {loading && <div className="state-card glass-card">Memuat data prioritas...</div>}
        {!loading && error && <div className="error-card glass-card">{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="state-card glass-card">Belum ada tugas.</div>
        )}
        {!loading && !error && topPriorityRows.map((row) => (
          <TaskCard key={row.id} row={row} mode="priority" />
        ))}
      </div>
    </section>
  );
}

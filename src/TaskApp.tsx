import { useEffect, useMemo, useState } from "react";
import { type Priority, type TaskStatus } from "./taskReducer";
import Modal from "./Modal";
import Sidebar from "./Sidebar";

const API = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/ws";

type TaskRow = {
  id: number;
  title: string;
  status: "todo" | "in_progress" | "done" | "blocked" | "archived";
  priority: "low" | "medium" | "high";
  created_at?: number;
};

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "blocked", "archived"];
const PRIOS: Priority[] = ["low", "medium", "high"];

export default function TaskApp() {
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("medium");
  const [draftStatus, setDraftStatus] = useState<TaskStatus>("todo");

  const [isNewOpen, setNewOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [q, setQ] = useState("");

  
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const getToken = () => localStorage.getItem("accessToken");

  const getHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    };
  };

  
  async function reload() {
    const url = q ? `${API}/tasks?q=${encodeURIComponent(q)}` : `${API}/tasks`;
    const token = getToken();
    try {
      const res = await fetch(url, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) { console.error(error); }
  }

  
  useEffect(() => { 
      reload(); 
  }, [q, lastUpdate]); 

  
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    
    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
      console.log("🟢 Connected to Live Server");
    };

    ws.onmessage = (event) => {
      
      if (event.data === "update") {
        console.log("🔔 Update received! Refreshing data...");
        setLastUpdate(Date.now());
      }
    };

    ws.onerror = (e) => console.error("WS Error", e);

    return () => {
      ws.close();
    };
  }, []); 

  const editing = tasks.find(t => t.id === editId) || null;
  const visible = useMemo(() => {
    return filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => {
    const base = { all: tasks.length, byStatus: { todo: 0, in_progress: 0, done: 0, blocked: 0, archived: 0 } };
    for (const t of tasks) {
        if ((base.byStatus as any)[t.status] !== undefined) {
            (base.byStatus as any)[t.status]++;
        }
    }
    return base;
  }, [tasks]);

  
  async function apiAdd(title: string, priority: Priority, status: TaskStatus) {
    await fetch(`${API}/tasks`, {
      method: "POST", headers: getHeaders(),
      body: JSON.stringify({ title, priority, status })
    });
    
    setLastUpdate(Date.now());
  }

  async function apiUpdate(id: number, patch: Partial<TaskRow>) {
    await fetch(`${API}/tasks/${id}`, {
      method: "PUT", headers: getHeaders(),
      body: JSON.stringify(patch)
    });
    setLastUpdate(Date.now());
  }

  async function apiDelete(id: number) {
    await fetch(`${API}/tasks/${id}`, { 
      method: "DELETE", headers: getHeaders()
    });
    setLastUpdate(Date.now());
  }

  const addFromModal = async () => {
    const title = draftTitle.trim();
    if (!title) return;
    await apiAdd(title, draftPriority, draftStatus);
    setDraftTitle(""); setNewOpen(false);
  };

  const saveEdit = async (fields: Partial<TaskRow>) => {
    if (!editing) return;
    await apiUpdate(editing.id, fields);
    setEditId(null);
  };

  const filteredVisible = visible.filter(t => !q || t.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ display: "flex", gridTemplateColumns: "220px 1fr", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar
        active={filter}
        counts={counts}
        onPick={(f) => setFilter(f)}
        onNew={() => setNewOpen(true)}
        onClearDone={async () => {
            const done = tasks.filter(t => t.status === "done");
            await Promise.all(done.map(t => apiDelete(t.id)));
        }}
      />
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 24px", flex: 1 }}>
        <h2 style={{ margin: 0 }}>Task Manager <span style={{fontSize: "0.5em", color:"#4caf50", verticalAlign:"middle"}}>● Live</span></h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder="Search tasks…" style={{ padding: 8, flex: 1 }} />
          <button onClick={() => setNewOpen(true)}>＋ New</button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
          {filteredVisible.map((t) => (
            <li key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 130px repeat(3, max-content)", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ textDecoration: t.status === "archived" ? "line-through" : "none" }}>{t.title}</span>
              <select value={t.status} onChange={(e) => apiUpdate(t.id, { status: e.target.value as TaskStatus })}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <select value={t.priority} onChange={(e) => apiUpdate(t.id, { priority: e.target.value as Priority })}>{PRIOS.map(p => <option key={p} value={p}>{p}</option>)}</select>
              <button onClick={() => setEditId(t.id)}>✎</button>
              <button onClick={() => apiDelete(t.id)}>✕</button>
            </li>
          ))}
        </ul>
      </main>

      <Modal open={isNewOpen} onClose={() => setNewOpen(false)} title="New Task" footer={<><button onClick={() => setNewOpen(false)}>Cancel</button><button onClick={addFromModal}>Create</button></>}>
        <div style={{ display: "grid", gap: 10 }}>
            <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Task title" style={{ padding: 8 }} autoFocus />
        </div>
      </Modal>
      
      <Modal open={!!editing} onClose={() => setEditId(null)} title="Edit Task" footer={<><button onClick={() => setEditId(null)}>Close</button><button onClick={() => saveEdit({ title: (document.getElementById("edit-title") as any).value })}>Save</button></>}>
        {editing && <input id="edit-title" defaultValue={editing.title} style={{ padding: 8, width: "100%" }} />}
      </Modal>
    </div>
  );
}
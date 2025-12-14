import { useState } from "react";
import Login from "./Login";
import TaskApp from "./TaskApp";

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  if (!user) {
    return <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div>
      <div style={{ background: "#eee", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{color: "black"}}>Hello, <strong>{user.username}</strong></span>
        <button onClick={() => {
          setUser(null);
          localStorage.removeItem("accessToken"); 
        }} style={{ padding: "5px 10px", cursor: "pointer" }}>Logout</button>
      </div>
      
      <TaskApp />
    </div>
  );
}

export default App;
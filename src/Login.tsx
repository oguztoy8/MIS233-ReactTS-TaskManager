import { useState } from "react";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred");
      }

      if (isRegistering) {
        alert("Registration successful! You can now login.");
        setIsRegistering(false);
        setUsername(""); 
        setPassword("");
      } else {
        if (data.token) {
          localStorage.setItem("accessToken", data.token);
        }
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh", 
      width: "100vw", 
      position: "fixed", 
      top: 0,
      left: 0
    }}>
      <div style={{ 
        padding: "2rem", 
        border: "1px solid #444", 
        borderRadius: "8px", 
        width: "350px", 
        backgroundColor: "#1a1a1a" 
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "white" }}>
          {isRegistering ? "Register" : "Login"}
        </h2>
        
        {error && <p style={{ color: "#ff6b6b", textAlign: "center" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "#ddd" }}>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #555", backgroundColor: "#333", color: "white" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "#ddd" }}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #555", backgroundColor: "#333", color: "white" }}
            />
          </div>
          <button type="submit" style={{ padding: "12px", cursor: "pointer", marginTop: "10px", backgroundColor: "#646cff", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", textAlign: "center", color: "#ccc" }}>
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            style={{ color: "#646cff", cursor: "pointer", textDecoration: "underline", marginLeft: "5px" }}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setUsername("");
              setPassword("");
            }}
          >
            {isRegistering ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}
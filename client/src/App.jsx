import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import "./App.css"; // Import custom CSS styles

const API_URL = import.meta.env.VITE_TRUSTWISE_APP_API;
//const API_URL = "http://localhost:5000/api";


// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [activeTab, setActiveTab] = useState("analysis");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [theme, setTheme] = useState("light");

  // Apply theme by toggling the CSS class on the body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Fetch history when the "History" tab is active
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Server error occurred");

      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      setError("Error analyzing text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analysis_history.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete history");
      setHistory([]);
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  // Prepare data for graphs
  const labels = history.map((entry, index) => `Entry ${index + 1}`);

  const toxicityData = {
    labels,
    datasets: [
      {
        label: "Toxicity Score",
        data: history.slice().reverse().map((entry) => entry.toxicity),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
      },
    ],
  };

  const gibberishData = {
    labels,
    datasets: [
      {
        label: "Gibberish Score",
        data: history.slice().reverse().map((entry) => parseFloat(entry.gibberish.split(":")[1]?.trim())),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
      },
    ],
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <h1 className="app-title">Text Analysis Tool</h1>
            <button
              className={`tab ${activeTab === "analysis" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("analysis")}
            >
              Analysis
            </button>
            <button
              className={`tab ${activeTab === "history" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
          </div>
          <div
            className="history-controls"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              margin: "10px 0",
            }}
          >
            {activeTab === "history" && (
              <>
                <button onClick={exportHistory}>Export History</button>
                <button onClick={deleteHistory}>Delete History</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === "analysis" && (
          <section className="analysis-section">
            <textarea
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text here..."
            ></textarea>
            <div className="controls">
              <button onClick={analyzeText} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Text"}
              </button>
              {error && <span className="error">{error}</span>}
            </div>
            {showResults && results && (
              <div className="results">
                <div className="result-item">
                  <span>Toxicity Score:</span>{" "}
                  <strong>{results.toxicity}</strong>
                </div>
                <div className="result-item">
                  <span>Gibberish Score:</span>{" "}
                  <strong>{results.gibberish}</strong>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "history" && (
          <section className="history-section">
            <h2>Analysis History</h2>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Text</th>
                  <th>Toxicity</th>
                  <th>Gibberish</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.text.substring(0, 500)}</td>
                    <td>{entry.toxicity}</td>
                    <td>{entry.gibberish}</td>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="graphs-container">
              <div className="graph">
                <Line
                  data={toxicityData}
                  options={{ responsive: true, plugins: { legend: { position: "top" } } }}
                />
              </div>
              <div className="graph">
                <Line
                  data={gibberishData}
                  options={{ responsive: true, plugins: { legend: { position: "top" } } }}
                />
              </div>
            </div>
          </section>
        )}

        <div
          className={`bottom-right-element ${theme}`}
          style={{ position: "absolute", bottom: "10px", right: "10px" }}
        >
          <label className="theme-switch">
            <input
              type="checkbox"
              onChange={() => setTheme(theme === "light" ? "dark" : "light")}
              checked={theme === "dark"}
            />
            <span className="slider"></span>
          </label>
        </div>
      </main>
    </div>
  );
}

export default App;

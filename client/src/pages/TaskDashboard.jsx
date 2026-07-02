import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTasks, deleteTask } from "../services/authService";

function TaskDashboard() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  // Load Tasks
  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Delete Task
  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      alert("Task Deleted Successfully");
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div
      style={{
        background: "#f4f4f4",
        minHeight: "100vh",
        padding: "30px",
      }}
    >
      {/* Navigation bar to Billing Portal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "8px 16px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.4)",
          }}
        >
          💳 Go to SaaS Billing Portal
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }}
          style={{
            padding: "8px 16px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <h1 style={{ textAlign: "center" }}>📋 Task Management Dashboard</h1>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Link to="/add-task">
          <button
            style={{
              padding: "10px 20px",
              background: "blue",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            + Add Task
          </button>
        </Link>
      </div>

      {/* Statistics */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "30px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "20px",
            width: "200px",
            textAlign: "center",
            boxShadow: "0 0 10px gray",
          }}
        >
          <h2>Total Tasks</h2>
          <h3>{tasks.length}</h3>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            width: "200px",
            textAlign: "center",
            boxShadow: "0 0 10px gray",
          }}
        >
          <h2>Completed</h2>
          <h3>
            {tasks.filter((task) => task.status === "Completed").length}
          </h3>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            width: "200px",
            textAlign: "center",
            boxShadow: "0 0 10px gray",
          }}
        >
          <h2>Pending</h2>
          <h3>
            {tasks.filter((task) => task.status === "Pending").length}
          </h3>
        </div>
      </div>

      <h2 style={{ marginTop: "40px" }}>My Tasks</h2>

      {tasks.length === 0 ? (
        <p>No Tasks Found.</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task._id}
            style={{
              background: "white",
              padding: "20px",
              marginTop: "20px",
              boxShadow: "0 0 10px gray",
            }}
          >
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>
              <strong>Priority:</strong> {task.priority}
            </p>
            <p>
              <strong>Status:</strong> {task.status}
            </p>

            <button
              onClick={() => navigate(`/edit-task/${task._id}`)}
              style={{
                background: "green",
                color: "white",
                border: "none",
                padding: "8px 15px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(task._id)}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "8px 15px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default TaskDashboard;

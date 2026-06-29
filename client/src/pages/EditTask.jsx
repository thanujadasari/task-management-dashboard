import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTaskById, updateTask } from "../services/authService";

function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Low");
  const [status, setStatus] = useState("Pending");

  useEffect(() => {
    const loadTask = async () => {
      try {
        const task = await getTaskById(id);

        if (task) {
          setTitle(task.title);
          setDescription(task.description);
          setPriority(task.priority);
          setStatus(task.status);
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadTask();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateTask(id, {
        title,
        description,
        priority,
        status,
      });

      alert("Task Updated Successfully");

      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert("Error Updating Task");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "50px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "400px",
          background: "white",
          padding: "20px",
          boxShadow: "0 0 10px gray",
        }}
      >
        <h2>Edit Task</h2>

        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        >
          <option>Pending</option>
          <option>Completed</option>
        </select>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "20px",
            background: "green",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Update Task
        </button>
      </form>
    </div>
  );
}

export default EditTask;
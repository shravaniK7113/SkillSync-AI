import "./Toast.css";

function Toast({ show, message, type = "success" }) {
  if (!show) return null;

  return (
    <div className={`app-toast ${type}`}>
      {message}
    </div>
  );
}

export default Toast;
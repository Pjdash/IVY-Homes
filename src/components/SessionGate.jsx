import { Navigate, Route, Routes } from "react-router-dom";

export default function SessionGate({ session, login, app }) {
  if (!session) {
    return (
      <Routes>
        <Route path="*" element={login} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={app} />
    </Routes>
  );
}

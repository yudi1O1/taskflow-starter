import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <span className="brand">TaskFlow</span>
      {user && (
        <div className="nav-right">
          <span>{user.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      )}
    </nav>
  );
}

import { useAuth } from '../context/AuthContext.jsx';
import TaskList from '../components/TaskList.jsx';
import Navbar from '../components/Navbar.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <main className="dashboard">
        <h1>Welcome back, {user?.name}</h1>
        <TaskList />
      </main>
    </div>
  );
}

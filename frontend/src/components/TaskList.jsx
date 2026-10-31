import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api.js';
import TaskItem from './TaskItem.jsx';

const EMPTY_FILTERS = {
  search: '',
  status: '',
  assignee: '',
  dueDateFrom: '',
  dueDateTo: '',
};

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [assignees, setAssignees] = useState([]);
  const [savedViews, setSavedViews] = useState([]);
  const [selectedViewId, setSelectedViewId] = useState('');
  const [viewName, setViewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const latestRequest = useRef(0);

  const fetchTasks = useCallback(async (nextFilters) => {
    const requestId = ++latestRequest.current;
    try {
      const { data } = await api.get('/tasks', { params: nextFilters });
      // FIX: Ignore older poll results so they cannot overwrite a newer filter result.
      if (requestId === latestRequest.current) setTasks(data);
    } catch (error) {
      if (requestId === latestRequest.current) {
        setNotice(error.response?.data?.error || 'Could not load tasks. Please try again.');
      }
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(activeFilters);
    const interval = setInterval(() => fetchTasks(activeFilters), 5000);
    return () => {
      clearInterval(interval);
      latestRequest.current += 1;
    };
  }, [activeFilters, fetchTasks]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/tasks/assignees'), api.get('/tasks/views')])
      .then(([assigneeResponse, viewResponse]) => {
        if (cancelled) return;
        setAssignees(assigneeResponse.data);
        setSavedViews(viewResponse.data);
      })
      .catch((error) => {
        if (!cancelled) {
          setNotice(error.response?.data?.error || 'Could not load filters and saved views.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function applyFilters(nextFilters) {
    const normalized = { ...EMPTY_FILTERS, ...nextFilters, assignee: nextFilters.assignee || '' };
    setFilters(normalized);
    setActiveFilters(normalized);
    setNotice('');
  }

  async function handleComplete(id) {
    try {
      await api.patch(`/tasks/${id}/complete`);
      await fetchTasks(activeFilters);
    } catch (error) {
      setNotice(error.response?.data?.error || 'Could not complete task. Please try again.');
    }
  }

  function handleApply(event) {
    event.preventDefault();
    applyFilters(filters);
  }

  function handleClearFilters() {
    setSelectedViewId('');
    applyFilters(EMPTY_FILTERS);
  }

  function handleViewChange(event) {
    const id = event.target.value;
    setSelectedViewId(id);
    const view = savedViews.find((item) => item._id === id);
    if (view) applyFilters(view.filters);
  }

  async function handleSaveView(event) {
    event.preventDefault();
    const name = viewName.trim();
    if (!name) {
      setNotice('Enter a name for this view.');
      return;
    }

    try {
      const { data: savedView } = await api.post('/tasks/views', {
        name,
        filters,
      });
      setSavedViews((current) => [
        savedView,
        ...current.filter((view) => view._id !== savedView._id),
      ]);
      setSelectedViewId(savedView._id);
      setViewName('');
      setNotice(`Saved "${savedView.name}".`);
    } catch (error) {
      setNotice(error.response?.data?.error || 'Could not save this view. Please try again.');
    }
  }

  async function handleDeleteView() {
    if (!selectedViewId) return;
    try {
      await api.delete(`/tasks/views/${selectedViewId}`);
      setSavedViews((current) => current.filter((view) => view._id !== selectedViewId));
      setSelectedViewId('');
      setNotice('Saved view deleted.');
    } catch (error) {
      setNotice(error.response?.data?.error || 'Could not delete this view. Please try again.');
    }
  }

  const selectedAssigneeUnavailable =
    filters.assignee && !assignees.some((assignee) => assignee._id === filters.assignee);

  return (
    <section className="task-list" aria-label="Tasks">
      <form className="filters" onSubmit={handleApply}>
        <label>
          Search title
          <input
            placeholder="Search title..."
            maxLength={100}
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          >
            <option value="">All statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label>
          Assignee
          <select
            value={filters.assignee}
            onChange={(event) => setFilters({ ...filters, assignee: event.target.value })}
          >
            <option value="">Anyone</option>
            {selectedAssigneeUnavailable && (
              <option value={filters.assignee}>Unavailable assignee ({filters.assignee.slice(-6)})</option>
            )}
            {assignees.map((assignee) => (
              <option key={assignee._id} value={assignee._id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due from
          <input
            type="date"
            value={filters.dueDateFrom}
            onChange={(event) => setFilters({ ...filters, dueDateFrom: event.target.value })}
          />
        </label>
        <label>
          Due through
          <input
            type="date"
            value={filters.dueDateTo}
            onChange={(event) => setFilters({ ...filters, dueDateTo: event.target.value })}
          />
        </label>
        <div className="filter-actions">
          <button type="submit">Apply filters</button>
          <button type="button" className="secondary-button" onClick={handleClearFilters}>
            Clear
          </button>
        </div>
      </form>

      <div className="saved-views" aria-label="Saved views">
        <label>
          Saved views
          <select value={selectedViewId} onChange={handleViewChange}>
            <option value="">Choose a saved view</option>
            {savedViews.map((view) => (
              <option key={view._id} value={view._id}>{view.name}</option>
            ))}
          </select>
        </label>
        <form className="save-view-form" onSubmit={handleSaveView}>
          <label>
            Save current filters as
            <input
              value={viewName}
              maxLength={60}
              placeholder="View name"
              onChange={(event) => setViewName(event.target.value)}
            />
          </label>
          <button type="submit">Save view</button>
        </form>
        <button
          type="button"
          className="secondary-button"
          disabled={!selectedViewId}
          onClick={handleDeleteView}
        >
          Delete selected view
        </button>
      </div>

      {notice && <p className="notice" role="status">{notice}</p>}
      {loading && tasks.length === 0 ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks match these filters.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <TaskItem key={task._id} task={task} onComplete={handleComplete} />
          ))}
        </ul>
      )}
    </section>
  );
}

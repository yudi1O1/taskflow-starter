function formatUtcDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function TaskItem({ task, onComplete }) {
  return (
    <li className={`task-item status-${task.status}`}>
      <div>
        <strong>{task.title}</strong>
        <p>{task.description}</p>
        <small>
          Assignee: {task.assignee?.name || 'Unassigned'} · Status: {task.status}
          {task.dueDate && <> · Due: {formatUtcDate(task.dueDate)} UTC</>}
        </small>
      </div>
      {task.status !== 'done' && (
        <button onClick={() => onComplete(task._id)}>Mark complete</button>
      )}
    </li>
  );
}

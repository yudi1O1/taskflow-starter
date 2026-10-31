import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import SavedView from '../models/SavedView.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const TASK_STATUSES = ['todo', 'in-progress', 'done'];

function isDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeFilters(input = {}) {
  if (!input || typeof input !== 'object') input = {};
  const search = typeof input.search === 'string' ? input.search.trim() : '';
  const status = input.status || '';
  const assignee = input.assignee || '';
  const dueDateFrom = input.dueDateFrom || '';
  const dueDateTo = input.dueDateTo || '';

  if (search.length > 100) return { error: 'Search must be 100 characters or fewer' };
  if (status && !TASK_STATUSES.includes(status)) return { error: 'Invalid task status' };
  if (assignee && !mongoose.isValidObjectId(assignee)) return { error: 'Invalid assignee' };
  if (dueDateFrom && !isDateOnly(dueDateFrom)) return { error: 'Invalid start date' };
  if (dueDateTo && !isDateOnly(dueDateTo)) return { error: 'Invalid end date' };
  if (dueDateFrom && dueDateTo && dueDateFrom > dueDateTo) {
    return { error: 'Start date must be on or before end date' };
  }

  return { filters: { search, status, assignee: assignee || null, dueDateFrom, dueDateTo } };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDueDateQuery({ dueDateFrom, dueDateTo }) {
  const dueDate = {};
  if (dueDateFrom) dueDate.$gte = new Date(`${dueDateFrom}T00:00:00.000Z`);
  if (dueDateTo) {
    const exclusiveEnd = new Date(`${dueDateTo}T00:00:00.000Z`);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    dueDate.$lt = exclusiveEnd;
  }
  return Object.keys(dueDate).length ? dueDate : undefined;
}

router.use(requireAuth);

// GET /api/tasks?search=&status=&assignee=&dueDateFrom=&dueDateTo=
router.get('/', async (req, res) => {
  try {
    const normalized = normalizeFilters(req.query);
    if (normalized.error) return res.status(400).json({ error: normalized.error });

    const { search, status, assignee, dueDateFrom, dueDateTo } = normalized.filters;
    const query = {};
    if (status) query.status = status;
    if (assignee) query.assignee = assignee;
    const dueDate = buildDueDateQuery({ dueDateFrom, dueDateTo });
    if (dueDate) query.dueDate = dueDate;
    if (search) {
      query.title = { $regex: escapeRegex(search), $options: 'i' };
    }

    // FIX: Populate assignees in the task query to avoid one extra database
    // lookup per task (the previous loop created an N+1 query pattern).
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .populate('assignee', 'name email');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

router.get('/assignees', async (req, res) => {
  try {
    const users = await User.find({}, '_id name email').sort({ name: 1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignees', details: err.message });
  }
});

router.get('/views', async (req, res) => {
  try {
    const views = await SavedView.find({ owner: req.user.id }).sort({ updatedAt: -1 }).lean();
    res.json(views);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved views', details: err.message });
  }
});

router.post('/views', async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 60) {
      return res.status(400).json({ error: 'View name must be between 1 and 60 characters' });
    }

    const normalized = normalizeFilters(req.body.filters);
    if (normalized.error) return res.status(400).json({ error: normalized.error });

    // Saving an existing name updates that user's view instead of creating duplicates.
    const view = await SavedView.findOneAndUpdate(
      { owner: req.user.id, name },
      { $set: { filters: normalized.filters } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(view);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save view', details: err.message });
  }
});

router.delete('/views/:viewId', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.viewId)) {
      return res.status(400).json({ error: 'Invalid view id' });
    }

    const deleted = await SavedView.findOneAndDelete({
      _id: req.params.viewId,
      owner: req.user.id,
    });
    if (!deleted) return res.status(404).json({ error: 'Saved view not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete saved view', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, assignee, dueDate, status } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const task = await Task.create({ title, description, assignee, dueDate, status });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// Marks a task complete and bumps its completion counter (used for
// a per-task "completed N times" stat shown on reopened tasks).
router.patch('/:id/complete', async (req, res) => {
  try {
    // FIX: Update status and completion count atomically so simultaneous
    // completions cannot overwrite each other's counter increment.
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'done' }, $inc: { completedCount: 1 } },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete task', details: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

export default router;

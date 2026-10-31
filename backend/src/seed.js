import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User from './models/User.js';
import Task from './models/Task.js';
import SavedView from './models/SavedView.js';

dotenv.config();

const SEED_USERS = [
  { name: 'Asha Rao', email: 'asha@taskflow.dev', role: 'admin' },
  { name: 'Ben Fisher', email: 'ben@taskflow.dev', role: 'member' },
  { name: 'Chen Wei', email: 'chen@taskflow.dev', role: 'member' },
  { name: 'Dina Kapoor', email: 'dina@taskflow.dev', role: 'member' },
  { name: 'Elan Torres', email: 'elan@taskflow.dev', role: 'member' },
];

const STATUSES = ['todo', 'in-progress', 'done'];

const TASK_TITLES = [
  'Set up CI pipeline',
  'Fix login redirect bug',
  'Design onboarding flow',
  'Write API documentation',
  'Migrate to new logging service',
  'Refactor auth middleware',
  'Add pagination to tasks list',
  'Investigate slow dashboard load',
  'Update dependency versions',
  'Create Q3 roadmap doc',
  'Fix flaky checkout test',
  'Add dark mode toggle',
  'Improve error messages',
  'Set up staging environment',
  'Write unit tests for billing',
  'Review PR #482',
  'Plan sprint retro',
  'Fix broken image uploads',
  'Add rate limiting to API',
  'Draft customer email template',
];

async function run() {
  await connectDB();

  await User.deleteMany({});
  await Task.deleteMany({});
  await SavedView.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);
  const users = await User.insertMany(
    SEED_USERS.map((u) => ({ ...u, passwordHash }))
  );

  const tasks = TASK_TITLES.map((title, i) => {
    const status = STATUSES[i % STATUSES.length];
    return {
      title,
      description: `Seed task: ${title}`,
      status,
      assignee: users[i % users.length]._id,
      dueDate: new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000),
      completedCount: status === 'done' ? 1 : 0,
    };
  });

  await Task.insertMany(tasks);

  console.log(`Seeded ${users.length} users and ${tasks.length} tasks.`);
  console.log('All seed users share the password: password123');
  console.log('Example login: asha@taskflow.dev / password123');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

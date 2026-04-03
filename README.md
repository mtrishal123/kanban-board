# Kanban Board

A fully-featured, production-quality Kanban task board built with React 19, TypeScript, and Supabase. Inspired by Linear and Asana.

**Live demo:** https://kanban-workdeck.netlify.app

---

## Features

### Core
- 4-column Kanban board — To Do, In Progress, In Review, Done
- Drag and drop tasks between columns with live cross-column preview
- Same-column reordering
- Tasks persist in Supabase with Row Level Security
- Anonymous guest auth — no signup required, session persists across refreshes

### Advanced
- **Team Members & Assignees** — create members with name + color, assign to tasks, avatars on cards
- **Task Comments** — per-task comment feed with timestamps, stored in Supabase
- **Activity Log** — full audit trail per task (status changes, priority, assignee, labels, due date, description)
- **Labels / Tags** — custom labels with colors, multi-assign per task, filter by label
- **Due Date Indicators** — color-coded badges: red (overdue), amber (due soon), green (done)
- **Search & Filtering** — real-time title search, filter by priority / assignee / label, active filter pills
- **Board Stats** — live total / done / overdue counts in the header

### UI
- Dark and light mode with persistent preference (no flash on refresh)
- Priority-colored left border accent on each card
- Color-coded column headers (per-status accent)
- Responsive layout — horizontal scroll on mobile with snap
- Smooth drag animation with floating overlay card

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build | Vite |
| Styling | CSS Modules + CSS Variables |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Database & Auth | Supabase (PostgreSQL + Anonymous Auth) |
| Hosting | Netlify |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project

### 1. Clone and install
```bash
git clone https://github.com/mtrishal123/kanban-board.git
cd kanban-board
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up the database

Run the following SQL in your Supabase SQL editor:
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tasks
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  due_date date,
  user_id uuid references auth.users(id) on delete cascade not null,
  assignee_id uuid,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Labels
create table labels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text not null default '#6366f1',
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  constraint labels_name_user_unique unique (name, user_id)
);

-- Task labels junction
create table task_labels (
  task_id uuid references tasks(id) on delete cascade not null,
  label_id uuid references labels(id) on delete cascade not null,
  primary key (task_id, label_id)
);

-- Comments
create table comments (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  content text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  member_id uuid,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Team members
create table team_members (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text not null default '#7c6af7',
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Activity log
create table activity_log (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  meta jsonb,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Migrations
alter table tasks add constraint tasks_assignee_id_fkey
  foreign key (assignee_id) references team_members(id) on delete set null;

alter table comments add column if not exists
  member_id uuid references team_members(id) on delete set null;

-- Enable RLS
alter table tasks enable row level security;
alter table labels enable row level security;
alter table task_labels enable row level security;
alter table comments enable row level security;
alter table team_members enable row level security;
alter table activity_log enable row level security;

-- RLS Policies
create policy "own tasks" on tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own labels" on labels for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own team" on team_members for all using (auth.uid() = user_id);
create policy "own comments" on comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own activity" on activity_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own task labels select" on task_labels for select
  using (exists (select 1 from tasks where tasks.id = task_labels.task_id and tasks.user_id = auth.uid()));
create policy "own task labels insert" on task_labels for insert
  with check (exists (select 1 from tasks where tasks.id = task_labels.task_id and tasks.user_id = auth.uid()));
create policy "own task labels delete" on task_labels for delete
  using (exists (select 1 from tasks where tasks.id = task_labels.task_id and tasks.user_id = auth.uid()));
```

Also enable **Anonymous Sign-In** in your Supabase dashboard:
Authentication → Sign In / Providers → Allow anonymous sign-ins → ON

### 4. Run locally
```bash
npm run dev
```

Open http://localhost:5173. A guest session is created automatically — no login needed.

---

## Project Structure
```
src/
├── components/
│   ├── Board.tsx              # Main board, drag context, header, stats
│   ├── Column.tsx             # Single Kanban column
│   ├── TaskCard.tsx           # Draggable task card
│   ├── TaskDetailModal.tsx    # Full task editor with activity + comments
│   ├── AddTaskModal.tsx       # Quick-add task form
│   ├── FilterPanel.tsx        # Priority / assignee / label filters
│   ├── ActiveFilterBar.tsx    # Active filter pill strip
│   ├── TeamMembersPanel.tsx   # Team member management
│   ├── PriorityBadge.tsx
│   ├── DueDateBadge.tsx
│   ├── LabelBadge.tsx
│   └── ConfirmDialog.tsx
├── hooks/
│   ├── useAuth.ts             # Anonymous session management
│   ├── useTasks.ts            # Task CRUD + optimistic updates
│   ├── useTeamMembers.ts
│   ├── useLabels.ts
│   ├── useTaskLabels.ts
│   ├── useComments.ts
│   └── useActivityLog.ts
├── types/
│   ├── index.ts               # Task, Label, Status, Priority types
│   └── filters.ts             # Filter state types
├── lib/
│   └── supabase.ts            # Supabase client config
└── styles/
    └── variables.css          # Design tokens (colors, radii, shadows)
```

---

## Deployment

The app is deployed on Netlify with continuous deploy from the `main` branch.

Required environment variables in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The `netlify.toml` at the repo root handles SPA routing (redirects `/*` to `/index.html`).

---

## Security

- Only the Supabase **anon public key** is used in the frontend
- The **service role key** is never referenced in code
- `.env.local` is gitignored — credentials are never committed
- All tables have **Row Level Security** enabled
- Every policy enforces `auth.uid() = user_id` — cross-user data access is impossible
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE,
  role text CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  manager text,
  team text,
  profile_image text,
  created_at timestamp DEFAULT now()
);

-- Create the 'tasks' table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  status text CHECK (status IN ('not_picked', 'in_progress', 'completed')) DEFAULT 'not_picked',
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  deadline date,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create the 'task_comments' table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Create the 'analytics_snapshots' table
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date date DEFAULT CURRENT_DATE,
  total_tasks int,
  completed_tasks int,
  in_progress_tasks int,
  not_picked_tasks int,
  employee_id uuid REFERENCES users(id) ON DELETE CASCADE
);

-- Create the 'invitations' table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status text CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  created_at timestamp DEFAULT now()
);

-- NO RLS - Keep it simple for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;

-- Create trigger function to automatically create user in public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

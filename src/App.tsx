import React, { useState, useEffect } from 'react';
import './App.css';
import { Layout, CheckSquare, Clock, AlertCircle, RefreshCw, Plus, X, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  content: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
}

interface ColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  onAddTask: (content: string) => void;
  onDeleteTask: (id: string) => void;
}

const SortableTaskCard = ({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card sortable-item ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="task-drag-handle" {...attributes} {...listeners}>
        {task.content}
      </div>
      <button 
        className="delete-task-btn" 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const Column: React.FC<ColumnProps> = ({ id, title, icon, tasks, onAddTask, onDeleteTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');

  const handleSave = () => {
    if (newContent.trim()) {
      onAddTask(newContent.trim());
      setNewContent('');
      setIsAdding(false);
    }
  };

  return (
    <div className="column">
      <div className="column-header">
        {icon}
        <h2>{title}</h2>
      </div>
      
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="task-list droppable-column">
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} onDelete={onDeleteTask} />
          ))}
        </div>
      </SortableContext>

      <div className="add-task-container">
        {isAdding ? (
          <div className="task-input-area">
            <textarea
              autoFocus
              placeholder="Enter a title for this task..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="task-input-actions">
              <button className="save-task-btn" onClick={handleSave}>Add card</button>
              <button className="cancel-task-btn" onClick={() => setIsAdding(false)}>
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button className="add-task-btn" onClick={() => setIsAdding(true)}>
            <Plus size={16} />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Fallback to local data if server is not up
      try {
        const response = await fetch('/data.json');
        const data = await response.json();
        setTasks(data);
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    try {
      await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTasks),
      });
    } catch (error) {
      console.error('Error saving tasks to server:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const columns = [
    { id: 'backlog' as const, title: 'Refine', icon: <AlertCircle size={18} /> },
    { id: 'in-progress' as const, title: 'Jules Working', icon: <Clock size={18} /> },
    { id: 'review' as const, title: 'Review & Test', icon: <Layout size={18} /> },
    { id: 'done' as const, title: 'Deployed', icon: <CheckSquare size={18} /> },
  ];

  const handleAddTask = (status: Task['status']) => (content: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      content,
      status,
    };
    saveTasks([...tasks, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    saveTasks(updatedTasks);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTaskIndex = tasks.findIndex(t => t.id === activeId);
    if (activeTaskIndex === -1) return;
    const activeTask = tasks[activeTaskIndex];

    const overColumn = columns.find(c => c.id === overId);
    const overTask = tasks.find(t => t.id === overId);

    if (overColumn) {
      if (activeTask.status !== overColumn.id) {
        const updatedTasks = [...tasks];
        updatedTasks[activeTaskIndex] = { ...activeTask, status: overColumn.id };
        setTasks(updatedTasks);
      }
    } else if (overTask) {
      if (activeTask.status !== overTask.status) {
        const updatedTasks = [...tasks];
        updatedTasks[activeTaskIndex] = { ...activeTask, status: overTask.status };
        setTasks(updatedTasks);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeIndex = tasks.findIndex(t => t.id === activeId);
    const overIndex = tasks.findIndex(t => t.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const updatedTasks = arrayMove(tasks, activeIndex, overIndex);
      saveTasks(updatedTasks);
    } else {
      saveTasks(tasks);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Meow Board 🐱</h1>
        <p>Senior Dev & AI Agent Workflow</p>
        <button className="refresh-btn" onClick={fetchTasks} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="board">
          {columns.map(col => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              icon={col.icon}
              tasks={tasks.filter(t => t.status === col.id)}
              onAddTask={handleAddTask(col.id)}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? (
            <div className="task-card is-dragging">
              {activeTask.content}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default App;

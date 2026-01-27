import React, { useState } from 'react';
import { Task } from '../types';
import { CheckSquare, Trash2, Edit2, Calendar } from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  onAddTask: (t: Task) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const Tasks: React.FC<TasksProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleAdd = () => {
    if (!title) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      dueDate,
      isCompleted: false
    };
    onAddTask(newTask);
    setTitle('');
    setDescription('');
    setDueDate('');
  };

  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Minhas Tarefas</h2>
        
        {/* Add Task Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
               <input 
                 type="text" 
                 placeholder="Título da tarefa"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="w-full border-b border-slate-300 py-2 px-1 focus:border-blue-500 outline-none bg-transparent"
               />
            </div>
            <div className="w-full md:w-48 relative">
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border-b border-slate-300 py-2 px-1 focus:border-blue-500 outline-none bg-transparent text-slate-600"
              />
              <Calendar className="absolute right-0 top-2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2">
               <button className="bg-slate-100 px-4 py-2 rounded text-sm text-slate-600 border border-slate-200">Escolher arquivo</button>
               <span className="text-xs text-slate-400 italic">Nenhum arquivo</span>
            </div>
          </div>
          <div>
            <textarea 
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-b border-slate-300 py-2 px-1 focus:border-blue-500 outline-none bg-transparent resize-none h-20"
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pending */}
        <div>
          <h3 className="text-lg font-bold text-yellow-500 mb-4">Pendentes</h3>
          <div className="space-y-4">
            {pendingTasks.length === 0 && <p className="text-slate-400 italic">Nenhuma tarefa pendente.</p>}
            {pendingTasks.map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg border border-l-4 border-l-yellow-400 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">{task.title}</h4>
                    <p className="text-xs text-slate-500 mb-2">{task.dueDate}</p>
                  </div>
                  <button onClick={() => onToggleTask(task.id)} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded">
                    <CheckSquare size={20} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2">{task.description}</p>
                <div className="mt-4 flex gap-2">
                   <button className="px-3 py-1 border border-yellow-400 text-yellow-500 text-xs rounded hover:bg-yellow-50">Editar</button>
                   <button onClick={() => onDeleteTask(task.id)} className="px-3 py-1 border border-red-400 text-red-500 text-xs rounded hover:bg-red-50">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed */}
        <div>
          <h3 className="text-lg font-bold text-emerald-600 mb-4">Concluídas</h3>
          <div className="space-y-4">
            {completedTasks.length === 0 && <p className="text-slate-400 italic">Nenhuma tarefa concluída.</p>}
            {completedTasks.map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg border border-l-4 border-l-emerald-500 shadow-sm opacity-75">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 line-through decoration-emerald-500">{task.title}</h4>
                    <p className="text-xs text-slate-500 mb-2">{task.dueDate}</p>
                  </div>
                  <button onClick={() => onToggleTask(task.id)} className="text-slate-400 hover:text-emerald-600 p-1 rounded">
                    <CheckSquare size={20} />
                  </button>
                </div>
                <p className="text-sm text-slate-500 mt-2 line-through">{task.description}</p>
                 <div className="mt-4 flex gap-2">
                   <button className="px-3 py-1 border border-yellow-400 text-yellow-500 text-xs rounded hover:bg-yellow-50">Editar</button>
                   <button onClick={() => onDeleteTask(task.id)} className="px-3 py-1 border border-red-400 text-red-500 text-xs rounded hover:bg-red-50">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
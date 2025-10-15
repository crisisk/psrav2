import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
export type KanbanCard = {
  id: string;
  title: string;
  description: string;
  status: string; // Should match the column id
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  tags?: string[];
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type KanbanData = KanbanColumn[];

// --- KanbanCard Component ---
interface KanbanCardProps {
  card: KanbanCard;
}

const priorityClasses = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const KanbanCardComponent: React.FC<KanbanCardProps> = ({ card }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'Card', card } });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-4 mb-3 bg-white rounded-lg shadow-md
        hover:shadow-lg transition-shadow duration-200
        cursor-grab active:cursor-grabbing
        focus:outline-none focus:ring-2 focus:ring-indigo-500
        ${isDragging ? 'opacity-50 border-2 border-indigo-500 shadow-xl' : 'border border-gray-200'}
      `}
      role="listitem"
      aria-label={`Task: ${card.title}`}
      tabIndex={0}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-base font-semibold text-gray-800 truncate">{card.title}</h3>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${priorityClasses[card.priority]}`}
          aria-label={`Priority: ${card.priority}`}
        >
          {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{card.description}</p>
      <div className="flex justify-between items-center text-xs text-gray-400">
        {card.assignedTo && (
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            {card.assignedTo}
          </span>
        )}
        {card.tags && card.tags.length > 0 && (
          <div className="flex space-x-1">
            {card.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- KanbanColumn Component ---
interface KanbanColumnProps {
  column: KanbanColumn;
  cards: KanbanCard[];
}

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({ column, cards }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'Column', column } });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 1 : 0,
  };

  const cardIds = cards.map(card => card.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        w-80 flex-shrink-0 rounded-xl bg-white p-4 shadow-xl border border-gray-200
        ${isDragging ? 'opacity-50 border-2 border-indigo-500 shadow-2xl' : ''}
      `}
      role="region"
      aria-labelledby={`column-title-${column.id}`}
    >
      {/* Column Header - Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex justify-between items-center mb-4 p-2 rounded-lg bg-indigo-50 shadow-sm cursor-grab active:cursor-grabbing hover:bg-indigo-100 transition-colors"
        aria-label={`Drag column ${column.title}`}
        tabIndex={0}
        role="button"
      >
        <h2 id={`column-title-${column.id}`} className="text-lg font-bold text-indigo-800">
          {column.title}
        </h2>
        <span className="text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
          {cards.length}
        </span>
      </div>

      {/* Card List - Sortable Context */}
      <div className="flex flex-col gap-3 min-h-[100px]" role="list">
        <SortableContext items={cardIds}>
          {cards.map(card => (
            <KanbanCardComponent key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// --- KanbanBoard Component ---

// --- Dummy Data for Demonstration ---
const initialData: KanbanData = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: '1', title: 'Design System Mockup', description: 'Create initial mockups for the new Sevensa design system.', status: 'todo', priority: 'high', assignedTo: 'Alice', tags: ['Design', 'UI'] },
      { id: '2', title: 'Setup Project Structure', description: 'Initialize React project with TypeScript and Tailwind CSS.', status: 'todo', priority: 'medium', assignedTo: 'Bob', tags: ['Tech', 'Setup'] },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      { id: '3', title: 'Implement Kanban Board', description: 'Develop the core KanbanBoard component with drag-and-drop.', status: 'in-progress', priority: 'high', assignedTo: 'Charlie', tags: ['Feature', 'Frontend'] },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    cards: [
      { id: '4', title: 'Write Unit Tests', description: 'Ensure all new components have 100% test coverage.', status: 'review', priority: 'low', assignedTo: 'David', tags: ['Testing'] },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: '5', title: 'Initial Branding Setup', description: 'Applied Sevensa color palette to main layout.', status: 'done', priority: 'low', assignedTo: 'Eve', tags: ['Branding'] },
    ],
  },
];

// --- Component Logic ---

const KanbanBoard: React.FC = () => {
  const [kanbanData, setKanbanData] = useState<KanbanData>(initialData);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columnIds = useMemo(() => kanbanData.map(column => column.id), [kanbanData]);

  const findColumn = (id: UniqueIdentifier) => {
    // Check if the ID belongs to a column
    const column = kanbanData.find(col => col.id === id);
    if (column) return column;

    // Check if the ID belongs to a card
    const card = kanbanData.flatMap(col => col.cards).find(c => c.id === id);
    if (card) {
      return kanbanData.find(col => col.id === card.status);
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // 1. Column Dragging
    if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column') {
      const oldIndex = kanbanData.findIndex(col => col.id === activeId);
      const newIndex = kanbanData.findIndex(col => col.id === overId);

      if (oldIndex !== newIndex) {
        setKanbanData(prevData => arrayMove(prevData, oldIndex, newIndex));
      }
      return;
    }

    // 2. Card Dragging (within or between columns)
    // The logic for card movement is primarily handled in handleDragOver for visual feedback,
    // but we need to ensure the final state is correct, especially for reordering within the same column.
    
    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn) return;

    const isSameColumn = activeColumn.id === overColumn.id;

    if (isSameColumn) {
      // Reordering within the same column
      const oldIndex = activeColumn.cards.findIndex(c => c.id === activeId);
      const newIndex = overColumn.cards.findIndex(c => c.id === overId);

      if (oldIndex !== newIndex) {
        const newCards = arrayMove(activeColumn.cards, oldIndex, newIndex);
        setKanbanData(prevData =>
          prevData.map(col =>
            col.id === activeColumn.id ? { ...col, cards: newCards } : col
          )
        );
      }
    }
    // Note: Cross-column movement is handled by handleDragOver, which updates state mid-drag.
    // If handleDragOver was not called (e.g., drag ended on a column but not a card), 
    // the state should already be correct from the last successful handleDragOver call, 
    // or the card should snap back if the drop was invalid (handled by dnd-kit implicitly).
    // For simplicity and to avoid redundant state updates, we rely on handleDragOver for cross-column moves.
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
      return;
    }

    // Moving card from one column to another
    setKanbanData(prevData => {
      const activeCard = activeColumn.cards.find(c => c.id === activeId);
      if (!activeCard) return prevData;

      // Update the card's status to the new column's ID
      const newCard: KanbanCard = { ...activeCard, status: overColumn.id };

      return prevData.map(col => {
        if (col.id === activeColumn.id) {
          // Remove from active column
          return { ...col, cards: col.cards.filter(c => c.id !== activeId) };
        } else if (col.id === overColumn.id) {
          // Add to over column
          // Determine the target index: if overId is a card, insert before it; otherwise, append to the column.
          const overIndex = overColumn.cards.findIndex(c => c.id === overId);
          const targetIndex = overIndex === -1 ? col.cards.length : overIndex;
          
          const newCards = [...col.cards];
          newCards.splice(targetIndex, 0, newCard);
          return { ...col, cards: newCards };
        }
        return col;
      });
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans" role="main">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 border-indigo-500 pb-2">
        <span className="text-indigo-700">Sevensa</span> Kanban Board
      </h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div
          className="flex space-x-6 overflow-x-auto pb-4 h-full"
          role="listbox"
          aria-orientation="horizontal"
        >
          <SortableContext items={columnIds}>
            {kanbanData.map(column => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                cards={column.cards}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
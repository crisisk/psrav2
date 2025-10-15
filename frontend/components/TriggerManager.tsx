'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Trigger {
  id: string;
  eventType: string;
  condition: string;
  action: string;
}

interface ApiResponse {
  data?: Trigger[];
  error?: string;
}

export function TriggerManager() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [newTrigger, setNewTrigger] = useState({
    eventType: '',
    condition: '',
    action: '',
  });

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    try {
      const response = await fetch('/api/triggers');
      const result: ApiResponse = await response.json();
      if (response.ok) {
        setTriggers(result.data || []);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to fetch triggers');
    }
  };

  const createTrigger = async () => {
    try {
      const response = await fetch('/api/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrigger),
      });

      if (response.ok) {
        fetchTriggers();
        setNewTrigger({ eventType: '', condition: '', action: '' });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to create trigger');
    }
  };

  const deleteTrigger = async (id: string) => {
    try {
      const response = await fetch('/api/triggers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchTriggers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to delete trigger');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-bold">Triggers Management</h1>
        
        <div className="space-y-4 bg-gray-100 p-4 rounded-lg">
          <Input
            placeholder="Event Type"
            value={newTrigger.eventType}
            onChange={(e) => setNewTrigger({...newTrigger, eventType: e.target.value})}
          />
          <Input
            placeholder="Condition"
            value={newTrigger.condition}
            onChange={(e) => setNewTrigger({...newTrigger, condition: e.target.value})}
          />
          <Input
            placeholder="Action"
            value={newTrigger.action}
            onChange={(e) => setNewTrigger({...newTrigger, action: e.target.value})}
          />
          <Button onClick={createTrigger} className="w-full">
            Add New Trigger
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {triggers.map((trigger) => (
                <tr key={trigger.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{trigger.eventType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{trigger.condition}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{trigger.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="danger"
                      onClick={() => deleteTrigger(trigger.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

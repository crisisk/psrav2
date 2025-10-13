'use client';

import { useState } from 'react';
import { User, Bell, Globe, Moon, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [language, setLanguage] = useState('nl');
  const [theme, setTheme] = useState('light');

  const handleSaveSettings = async () => {
    console.log('Saving settings...');
    // In production, this would save to backend
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Deleting account...');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Profile Section */}
      <section className="mb-8 bg-white dark:bg-dark-bg-surface rounded-lg p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 mr-2 text-sevensa-teal" />
          <h2 className="text-xl font-semibold">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              defaultValue="Suus Manager"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              defaultValue="suus@sevensa.nl"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            />
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="mb-8 bg-white dark:bg-dark-bg-surface rounded-lg p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 mr-2 text-sevensa-teal" />
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Email Notifications</label>
              <p className="text-sm text-gray-600">Receive email updates about your assessments</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-5 w-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Push Notifications</label>
              <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
            </div>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="h-5 w-5"
            />
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="mb-8 bg-white dark:bg-dark-bg-surface rounded-lg p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <Globe className="h-5 w-5 mr-2 text-sevensa-teal" />
          <h2 className="text-xl font-semibold">Preferences</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            >
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Dark Mode</label>
              <p className="text-sm text-gray-600">Use dark theme</p>
            </div>
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              className="h-5 w-5"
            />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50 rounded-lg p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <Trash2 className="h-5 w-5 mr-2 text-red-600" />
          <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete Account
        </button>
      </section>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

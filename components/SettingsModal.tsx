import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { Settings, X, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config);

  useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Ustawienia
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clockify API Key</label>
            <input
              type="password"
              name="clockifyApiKey"
              value={formData.clockifyApiKey}
              onChange={handleChange}
              placeholder="Twój klucz API Clockify"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dane do Raportu</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko (Kontrahent)</label>
              <input
                type="text"
                name="contractorName"
                value={formData.contractorName}
                onChange={handleChange}
                placeholder="np. Jan Kowalski"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa firmy (Dla kogo)</label>
              <input
                type="text"
                name="supervisorName"
                value={formData.supervisorName}
                onChange={handleChange}
                placeholder="np. PTE"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
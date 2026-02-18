import React, { useState, useEffect } from 'react';
import { AppConfig, ClockifyProject } from '../types';
import { validateClockifyKey, fetchProjects } from '../services/clockify';
import { Settings, X, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [projects, setProjects] = useState<ClockifyProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setFormData(config);
    setKeyStatus('idle');
    setProjects([]);
    // Attempt to load projects automatically if key exists
    if (config.clockifyApiKey && isOpen) {
       handleVerifyAndLoad(config.clockifyApiKey);
    }
  }, [config, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Logic for auto-selecting supervisor based on project name
    if (name === 'selectedProjectId') {
        const selectedProject = projects.find(p => p.id === value);
        let newSupervisorName = formData.supervisorName;

        if (selectedProject) {
            const projectNameLower = selectedProject.name.toLowerCase();
            if (projectNameLower.includes('pte')) {
                newSupervisorName = 'PTE';
            } else if (projectNameLower.includes('uz')) {
                newSupervisorName = 'Secureside';
            }
        }
        
        setFormData((prev) => ({ 
            ...prev, 
            [name]: value,
            supervisorName: newSupervisorName 
        }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    if (name === 'clockifyApiKey') {
        setKeyStatus('idle');
        setStatusMessage('');
    }
  };

  const handleVerifyAndLoad = async (keyOverride?: string) => {
    const keyToUse = keyOverride || formData.clockifyApiKey;
    if (!keyToUse) {
        setStatusMessage("Wprowadź klucz API");
        setKeyStatus('invalid');
        return;
    }

    setLoadingProjects(true);
    setKeyStatus('idle');
    setStatusMessage('');

    try {
        const user = await validateClockifyKey(keyToUse);
        const fetchedProjects = await fetchProjects(keyToUse, user.activeWorkspace);
        setProjects(fetchedProjects);
        setKeyStatus('valid');
        setStatusMessage('Klucz prawidłowy. Projekty załadowane.');
    } catch (error) {
        setKeyStatus('invalid');
        setStatusMessage('Błąd klucza API lub brak dostępu.');
        setProjects([]);
    } finally {
        setLoadingProjects(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Ustawienia Raporto
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klucz API Clockify</label>
            <div className="flex gap-2">
                <input
                  type="password"
                  name="clockifyApiKey"
                  value={formData.clockifyApiKey}
                  onChange={handleChange}
                  placeholder="np. XyZ123..."
                  className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                    keyStatus === 'invalid' ? 'border-red-300 focus:ring-red-200' : 
                    keyStatus === 'valid' ? 'border-green-300 focus:ring-green-200' : 
                    'focus:ring-orange-500 border-gray-300'
                  }`}
                />
                <button
                    type="button"
                    onClick={() => handleVerifyAndLoad()}
                    disabled={loadingProjects || !formData.clockifyApiKey}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                    {loadingProjects ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sprawdź"}
                </button>
            </div>
            {statusMessage && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${keyStatus === 'valid' ? 'text-green-600' : keyStatus === 'invalid' ? 'text-red-600' : 'text-gray-500'}`}>
                    {keyStatus === 'valid' && <CheckCircle2 className="w-3 h-3" />}
                    {keyStatus === 'invalid' && <AlertCircle className="w-3 h-3" />}
                    {statusMessage}
                </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projekt (Filtrowanie)</label>
            <select
                name="selectedProjectId"
                value={formData.selectedProjectId || ''}
                onChange={handleChange}
                disabled={projects.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
                <option value="">-- Wszystkie projekty --</option>
                {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
            {projects.length === 0 && keyStatus === 'valid' && (
                <p className="text-xs text-gray-500 mt-1">Brak projektów lub nie załadowano.</p>
            )}
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dane do Nagłówka Raportu</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko (Kontrahent)</label>
              <input
                type="text"
                name="contractorName"
                value={formData.contractorName}
                onChange={handleChange}
                placeholder="np. Jan Kowalski"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              Zapisz Ustawienia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
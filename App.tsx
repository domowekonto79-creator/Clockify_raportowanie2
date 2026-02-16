import React, { useState, useEffect } from 'react';
import { 
  ClockifyTimeEntry, 
  DailyReportItem, 
  AppConfig 
} from './types';
import { 
  validateClockifyKey, 
  fetchCurrentMonthEntries, 
  parseDuration 
} from './services/clockify';
import { generateWordDocument } from './services/docxGenerator';
import SettingsModal from './components/SettingsModal';
import { 
  Loader2, 
  FileDown, 
  RefreshCw, 
  AlertCircle,
  Clock,
  Settings as SettingsIcon
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

const DEFAULT_CONFIG: AppConfig = {
  clockifyApiKey: '',
  contractorName: 'Grzegorz Bielecki',
  supervisorName: 'PTE'
};

function App() {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('raporto_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [entries, setEntries] = useState<ClockifyTimeEntry[]>([]);
  const [reportData, setReportData] = useState<DailyReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial Check
  useEffect(() => {
    if (!config.clockifyApiKey) {
      setIsSettingsOpen(true);
    }
  }, [config.clockifyApiKey]);

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('raporto_config', JSON.stringify(newConfig));
  };

  const processEntries = (rawEntries: ClockifyTimeEntry[]) => {
    // Group by Date
    const grouped: { [date: string]: { descriptions: string[], duration: number } } = {};

    rawEntries.forEach(entry => {
      const date = entry.timeInterval.start.split('T')[0];
      const duration = parseDuration(entry.timeInterval.duration);
      
      if (!grouped[date]) {
        grouped[date] = { descriptions: [], duration: 0 };
      }
      
      if (entry.description) {
        grouped[date].descriptions.push(entry.description);
      }
      grouped[date].duration += duration;
    });

    // Convert to Array
    const reportItems: DailyReportItem[] = Object.keys(grouped)
      .sort()
      .map(date => ({
        date,
        rawDescriptions: grouped[date].descriptions,
        finalDescription: grouped[date].descriptions.join(", "), // Default concat
        totalHours: grouped[date].duration
      }));

    setReportData(reportItems);
  };

  const fetchData = async () => {
    if (!config.clockifyApiKey) {
      setError("Wprowadź klucz API Clockify w ustawieniach.");
      setIsSettingsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await validateClockifyKey(config.clockifyApiKey);
      const data = await fetchCurrentMonthEntries(
        config.clockifyApiKey,
        user.activeWorkspace,
        user.id
      );
      setEntries(data);
      processEntries(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Błąd pobierania danych z Clockify");
    } finally {
      setLoading(false);
    }
  };

  const handleExportWord = () => {
    if (reportData.length === 0) {
      setError("Brak danych do wyeksportowania.");
      return;
    }
    const reportDate = entries.length > 0 ? parseISO(entries[0].timeInterval.start) : new Date();
    generateWordDocument(
      reportData, 
      config.contractorName, 
      config.supervisorName,
      reportDate
    );
  };

  const handleDescriptionChange = (index: number, val: string) => {
    const newData = [...reportData];
    newData[index].finalDescription = val;
    setReportData(newData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
              R
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Raporto</h1>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
            title="Ustawienia"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Actions Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col">
             <h2 className="text-lg font-semibold text-gray-800">Bieżący Miesiąc</h2>
             <p className="text-sm text-gray-500">
                {format(new Date(), 'LLLL yyyy', { locale: pl })}
             </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-orange-600 transition-all font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Pobierz z Clockify
            </button>

            <button
              onClick={handleExportWord}
              disabled={reportData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium disabled:opacity-50 shadow-sm shadow-orange-200"
            >
              <FileDown className="w-4 h-4" />
              Zapisz do Worda
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {reportData.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Brak danych</h3>
              <p className="max-w-sm mx-auto">
                Skonfiguruj klucz API i kliknij "Pobierz z Clockify", aby zobaczyć wpisy z bieżącego miesiąca.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50 border-b border-orange-100">
                    <th className="p-4 font-semibold text-orange-900 w-32">Data</th>
                    <th className="p-4 font-semibold text-orange-900">Opis (Edytowalny)</th>
                    <th className="p-4 font-semibold text-orange-900 w-24 text-right">Godziny</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.map((item, idx) => (
                    <tr key={item.date} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 align-top font-medium text-gray-700 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="p-4 align-top">
                        <textarea
                          className="w-full bg-transparent border-0 p-0 focus:ring-0 text-gray-700 resize-none overflow-hidden"
                          rows={Math.max(2, Math.ceil(item.finalDescription.length / 80))}
                          value={item.finalDescription}
                          onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                        />
                      </td>
                      <td className="p-4 align-top text-right font-mono text-gray-600">
                        {Math.round(item.totalHours)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-200">
                    <td className="p-4 text-right" colSpan={2}>Suma:</td>
                    <td className="p-4 text-right">
                      {Math.round(reportData.reduce((acc, curr) => acc + curr.totalHours, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />
    </div>
  );
}

export default App;
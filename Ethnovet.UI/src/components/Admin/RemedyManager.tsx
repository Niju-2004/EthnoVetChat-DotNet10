import React, { useState, useEffect } from 'react';
import type { Remedy } from '../../types';
import { Plus, Search, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

interface RemedyManagerProps {
  apiBaseUrl: string;
  adminToken: string;
  onUnauthorized: () => void;
}

export const RemedyManager: React.FC<RemedyManagerProps> = ({
  apiBaseUrl,
  adminToken,
  onUnauthorized,
}) => {
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentRemedy, setCurrentRemedy] = useState<Partial<Remedy>>({
    disease: '',
    animal: '',
    symptoms: '',
    ingredients: '',
    treatment: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchRemedies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/remedies`, {
        headers: { 'X-Admin-Token': adminToken },
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to load remedies');
      const data = await res.json();
      setRemedies(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching remedies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemedies();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentRemedy({
      disease: '',
      animal: '',
      symptoms: '',
      ingredients: '',
      treatment: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (remedy: Remedy) => {
    setModalMode('edit');
    setCurrentRemedy({ ...remedy });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRemedy.disease?.trim() || !currentRemedy.treatment?.trim()) {
      alert('Disease and Treatment are required.');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        const res = await fetch(`${apiBaseUrl}/api/admin/remedies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify(currentRemedy),
        });
        if (res.status === 401) return onUnauthorized();
        if (!res.ok) throw new Error('Failed to create remedy');
        const created = await res.json();
        setRemedies((prev) => [...prev, created]);
      } else {
        const res = await fetch(`${apiBaseUrl}/api/admin/remedies/${currentRemedy.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify(currentRemedy),
        });
        if (res.status === 401) return onUnauthorized();
        if (!res.ok) throw new Error('Failed to update remedy');
        const updated = await res.json();
        setRemedies((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/remedies/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': adminToken },
      });
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) throw new Error('Delete failed');
      setRemedies((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Delete error');
    }
  };

  const filteredRemedies = remedies.filter((r) => {
    const matchesSearch =
      r.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.animal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAnimal =
      selectedAnimal === 'all' || r.animal.toLowerCase().includes(selectedAnimal.toLowerCase());
    return matchesSearch && matchesAnimal;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search remedies by disease, symptom, or herb..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAnimal}
            onChange={(e) => setSelectedAnimal(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Animals</option>
            <option value="cow">Cow / Cattle</option>
            <option value="goat">Goat / Sheep</option>
            <option value="chicken">Poultry / Chicken</option>
            <option value="dog">Dog</option>
          </select>

          <button
            onClick={fetchRemedies}
            title="Refresh"
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Remedy</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800/90 backdrop-blur-xs text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 w-12">#</th>
                <th className="py-2.5 px-3">Disease / Condition</th>
                <th className="py-2.5 px-3">Target Animal</th>
                <th className="py-2.5 px-3">Herbal Ingredients</th>
                <th className="py-2.5 px-3 max-w-xs">Treatment & Dosage</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {loading && remedies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading traditional remedies...
                  </td>
                </tr>
              ) : filteredRemedies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No matching remedies found.
                  </td>
                </tr>
              ) : (
                filteredRemedies.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{r.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                      {r.disease}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[11px] font-medium">
                        {r.animal || 'Any'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600 dark:text-slate-400" title={r.ingredients}>
                      {r.ingredients}
                    </td>
                    <td className="py-2.5 px-3 max-w-[260px] truncate text-slate-600 dark:text-slate-400" title={r.treatment}>
                      {r.treatment}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Edit Remedy"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirmId === r.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-500 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                            title="Delete Remedy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Showing {filteredRemedies.length} of {remedies.length} remedies</span>
          <span>Verified EVP Knowledge Base</span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold m-0">
                {modalMode === 'create' ? 'Add New Traditional Remedy' : `Edit Remedy #${currentRemedy.id}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Disease / Condition *</label>
                <input
                  type="text"
                  required
                  value={currentRemedy.disease || ''}
                  onChange={(e) => setCurrentRemedy({ ...currentRemedy, disease: e.target.value })}
                  placeholder="e.g. Bloat, Diarrhea, Mastitis"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Animal(s)</label>
                <input
                  type="text"
                  value={currentRemedy.animal || ''}
                  onChange={(e) => setCurrentRemedy({ ...currentRemedy, animal: e.target.value })}
                  placeholder="e.g. Cow, goat, poultry, sheep"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Symptoms</label>
                <input
                  type="text"
                  value={currentRemedy.symptoms || ''}
                  onChange={(e) => setCurrentRemedy({ ...currentRemedy, symptoms: e.target.value })}
                  placeholder="e.g. Watery dung, swollen abdomen, fever"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Herbal Ingredients</label>
                <input
                  type="text"
                  value={currentRemedy.ingredients || ''}
                  onChange={(e) => setCurrentRemedy({ ...currentRemedy, ingredients: e.target.value })}
                  placeholder="e.g. Neem leaves 100g, Turmeric 20g, Black pepper 10g"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Treatment & Dosage Method *</label>
                <textarea
                  rows={4}
                  required
                  value={currentRemedy.treatment || ''}
                  onChange={(e) => setCurrentRemedy({ ...currentRemedy, treatment: e.target.value })}
                  placeholder="Grind ingredients into paste, administer orally once daily for 3 days..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : modalMode === 'create' ? 'Add Remedy' : 'Update Remedy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

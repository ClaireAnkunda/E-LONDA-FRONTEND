import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { votersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Voter {
  id: string;
  regNo: string;
  name: string;
  email: string | null;
  phone: string | null;
  program: string | null;
  status: string;
  createdAt: string;
}

interface VotersListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VotersListModal: React.FC<VotersListModalProps> = ({ isOpen, onClose }) => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState(''); // The actual search term used for API calls
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    if (isOpen) {
      fetchVoters();
    }
  }, [isOpen, page, activeSearch]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setActiveSearch('');
      setPage(1);
    }
  }, [isOpen]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      // Only include search in params if it's not empty
      const params: { page: number; limit: number; search?: string } = {
        page,
        limit,
      };
      
      if (activeSearch && activeSearch.trim().length > 0) {
        params.search = activeSearch.trim();
      }
      
      const response = await votersAPI.getAll(params);
      setVoters(response.voters || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch voters:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load voters';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm.trim());
    setPage(1);
  };

  const handleClear = () => {
    setSearchTerm('');
    setActiveSearch('');
    setPage(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-green-200/50 bg-white/95 backdrop-blur-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-green-600">Eligible Voters</CardTitle>
              <CardDescription className="mt-1">
                {total > 0 ? `${total.toLocaleString()} voter${total !== 1 ? 's' : ''} registered` : 'No voters found'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search by name, registration number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                Search
              </Button>
              {activeSearch && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : voters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No voters found</p>
              {searchTerm && (
                <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {voters.map((voter) => (
                <div
                  key={voter.id}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{voter.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {voter.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Reg No:</span> {voter.regNo}
                        </div>
                        {voter.email && (
                          <div>
                            <span className="font-medium">Email:</span> {voter.email}
                          </div>
                        )}
                        {voter.phone && (
                          <div>
                            <span className="font-medium">Phone:</span> {voter.phone}
                          </div>
                        )}
                        {voter.program && (
                          <div>
                            <span className="font-medium">Program:</span> {voter.program}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VotersListModal;


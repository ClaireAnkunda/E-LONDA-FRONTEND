import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface AuditLog {
  id: string;
  actorType: string;
  actorId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  payload: any;
  createdAt: string;
}

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await reportsAPI.getAuditLog({ page, limit: 50 });
      setLogs(data.logs || data);
      if (data.totalPages) {
        setTotalPages(data.totalPages);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('APPROVE')) {
      return 'text-green-600 bg-green-50';
    }
    if (action.includes('DELETE') || action.includes('REJECT')) {
      return 'text-red-600 bg-red-50';
    }
    if (action.includes('UPDATE')) {
      return 'text-blue-600 bg-blue-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[900px] max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            View all system activities and changes. This log is immutable and append-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading audit logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No audit logs found</p>
          ) : (
            <>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.actorType}
                            {log.actorId && ` (${log.actorId.substring(0, 8)}...)`}
                          </span>
                        </div>
                        {log.entity && (
                          <p className="text-sm text-muted-foreground">
                            Entity: {log.entity}
                            {log.entityId && ` (${log.entityId.substring(0, 8)}...)`}
                          </p>
                        )}
                        {log.payload && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground ml-4">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogModal;


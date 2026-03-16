// src/app/hooks/useCustomers.js
import { useState, useEffect, useCallback } from 'react';

export function useCustomers(initialFilters = {}) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    search: '',
    period: 'all',
    ...initialFilters,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCustomers(data.customers);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const refetch = () => fetchCustomers();

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // reset to page 1 on filter change
  };

  const goToPage = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return {
    customers,
    loading,
    error,
    pagination,
    filters,
    setFilter,
    goToPage,
    refetch,
  };
}
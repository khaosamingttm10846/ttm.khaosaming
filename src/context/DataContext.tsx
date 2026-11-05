import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { ServiceRecord, FinancialRecord, ClinicEvent } from '../types';
import { SAMPLE_SERVICES, SAMPLE_FINANCES, SAMPLE_CLINIC_EVENTS } from '../mockData';

interface DataContextType {
  services: ServiceRecord[];
  finances: FinancialRecord[];
  clinicEvents: ClinicEvent[];
  loadingServices: boolean;
  loadingFinances: boolean;
  loadingEvents: boolean;
  addServiceRecord: (record: Omit<ServiceRecord, 'id'>) => Promise<void>;
  updateServiceRecord: (id: string, record: Partial<ServiceRecord>) => Promise<void>;
  deleteServiceRecord: (id: string) => Promise<void>;
  importServicesBatch: (records: Omit<ServiceRecord, 'id'>[]) => Promise<number>;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => Promise<void>;
  updateFinancialRecord: (id: string, record: Partial<FinancialRecord>) => Promise<void>;
  deleteFinancialRecord: (id: string) => Promise<void>;
  importFinancesBatch: (records: Omit<FinancialRecord, 'id'>[]) => Promise<number>;
  addClinicEvent: (event: Omit<ClinicEvent, 'id'>) => Promise<void>;
  updateClinicEvent: (id: string, event: Partial<ClinicEvent>) => Promise<void>;
  deleteClinicEvent: (id: string) => Promise<void>;
  seedSampleData: () => Promise<void>;
  clearAllDemoData: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  services: [],
  finances: [],
  clinicEvents: [],
  loadingServices: true,
  loadingFinances: true,
  loadingEvents: true,
  addServiceRecord: async () => {},
  updateServiceRecord: async () => {},
  deleteServiceRecord: async () => {},
  importServicesBatch: async () => 0,
  addFinancialRecord: async () => {},
  updateFinancialRecord: async () => {},
  deleteFinancialRecord: async () => {},
  importFinancesBatch: async () => 0,
  addClinicEvent: async () => {},
  updateClinicEvent: async () => {},
  deleteClinicEvent: async () => {},
  seedSampleData: async () => {},
  clearAllDemoData: async () => {},
});

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [finances, setFinances] = useState<FinancialRecord[]>([]);
  const [clinicEvents, setClinicEvents] = useState<ClinicEvent[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [loadingFinances, setLoadingFinances] = useState<boolean>(true);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);

  // Helper to get auth header
  const getAuthHeaders = useCallback(async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.warn('Could not get token:', e);
      }
    }
    return headers;
  }, [currentUser]);

  // Fetch all services from Database
  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: ServiceRecord[] = await res.json();
      
      if (data.length === 0) {
        // Auto-seed sample services if database is clean
        const seedItems = SAMPLE_SERVICES.map((s, idx) => ({
          ...s,
          id: `ks-srv-${1000 + idx}`,
          createdBy: 'รพ.เขาสมิง (ระบบเริ่มต้น)',
        }));
        await fetch('/api/services/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: seedItems }),
        });
        setServices(seedItems);
      } else {
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to load services from database:', error);
      // Fallback
      setServices(
        SAMPLE_SERVICES.map((s, idx) => ({
          ...s,
          id: `preview-srv-${idx}`,
        }))
      );
    } finally {
      setLoadingServices(false);
    }
  }, []);

  // Fetch all finances from Database
  const fetchFinances = useCallback(async () => {
    setLoadingFinances(true);
    try {
      const res = await fetch('/api/finances');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: FinancialRecord[] = await res.json();

      if (data.length === 0) {
        // Auto-seed sample finances
        const seedItems = SAMPLE_FINANCES.map((f, idx) => ({
          ...f,
          id: `ks-fin-${1000 + idx}`,
          createdBy: 'รพ.เขาสมิง (ระบบเริ่มต้น)',
        }));
        for (const f of seedItems) {
          await fetch('/api/finances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(f),
          });
        }
        setFinances(seedItems);
      } else {
        setFinances(data);
      }
    } catch (error) {
      console.error('Failed to load finances from database:', error);
      setFinances(
        SAMPLE_FINANCES.map((f, idx) => ({
          ...f,
          id: `preview-fin-${idx}`,
        }))
      );
    } finally {
      setLoadingFinances(false);
    }
  }, []);

  // Fetch all clinic events from Database
  const fetchClinicEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/clinic-events');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: ClinicEvent[] = await res.json();

      if (data.length === 0) {
        // Auto-seed sample events
        const seedItems = SAMPLE_CLINIC_EVENTS.map((e, idx) => ({
          ...e,
          id: `ks-ev-${1000 + idx}`,
          createdBy: 'รพ.เขาสมิง (ระบบเริ่มต้น)',
        }));
        for (const ev of seedItems) {
          await fetch('/api/clinic-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ev),
          });
        }
        setClinicEvents(seedItems);
      } else {
        setClinicEvents(data);
      }
    } catch (error) {
      console.error('Failed to load clinic events from database:', error);
      setClinicEvents(
        SAMPLE_CLINIC_EVENTS.map((e, idx) => ({
          ...e,
          id: `preview-ev-${idx}`,
        }))
      );
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchServices();
    fetchFinances();
    fetchClinicEvents();
  }, [fetchServices, fetchFinances, fetchClinicEvents]);

  // ==========================================
  // SERVICE RECORD CRUD
  // ==========================================
  const addServiceRecord = async (record: Omit<ServiceRecord, 'id'>) => {
    const id = `ks-srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullRecord: ServiceRecord = {
      ...record,
      id,
      createdBy: currentUser?.email || 'เจ้าหน้าที่แผนกแพทย์แผนไทย',
      createdAt: new Date().toISOString(),
    };

    setServices((prev) => [fullRecord, ...prev]);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/services', {
        method: 'POST',
        headers,
        body: JSON.stringify(fullRecord),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error adding service to database:', error);
      fetchServices();
      throw error;
    }
  };

  const updateServiceRecord = async (id: string, updates: Partial<ServiceRecord>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error updating service in database:', error);
      fetchServices();
      throw error;
    }
  };

  const deleteServiceRecord = async (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error deleting service from database:', error);
      fetchServices();
      throw error;
    }
  };

  const importServicesBatch = async (records: Omit<ServiceRecord, 'id'>[]) => {
    const creator = currentUser?.email || 'นำเข้าจาก Excel';
    const timestamp = new Date().toISOString();
    const batchItems: ServiceRecord[] = records.map((r, idx) => ({
      ...r,
      id: `ks-srv-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      createdBy: creator,
      createdAt: timestamp,
    }));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/services/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: batchItems }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      setServices((prev) => [...batchItems, ...prev]);
      return batchItems.length;
    } catch (error) {
      console.error('Error batch importing services to database:', error);
      throw error;
    }
  };

  // ==========================================
  // FINANCIAL RECORD CRUD
  // ==========================================
  const addFinancialRecord = async (record: Omit<FinancialRecord, 'id'>) => {
    const id = `ks-fin-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullRecord: FinancialRecord = {
      ...record,
      id,
      createdBy: currentUser?.email || 'เจ้าหน้าที่การเงิน',
      createdAt: new Date().toISOString(),
    };

    setFinances((prev) => [fullRecord, ...prev]);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/finances', {
        method: 'POST',
        headers,
        body: JSON.stringify(fullRecord),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error adding finance record to database:', error);
      fetchFinances();
      throw error;
    }
  };

  const updateFinancialRecord = async (id: string, updates: Partial<FinancialRecord>) => {
    setFinances((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/finances/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error updating finance record in database:', error);
      fetchFinances();
      throw error;
    }
  };

  const deleteFinancialRecord = async (id: string) => {
    setFinances((prev) => prev.filter((f) => f.id !== id));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/finances/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error deleting finance record from database:', error);
      fetchFinances();
      throw error;
    }
  };

  const importFinancesBatch = async (records: Omit<FinancialRecord, 'id'>[]) => {
    const creator = currentUser?.email || 'นำเข้าจาก Excel';
    const timestamp = new Date().toISOString();
    const batchItems: FinancialRecord[] = records.map((r, idx) => ({
      ...r,
      id: `ks-fin-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      createdBy: creator,
      createdAt: timestamp,
    }));

    try {
      const headers = await getAuthHeaders();
      for (const item of batchItems) {
        await fetch('/api/finances', {
          method: 'POST',
          headers,
          body: JSON.stringify(item),
        });
      }
      setFinances((prev) => [...batchItems, ...prev]);
      return batchItems.length;
    } catch (error) {
      console.error('Error batch importing finances to database:', error);
      throw error;
    }
  };

  // ==========================================
  // CLINIC EVENT CRUD
  // ==========================================
  const addClinicEvent = async (event: Omit<ClinicEvent, 'id'>) => {
    const id = `ks-ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullEvent: ClinicEvent = {
      ...event,
      id,
      createdBy: currentUser?.email || 'เจ้าหน้าที่แผนกแพทย์แผนไทย',
      createdAt: new Date().toISOString(),
    };

    setClinicEvents((prev) => [...prev, fullEvent]);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/clinic-events', {
        method: 'POST',
        headers,
        body: JSON.stringify(fullEvent),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error adding clinic event to database:', error);
      fetchClinicEvents();
      throw error;
    }
  };

  const updateClinicEvent = async (id: string, updates: Partial<ClinicEvent>) => {
    setClinicEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clinic-events/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error updating clinic event in database:', error);
      fetchClinicEvents();
      throw error;
    }
  };

  const deleteClinicEvent = async (id: string) => {
    setClinicEvents((prev) => prev.filter((e) => e.id !== id));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clinic-events/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (error) {
      console.error('Error deleting clinic event from database:', error);
      fetchClinicEvents();
      throw error;
    }
  };

  // ==========================================
  // SEED & DEMO MANAGEMENT
  // ==========================================
  const seedSampleData = async () => {
    setLoadingServices(true);
    setLoadingFinances(true);
    setLoadingEvents(true);

    try {
      const headers = await getAuthHeaders();

      // Seed Services
      const servicesToSeed = SAMPLE_SERVICES.map((s, idx) => ({
        ...s,
        id: `ks-srv-${1000 + idx}`,
        createdBy: 'รพ.เขาสมิง (ข้อมูลตัวอย่าง)',
      }));
      await fetch('/api/services/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: servicesToSeed }),
      });
      setServices(servicesToSeed);

      // Seed Finances
      const financesToSeed = SAMPLE_FINANCES.map((f, idx) => ({
        ...f,
        id: `ks-fin-${1000 + idx}`,
        createdBy: 'รพ.เขาสมิง (ข้อมูลตัวอย่าง)',
      }));
      for (const f of financesToSeed) {
        await fetch('/api/finances', {
          method: 'POST',
          headers,
          body: JSON.stringify(f),
        });
      }
      setFinances(financesToSeed);

      // Seed Events
      const eventsToSeed = SAMPLE_CLINIC_EVENTS.map((e, idx) => ({
        ...e,
        id: `ks-ev-${1000 + idx}`,
        createdBy: 'รพ.เขาสมิง (ข้อมูลตัวอย่าง)',
      }));
      for (const ev of eventsToSeed) {
        await fetch('/api/clinic-events', {
          method: 'POST',
          headers,
          body: JSON.stringify(ev),
        });
      }
      setClinicEvents(eventsToSeed);
    } catch (error) {
      console.error('Error seeding data to database:', error);
    } finally {
      setLoadingServices(false);
      setLoadingFinances(false);
      setLoadingEvents(false);
    }
  };

  const clearAllDemoData = async () => {
    // Clear demo records with id starting with ks- or preview-
    setServices((prev) => prev.filter((s) => !s.id.startsWith('preview-') && !s.id.startsWith('ks-srv-10')));
    setFinances((prev) => prev.filter((f) => !f.id.startsWith('preview-') && !f.id.startsWith('ks-fin-10')));
    setClinicEvents((prev) => prev.filter((e) => !e.id.startsWith('preview-') && !e.id.startsWith('ks-ev-10')));
  };

  return (
    <DataContext.Provider
      value={{
        services,
        finances,
        clinicEvents,
        loadingServices,
        loadingFinances,
        loadingEvents,
        addServiceRecord,
        updateServiceRecord,
        deleteServiceRecord,
        importServicesBatch,
        addFinancialRecord,
        updateFinancialRecord,
        deleteFinancialRecord,
        importFinancesBatch,
        addClinicEvent,
        updateClinicEvent,
        deleteClinicEvent,
        seedSampleData,
        clearAllDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

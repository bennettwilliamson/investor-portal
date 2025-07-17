"use client";

import React from "react";

interface DatasetContextValue {
  datasets: string[];          // available dataset identifiers (derived from JSON file names)
  selected: string | null;     // currently chosen dataset identifier
  data: any[];                 // data content (raw JSON array) for the selected dataset
  selectDataset: (name: string) => void; // trigger dataset change
  loading: boolean;            // indicates that data is still being fetched
}

const DatasetContext = React.createContext<DatasetContextValue | undefined>(undefined);

export const useDataset = () => {
  const ctx = React.useContext(DatasetContext);
  if (!ctx) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return ctx;
};

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Fetch list of datasets (JSON files in src/data)
  React.useEffect(() => {
    async function fetchDatasets() {
      try {
        const res = await fetch("/api/datasets");
        if (!res.ok) throw new Error("Failed to fetch dataset list");
        const list: string[] = await res.json();
        setDatasets(list);
        // Default to the first dataset in the list (if any)
        if (list.length > 0) {
          setSelected((prev) => prev ?? list[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchDatasets();
  }, []);

  // Fetch data content whenever `selected` changes
  React.useEffect(() => {
    async function fetchData(name: string) {
      setLoading(true);
      try {
        const res = await fetch(`/api/datasets/${name}`);
        if (!res.ok) throw new Error("Failed to load dataset " + name);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    if (selected) {
      fetchData(selected);
    }
  }, [selected]);

  const value: DatasetContextValue = React.useMemo(
    () => ({ datasets, selected, data, selectDataset: setSelected, loading }),
    [datasets, selected, data, loading]
  );

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}; 
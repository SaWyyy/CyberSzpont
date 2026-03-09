import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/results");
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Błąd pobierania wyników:", error);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch("/api/upload", { method: "POST", body: formData });
      setFile(null);
      fetchResults();
    } catch (error) {
      alert("Wystąpił błąd podczas przesyłania pliku.");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CLEAN': return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-xs font-bold shadow-sm">CZYSTY</span>;
      case 'INFECTED': return <span className="px-3 py-1 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full text-xs font-bold shadow-sm animate-pulse">ZAINFEKOWANY</span>;
      case 'SCANNING': return <span className="px-3 py-1 bg-sky-500/10 text-sky-600 border border-sky-500/20 rounded-full text-xs font-bold shadow-sm animate-pulse">SKANOWANIE...</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">OCZEKUJE</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">SecuScan</h1>
            <p className="text-xs font-medium text-slate-500">DevSecOps Analysis Platform</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Kolumna lewa: Upload i Statusy (1/3 szerokości) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Karta Uploadu */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">Skaner Plików</h2>
                <p className="text-sm text-slate-500 mt-1">Prześlij plik do analizy w odizolowanym środowisku.</p>
              </div>
              <div className="p-5">
                <div 
                  className={`relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out ${
                    dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
                  }`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                >
                  <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
                  
                  {!file ? (
                    <div className="text-center px-4">
                      <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 text-indigo-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">
                        <button type="button" className="text-indigo-600 hover:text-indigo-700" onClick={() => inputRef.current.click()}>Wybierz plik</button> lub upuść tutaj
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Wsparcie dla wszystkich formatów (Max 15MB)</p>
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate w-48 mx-auto">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <div className="flex space-x-2 mt-4 justify-center">
                        <button onClick={() => setFile(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Anuluj</button>
                        <button onClick={uploadFile} disabled={isUploading} className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                          {isUploading ? 'Przetwarzanie...' : 'Rozpocznij skan'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Karta Statusu Architektury (Bajer dla prowadzącego) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-800">Status Mikrousług</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 flex items-center"><svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg> API Gateway</span>
                  <span className="text-emerald-500 font-medium">Online</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 flex items-center"><svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> ClamAV Engine</span>
                  <span className="text-emerald-500 font-medium">Aktywny</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 flex items-center"><svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg> MinIO Storage</span>
                  <span className="text-emerald-500 font-medium">Zabezpieczony</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolumna prawa: Historia skanowań (2/3 szerokości) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Dziennik Audytów</h2>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Ostatnie 20 zdarzeń</span>
              </div>
              
              <div className="flex-1 overflow-auto bg-slate-50/30">
                <ul className="divide-y divide-slate-100">
                  {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                      <svg className="w-12 h-12 mb-3 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                      <p className="text-sm">Brak historii skanowania.</p>
                    </div>
                  ) : (
                    results.map((item) => (
                      <li key={item.id} className="p-5 hover:bg-white transition-colors duration-150 flex items-center justify-between group">
                        <div className="flex items-start space-x-4">
                          <div className="mt-1">
                            {item.status === 'INFECTED' ? (
                              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            ) : item.status === 'CLEAN' ? (
                              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            ) : (
                              <svg className="w-5 h-5 text-sky-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.filename}</p>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className="text-xs text-slate-400 font-mono">ID: {item.id.split('-')[0]}...</span>
                              {item.result && item.result !== 'Brak zagrożeń' && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-rose-500 font-mono bg-rose-50 px-1.5 rounded">{item.result}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {getStatusBadge(item.status)}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
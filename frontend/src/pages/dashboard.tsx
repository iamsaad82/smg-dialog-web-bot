import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/api";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              {user?.first_name} {user?.last_name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Willkommen, {user?.first_name || 'Benutzer'}!
              </h2>
              <p className="text-gray-600 mb-4">
                Sie sind als {user?.role === UserRole.ADMIN ? 'Administrator' : 
                              user?.role === UserRole.AGENCY_ADMIN ? 'Agentur-Administrator' : 
                              user?.role === UserRole.EDITOR ? 'Editor' : 'Betrachter'} angemeldet.
              </p>
              
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Admin Section */}
                {user?.role === UserRole.ADMIN && (
                  <>
                    <a href="/users" className="block hover:bg-gray-50 p-6 border border-gray-200 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">Benutzerverwaltung</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Benutzer anzeigen, erstellen und verwalten
                          </p>
                        </div>
                      </div>
                    </a>

                    <a href="/agencies" className="block hover:bg-gray-50 p-6 border border-gray-200 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">Agenturverwaltung</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Agenturen anzeigen, erstellen und verwalten
                          </p>
                        </div>
                      </div>
                    </a>

                    <a href="/tenants" className="block hover:bg-gray-50 p-6 border border-gray-200 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">Kundenverwaltung</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Kunden anzeigen, erstellen und verwalten
                          </p>
                        </div>
                      </div>
                    </a>
                  </>
                )}

                {/* Agency Admin Section */}
                {user?.role === UserRole.AGENCY_ADMIN && (
                  <>
                    <a href="/tenants" className="block hover:bg-gray-50 p-6 border border-gray-200 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">Kundenverwaltung</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Kunden anzeigen, erstellen und verwalten
                          </p>
                        </div>
                      </div>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { ContactInfo, ContactLink } from '../types/api';

interface ContactCardEditorProps {
  contact: ContactInfo;
  onSave: (contact: ContactInfo) => void;
  onCancel: () => void;
}

const ContactCardEditor: React.FC<ContactCardEditorProps> = ({
  contact,
  onSave,
  onCancel
}) => {
  const [editedContact, setEditedContact] = useState<ContactInfo>(contact);
  const [newKeyword, setNewKeyword] = useState('');
  const [newLink, setNewLink] = useState<ContactLink>({
    type: 'website',
    label: '',
    url: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedContact(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    setEditedContact(prev => ({
      ...prev,
      keywords: [...(prev.keywords || []), newKeyword.trim()]
    }));
    setNewKeyword('');
  };

  const handleRemoveKeyword = (index: number) => {
    setEditedContact(prev => ({
      ...prev,
      keywords: prev.keywords ? 
        prev.keywords.filter((_, i) => i !== index) :
        []
    }));
  };

  const handleAddLink = () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    
    setEditedContact(prev => ({
      ...prev,
      links: [...(prev.links || []), { ...newLink }]
    }));
    setNewLink({
      type: 'website',
      label: '',
      url: ''
    });
  };

  const handleRemoveLink = (index: number) => {
    setEditedContact(prev => ({
      ...prev,
      links: prev.links ? 
        prev.links.filter((_, i) => i !== index) :
        []
    }));
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLink(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedContact);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Kontaktkarte bearbeiten</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basisinformationen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID</label>
            <input
              type="text"
              name="id"
              value={editedContact.id}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              readOnly={!!contact.id} // Nur editierbar, wenn neue Kontaktkarte
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Typ</label>
            <select
              name="type"
              value={editedContact.type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="department">Amt/Behörde</option>
              <option value="store">Geschäft</option>
              <option value="doctor">Arztpraxis</option>
              <option value="service">Dienstleister</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            name="name"
            value={editedContact.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
          <input
            type="text"
            name="address"
            value={editedContact.address || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
            <input
              type="text"
              name="phone"
              value={editedContact.phone || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-Mail</label>
            <input
              type="email"
              name="email"
              value={editedContact.email || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Öffnungszeiten</label>
          <input
            type="text"
            name="hours"
            value={editedContact.hours || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="z.B. Mo-Fr 9-17 Uhr"
          />
        </div>
        
        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Keywords</label>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {editedContact.keywords?.map((keyword, index) => (
              <div key={index} className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded-md flex items-center">
                <span className="text-indigo-800 dark:text-indigo-200 text-sm">{keyword}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(index)}
                  className="ml-2 text-indigo-500 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-100"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Neues Keyword"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-r-md"
            >
              Hinzufügen
            </button>
          </div>
        </div>
        
        {/* Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Links</label>
          
          <div className="space-y-2 mb-4">
            {editedContact.links?.map((link, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <span className="font-medium">{link.label}:</span>
                <span className="text-blue-500 flex-1 truncate">{link.url}</span>
                <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{link.type}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              name="type"
              value={newLink.type}
              onChange={handleLinkChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="website">Website</option>
              <option value="appointment">Termin</option>
              <option value="map">Karte</option>
              <option value="email">E-Mail</option>
              <option value="phone">Telefon</option>
            </select>
            
            <input
              type="text"
              name="label"
              value={newLink.label}
              onChange={handleLinkChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Beschriftung"
            />
            
            <input
              type="text"
              name="url"
              value={newLink.url}
              onChange={handleLinkChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="URL"
            />
          </div>
          
          <button
            type="button"
            onClick={handleAddLink}
            className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md w-full"
          >
            Link hinzufügen
          </button>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-md"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
          >
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactCardEditor;
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Store, MoreVertical, X, Trash2, Users } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

type Catalog = {
  catalog_id: string;
  catalog_name: string;
  slug: string;
  catalog_type: string;
  is_active: boolean;
  created_date: string;
  tenant_slug?: string;
};

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Catalog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCatalog, setNewCatalog] = useState({ name: '', type: 'GENERAL' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getCatalogUrl = (tenantSlug?: string, catalogSlug?: string) => {
    if (!tenantSlug || !catalogSlug) return '';
    const isLocalhost = window.location.hostname.includes('localhost');
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (isLocalhost ? 'localhost:3000' : 'your-saas.com');
    const protocol = isLocalhost ? 'http://' : 'https://';
    return `${protocol}${tenantSlug}.${rootDomain}/c/${catalogSlug}`;
  };

  // Dropdown & Action states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [managingCatalog, setManagingCatalog] = useState<Catalog | null>(null);
  const [availableCustomers, setAvailableCustomers] = useState<{value: string, label: string}[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', phoneNumber: '', email: '' });

  useEffect(() => {
    fetchCatalogs();
  }, []);

  async function fetchCatalogs() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/catalogs");
      if (res.ok) {
        const data = await res.json();
        setCatalogs(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch catalogs");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const generatedSlug = newCatalog.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const res = await fetch("/api/v1/catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogName: newCatalog.name,
          slug: generatedSlug,
          catalogType: newCatalog.type,
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create catalog");
      }
      
      
      setCatalogs([data.data, ...catalogs]);
      setIsDialogOpen(false);
      setNewCatalog({ name: '', type: 'GENERAL' });
      alert(`Catalog created successfully! URL: ${getCatalogUrl(data.data.tenant_slug, data.data.slug)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCatalog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this catalog?')) return;
    try {
      const res = await fetch(`/api/v1/catalogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCatalogs(catalogs.filter(c => c.catalog_id !== id));
      } else {
        alert('Failed to delete catalog');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openManageCustomers = async (catalog: Catalog) => {
    setManagingCatalog(catalog);
    setActiveDropdown(null);
    try {
      const res = await fetch('/api/v1/customers?limit=100');
      if (res.ok) {
        const data = await res.json();
        setAvailableCustomers((data.data || []).map((c: any) => ({
          value: c.customer_id,
          label: `${c.first_name} ${c.last_name} (${c.email})`
        })));
      }
    } catch (e) {
      console.error('Failed to load customers');
    }
  };

  const handleAssignCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCatalog) return;
    
    setIsAssigning(true);
    let targetCustomerId = selectedCustomerId;

    try {
      // If creating new customer, create it first
      if (isCreatingNewCustomer) {
        const createRes = await fetch('/api/v1/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomer)
        });
        
        const createData = await createRes.json();
        if (!createRes.ok) {
          alert(createData.error || 'Failed to create new customer');
          setIsAssigning(false);
          return;
        }
        targetCustomerId = createData.data.customer_id;
      }

      if (!targetCustomerId) {
        alert('Please select or create a customer');
        setIsAssigning(false);
        return;
      }

      // Assign to catalog
      const res = await fetch(`/api/v1/catalogs/${managingCatalog.catalog_id}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: targetCustomerId })
      });
      if (res.ok) {
        alert('Customer assigned successfully!');
        setManagingCatalog(null);
        setSelectedCustomerId('');
        setIsCreatingNewCustomer(false);
        setNewCustomer({ firstName: '', lastName: '', phoneNumber: '', email: '' });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to assign customer');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Catalogs</h1>
          <p className="text-secondary text-sm">Manage different store catalogs and custom pricing for customers.</p>
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="group relative flex items-center gap-2 px-5 py-2.5 bg-[#050505] text-white rounded-[12px] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-[0.16,1,0.3,1] rounded-[12px]" />
          <div className="relative z-10 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Catalog
          </div>
        </button>

        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-heading font-semibold">Create New Catalog</h2>
                <button onClick={() => setIsDialogOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateCatalog} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Catalog Name</label>
                  <input 
                    required
                    type="text" 
                    value={newCatalog.name}
                    onChange={(e) => setNewCatalog({...newCatalog, name: e.target.value})}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="e.g. VIP Customers 2024"
                  />
                </div>

                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-primary">Catalog Type</label>
                  <CustomSelect
                    name="catalogType"
                    value={newCatalog.type}
                    onChange={(val) => setNewCatalog({...newCatalog, type: val})}
                    options={[
                      { value: "GENERAL", label: "General (Public)" },
                      { value: "SPECIAL", label: "Special (Restricted)" }
                    ]}
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setIsDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Catalog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {managingCatalog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-heading font-semibold">Manage Customers</h2>
                <button onClick={() => setManagingCatalog(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAssignCustomer} className="p-6 space-y-4">
                <p className="text-sm text-secondary mb-4">
                  Assign a customer to the <strong className="text-primary">{managingCatalog.catalog_name}</strong> catalog.
                </p>

                <div className="flex gap-2 p-1 bg-black/[0.04] rounded-lg w-fit mb-4">
                  <button type="button" onClick={() => setIsCreatingNewCustomer(false)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!isCreatingNewCustomer ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}>
                    Select Existing
                  </button>
                  <button type="button" onClick={() => setIsCreatingNewCustomer(true)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${isCreatingNewCustomer ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}>
                    Create New
                  </button>
                </div>

                {!isCreatingNewCustomer ? (
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium text-primary">Select Customer</label>
                    <CustomSelect
                      name="customerId"
                      value={selectedCustomerId}
                      onChange={setSelectedCustomerId}
                      options={availableCustomers}
                      placeholder="Choose a customer..."
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-primary">First Name</label>
                        <input required type="text" value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-primary">Last Name</label>
                        <input required type="text" value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-primary">Phone Number</label>
                      <input required type="tel" value={newCustomer.phoneNumber} onChange={e => setNewCustomer({...newCustomer, phoneNumber: e.target.value})} className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-primary">Email (Optional)</label>
                      <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setManagingCatalog(null)}
                    className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isAssigning || !selectedCustomerId}
                    className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm">
        <div className="p-4 border-b border-black/[0.04] bg-surface rounded-t-2xl">
          <div className="relative max-w-md bg-white">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search catalogs..." 
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
        </div>

        <div className="w-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Catalog Name</th>
                <th className="px-6 py-4 font-medium text-primary">Slug</th>
                <th className="px-6 py-4 font-medium text-primary">URL</th>
                <th className="px-6 py-4 font-medium text-primary">Type</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : catalogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <Store className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>No catalogs found. Create one to set up a specific store endpoint.</p>
                  </td>
                </tr>
              ) : (
                catalogs.map((c) => (
                  <tr key={c.catalog_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-primary truncate">{c.catalog_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-secondary font-mono text-xs">/{c.slug}</td>
                    <td className="px-6 py-4 text-secondary font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Link href={getCatalogUrl(c.tenant_slug, c.slug)} target="_blank" className="hover:text-primary transition-colors truncate max-w-[200px] inline-block" title={getCatalogUrl(c.tenant_slug, c.slug)}>
                          {getCatalogUrl(c.tenant_slug, c.slug).replace(/^https?:\/\//, '')}
                        </Link>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(getCatalogUrl(c.tenant_slug, c.slug));
                            alert('URL copied to clipboard!');
                          }}
                          className="p-1 hover:bg-black/5 rounded"
                          title="Copy full URL"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                        c.catalog_type === 'GENERAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {c.catalog_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === c.catalog_id ? null : c.catalog_id)}
                          className="p-1.5 text-secondary hover:bg-black/5 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeDropdown === c.catalog_id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                              <div className="py-1">
                                {c.catalog_type === 'SPECIAL' && (
                                  <button
                                    onClick={() => openManageCustomers(c)}
                                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Users className="w-4 h-4" />
                                    Manage Customers
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    handleDeleteCatalog(c.catalog_id);
                                  }}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Catalog
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

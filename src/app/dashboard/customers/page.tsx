"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, Users } from "lucide-react";

type Customer = {
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  status: string;
  customer_groups: { group_name: string } | null;
  created_date: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', phoneNumber: '', email: '' });

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/v1/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Customers</h1>
          <p className="text-secondary text-sm">Manage your B2C customers and B2B clients.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="group relative flex items-center gap-2 px-5 py-2.5 bg-[#050505] text-white rounded-[12px] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-[0.16,1,0.3,1] rounded-[12px]" />
          <div className="relative z-10 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </div>
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-heading font-semibold">Add New Customer</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const res = await fetch('/api/v1/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCustomer)
                  });
                  if (res.ok) {
                    setIsAddModalOpen(false);
                    setNewCustomer({ firstName: '', lastName: '', phoneNumber: '', email: '' });
                    fetchCustomers();
                  } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to add customer');
                  }
                } catch (err) {
                  alert('Error adding customer');
                } finally {
                  setIsSubmitting(false);
                }
              }} 
              className="p-6 space-y-4"
            >
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
                <label className="text-sm font-medium text-primary">Phone Number (Primary)</label>
                <input required type="tel" placeholder="+1234567890" value={newCustomer.phoneNumber} onChange={e => setNewCustomer({...newCustomer, phoneNumber: e.target.value})} className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Email (Optional)</label>
                <input type="email" placeholder="customer@example.com" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search customers by name, email..." 
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-lg hover:bg-black/5 transition-colors text-sm font-medium text-primary">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Name</th>
                <th className="px-6 py-4 font-medium text-primary">Phone</th>
                <th className="px-6 py-4 font-medium text-primary">Email</th>
                <th className="px-6 py-4 font-medium text-primary">Group</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary">
                    <Users className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>No customers found.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-6 py-4 text-secondary">{c.phone_number || '-'}</td>
                    <td className="px-6 py-4 text-secondary">{c.email || '-'}</td>
                    <td className="px-6 py-4 text-secondary">{c.customer_groups?.group_name || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-secondary hover:bg-black/5 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
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

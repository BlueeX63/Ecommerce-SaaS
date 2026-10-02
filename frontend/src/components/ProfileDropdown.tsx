import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { LayoutTemplate, Settings, CreditCard, LogOut, ChevronRight, Home } from "lucide-react";

export function ProfileDropdown({ isOpen, setIsOpen, user, logout, isMobile = false }: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  user: any;
  logout: () => void;
  isMobile?: boolean;
}) {
  const containerVars: Variants = {
    initial: { opacity: 0, y: 15, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      scale: 0.95, 
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const itemVars: Variants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={containerVars}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`absolute top-14 ${isMobile ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} w-72 bg-white border border-gray-200 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden p-2.5`}
        >
          {/* User Info */}
          <motion.div variants={itemVars} className="px-4 py-4 mb-2 relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#FF4D00] mb-0.5">
              Account
            </span>
            <p className="text-lg font-bold text-gray-900 truncate">
              {user ? `${user.first_name || ''} ${user.last_name && user.last_name !== '-' ? user.last_name : ''}`.trim() || 'Guest' : 'Guest'}
            </p>
            <p className="text-xs font-medium text-gray-500 truncate">{user?.email}</p>
          </motion.div>

          {/* Links */}
          <div className="flex flex-col gap-1 relative z-10">

            <motion.div variants={itemVars}>
              <DropdownItem href="/dashboard" icon={LayoutTemplate} label="Dashboard" onClick={() => setIsOpen(false)} />
            </motion.div>
            <motion.div variants={itemVars}>
              <DropdownItem href="/dashboard/settings" icon={Settings} label="Settings" onClick={() => setIsOpen(false)} />
            </motion.div>
            <motion.div variants={itemVars}>
              <DropdownItem href="/dashboard/billing" icon={CreditCard} label="Billing" onClick={() => setIsOpen(false)} />
            </motion.div>
          </div>

          <motion.div variants={itemVars} className="h-px bg-gray-100 my-2 mx-2 relative z-10"></motion.div>
          
          <motion.div variants={itemVars} className="relative z-10">
            <button
              onClick={() => {
                if (logout) logout();
                setIsOpen(false);
              }}
              className="group relative w-full px-4 py-3 rounded-[16px] flex items-center justify-between overflow-hidden border border-transparent transition-colors duration-300"
            >
              {/* Background sweep */}
              <div className="absolute inset-0 bg-red-50 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] z-0" />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-red-200 group-hover:bg-white transition-all duration-500 ease-[0.16,1,0.3,1] group-hover:rotate-[360deg] group-hover:shadow-sm">
                  <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors">
                  Logout
                </span>
              </div>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DropdownItem({ href, icon: Icon, label, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative w-full px-4 py-3 rounded-[16px] flex items-center justify-between overflow-hidden border border-transparent transition-colors duration-300"
    >
      {/* Background sweep */}
      <div className="absolute inset-0 bg-gray-50 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] z-0" />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 group-hover:bg-white transition-all duration-500 ease-[0.16,1,0.3,1] group-hover:rotate-[360deg] group-hover:shadow-sm">
          <Icon className="w-4 h-4 text-gray-500 group-hover:text-[#FF4D00] transition-colors" />
        </div>
        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
      </div>
      
      <div className="relative z-10 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-[0.16,1,0.3,1]">
        <ChevronRight className="w-4 h-4 text-[#FF4D00]" />
      </div>
    </Link>
  );
}

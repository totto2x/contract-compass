import React, { useState } from 'react';
import { Bell, User, Search, Command, LogOut, ChevronDown } from 'lucide-react';
import { AuthService, type AuthUser } from '../lib/auth';
import toast from 'react-hot-toast';

interface HeaderProps {
  onQuickSearch?: (query: string) => void;
  user?: AuthUser;
}

const Header: React.FC<HeaderProps> = ({ onQuickSearch, user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Mock search results - in real app, this would come from API
  const searchResults = [
    { id: '1', name: 'TechCorp Enterprise Agreement', type: 'project' },
    { id: '2', name: 'StartupXYZ Development Contract', type: 'project' },
    { id: '3', name: 'MegaCorp Migration Services', type: 'project' },
  ].filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  const handleSearchSelect = (item: any) => {
    onQuickSearch?.(item.name);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-clicking
    
    setIsLoggingOut(true);
    try {
      await AuthService.signOut();
      toast.success('Logged out successfully');
      setShowUserMenu(false);
      
      // Force page reload to clear any cached state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to log out: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('[data-user-menu]')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <img src="/cropped legal logo.png" alt="Logo" className="w-10 h-10 rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 legal-heading">Contract Compass</h1>
              <p className="text-sm text-gray-600 font-medium">Professional Contract Management</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Quick Search */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contracts and projects..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-80 text-sm font-medium placeholder-gray-500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <Command className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">K</span>
              </div>
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-legal-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Contract Projects
                    </div>
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSearchSelect(item)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-150"
                      >
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="text-sm text-gray-900 font-medium">{item.name}</span>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length > 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500 text-center">
                    No projects found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative" data-user-menu>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoggingOut}
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="User avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-600">Contract Manager</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
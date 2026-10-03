import React from 'react';
import {
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onNavigateHome?: () => void;
  isWorkspace?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-[72px] bg-white border-b border-[#dce6df] flex items-center">
      <div className="w-full px-6 lg:px-8 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-[#e3f0e7] flex items-center justify-center">
            <span className="text-[#176344] text-lg">◉</span>
          </div>

          <div className="text-left">
            <div className="text-lg font-bold text-[#0B3325]">
              SAR Analysis
            </div>

            <div className="text-[11px] text-[#769087]">
              Earth Observation
            </div>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-5 text-sm">
          <span className="text-[#547268]">
            Earth Observation
          </span>

          <span className="text-[#b2c1b8]">•</span>

          <span className="text-[#173D2D] font-medium">
            SAR → Optical
          </span>

          <span className="text-[#b2c1b8]">•</span>

          <span className="text-[#173D2D]">
            Terrain Analysis
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-[#173D2D]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#258052]" />
              System Online
            </div>

            <div className="h-7 w-px bg-[#dce6df]" />

            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#29493C]" />

              <span className="hidden lg:block text-sm text-[#173D2D] max-w-[220px] truncate">
                {user.email}
              </span>

              <ChevronDown className="w-4 h-4 text-[#6e857b]" />
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="text-[#668078] hover:text-[#b04438]"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
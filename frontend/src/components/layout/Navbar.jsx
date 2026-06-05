import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../Button";
import { LayoutDashboard, Target, User, Trophy, LogOut } from "lucide-react";

const Navbar = ({ isAuthenticated, username, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(username || "user")}&backgroundColor=c7d2fe,ddd6fe,cffafe`;

  const links = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/simulator", label: "Simulator", icon: Target },
    { path: "/profile", label: "Profile", icon: User },
    { path: "/achievements", label: "Achievements", icon: Trophy },
  ];

  return (
    <nav className="bg-white/70 backdrop-blur-xl border-b border-violet-100 sticky top-0 z-50 shadow-sm shadow-violet-500/5">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/Logo.png"
              alt="CareerPath AI Simulator"
              className="h-18 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      isActive(link.path)
                        ? "bg-violet-100 text-indigo-700"
                        : "text-slate-600 hover:bg-violet-50/70 hover:text-indigo-700"
                    }`}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                ))}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-violet-200">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2 py-1 bg-violet-50/70 hover:bg-violet-100 rounded-lg border border-violet-100 hover:border-violet-200 transition-colors"
                  >
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="w-7 h-7 rounded-full bg-white border border-violet-200"
                    />
                    <span className="text-sm font-semibold text-slate-700 pr-1">
                      {username}
                    </span>
                  </Link>
                  <Button variant="outlined" size="small" onClick={onLogout}>
                    <LogOut size={14} className="mr-1" /> Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="small">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="small">Get Started →</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:bg-violet-50 rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden py-4 border-t border-violet-100 animate-fade-in bg-white/80 backdrop-blur-xl px-4">
          {isAuthenticated ? (
            <div className="space-y-2">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg font-medium transition-all mb-4 ${
                    isActive(link.path)
                      ? "bg-violet-100 text-indigo-700"
                      : "text-slate-600 hover:bg-violet-50"
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-violet-100">
                <div className="flex items-center gap-2 mb-3 px-4">
                  <img
                    src={avatarUrl}
                    alt={username}
                    className="w-8 h-8 rounded-full bg-violet-50 border border-violet-200"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Hi, {username}
                  </span>
                </div>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 flex flex-col">
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outlined" fullWidth>
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <Button fullWidth>Get Started →</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
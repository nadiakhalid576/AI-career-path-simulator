// FOOTER COMPONENT - Simple & Professional
// ============================================
import { Link } from "react-router-dom";
import { Target, Mail, Briefcase, Twitter, ChevronRight, MapPin, Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-violet-200" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Section */}
          <div>
            <div className="flex items-center mb-4">
              <img
                src="/Logo.png"
                alt="CareerPath AI Simulator"
                className="h-18 w-auto bg-white/95 rounded-lg p-1 transition-transform hover:scale-105"
              />
            </div>
            <p className="text-sm leading-relaxed text-violet-200/80">
              AI-powered career planning platform that helps students explore, simulate, and plan their professional journey with confidence.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-violet-500 rounded-lg transition-colors">
                <Mail size={15} />
              </a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-violet-500 rounded-lg transition-colors">
                <Briefcase size={15} />
              </a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-violet-500 rounded-lg transition-colors">
                <Twitter size={15} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight size={14} /> Home
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight size={14} /> Get Started
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight size={14} /> Login
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight size={14} /> Features
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Get in Touch</h4>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Mail size={14} />
                support@careerpathai.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={14} />
                Software Engineering Department
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-violet-700/50 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="flex items-center gap-1.5 text-violet-300/80">© {currentYear} CareerPath AI. Made with <Heart size={14} className="text-pink-400 fill-pink-400" /> for students.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
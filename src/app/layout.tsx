import { AuthProvider } from './context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'KAANOONGPT - AI Legal Companion',
  description: 'Your AI Legal Companion for Nepali Laws',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
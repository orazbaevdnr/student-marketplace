import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { strings } from '../i18n/strings';
import { Button } from '../components/ui/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-lg font-semibold text-slate-800 mt-2">
          {strings.notFound.title}
        </h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          {strings.notFound.desc}
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          fullWidth
        >
          {strings.notFound.backHomeBtn}
        </Button>
      </div>
    </div>
  );
};

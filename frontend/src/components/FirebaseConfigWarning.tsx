import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FirebaseConfigWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const FirebaseConfigWarning: React.FC<FirebaseConfigWarningProps> = ({ isVisible, onDismiss }) => {
  const { t } = useTranslation();
  
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              {t('firebase.configNeeded')}
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              {t('firebase.configNeededDesc')}
            </p>
            <div className="text-xs text-yellow-600 mb-3">
              <p className="mb-1">{t('firebase.setupSteps')}：</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>{t('firebase.step1')}</li>
                <li>{t('firebase.step2')}</li>
                <li>{t('firebase.step3')}</li>
              </ol>
            </div>
            <div className="flex items-center justify-between">
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-yellow-700 hover:text-yellow-800 underline"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Firebase Console
              </a>
              <button
                onClick={onDismiss}
                className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
              >
                {t('firebase.dismiss')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseConfigWarning;
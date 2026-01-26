import { RouterProvider } from 'react-router-dom';
import routes from './routes';
import { ConfigProvider } from './components/theme/ConfigProvider.tsx';
import {DEFAULT_ORGANIZATION} from "./config/firebase.ts";
import './utils/i18n';
import {SearchProvider} from "./context/SearchContext.tsx";
import {AuthProvider} from "./context/AuthContext.tsx";
import { I18nProvider } from './context/I18nContext.tsx';
import { NotificationProvider } from './context/notificationContext.tsx';
import LibrarianAlertListener from './components/LibrarianAlertListener.tsx';
import MaintenanceGate from './components/common/MaintenanceGate.tsx';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <I18nProvider>
          <ConfigProvider orgName={DEFAULT_ORGANIZATION}>
            <MaintenanceGate>
              <SearchProvider>
                <LibrarianAlertListener />
                <RouterProvider router={routes} />
              </SearchProvider>
            </MaintenanceGate>
          </ConfigProvider>
        </I18nProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;

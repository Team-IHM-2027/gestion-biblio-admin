import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import useI18n from '../hooks/useI18n';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import BookList from '../components/dashboard/BookList';
import HelpBanner from '../components/dashboard/HelpBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Overview: React.FC = () => {
  const { t } = useI18n();
  const { stats, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text={t('components:dashboard.loading')} />
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const booksChartData = Object.entries(stats.booksByCathegorie).map(([cathegorie, count]) => ({
    cathegorie,
    books: count
  }));

  const thesesChartData = Object.entries(stats.thesesByDepartment).map(([department, count]) => ({
    department,
    theses: count
  }));

  const empruntsPieData = Object.entries(stats.empruntsByDepartment).map(([department, count]) => ({
    department,
    borrows: count
  }));

  // Couleurs pour le graphique en secteurs
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Help Banner */}
        <HelpBanner />

        {/* Statistics Grid - Tâche 1 : Modification des libellés et réorganisation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          
          {/* Groupe 1 : Statistiques des Livres */}
          <StatCard
            icon="Book"
            title="Titres de Livres Uniques" // Modifié
            value={stats.totalBooks}
            description={t('components:dashboard.desc_unique_titles')}
            color="blue"
          />
          <StatCard
            icon="BookCopy"
            title="Total d'Exemplaires" // Modifié
            value={stats.totalBookExemplaires}
            description={t('components:dashboard.desc_total_inventory')}
            color="green"
          />
          <StatCard
            icon="BookOpen"
            title="Exemplaires Disponibles" // Modifié
            value={stats.availableExemplaires}
            percentage={(stats.availableExemplaires / stats.totalBookExemplaires) * 100}
            description={t('components:dashboard.desc_available')}
            color="yellow"
          />
          <StatCard
            icon="BookMarked"
            title="Exemplaires Présents" // Modifié
            value={stats.physicallyPresentBooks}
            percentage={(stats.physicallyPresentBooks / stats.totalBookExemplaires) * 100}
            description={t('components:dashboard.desc_physically_present')}
            color="purple"
          />

          {/* Groupe 2 : Statistiques des Utilisateurs & Thèses */}
          <StatCard
            icon="Users"
            title="Total Étudiants" // Modifié
            value={stats.totalStudents}
            color="blue"
          />
          <StatCard
            icon="UserX"
            title="Étudiants Suspendus" // Modifié
            value={stats.suspendedStudents}
            percentage={(stats.suspendedStudents / stats.totalStudents) * 100}
            color="red"
          />
          <StatCard
            icon="GraduationCap"
            title="Mémoires/Thèses Total" // Modifié
            value={stats.totalTheses}
            color="orange"
          />
          <StatCard
            icon="UserCheck"
            title="Étudiants Ayant Emprunté" // Modifié
            value={stats.totalEmprunts}
            percentage={(stats.totalEmprunts / stats.totalStudents) * 100}
            description={t('components:dashboard.desc_people_borrowed')}
            color="green"
          />

          {/* Groupe 3 : Statistiques d'Activité (Emprunts/Réservations) */}
          <StatCard
            icon="CreditCard"
            title="Documents Empruntés Actuellement" // Modifié
            value={stats.borrowedDocuments}
            percentage={(stats.borrowedDocuments / stats.totalBookExemplaires) * 100}
            description={t('components:dashboard.desc_borrowed')}
            color="primary"
          />
          <StatCard
            icon="BarChart3"
            title="Total Réservations" // Modifié
            value={stats.totalReservations}
            color="purple"
          />
          <StatCard
            icon="Clock"
            title="Réservations en Attente" // Modifié
            value={stats.reservedNotPickedUp}
            percentage={(stats.reservedNotPickedUp / stats.totalBookExemplaires) * 100}
            description={t('components:dashboard.desc_reserved')}
            color="yellow"
          />
          <StatCard
            icon="TrendingUp"
            title="Ratio Réservation / Emprunt" // Modifié
            value={`${stats.reservationToBorrowRatio.toFixed(1)}%`}
            description={t('components:dashboard.desc_reservation_ratio')}
            color="orange"
          />
        </div>
        {/* Fin des modifications de la Tâche 1 */}

        {/* Additional Stats Grid - Listes de livres (Aucun changement ici) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <BookList
            title={t('components:dashboard.top_borrowed')}
            books={stats.topBorrowedBooks.map(book => ({
              name: book.name,
              count: book.count
            }))}
            icon="TrendingUp"
            emptyMessage={t('components:dashboard.no_data_available')}
          />

          <BookList
            title={t('components:dashboard.low_stock')}
            books={stats.lowStockBooks.map(book => ({
              name: book.name,
              info: `${book.available}/${book.total} (${book.percentage})`
            }))}
            icon="AlertTriangle"
            emptyMessage={t('components:dashboard.no_data_available')}
          />

          <BookList
            title={t('components:dashboard.recently_returned')}
            books={stats.recentlyReturnedBooks.map(book => ({
              name: book.titre,
              info: `${book.etudiant} - ${book.date}`
            }))}
            icon="RotateCcw"
            emptyMessage={t('components:dashboard.no_data_available')}
          />
        </div>

        {/* Current Week Borrows Chart (Aucun changement ici) */}
        <div className="mb-8">
          <ChartCard title={t('components:dashboard.current_week')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.currentWeekBorrows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="borrows" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Container (Aucun changement ici) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Emprunts par département - Pie Chart */}
          <ChartCard title={t('components:dashboard.borrows_by_department')}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={empruntsPieData}
                  dataKey="borrows"
                  nameKey="department"
                  fill="#8884d8"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {empruntsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}-${entry}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Livres par catégorie - Bar Chart */}
          <ChartCard title={t('components:dashboard.books_by_category')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={booksChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cathegorie" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="books" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Mémoires par département - Bar Chart */}
          <ChartCard title={t('components:dashboard.theses_by_department')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={thesesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="theses" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Monthly Borrows Line Chart (Aucun changement ici) */}
        <ChartCard title={t('components:dashboard.monthly_borrows')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyBorrows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="borrows" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Overview;
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import History from './pages/History';
import Stats from './pages/Stats';
import AddExpense from './pages/AddExpense';
import Budget from './pages/Budget';
import Recurring from './pages/Recurring';
import TabBar from './components/TabBar';

export default function App() {
  const location = useLocation();
  const isModal = location.pathname === '/add-expense';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/recurring" element={<Recurring />} />
        <Route path="/add-expense" element={<AddExpense />} />
      </Routes>
      {!isModal && <TabBar />}
      {isModal && <AddExpense />}
    </div>
  );
}

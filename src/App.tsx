import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAuth } from '@/auth/RequireAuth';
import { Loading } from '@/components/States';
import { ScrollToTop } from '@/components/ScrollToTop';

const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Home = lazy(() => import('@/pages/Home'));
const NewCollar = lazy(() => import('@/pages/NewCollar'));
const NewPet = lazy(() => import('@/pages/NewPet'));
const PetDetail = lazy(() => import('@/pages/PetDetail'));
const EditPet = lazy(() => import('@/pages/EditPet'));
const EditCollar = lazy(() => import('@/pages/EditCollar'));
const EditSafeArea = lazy(() => import('@/pages/EditSafeArea'));

const guest = (el: React.ReactNode) => <GuestOnly>{el}</GuestOnly>;
const authed = (el: React.ReactNode) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <div className="app-frame">
      <ScrollToTop />
      <Suspense fallback={<div className="screen"><Loading /></div>}>
        <Routes>
          <Route path="/login" element={guest(<Login />)} />
          <Route path="/cadastro" element={guest(<Register />)} />

          <Route path="/" element={authed(<Home />)} />
          <Route path="/coleiras/nova" element={authed(<NewCollar />)} />
          <Route path="/animais/novo" element={authed(<NewPet />)} />
          <Route path="/animais/:petId" element={authed(<PetDetail />)} />
          <Route path="/animais/:petId/editar" element={authed(<EditPet />)} />
          <Route path="/animais/:petId/coleira" element={authed(<EditCollar />)} />
          <Route path="/animais/:petId/trocar-coleira" element={authed(<NewCollar />)} />
          <Route path="/animais/:petId/area" element={authed(<EditSafeArea />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

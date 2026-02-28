// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth} from "./context/AuthContext";
import { TopBar } from "./components/topBar/TopBar";
import Login from './pages/login/Login.tsx';
import RecipeList from "./pages/recipesList/RecipesList";
import RecipeDetails from "./pages/recipeDetails/RecipeDetails";
import AddEditRecipe from './pages/addEditRecipe/AddEditRecipe';
import Moderator from './pages/moderator/Moderator';
import { Toaster} from "react-hot-toast";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminUsers from "./pages/admin/users/AdminUsers.tsx";
import {AdminIngredients} from "./pages/admin/ingredients/AdminIngredients.tsx";
import {AdminStatistics} from "./pages/admin/statistics/AdminStatistics.tsx";
import AdminAudit from "./pages/admin/audit/AdminAudit.tsx";
import AdminCategories from "./pages/admin/category/AdminCategories.tsx";
import Register from "./pages/register/Register.tsx";
import AdminFeedback from "./pages/admin/feedback/AdminFeedback.tsx";

// Создаем обертку для контента, чтобы внутри был доступ к useAuth
const AppContent =() => {
    const { isAuthenticated } = useAuth();  //
    const { user } = useAuth();

    return (
        <>
            <TopBar />
            <Toaster position='top-right' reverseOrder={false}/>
            <Routes>
                {/* Главная страница */}
                <Route path="/" element={<RecipeList />} />
                {/* Страница логина — заменяем <div> на компонент <Login /> */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" /> :<Login />} />
                <Route path="/register" element={isAuthenticated ? <Navigate to='/' /> : <Register /> } />
                <Route
                    path="/favorites"
                    element={isAuthenticated ? <RecipeList /> : <Navigate to="/login" /> }
                />
                <Route path="/recipe/:id" element={<RecipeDetails />} />
                <Route path="/my-recipes" element={isAuthenticated ? <RecipeList /> : <Navigate to="/login" />} />
                <Route path='/recipe/new' element={isAuthenticated ? <AddEditRecipe /> : <Navigate to="/login" />} />
                <Route path='/recipe/edit/:id' element={isAuthenticated ? <AddEditRecipe /> : <Navigate to="/login" />} />

                <Route path={'/moderator'} element={
                    (isAuthenticated && (user?.roles.includes('MODERATOR') || user?.roles.includes('ADMIN'))
                    ? <Moderator /> : <Navigate to='/login' />
                    ) }
                       />


                {/* АДМИН ПАНЕЛЬ (Защищенная) */}
                {user?.roles.includes('ADMIN') && (
                    <Route path="/admin" element={<AdminLayout /> }>
                        {/* По умолчанию перенаправляем на пользователей */}
                        <Route index element={<Navigate to="users" replace /> } />

                        <Route path="users" element={<AdminUsers />} />
                        <Route path="ingredients" element={<AdminIngredients />} />
                        <Route path="statistics" element={<AdminStatistics />} />
                        <Route path="audit" element={<AdminAudit />} />
                        <Route path="categories" element={<AdminCategories />} />

                        <Route path="feedback" element={<AdminFeedback />} />
                    </Route>
                    )}

            </Routes>
        </>
    )
};


function App() {
  //   нужно обернуть всё в AuthProvider и добавить TopBar над всеми маршрутами.
  return (
      <AuthProvider>
          <BrowserRouter>
              <AppContent />
          </BrowserRouter>
      </AuthProvider>

  )
}

export default App;

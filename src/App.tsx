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
import FeedbackPage from "./pages/feedbackUser/FeedbackPage.tsx";
import HomePage from "./pages/home/HomePage.tsx";
import UserProfile from "./pages/profile/UserProfile.tsx";
import AdminRecipes from "./pages/admin/recipes/AdminRecipes.tsx";
import {VerifyEmail} from "./components/verifyEmail/VerifyEmail.tsx";
import { ForgotPassword} from "./components/forgotPassword/ForgotPassword.tsx";
import { ResetPassword} from "./components/resetPassword/ResetPassword.tsx";
// 1. ИМПОРТИРУЕМ КОМПОНЕНТ ПОДСКАЗКИ
// (Убедитесь, что путь до папки components указан верно для вашего проекта)
import PwaInstallPrompt from "./components/pwaInstallPromt/PwaInstallPrompt.tsx";
import AdminConversions from "./pages/admin/conversions/AdminConversions.tsx";

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
                <Route path="/" element={<HomePage />} />
                {/* Страница логина — заменяем <div> на компонент <Login /> */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" /> :<Login />} />
                <Route path="/register" element={isAuthenticated ? <Navigate to='/' /> : <Register /> } />
                <Route path="/verify-email" element={<VerifyEmail /> } />
                <Route path="/forgot-password" element={<ForgotPassword /> } />
                <Route path="/reset-password" element={<ResetPassword /> } />
                <Route path="/recipes" element={<RecipeList />} />
                <Route
                    path="/favorites"
                    element={isAuthenticated ? <RecipeList /> : <Navigate to="/login" /> }
                />
                <Route path="/recipe/:id" element={<RecipeDetails />} />
                <Route path="/my-recipes" element={isAuthenticated ? <RecipeList /> : <Navigate to="/login" />} />
                <Route path='/recipe/new' element={isAuthenticated ? <AddEditRecipe /> : <Navigate to="/login" />} />
                <Route path='/recipe/edit/:id' element={isAuthenticated ? <AddEditRecipe /> : <Navigate to="/login" />} />
                <Route path='/contact' element={<FeedbackPage />} />

                <Route path="/profile" element={isAuthenticated ?
                    // <ProtectedRoute>
                        <UserProfile />
                    // </ProtectedRoute>
                    :
                    <Navigate to='/login' />
                    }/>

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
                        <Route path="recipes" element={<AdminRecipes />} />
                        <Route path="recipes/edit/:id" element={<AddEditRecipe />} />
                        <Route path="conversions" element={<AdminConversions />} />
                    </Route>
                    )}

            </Routes>

            {/* 2. ВСТАВЛЯЕМ ПОДСКАЗКУ ЗДЕСЬ!
        Мы ставим её вне <Routes>, чтобы она не зависела от текущей страницы.
        Она не сломает верстку, так как мы задали ей стиль position: 'fixed',
        то есть она будет "парить" поверх всех остальных элементов сайта.
      */}
            <PwaInstallPrompt />
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

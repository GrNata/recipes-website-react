// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

import {BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import {AuthProvider, useAuth} from "./context/AuthContext";
import { TopBar } from "./components/topBar/TopBar";
import Login from './pages/login/Login.tsx';
import RecipeList from "./pages/recipesList/RecipesList";

// Создаем обертку для контента, чтобы внутри был доступ к useAuth
const AppContent =() => {
    const { isAuthenticated } = useAuth();  //

    return (
        <>
            <TopBar />
            <Routes>
                {/* Главная страница */}
                <Route path="/" element={<RecipeList />} />
                {/* Страница логина — заменяем <div> на компонент <Login /> */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" /> :<Login />} />
                <Route
                    path="/favorites"
                    element={isAuthenticated ? <RecipeList /> : <Navigate to="/login" /> }
                />

                {/*<Route path="/recipe/:id" element={<div>Детали рецепта</div>} />*/}
                {/*<Route path="/admin" element={<div>Панель администратора</div>} />*/}
            </Routes>
        </>
    )
}


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

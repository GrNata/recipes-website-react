import {useNavigate, Link, useLocation} from "react-router-dom";
import {useAuth} from "../../context/AuthContext";
import { Search } from "lucide-react";
import styles from './TopBar.module.css';
import React, {useEffect, useState} from "react";
// import {createNodeImportMeta} from "vite/module-runner";

export const TopBar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();
    const location = useLocation();     // Чтобы знать, на какой мы странице

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // МАГИЯ DEBOUNCE (Живой поиск)
    useEffect(() => {
        // Разрешаем поиск и на главной (/), и в Избранном (/favorites)
        if (location.pathname !== '/'
            && location.pathname !== '/favorites'
            && location.pathname !== '/my-recipes'
        ) return;

        // Запускаем таймер
        const timer = setTimeout(() => {
            const trimmerTerm = searchTerm.trim().toLowerCase();

            // Если что-то введено, обновляем URL
            if (trimmerTerm) {
                // Использован replace: true, чтобы не засорять историю браузера каждой буквой
                // ИСПОЛЬЗУЕМ location.pathname вместо жесткого '/'
                navigate(`${location.pathname}?search=${encodeURIComponent(trimmerTerm)}`, { replace: true });
            } else {
                // Если поле пустое и мы уже что-то искали — сбрасываем поиск
                if (location.search.includes('search=')) {
                    // Очищаем поиск, оставаясь на текущей странице
                    navigate(location.pathname, { replace: true });
                }
            }
        }, 500);    // 500 миллисекунд задержки
        // Функция очистки: если searchTerm изменился ДО того как прошли 500мс,
        // старый таймер удаляется и запускается новый (в начале useEffect)
        return () => clearTimeout(timer);
    // }, [searchTerm]);
    }, [searchTerm, navigate, location.pathname, location.search]);

// Ручной поиск по нажатию Enter (для верности оставляем)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmerTerm = searchTerm.trim().toLowerCase();
        if (trimmerTerm) {
            console.log('передаем поисковый запрос через URL - ', searchTerm)
            // Переходим на главную и передаем поисковый запрос через URL
            navigate(`${location.pathname}?search=${encodeURIComponent(trimmerTerm)}`);
        } else {
            navigate(location.pathname)
        }
    };

    // НОВАЯ ПЕРЕМЕННАЯ: Показывать поиск только на Главной и в Избранном
    const showSearchBar = location.pathname === '/'
        || location.pathname === '/favorites'
        || location.pathname === '/my-recipes'
    ;


    return (
        <nav className={styles.nav} >
            <div className={styles.logo} onClick={() => navigate('/')}>
                👨‍🍳 Главная - рецепты
            </div>

            <div className={styles.links}>
                {/* <Link to="/" style={{color: '#123C69'}}>🏠 Главная</Link> */}

                {/* Функционал для всех залогиненных */}
                {isAuthenticated &&
                    <Link to="/favorites" style={{marginLeft: '10px', color: '#123C69' }}>
                        ⭐ Избранное
                    </Link>}

                {/* Мои рецепты */}
                {isAuthenticated &&
                    <Link to="/my-recipes" style={{ marginLeft: '15px', color: '#AC3B61', fontWeight: 'bold'}}>
                        📝 Мои рецепты
                    </Link>
                }

                {/* Функционал только для Админа */}
                {user?.roles.includes('ADMIN') && (
                    <Link to="/admin" style={{ marginLeft: '10px', color: '#701332'}}>🛡️ Админка</Link>
                )}
            </div>

            {/* Строка поиска */}
            {showSearchBar && (
                <form className={styles.searchContainer} onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Найти рецепт по названию ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton}>
                        <Search size={20} />
                    </button>
                </form>
            )}

            <div className={styles.userSection}>
                {isAuthenticated ? (
                    <>
                        <span>{user?.email} </span>
                        <button className={styles.logoutBtn} onClick={ handleLogout }>Выйти</button>
                    </>
                ) : (
                    <button onClick={ () => navigate('/login')}>Войти</button>
                )}
            </div>
        </nav>
    );
};
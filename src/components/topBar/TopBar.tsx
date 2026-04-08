import {useNavigate, Link, useLocation} from "react-router-dom";
import {useAuth} from "../../context/AuthContext";
import { Search, Menu, X, Sun, Moon } from "lucide-react";
import styles from './TopBar.module.css';
import React, {useEffect, useState, useRef } from "react";

export const TopBar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);    // Для выпадающего меню профиля

    // 🔥 СТЕЙТ ТЕМНОЙ ТЕМЫ
    const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'light');

    // Для мобильного бургер-меню
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();     // Чтобы знать, на какой мы странице

    // Создаем ссылку на блок меню, чтобы знать, где оно находится
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        // navigate('/login');
        navigate('/');
        setIsMobileMenuOpen(false);     // Закрываем мобильное меню при выходе
    };

    // Закрытие мобильного меню при переходе по ссылке
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // Применяем тему к HTML-тегу при загрузке или смене
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }


    // МАГИЯ DEBOUNCE (Живой поиск)
    useEffect(() => {
        console.log('USER: email = ', user?.email, " username = ", user?.username)

        // Разрешаем поиск и на главной (/), и в Избранном (/favorites), , в Моих рецептах и во ВСЕХ РЕЦЕПТАХ
        if (location.pathname !== '/'
            && location.pathname !== '/favorites'
            && location.pathname !== '/my-recipes'
            && location.pathname !== '/recipes'
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

    // Закрытие меню при клике вне его области (Снаружи)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Если клик был НЕ по нашему меню (menuRef), то закрываем его
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        // Вешаем слушатель только если меню открыто
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, [isMenuOpen]);

// Ручной поиск по нажатию Enter (для верности оставляем)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmerTerm = searchTerm.trim().toLowerCase();
        if (trimmerTerm) {
            console.log('передаем поисковый запрос через URL - ', searchTerm)
            // Переходим на главную и передаем поисковый запрос через URL
            navigate(`${location.pathname}?search=${encodeURIComponent(trimmerTerm)}`);

            closeMobileMenu();      // Закрываем меню после поиска
        } else {
            navigate(location.pathname)
        }
    };

    // НОВАЯ ПЕРЕМЕННАЯ: Показывать поиск только на Главной и в Избранном
    const showSearchBar = location.pathname === '/'
        || location.pathname === '/favorites'
        || location.pathname === '/my-recipes'
        || location.pathname === '/recipes'
    ;


    return (
        <div className={styles.topBar} >
            {/* ЛЕВАЯ ЧАСТЬ */}
            <div className={styles.left} onClick={() => { navigate('/'); closeMobileMenu(); }}>
                🏠   Главная
            </div>

            {/* НОВАЯ КНОПКА БУРГЕРА (Видна только на мобилках) */}
            <button
                className={styles.burgerBtn}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} /> }
            </button>

            {/* ОБЕРТКА ДЛЯ МЕНЮ: На десктопе - в ряд, на мобилке - выпадает вниз */}
            <div className={`${styles.menuWrapper} ${isMobileMenuOpen ? styles.menuOpen : ''}`}>

                <div className={styles.center}>
                    {/* <Link to="/" style={{color: '#123C69'}}>🏠 Главная</Link> */}

                    {/* ЦЕНТР (Только для залогиненных) */}
                    {isAuthenticated &&
                        <>
                            <Link to="/recipes" className={styles.favoriteBtn} onClick={closeMobileMenu}>
                                👨‍🍳 Все рецепты
                            </Link>

                            <Link to="/favorites" className={styles.favoriteBtn}  onClick={closeMobileMenu}>
                                ❤️ Избранное
                            </Link>

                            <Link to="/my-recipes" className={styles.myRecipesBtn}  onClick={closeMobileMenu}>
                                📝 Мои рецепты
                            </Link>

                        </>
                    }
                            {/* Строка поиска */}
                            {showSearchBar &&  (
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
                    {/*    </>*/}
                    {/*}*/}
                </div>

                {/* ПРАВАЯ ЧАСТЬ */}
                <div className={styles.right}>

                    {/* 🔥 КНОПКА СМЕНЫ ТЕМЫ */}
                    <button
                        onClick={toggleTheme}
                        className={styles.themeToggleBtn}
                        title={theme === 'light' ? 'Включить темную тему' : 'Включить светлую тему'}
                    >
                        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} color="#FFD700" /> }
                    </button>

                    {!isAuthenticated ? (
                        // Для гостей
                        <div className={styles.authButtonsMobile}>
                            <button onClick={ () => { navigate('/login'); closeMobileMenu(); }}>Войти</button>
                            <button className={styles.logoutBtn} onClick={() => {
                                navigate('/register');
                                closeMobileMenu();
                            }}>
                                Регистрация
                            </button>
                            {/*<button className={styles.logoutBtn} onClick={ openGegister }>Регистрация</button>*/}
                        </div>
                        ) : (
                        // Для авторизованных
                        // ВАЖНО: Привязываем ref к обертке меню
                        <div className={styles.userMenuWrapper} ref={menuRef}>
                            {/* Кнопка переключает стейт isMenuOpen */}
                            <button className={styles.usernameBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                👤  {user?.username} ▼
                            </button>

                            {/* Выпадающее меню */}
                            {/* Выпадающее меню показывается только если isMenuOpen === true */}
                            {isMenuOpen && (
                            <div className={styles.dropdown}>
                                {/* ССЫЛКА НА ЛИЧНЫЙ КАБИНЕТ */}
                                <Link
                                    to='/profile'
                                    className={styles.btnModerator}
                                    onClick={() => { setIsMenuOpen(false); closeMobileMenu(); }}>
                                    ⚙️ Личный кабинет
                                </Link>

                                 {user?.roles.includes('ADMIN') && (
                                     <Link
                                         to="/admin"
                                         className={styles.btnAdmin}
                                         onClick={() => {setIsMenuOpen(false); closeMobileMenu(); }}
                                     >
                                         🛡️ Админ-панель
                                     </Link>
                                 )}
                                {/* Модератором может быть и админ, и обычный модератор */}
                                {(user?.roles.includes('MODERATOR') || user?.roles.includes('ADMIN')) && (
                                    <Link
                                        to='/moderator'
                                        className={styles.btnModerator}
                                        onClick={() => { setIsMenuOpen(false); closeMobileMenu(); }}
                                    >
                                        ⚖️ Модерация
                                    </Link>
                                )}

                                <Link
                                    to='/contact'
                                    className={styles.btnModerator}
                                    onClick={() => { setIsMenuOpen(false); closeMobileMenu(); }}
                                >
                                    📁 Отправить сообщение
                                </Link>

                                <button
                                    className={styles.logoutBtn}
                                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                                >
                                    🚪 Выйти
                                </button>
                            </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
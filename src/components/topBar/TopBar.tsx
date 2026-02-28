import {useNavigate, Link, useLocation} from "react-router-dom";
import {useAuth} from "../../context/AuthContext";
import { Search } from "lucide-react";
import styles from './TopBar.module.css';
import React, {useEffect, useState} from "react";

export const TopBar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();     // Чтобы знать, на какой мы странице

    const handleLogout = () => {
        logout();
        // navigate('/login');
        navigate('/');
    };


    // МАГИЯ DEBOUNCE (Живой поиск)
    useEffect(() => {
        console.log('USER: email = ', user?.email, " username = ", user?.username)

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
        <div className={styles.topBar} >
            {/* ЛЕВАЯ ЧАСТЬ */}
            <div className={styles.left} onClick={() => navigate('/')}>
                👨‍🍳 Главная - рецепты
            </div>

            <div className={styles.center}>
                {/* <Link to="/" style={{color: '#123C69'}}>🏠 Главная</Link> */}

                {/* ЦЕНТР (Только для залогиненных) */}
                {isAuthenticated &&
                    <>
                        <Link to="/favorites" className={styles.favoriteBtn}>
                            ❤️ Избранное
                        </Link>

                        <Link to="/my-recipes" className={styles.myRecipesBtn}>
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
                    {!isAuthenticated ? (
                        // Для гостей
                        <>
                            <button onClick={ () => navigate('/login')}>Войти</button>
                            <button className={styles.logoutBtn} onClick={() => navigate('/register')}>Регистрация</button>
                            {/*<button className={styles.logoutBtn} onClick={ openGegister }>Регистрация</button>*/}
                        </>
                        ) : (
                        // Для авторизованных
                        // <>
                        <div className={styles.userMenuWrapper}>
                            {/* Кнопка переключает стейт isMenuOpen */}
                            <button className={styles.usernameBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                👤  {user?.username} ▼
                                {/*👤  {user?.email} ▼*/}
                            </button>

                            {/* Выпадающее меню */}
                            {/* Выпадающее меню показывается только если isMenuOpen === true */}
                            {isMenuOpen && (
                            <div className={styles.dropdown}>
                                 {user?.roles.includes('ADMIN') && (
                                     <Link to="/admin" className={styles.btnAdmin}>🛡️ Админ-панель</Link>
                                 )}
                                {/* Модератором может быть и админ, и обычный модератор */}
                                {(user?.roles.includes('MODERATOR') || user?.roles.includes('ADMIN')) && (
                                    <Link to='/moderator' className={styles.btnModerator}>⚖️ Модерация</Link>
                                )}

                                <Link to='/contact' className={styles.btnModerator}>📁 Отправить сообщение</Link>

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
    );
};
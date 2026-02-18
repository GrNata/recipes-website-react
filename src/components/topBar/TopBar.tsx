import { useNavigate, Link } from "react-router-dom";
import {useAuth} from "../../context/AuthContext";
import { Search } from "lucide-react";
import styles from './TopBar.module.css';
import React, {useState} from "react";

export const TopBar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim().toLowerCase()) {
            console.log('передаем поисковый запрос через URL - ', searchTerm)
            // Переходим на главную и передаем поисковый запрос через URL
            navigate(`/?search=${encodeURIComponent(searchTerm)}`);
        } else {
            navigate('/')
        }
    };

    return (
        <nav className={styles.nav} >
            <div className={styles.logo} onClick={() => navigate('/')}>
                👨‍🍳 Главная - рецепты
            </div>

            {/* Строка поиска */}
            <form className={styles.searchContainer} onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Найти рецепт или ингредиент ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                    <Search size={20} />
                </button>
            </form>

            <div className={styles.links}>
                {/* <Link to="/" style={{color: '#123C69'}}>🏠 Главная</Link> */}

                {/* Функционал для всех залогиненных */}
                {isAuthenticated && <Link to="/favorites" style={{marginLeft: '10px', color: '#123C69' }}>⭐ Избранное</Link>}

                {/* Функционал только для Админа */}
                {user?.roles.includes('ADMIN') && (
                    <Link to="/admin" style={{ marginLeft: '10px', color: '#AC3B61'}}>🛡️ Админка</Link>
                )}
            </div>
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
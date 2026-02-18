import { useNavigate, Link } from "react-router-dom";
import {useAuth} from "../../context/AuthContext";
import styles from './TopBar.module.css';

export const TopBar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    console.log('TopBar: isAuthenticated: ', isAuthenticated);
    console.log('TopBar: roles: ', user?.roles);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (
        <nav className={styles.nav} >
            <div className={styles.links}>
                <Link to="/" style={{color: '#123C69'}}>🏠 Главная</Link>

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
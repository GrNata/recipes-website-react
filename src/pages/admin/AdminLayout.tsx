import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Users ,BookOpen, Database, BarChart2, Activity, ShieldAlert } from "lucide-react";
import style from './Adminlayout.module.css';

//Обертка с боковым меню

const AdminLayout: React.FC = () => {

    return (
        <div className={style.adminContainer}>
            {/* Левое боковое меню Админа */}
            <aside className={style.sidebar}>
                <h2 className={style.sidebarTitle}>
                    <ShieldAlert size={24} /> Админ-панель
                </h2>
                <nav className={style.navMenu}>
                    <NavLink to='/admin/users' className={({isActive}) => isActive ? style.activeLink : style.link}>
                        <Users size={20} /> Пользователи
                    </NavLink>
                    <NavLink to='/admin/ingredients' className={({isActive}) => isActive ? style.activeLink : style.link}>
                        <Database size={20} /> Ингредиенты
                    </NavLink>
                    <NavLink to='/admin/categories' className={({isActive}) => isActive ? style.activeLink : style.link}>
                        <BookOpen size={20} /> Категории
                    </NavLink>
                    <NavLink to='/admin/statistics' className={({isActive}) => isActive ? style.activeLink : style.link}>
                        <BarChart2 size={20} /> Статистика
                    </NavLink>
                    <NavLink to='/admin/audit' className={({isActive}) => isActive ? style.activeLink : style.link}>
                        <Activity size={20} /> Аудит-логи
                    </NavLink>
                </nav>
            </aside>

            {/* Правая часть: Динамический контент (Вкладки) */}
            <main className={style.mainContent}>
                <Outlet /> {/* Сюда будут подставляться таблицы и графики */ }
            </main>
        </div>
    );
};

export default AdminLayout;
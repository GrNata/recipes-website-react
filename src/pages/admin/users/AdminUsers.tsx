import React, {useEffect, useState} from "react";
import {Trash2, Search, RotateCcw, Filter, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { adminApi } from "../../../api/admin";
import style from './AdminUsers.module.css';
import type {UserDto, UpdateUserRoleRequest, BlockUserRequest} from "../../../types";
import {formatDateForBackend} from "../../../utils/FormatDateAndTimeForBackend.tsx";
import { Pagination } from "../../../components/pagination/Pagination.tsx";


const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Стейты для фильтров
    // const [roleFiltred, setRoleFilter] = useState<string>('ALL');
    // const [blockedFilter, setBlockedFilter] = useState<string>('ALL');
    const [roleFiltred, setRoleFilter] = useState<string>('');
    const [blockedFilter, setBlockedFilter] = useState<string>('');
    const [searchEmail, setSearchEmail] = useState<string>('')
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    // Стейты для удаления аккаунта - пользователя - ЗАЩИТА
    const [deletingUser, setDeletingUser] = useState<{id: number, email: string} | null>(null);
    const [adminConfirmText, setAdminConfirmText] = useState('');


    // --- НОВЫЙ СТЕЙТ ДЛЯ ФИЛЬТРОВ ---
    // На мобилках и планшетах (<= 1024px) фильтры закрыты, на компьютерах - открыты
    // --- СТЕЙТЫ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ ---
    // const [isFiltersOpen, setIsFiltersOpen] = useState(window.innerWidth > 768);
    const [isFiltersOpen, setIsFiltersOpen] = useState(window.innerWidth > 1024);

    // Управление колонками
    const [showCols, setShowCols] = useState({
        id: window.innerWidth > 1024,
        user: true,
        dates: window.innerWidth > 1024,
        roles: true,
        manageRoles: window.innerWidth > 1024,
        blocked: true,
        actions: window.innerWidth > 1024
    });

    // --- ПАГИНАЦИЯ ---
    const [page, setPage] = useState(0);
    const itemsPerPage = 10;

    // ВЫЧИСЛЯЕМ ПАГИНАЦИЮ
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const paginatedUsers = users.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const toggleCol = (colName: keyof typeof showCols) => {
        setShowCols(prev => ({ ...prev, [colName]: !prev[colName] }));
    };


    // Загрузка пользователей
    const loadUsers = async () => {
        setLoading(true);
        try {
            //// Преобразуем строковый стейт блокировки в boolean или undefined
            let isBlocked: boolean | undefined = undefined;
            if (blockedFilter === 'TRUE') isBlocked = true;
            if (blockedFilter === 'FALSE') isBlocked = false;

            const params ={
                role: roleFiltred || undefined,
                blocked: isBlocked,
                email: searchEmail || undefined,
                lastLoginFrom: formatDateForBackend(dateFrom),
                lastLoginTo: formatDateForBackend(dateTo)
            };

            // Если хотя бы один фильтр заполнен, используем /filter, иначе загружаем всех
            console.log('USERS: params = ', params)
            let data;
            if (Object.values(params).some(v => v !== undefined)) {
                console.log('USERS: 2 params = ', params)
                data = await adminApi.filterUsers(params);
            } else {
                console.log('USERS: ALL')
                data = await adminApi.getAllUsers();
                console.log('USERS: ALL data = ', data)
            }

            // const data = await adminApi.getAllUsers();
            setUsers(data.content || data);

        } catch (error) {
            console.error(error);
            toast.error('Не удалось загрузить пользователей.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [searchEmail, roleFiltred, blockedFilter, dateFrom, dateTo]);

    // // Обработчик поиска для кнопки (закрывает мобильную шторку)
    // const handleSearchClock = () => {
    //     loadUsers();
    //     if (window.innerWidth <= 1024) {
    //         setIsFiltersOpen(false);
    //     }
    // };

    // Обработчик действий
    const handleRoleChange = async (user: UserDto, roleToToggle: string, isChecked: boolean) => {
        // Защита: если пытаются снять роль ADMIN, прерываем выполнение
        if (!isChecked && roleToToggle === 'ADMIN') {
            toast.error('Нельзя убрать роль Администратора');
            return;
        }

        console.log('isChecked = ', isChecked)

        try {
        //     Формируем новый список ролей
            let newRoles = [ ...user.roles];
            if (isChecked) {
                // Если включили чекбокс — добавляем роль
                if (!newRoles.includes(roleToToggle)) {
                    newRoles.push(roleToToggle);
                }
            } else  {
                    newRoles = newRoles.filter(r => r !== roleToToggle);
            }

            //     Обязательно оставляем базовую роль USER
                if (!newRoles.includes('USER')) newRoles.push('USER');

                // 4. Формируем DTO для запроса прямо здесь
                const requestPayload: UpdateUserRoleRequest = {
                    roles: newRoles
                };

                // ВАЖНО: Смотрим в консоль браузера (F12)
                console.log(`Изменение роли ${roleToToggle}. Было:`, user.roles, `Стало:`, newRoles);

                await adminApi.updateUserRole(user.id, requestPayload);
                // await adminApi.updateUserRole(user.id, newRoles);

            //     Обновляем локальный стейт
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, roles: newRoles} : u));
                toast.success(`Роли пользователя ${user.username} - ${user.email} - обновлены.`);

        } catch (e) {
            toast.error('Ошибка при изменении ролей.')
            console.error('Ошибка при изменении ролей', e);
        }
    };

    const handleBlockChange = async (user: UserDto, isBlocked: boolean) => {
        try {
            const requestPayload: BlockUserRequest = {
                blocked: isBlocked
            };
            await adminApi.updateBlockedStatus(user.id, requestPayload);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, blocked: isBlocked} : u));
            toast.success((isBlocked ? `Пользователь заблокирован` : `Пользователь разблокирован`));
        } catch (e) {
            toast.error('Ошибка при изменении статуса блокировки пользователя.')
            console.error('Ошибка при изменении статуса блокировки пользователя.', e)
        }
    };

    // ----- УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ --------
    // Эту функцию мы вызываем при клике на корзину (вместо прямого удаления)
    const triggerDelete = (id: number, email: string) => {
        setDeletingUser({ id, email });
        setAdminConfirmText('');
    };

    // А это уже само физическое удаление
    const confirmDeleteUser = async () => {
        console.log('deletingUser = ', deletingUser?.email, " adminConfirmText = ", adminConfirmText)

        if (!deletingUser || adminConfirmText !== deletingUser.email) return;

        try {
            await adminApi.deleteUser(deletingUser.id);
            toast.success('Пользователь удален');
            // Обновляем список пользователей
            setUsers(users.filter(u => u.id !== deletingUser.id));
            setDeletingUser(null);
        } catch (e) {
            toast.error('Ошибка удаления');
            console.error('Ошибка при удалении пользователя, ', e);
        }
    };


    if (loading) return <div style={{ padding: '20px'}}>⏳ Загрузка пользователей...</div>

    return (
        <div className={style.container}>
            <h2 className={style.header}>Управление пользователями</h2>

            {/* ПАНЕЛЬ ФИЛЬТРОВ (Аккордеон) */}
            <div className={style.filterAccordionHeader} onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/*<Filter size={20} color='#123C69' />*/}
                    <Filter size={20} color='var(--text-main)' />
                    <span>Фильтры и поиск</span>
                </div>
                {/*{isFiltersOpen ? <ChevronUp size={24} color="#123C69" /> : <ChevronDown size={24} color="#123C69" />}*/}
                {isFiltersOpen ? <ChevronUp size={24} color="var(--text-main)" /> : <ChevronDown size={24} color="var(--text-main)" />}
            </div>

        {/*/!*    ПАНЕЛЬ ФИЛЬТРОВ  *!/*/}
        {/*    <div className={style.filterAccordionHeader} onClick={() => setIsFiltersOpen(!isFiltersOpen)}>*/}
        {/*        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>*/}
        {/*            <Filter size={20} color='#123C69' />*/}
        {/*            <span>Фильтры и поиск</span>*/}
        {/*        </div>*/}
        {/*    </div>*/}


            {isFiltersOpen && (
                <div className={style.filtersRow}>

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Поиск по Email</label>
                        <input
                            type="text"
                            placeholder='Введите Email...'
                            className={style.filterInput}
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                        />
                    </div>

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Роль</label>
                        <select className={style.filterSelect} value={roleFiltred} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value=''>Все роли</option>
                            <option value='USER'>USER</option>
                            <option value='MODERATOR'>MODERATOR</option>
                            <option value='ADMIN'>ADMIN</option>
                        </select>
                    </div>

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Статус</label>
                        <select className={style.filterSelect} value={blockedFilter} onChange={(e) => setBlockedFilter(e.target.value)}>
                            <option value=''>Все</option>
                            <option value='FALSE'>Активные</option>
                            <option value='TRUE'>Заблокированные</option>
                        </select>
                    </div>

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Входили последний раз с:</label>
                        <input
                            type='date'
                            className={style.filterInput}
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>по:</label>
                        <input
                            type='date'
                            className={style.filterInput}
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div style={{ paddingTop: '20px'}}>
                        <button
                            onClick={() => {
                                setPage(0); // 🔥 Сбрасываем страницу
                                loadUsers();    //  Запускаем поиск
                                if (window.innerWidth <= 1024) {
                                    setIsFiltersOpen(false);    //  Прячем фильтры на мобилках и планшетах
                                }
                            }}
                            // style={{ background: '#123C69', color: 'white', padding: '10px, 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
                            // style={{ background: 'var(--accent-main)', color: '#A5A5A7', padding: '10px, 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
                            className={style.btnFind}
                        >
                            <Search size={16}  /> Найти
                        </button>
                    </div>

                    <div style={{ paddingTop: '20px'}}>
                        <button
                            onClick={() => {
                                setPage(0); // 🔥 Сбрасываем страницу
                                setDateTo('');
                                setDateFrom('');
                                setSearchEmail('');
                                setRoleFilter('');
                                setBlockedFilter('');
                            }}
                            className={style.btnReset}
                        >
                            <RotateCcw size={16}  /> Сброс
                        </button>

                        <button className={style.btnApplyMobile} onClick={() => setIsFiltersOpen(false)}>
                            Показать результаты
                        </button>
                    </div>
                </div>
            )}

            {/* 🔥 УПРАВЛЕНИЕ КОЛОНКАМИ */}
            <div className={style.columnTogglesBlock}>
                <span className={style.toggleTitle}>Колонки:</span>
                <div className={style.toggleChips}>
                    <button className={`${style.chip} ${showCols.id ? style.chipActive : ''}`} onClick={() => toggleCol('id')}>
                        {showCols.id ? <Eye size={16}/> : <EyeOff size={16}/>} ID
                    </button>
                    <button className={`${style.chip} ${showCols.user ? style.chipActive : ''}`} onClick={() => toggleCol('user')}>
                        {showCols.user ? <Eye size={16}/> : <EyeOff size={16}/>} Пользователь
                    </button>
                    <button className={`${style.chip} ${showCols.dates ? style.chipActive : ''}`} onClick={() => toggleCol('dates')}>
                        {showCols.dates ? <Eye size={16}/> : <EyeOff size={16}/>} Даты
                    </button>
                    <button className={`${style.chip} ${showCols.roles ? style.chipActive : ''}`} onClick={() => toggleCol('roles')}>
                        {showCols.roles ? <Eye size={16}/> : <EyeOff size={16}/>} Текущие роли
                    </button>
                    <button className={`${style.chip} ${showCols.manageRoles ? style.chipActive : ''}`} onClick={() => toggleCol('manageRoles')}>
                        {showCols.manageRoles ? <Eye size={16}/> : <EyeOff size={16}/>} Управление ролями
                    </button>
                    <button className={`${style.chip} ${showCols.blocked ? style.chipActive : ''}`} onClick={() => toggleCol('blocked')}>
                        {showCols.blocked ? <Eye size={16}/> : <EyeOff size={16}/>} Блокировка
                    </button>
                    <button className={`${style.chip} ${showCols.actions ? style.chipActive : ''}`} onClick={() => toggleCol('actions')}>
                        {showCols.actions ? <Eye size={16}/> : <EyeOff size={16}/>} Удалить
                    </button>
                </div>
            </div>

            {/* 🔥 ВЕРХНЯЯ ПАГИНАЦИЯ (только для мобильных) */}
            <div className={style.mobileOnlyPagination}>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

        {/*    ТАБЛИЦА   */}
            <div className={style.tableWrapper}>
                <table className={style.usersTable}>
                    <thead>
                        <tr>
                            {showCols.id && <th>ID</th>}
                            {showCols.user && <th>Пользователь</th>}
                            {showCols.dates && <th>Даты</th>}
                            {showCols.roles && <th>Текущие роли</th>}
                            {showCols.manageRoles && <th>Управление ролями</th>}
                            {showCols.blocked && <th>Блокировка</th>}
                            {showCols.actions && <th>Удалить</th>}
                        </tr>
                    </thead>
                    <tbody>
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '20px'}}>Пользователи не найдены</td>
                        </tr>
                    ) : (

                        // users.map(user => (
                        paginatedUsers.map(user => (
                            <tr key={user.id}>
                                {showCols.id && <td>{user.id}</td>}
                                {showCols.user && (
                                    <td>
                                        <strong className={style.trText}>{user.username}</strong><br/>
                                        {/*<span style={{ fontSize: '0.85rem', color: '#666'}}>{user.email}</span>*/}
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)'}}>{user.email}</span>
                                    </td>
                                )}
                                {showCols.dates && (
                                    <td style={{ fontSize: '0.85rem'}} >
                                        <span className={style.trText}>per: {user.registrationDate}</span><br/>
                                        <span className={style.trText}>Вход: {user.lastLoginAt || 'Никогда'}</span>
                                    </td>
                                )}
                                {showCols.roles && (
                                    <td>
                                        {user.roles.map(r => (
                                            <span key={r} className={`${style.roleBadge} ${
                                                r === 'ADMIN' ? style.roleAdmin :
                                                    r === 'MODERATOR' ? style.roleModerator : style.roleUser
                                            }`}>{r}</span>
                                        ))}
                                    </td>
                                )}
                                {showCols.manageRoles && (
                                    <td>
                                        <label className={style.checkboxLabel}>
                                            <input
                                                type='checkbox'
                                                checked={user.roles.includes('MODERATOR')}
                                                onChange={(e) => handleRoleChange(user, 'MODERATOR', e.target.checked)}
                                            />
                                            <span className={style.trText}>Модератор</span>
                                        </label>
                                        <label className={style.checkboxLabel}>
                                            <input
                                                type='checkbox'
                                                checked={user.roles.includes('ADMIN')}
                                                onChange={(e) => handleRoleChange(user, 'ADMIN', e.target.checked)}
                                                disabled={user.roles.includes('ADMIN')} // Блокируем чекбокс, если он уже Админ
                                            />
                                            <span className={style.trText}>Админ</span>
                                        </label>
                                    </td>
                                )}
                                {showCols.blocked && (
                                    <td>
                                        <label className={style.checkboxLabel} style={{ color: user.blocked ? '#BF3030' : 'inherit' }}>
                                            <input
                                                type="checkbox"
                                                checked={user.blocked}
                                                onChange={(e) => handleBlockChange(user, e.target.checked)}
                                            />
                                            <span className={style.trText}>{user.blocked ? 'Заблокирован' : 'Активен'}</span>
                                        </label>
                                    </td>
                                )}
                                {showCols.actions && (
                                    <td>
                                        {/*<button className={style.btnDelete} onClick={() => handleDelete(user.id, user.username, user.email)} title='Удалить пользователя'>*/}
                                        <button className={style.btnDelete} onClick={() => triggerDelete(user.id, user.email)} title='Удалить пользователя'>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>

                {!Object.values(showCols).some(Boolean) && (
                    // <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Все колонки скрыты. Включите хотя бы одну. 👀
                    </div>
                )}

            </div>

            {/* 🔥 НИЖНЯЯ ПАГИНАЦИЯ */}
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />


            {/* Модальное окно подтверждения для Админа */}
            {deletingUser && (
                <div className={style.modalOverlay}>
                    <div className={style.modalContent}>
                        {/*<h3 style={{ color: '#AC3B61', marginTop: 0 }}>Подтверждение удаления</h3>*/}
                        <h3 style={{ color: 'var(--accent-main)', marginTop: 0 }}>Подтверждение удаления</h3>
                        <p>Вы собираетесь безвозвратно удалить пользователя.</p>
                        <p>Введите его email <b>{deletingUser.email}</b> для подтверждения:</p>

                        <input
                            type="text"
                            value={adminConfirmText}
                            onChange={(e) => setAdminConfirmText(e.target.value)}
                            placeholder={deletingUser.email}
                            // style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '6px' }}
                            style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setDeletingUser(null)} style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--text-main)' }}>
                                Отмена
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                disabled={adminConfirmText !== deletingUser.email}
                                style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: adminConfirmText === deletingUser.email ? 'var(--accent-main)' : 'var(--border-color)', color: '#fff' }}
                            >
                                Удалить пользователя
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>


    )
};

export default AdminUsers;
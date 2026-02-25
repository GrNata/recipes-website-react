import React, {useEffect, useState} from "react";
import { Trash2, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";
import { adminApi } from "../../../api/admin";
import style from './AdminUsers.module.css';
import type {UserDto, UpdateUserRoleRequest, BlockUserRequest} from "../../../types";


const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Стейты для фильтров
    const [roleFiltred, setRoleFilter] = useState<string>('ALL');
    const [blockedFilter, setBlockedFilter] = useState<string>('ALL');
    const [searchEmail, setSearchEmail] = useState<string>('');

    // Загрузка пользователей
    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getAllUsers();
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
    }, []);

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
            toast.success((isBlocked ? `Пользовательзаблокирован` : `Пользователь разблокирован`));
        } catch (e) {
            toast.error('Ошибка при изменении статуса блокировки пользователя.')
            console.error('Ошибка при изменении статуса блокировки пользователя.', e)
        }
    };

    const handleDelete = async (userId: number, username: string, email: string) => {
        if (!window.confirm(`Вы уверены, что хотите удалить навсегда пользователя ${username}, ${email} ?`)) return;

        const deletePromise = adminApi.deleteUser(userId);
        toast.promise(deletePromise, {
            loading: 'Удаление...',
            success: 'Пользователь удален',
            error: 'Ошибка при удалении'
        });

        try {
            await deletePromise;
            setUsers(prev => prev.filter((u => u.id !== userId)));
        } catch (e) {
            console.error('Ошибка при удалении пользователя, ', e);
        }
    };

    // ЛОКАЛЬНАЯ ФИЛЬТРАЦИЯ
    const filteredUsers = users.filter(user => {
        const matchRole = roleFiltred === 'ALL' || user.roles.includes(roleFiltred);
        const matchBlocked = blockedFilter === 'ALL'
            ? true
            : blockedFilter === 'TRUE' ? user.blocked : !user.blocked;
        const matchEmail = user.email.toLowerCase().includes(searchEmail.toLowerCase());

        return matchRole && matchBlocked && matchEmail;
    });

    if (loading) return <div style={{ padding: '20px'}}>⏳ Загрузка пользователей...</div>

    return (
        <div className={style.container}>
            <h2 className={style.header}>Управление пользователями</h2>

        {/*    ПАНЕЛЬ ФИЛЬТРОВ  */}
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
                        <option value='ALL'>Все роли</option>
                        <option value='USER'>Только USER</option>
                        <option value='MODERATOR'>Только MODERATOR</option>
                        <option value='ADMIN'>Только ADMIN</option>
                    </select>
                </div>

                <div className={style.filterGroup}>
                    <label className={style.filterLabel}>Статус</label>
                    <select className={style.filterSelect} value={blockedFilter} onChange={(e) => setBlockedFilter(e.target.value)}>
                        <option value='ALL'>все</option>
                        <option value='FALSE'>Активные</option>
                        <option value='TRUE'>Заблокированные</option>
                    </select>
                </div>
            </div>

        {/*    ТАБЛИЦА   */}
            <div className={style.tableWrapper}>
                <table className={style.usersTable}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Пользователь</th>
                            <th>Даты</th>
                            <th>Текущие роли</th>
                            <th>Управление ролями</th>
                            <th>Блокировка</th>
                            <th>Удалить</th>
                        </tr>
                    </thead>
                    <tbody>
                    {filteredUsers.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '20px'}}>Пользователи не найдены</td>
                        </tr>
                    ) : (
                        filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>
                                    <strong>{user.username}</strong><br/>
                                    <span style={{ fontSize: '0.85rem', color: '#666'}}>{user.email}</span>
                                </td>
                                <td style={{ fontSize: '0.85rem'}}>
                                    per: {user.registrationDate}<br/>
                                    Вход: {user.lastLoginAt || 'Никогда'}
                                </td>
                                <td>
                                    {user.roles.map(r => (
                                        <span key={r} className={`${style.roleBadge} ${
                                            r === 'ADMIN' ? style.roleAdmin :
                                                r === 'MODERATOR' ? style.roleModerator : style.roleUser
                                        }`}>{r}</span>
                                    ))}
                                </td>
                                <td>
                                    <label className={style.checkboxLabel}>
                                        <input
                                            type='checkbox'
                                            checked={user.roles.includes('MODERATOR')}
                                            onChange={(e) => handleRoleChange(user, 'MODERATOR', e.target.checked)}
                                        />
                                        Модератор
                                    </label>
                                    <label className={style.checkboxLabel}>
                                        <input
                                            type='checkbox'
                                            checked={user.roles.includes('ADMIN')}
                                            onChange={(e) => handleRoleChange(user, 'ADMIN', e.target.checked)}
                                            disabled={user.roles.includes('ADMIN')} // Блокируем чекбокс, если он уже Админ
                                        />
                                        Админ
                                    </label>
                                </td>
                                <td>
                                    <label className={style.checkboxLabel} style={{ color: user.blocked ? '#BF3030' : 'inherit' }}>
                                        <input
                                            type="checkbox"
                                            checked={user.blocked}
                                            onChange={(e) => handleBlockChange(user, e.target.checked)}
                                        />
                                        {user.blocked ? 'Заблокирован' : 'Активен'}
                                    </label>
                                </td>
                                <td>
                                    <button className={style.btnDelete} onClick={() => handleDelete(user.id, user.username, user.email)} title='Удалить пользователя'>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>

            </div>
        </div>
    )
};

export default AdminUsers;
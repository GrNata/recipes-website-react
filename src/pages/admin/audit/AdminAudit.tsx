import {useEffect, useState} from "react";
import {adminApi} from "../../../api/admin.ts";
import style from './AdminAudit.module.css';
import {Activity, Filter, ChevronUp, ChevronDown, Eye, EyeOff} from "lucide-react";
import {formatDateForBackend} from "../../../utils/FormatDateAndTimeForBackend.tsx";
import {Pagination} from "../../../components/pagination/Pagination.tsx";


interface AuditLog {
    id: number;
    adminEmail: string;
    actionType: string;     // e.g., CREATE, DELETE
    entityType: string;     // e.g., RECIPE, USER
    status: string | null;      //      только для рецептов - статус
    entityId: number;
    description: string;
    // performedBy: string;
    createdAt: string;
}

const AdminAudit: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const [actionType, setActionType] = useState('');
    const [entityType, setEntityType] = useState('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [email, setEmail] = useState('');

    // --- НОВЫЕ СТЕЙТЫ ДЛЯ МОБИЛОК ---
    const [isFiltersOpen, setIsFiltersOpen] = useState(window.innerWidth > 1024);

    // Управление колонками: на ПК показываем все, на мобилках прячем второстепенные
    const [showCols, setShowCols] = useState({
        createAt: true,     //  Дата (всегда открыта по умолчанию)
        adminEmail: window.innerWidth > 1024,
        actionType: true,   // Действие (всегда открыто по умолчанию)
        entityType: true,   // Объект (всегда открыт по умолчанию)
        status: window.innerWidth > 1024,
        entityId: window.innerWidth > 1024,
        description: window.innerWidth > 1024
    });

    // --- ПАГИНАЦИЯ ---
    const [page, setPage] = useState(0);
    const itemsPerPage = 10;

    // Функция переключения видимости колонок
    const toggleCol = (colName: keyof typeof showCols) => {
        setShowCols(prev => ({...prev, [colName]: !prev[colName]}));
    };

    const fetchLogs = async () => {
        setLoading(true);

        try {
            let data: AuditLog[];
            // Если выбрано "Все", значение будет "" — превращаем это в undefined для API
            const params = {
                actionType: actionType || undefined,
                entityType: entityType || undefined,
                // Конвертируем формат из YYYY-MM-DD в DD-MM-YYYY
                from: formatDateForBackend(fromDate) || undefined,
                to: formatDateForBackend(toDate) || undefined
            };

            // Если хоть один фильтр активен — идем в /filter
            if (Object.values(params).some(v => v !== undefined)) {
            //     Используем метод фильтрации с бэкенда
                console.log('Отправка фильтров:', params)
                data = await adminApi.filterAuditLogs( params )
            } else {
                console.log('Загрузка всех логов без фильтра')
                data = await adminApi.getAuditLogs();
            }

            console.log('Logs: ', data)

            if (email) {
                data = data.filter(d => d.adminEmail === email);
            }

            setLogs(data);
        } catch (e) {
            console.error('ошибка загрузки логов', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [actionType, entityType, fromDate, toDate]);

    // Сбрасываем страницу на 0, если пользователь меняет фильтры
    useEffect(() => {
        setPage(0);
    }, [actionType, entityType, fromDate, toDate, email]);

    // 🔥 ВЫЧИСЛЯЕМ ПАГИНАЦИЮ
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const paginatedLogs = logs.slice(page * itemsPerPage, (page + 1) * itemsPerPage);


    // 🔥 НОВАЯ ФУНКЦИЯ ДЛЯ КНОПКИ ПОИСКА
    const handleSearch = () => {
        setPage(0); // 🔥 Сбрасываем страницу
        fetchLogs(); // Запускаем загрузку данных
        if (window.innerWidth <= 1024) {
            setIsFiltersOpen(false); // Закрываем фильтры только на мобилках и планшетах
        }
    };

    const getActionClass = (action: string) => {
        if (action.includes('CREATE')) return style.actionCreate;
        if (action.includes('DELETE')) return  style.actionDelete;
        if (action.includes('UPDATE')) return  style.actionUpdate;
        if (action.includes('LOGIN')) return  style.actionLogin;
        if (action.includes('REGISTER')) return  style.actionLogin;
        if (action.includes('LOGIN')) return  style.actionLogin;
        if (action.includes('APPROVED')) return  style.actionApproved;
        if (action.includes('REJECTED')) return  style.actionRejected;
        if (action.includes('PENDING')) return  style.actionPending;

        return style.actionUpdate;
    };

    return (
        <div className={style.container}>
            <h2 style={{ color: '#123C69', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Activity /> Журнал действий (Аудит)
            </h2>

            {/*     ФИЛЬТРЫ     */}
            {/* 🔥 ПАНЕЛЬ ФИЛЬТРОВ (Аккордеон) */}
            <div className={style.filterAccordionHeader} onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Filter size={20} color='#123C69' />
                    <span> Фильтры и поиск</span>
                </div>
                {isFiltersOpen ? <ChevronUp size={24} color='#123C69' /> : <ChevronDown size={24} color='#123C69' /> }
            </div>

            {isFiltersOpen && (
                <div className={style.filters}>

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Действие: </label>
                        <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
                            <option value="">Все</option>
                            <option value="CREATE">CREATE - создан</option>
                            <option value="UPDATE">UPDATE - изменен</option>
                            <option value="DELETE">DELETE - удален</option>
                            <option value="LOGIN">LOGIN - залогинен</option>
                            <option value="REGISTER">REGISTER - зарегистрировался</option>
                            <option value="APPROVED">APPROVED - опубликован</option>
                            <option value="REJECTED">REJECTED - отклонен</option>
                            <option value="PENDING">PENDING - на модерации</option>
                            <option value="UPDATE_PROFILE">UPDATE_PROFILE - изменен пофиль</option>
                            <option value="SYSTEM_CLEANUP">SYSTEM_CLEANUP - фоновое удаление</option>
                            {/*<option value="DRAFT">DRAFT - черновик</option>*/}
                        </select>
                    </div>

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Объект: </label>
                        <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                            <option value="">Все</option>
                            <option value="RECIPE">RECIPE</option>
                            <option value="USER">USER</option>
                            <option value="INGREDIENT">INGREDIENT</option>
                            <option value="CATEGORY TYPE">CATEGORY TYPE</option>
                            <option value="CATEGORY VALUE">CATEGORY VALUE</option>
                            <option value="PHOTO">PHOTO</option>
                        </select>
                    </div>

                    {/*     EMAIL   */}

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Email: </label>
                        <input
                            type="email"
                            className={style.filterInput}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>


                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Записи начиная с: </label>
                        <input
                            type="date"
                            className={style.filterInput}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>по: </label>
                        <input
                            type="date"
                            className={style.filterInput}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                    {(fromDate || toDate) && (
                        <button
                            className={style.btnClearDates}
                            onClick={() => { setFromDate(''); setToDate('') }}
                        >
                            Сбросить даты
                        </button>
                    )}

                    <button
                        onClick={handleSearch}
                        // onClick={fetchLogs}
                        className={style.btnRefresh}
                    >
                        Обновить
                    </button>
                </div>
            )}

            {/* ------------------------- */}

            {/* 🔥 УПРАВЛЕНИЕ КОЛОНКАМИ */}
            <div className={style.columnTogglesBlock}>
                <span className={style.toggleTitle}>Колонки:</span>
                <div className={style.toggleChips}>
                    <button
                        className={`${style.chip} ${showCols.createAt ? style.chipActive : ''}`}
                        onClick={() => toggleCol('createAt')}
                    >
                        {showCols.createAt ? <Eye size={16} /> : <EyeOff size={16} /> } Дата
                    </button>
                    <button
                        className={`${style.chip} ${showCols.adminEmail ? style.chipActive : ''}`}
                        onClick={() => toggleCol('adminEmail')}
                    >
                        {showCols.adminEmail ? <Eye size={16} /> : <EyeOff size={16} /> } Кто
                    </button>
                    <button
                        className={`${style.chip} ${showCols.actionType ? style.chipActive : ''}`}
                        onClick={() => toggleCol('actionType')}
                    >
                        {showCols.actionType ? <Eye size={16} /> : <EyeOff size={16} /> } Действие
                    </button>
                    <button
                        className={`${style.chip} ${showCols.entityType ? style.chipActive : ''}`}
                        onClick={() => toggleCol('entityType')}
                    >
                        {showCols.entityType ? <Eye size={16} /> : <EyeOff size={16} /> } Объект
                    </button>
                    <button
                        className={`${style.chip} ${showCols.status ? style.chipActive : ''}`}
                        onClick={() => toggleCol('status')}
                    >
                        {showCols.status ? <Eye size={16} /> : <EyeOff size={16} /> } Статус
                    </button>
                    <button
                        className={`${style.chip} ${showCols.entityId ? style.chipActive : ''}`}
                        onClick={() => toggleCol('entityId')}
                    >
                        {showCols.entityId ? <Eye size={16} /> : <EyeOff size={16} /> } ID объекта
                    </button>
                    <button
                        className={`${style.chip} ${showCols.description ? style.chipActive : ''}`}
                        onClick={() => toggleCol('description')}
                    >
                        {showCols.description ? <Eye size={16} /> : <EyeOff size={16} /> } Детали
                    </button>
                </div>
            </div>


            {loading ? <p>Загрузка логов...</p> : (

                <>
                    {/* 🔥 ВЕРХНЯЯ ПАГИНАЦИЯ (только для мобильных) */}
                    <div className={style.mobileOnlyPagination}>
                        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>

                    <div className={style.tableWrapper}>
                        <table className={style.table}>
                            <thead>
                                <tr>
                                    {showCols.createAt && <th>Дата</th>}
                                    {showCols.adminEmail && <th>Кто</th>}
                                    {showCols.actionType && <th>Действие</th>}
                                    {showCols.entityType && <th>Объект</th>}
                                    {showCols.status && <th>Статус (для рецептов)</th>}
                                    {showCols.entityId && <th>ID объекта</th>}
                                    {showCols.description && <th>Детали</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {/*{logs.map(log => (*/}
                                {/* 🔥 ИСПОЛЬЗУЕМ paginatedLogs ВМЕСТО logs */}
                                {paginatedLogs.map(log => (
                                    <tr key={log.id}>
                                        {showCols.createAt &&<td style={{ whiteSpace: 'nowrap'}}>{log.createdAt}</td>}
                                        {showCols.adminEmail && <td><strong>{log.adminEmail}</strong></td>}
                                        {showCols.actionType &&<td className={getActionClass(log.actionType)}>{log.actionType}</td>}
                                        {showCols.entityType && (<td style={log.entityType === 'RECIPE' ? {color: '#68237F'} :
                                            log.entityType === 'INGREDIENT' ? {color: '#1533AD'} :
                                                log.entityType === 'CATEGORY VALUE' ? {color: '#218555'} :
                                                    log.entityType === 'CATEGORY TYPE' ? {color: '#A67400'} :
                                                        {color: '#FF8100'}
                                        }
                                        >
                                            {log.entityType}
                                        </td>
                                        )}
                                        {showCols.status && (
                                        <td
                                                style={log.status === 'DRAFT' ? {color: '#123C68'} :
                                                    log.status === 'PENDING' ? {color: '#FF9640'} :
                                                        log.status === 'APPROVED' ? {color: '#00CC00'} :
                                                            {color: '#FF4040'}
                                            }>
                                                {log.entityType.trim().toUpperCase() === 'RECIPE' ? log.status : ''}
                                            </td>
                                        )}
                                        {showCols.entityId && <td>{log.entityId}</td>}
                                        {showCols.description && <td style={{ fontSize: '0.8rem', color: '#666'}}>{log.description}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Если пользователь отключил вообще все колонки, покажем подсказку */}
                        {!Object.values(showCols).some(Boolean) && (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                                Все колонки скрыты. Включите хотя бы одну, чтобы увидеть данные. 👀
                            </div>
                        )}

                    </div>

                    {/* 🔥 НИЖНЯЯ ПАГИНАЦИЯ */}
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
};

export default AdminAudit;
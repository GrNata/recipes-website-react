import {useEffect, useState} from "react";
import {adminApi} from "../../../api/admin.ts";
import style from './AdminAudit.module.css';
import {Activity} from "lucide-react";
import {formatDateForBackend} from "../../../utils/FormatDateAndTimeForBackend.tsx";


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
                        {/*<option value="DRAFT">DRAFT - черновик</option>*/}
                    </select>
                </div>

                <div className={style.filterGroup}>
                    <label className={style.filterLabel}>Сущность: </label>
                    <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                        <option value="">Все</option>
                        <option value="RECIPE">RECIPE</option>
                        <option value="USER">USER</option>
                        <option value="INGREDIENT">INGREDIENT</option>
                        <option value="CATEGORY TYPE">CATEGORY TYPE</option>
                        <option value="CATEGORY VALUE">CATEGORY VALUE</option>
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

                <button onClick={fetchLogs} className={style.btnRefresh}>Обновить</button>
            </div>
            {/* ------------------------- */}


            {loading ? <p>Загрузка логов...</p> : (
                <table className={style.table}>
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Кто</th>
                            <th>Действие</th>
                            <th>Объект</th>
                            <th>Статус (для рецептов)</th>
                            <th>ID объекта</th>
                            <th>Детали</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td>{log.createdAt}</td>
                                <td><strong>{log.adminEmail}</strong></td>
                                <td className={getActionClass(log.actionType)}>{log.actionType}</td>
                                <td style={log.entityType === 'RECIPE' ? {color: '#68237F'} :
                                    log.entityType === 'INGREDIENT' ? {color: '#1533AD'} :
                                        log.entityType === 'CATEGORY VALUE' ? {color: '#218555'} :
                                            log.entityType === 'CATEGORY TYPE' ? {color: '#A67400'} :
                                                {color: '#FF8100'}
                                }
                                >
                                    {log.entityType}
                                </td>
                                <td
                                    style={log.status === 'DRAFT' ? {color: '#123C68'} :
                                        log.status === 'PENDING' ? {color: '#FF9640'} :
                                            log.status === 'APPROVED' ? {color: '#00CC00'} :
                                                {color: '#FF4040'}
                                }
                                >
                                    {log.entityType.trim().toUpperCase() === 'RECIPE' ? log.status : ''}
                                </td>
                                <td>{log.entityId}</td>
                                <td style={{ fontSize: '0.8rem', color: '#666'}}>{log.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminAudit;
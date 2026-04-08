import React, { useCallback, useEffect, useState} from "react";
import { adminApi } from "../../../api/admin";
import { Trash2, Edit, Plus, Search, Eye, EyeOff, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { toast} from "react-hot-toast";
import style from './AdminIngredient.module.css';
import type {IngredientDto } from "../../../types";
import {Pagination} from "../../../components/pagination/Pagination.tsx";
// import {data} from "react-router-dom";

export const AdminIngredients: React.FC = () => {
    const [ingredients, setIngredients] = useState<IngredientDto[]>([]);

    // 🔥 НОВЫЙ СТЕЙТ: Все ингредиенты без пагинации (Словарь для поиска родителей)
    const [allIngredients, setAllIngredients] = useState<IngredientDto[]>([]);

    // Стейты для пагинации
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    // Стейт для поиска (то, что ввел пользователь)
    const [searchInput, setSearchInput] = useState('');
    // Стейт для поиска (то, что реально отправляем на сервер, чтобы не спамить при каждом нажатии клавиши)
    const [searchQuery, setSearchQuery] = useState('');

    // Модальное окно
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIngredient, setCurrentIngredient] = useState<IngredientDto | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        nameEng: string;
        energyKcal100g: number;
        parentId: number | null; // 🔥 Явно разрешаем и число, и null
    }>({
        name: '',
        nameEng: '',
        energyKcal100g: 0,
        parentId: null
    });

    // 🔥 СТЕЙТЫ ДЛЯ ЖИВОГО ПОИСКА РОДИТЕЛЯ В МОДАЛКЕ
    const [parentSearch, setParentSearch] = useState('');
    const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(window.innerWidth > 1024);

    // --- СТЕЙТЫ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ ---
    const [isFiltersOpen, setIsFiltersOpen] = useState(window.innerWidth > 1024);

    // Управление колонками
    const [showCols, setShowCols] = useState({
        id: window.innerWidth > 1024,
        name: true,       // Название всегда открыто
        nameEng: window.innerWidth > 1024,
        parent: window.innerWidth > 1024,
        calories: true,   // Калории открыты
        actions: true     // Кнопки всегда открыты
    });

    const toggleCol = (colName: keyof typeof showCols) => {
        setShowCols(prev => ({ ...prev, [colName]: !prev[colName] }));
    };

    // Обернули в useCallback, чтобы безопасно вызывать в useEffect
    const loadIngredients = useCallback(async () => {
        setLoading(true);
        try {
            // Передаем search и page на бэкенд
            // Если search пустой, передаем undefined, чтобы не искать по пустой строке
            // Загружаем пагинированные данные для таблицы
            const data = await adminApi.getPagedIngredients(searchQuery || undefined, page, 10);

            // Spring Boot возвращает объект Page. Массив элементов лежит в data.content
            const items = data.content || [];
            const pages = data.totalPages || 0;

            setIngredients(items);
            setTotalPages(pages);

            // Загружаем ВСЕ ингредиенты для словаря (чтобы искать родителей)
            const allData = await  adminApi.getAllIngredients();
            setAllIngredients(allData.content || allData);      // Зависит от того, что возвращает бэкенд (List или Page)
            // setAllIngredients(items);      // Зависит от того, что возвращает бэкенд (List или Page)

            console.log('СПРАВОЧНИК ИНГРЕДИЕНТОВ: ', allData)

        } catch (e) {
            toast.error('Ошибка загрузки всех ингредиентов');
            console.error('Ошибка загрузки всех ингредиентов', e);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        loadIngredients();
    }, [loadIngredients]);

    // Обработчик кнопки поиска (или нажатия Enter)
    const handleSearch = () => {
        setSearchQuery(searchInput); // Применяем поиск
        setPage(0); // Сбрасываем на первую страницу при новом поиске
    };

    // Слушаем нажатие Enter в поле поиска
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Удалить ингредиент? Это может повлиять на существующие рецепты!')) return;

        try {
            await adminApi.deleteIngredient(id);
            // setIngredients(prev => prev.filter(i => i.id !== id));   // Лучше перезагрузить с сервера
            toast.success('Ингредиент успешно удален');
            loadIngredients();      // Перезагружаем список после удаления
        } catch (e) {
            toast.error('Не удалось удалить ингредиент.');
            console.error('Не удалось удалить ингредиент.', e);
        }
    };

    // Открыть модальное окно для добавления
    const handleAddClick = () => {
        setCurrentIngredient(null);
        setFormData({ name: '', nameEng: '', energyKcal100g: 0, parentId: null });
        setParentSearch('');    // Очищаем поиск
        setIsModalOpen(true);
    };

    // Открыть модальное окно для редактирования
    const handleEditClick = (ingredient: IngredientDto) => {
        setCurrentIngredient(ingredient);
        setFormData({
            name: ingredient.name,
            nameEng: ingredient.nameEnglish ?? '',
            energyKcal100g: ingredient.energyKcal100g ?? 0,
            parentId: ingredient.parentId ?? null
        });

        // 🔥 Берем готовое имя прямо из DTO!
        setParentSearch(ingredient.parentName || '');

        setIsModalOpen(true);
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log('currentIngredient: ', currentIngredient)
            if (currentIngredient) {
                //     Редактирование
                await adminApi.updateIngredient(currentIngredient?.id, formData);
                toast.success('Обновлен!');
            } else {
            //     Создание
                console.log('formData: ', formData)
                await adminApi.createIngredient(formData);
                toast.success('Создан!');
            }
            setIsModalOpen(false);
            loadIngredients();      //  перегрузка
        } catch (e) {
            toast.error('Ошибка при сохранении ингрегиента');
            console.error('Ошибка при сохранении ингрегиента ', e);
        }
    };

    return (

        <div className={style.container}>
            <div className={style.topBar}>
                {/* Теперь ingredients.length - это количество только на этой странице.
                    Если хотите общее, нужно вытащить totalElements из data в loadIngredients */}
                {/*<h2 style={{color: '#123C69'}}>Ингредиенты ({ingredients.length})</h2>*/}
                <h2 style={{color: '#993053'}}>Ингредиенты ({ingredients.length})</h2>
                <button
                    className={style.btnAdd}
                    onClick={() => handleAddClick()}
                >
                    <Plus size={20} /> Добавить новый
                </button>
            </div>

            {/*/!* ПАНЕЛЬ ФИЛЬТРОВ (Аккордеон) *!/*/}
            <div className={style.filterAccordionHeader} onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/*<Filter size={20} color="#123C69" />*/}
                    <Filter size={20} color="var(--heading-color)" />
                    <span>Поиск</span>
                </div>
                {isFiltersOpen ? <ChevronUp size={24} color="#123C69" /> : <ChevronDown size={24} color="#123C69" />}
            </div>

            {isFiltersOpen && (
                <div className={style.searchContainer}>
                    <Search size={20} color='#666' className={style.searchIcon} />
                    <input
                        className={style.searchBar}
                        placeholder='Поиск по названию...'
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className={style.btnSearchAction} onClick={handleSearch}>
                        Найти
                    </button>
                </div>
            )}

            {/* 🔥 УПРАВЛЕНИЕ КОЛОНКАМИ */}
            <div className={style.columnTogglesBlock}>
                <span className={style.toggleTitle}>Колонки:</span>
                <div className={style.toggleChips}>
                    <button className={`${style.chip} ${showCols.id ? style.chipActive : ''}`} onClick={() => toggleCol('id')}>
                        {showCols.id ? <Eye size={16}/> : <EyeOff size={16}/>} ID
                    </button>
                    <button className={`${style.chip} ${showCols.name ? style.chipActive : ''}`} onClick={() => toggleCol('name')}>
                        {showCols.name ? <Eye size={16}/> : <EyeOff size={16}/>} Название
                    </button>
                    <button className={`${style.chip} ${showCols.nameEng ? style.chipActive : ''}`} onClick={() => toggleCol('nameEng')}>
                        {showCols.nameEng ? <Eye size={16}/> : <EyeOff size={16}/>} Название (англ)
                    </button>
                    <button className={`${style.chip} ${showCols.parent ? style.chipActive : ''}`} onClick={() => toggleCol('parent')}>
                        {showCols.parent ? <Eye size={16}/> : <EyeOff size={16}/>} Родитель
                    </button>
                    <button className={`${style.chip} ${showCols.calories ? style.chipActive : ''}`} onClick={() => toggleCol('calories')}>
                        {showCols.calories ? <Eye size={16}/> : <EyeOff size={16}/>} Калории
                    </button>
                    <button className={`${style.chip} ${showCols.actions ? style.chipActive : ''}`} onClick={() => toggleCol('actions')}>
                        {showCols.actions ? <Eye size={16}/> : <EyeOff size={16}/>} Действия
                    </button>
                </div>
            </div>

            {loading ? (
                // <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '1.3rem'}}>Загружаются...</div>
                <div className={style.loadingText}>⏳ Загрузка...</div>
            ) : (
            <>
                {/* 🔥 ВЕРХНЯЯ ПАНЕЛЬ ПАГИНАЦИИ (Только для мобильных) */}
                <div className={style.mobileOnlyPagination}>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>


                <div className={style.tableWrapper}>
                    <table className={style.table}>
                        <thead>
                            <tr>
                                {showCols.id && <th>ID</th>}
                                {showCols.name && <th>Название</th>}
                                {showCols.nameEng && <th>Название - английский вариант</th>}
                                {showCols.parent && <th>Родитель</th>}
                                {showCols.calories && <th>Калории (на 100г)</th>}
                                {showCols.actions && <th>Действия</th>}
                            </tr>
                        </thead>
                        <tbody>
                        {/* ИСПОЛЬЗУЕМ ingredients, а не локальный filtered! Сервер уже всё отфильтровал. */}
                        {ingredients.map(item => (
                        // {filtered.map(item => (
                            <tr key={item.id}>
                                {showCols.id && <td data-label='ID' style={{ color: '#4E4E50'}}><span className={style.tableText}>{item.id}</span></td>}
                                {showCols.name && <td data-label='Название'><strong className={style.tableText}>{item.name}</strong></td>}
                                {showCols.nameEng && <td data-label='Название (англ.)'><strong className={style.tableText}>{item.nameEnglish}</strong></td>}
                                {showCols.parent && (
                                    <td data-label='Родитель'>
                                        {item.parentName ? (
                                            // <span style={{ backgroundColor: '#eef2f5', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', color: '#41728F' }}>
                                            <span className={style.tableParent}>
                                                {item.parentName}
                                            </span>
                                        // ) : <span style={{ color: '#ccc' }}>—</span>}
                                        ) : <span style={{ color: 'var(--input-text)'}}>—</span>}
                                    </td>
                                )}
                                {showCols.calories && <td data-label='Калории'><span className={style.tableText}>{item.energyKcal100g} ккал</span></td>}
                                {showCols.actions && (
                                    <td data-label='Действия'>
                                        <button
                                            onClick={() =>
                                                handleEditClick(item)
                                        }
                                            style={{background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px'}}>
                                            <Edit size={18} color='#41728F' />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                                            <Trash2 size={18} color='#BF3030' />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {!Object.values(showCols).some(Boolean) && (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                            Все колонки скрыты. Включите хотя бы одну. 👀
                        </div>
                    )}

                </div>

                {/* Панель пагинации */}
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />

            </>
            )}


        {/*    Разметка модального окна (JSX)   */}
            {isModalOpen && (
                <div className={style.modalOverlay}>
                    <div className={style.modalContent}>
                        <h3>{currentIngredient ? 'Редактировать' : 'Добавить'} ингредиент</h3>
                        <form onSubmit={handleSave}>
                            <div className={style.formGroup}>
                                <label>Название </label>
                                <input
                                    type='text'
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                                <label>Название английский вариант </label>
                            </div>
                            <div className={style.formGroup}>
                                <input
                                    type='text'
                                    required
                                    value={formData.nameEng}
                                    onChange={(e) => setFormData({...formData, nameEng: e.target.value})}
                                />
                            </div>

                            {/* 🔥 НОВОЕ ПОЛЕ: ЖИВОЙ ПОИСК РОДИТЕЛЯ */}
                            <div className={style.formGroup} style={{ position: 'relative' }}>
                                <label>Родительский ингредиент (начните вводить)</label>
                                <input
                                    type='text'
                                    placeholder='Поиск родителя...'
                                    value={parentSearch}
                                    onFocus={() => setIsParentDropdownOpen(true)}
                                    onChange={(e) => {
                                        setParentSearch(e.target.value);
                                        setIsParentDropdownOpen(true);
                                        // Если поле очистили - сбрасываем ID
                                        if (e.target.value.trim() === '') setFormData({...formData, parentId: null});
                                    }}
                                />
                                {/* Выпадающий список совпадений */}
                                {isParentDropdownOpen && (
                                    <ul className={style.dropdownList}>
                                        <li onClick={() => {
                                            setParentSearch('');
                                            setFormData({...formData, parentId: null});
                                            setIsParentDropdownOpen(false);
                                        }}>
                                            <em>— Нет родителя —</em>
                                        </li>
                                        {allIngredients
                                            .filter(i => i.name.toLowerCase().includes(parentSearch.toLowerCase()) && i.id !== currentIngredient?.id) // Исключаем самого себя
                                            .slice(0, 10) // Показываем максимум 10 вариантов, чтобы не перегружать экран
                                            .map(i => (
                                                <li key={i.id} onClick={() => {
                                                    setParentSearch(i.name);
                                                    setFormData({...formData, parentId: i.id});
                                                    setIsParentDropdownOpen(false);
                                                }}>
                                                    {i.name}
                                                </li>
                                            ))
                                        }
                                    </ul>
                                )}
                            </div>

                            <div className={style.formGroup}>
                                <input
                                    type='number'
                                    required
                                    value={formData.energyKcal100g}
                                    onChange={(e) => setFormData({...formData, energyKcal100g: Number(e.target.value)})}
                                />
                            </div>

                            <div className={style.modalButtons}>
                                <button type='button' onClick={() => setIsModalOpen(false)} className={style.btnCancel}>
                                    Отмена
                                </button>
                                <button type='submit' className={style.btnSave} >Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    )
};

export default AdminIngredients;
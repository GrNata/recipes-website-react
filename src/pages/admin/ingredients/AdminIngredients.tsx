import React, {useCallback, useEffect, useState} from "react";
import { adminApi } from "../../../api/admin";
import { Trash2, Edit, Plus, Search, Eye, EyeOff, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { toast} from "react-hot-toast";
import style from './AdminIngredient.module.css';
import type {IngredientDto } from "../../../types";
import {Pagination} from "../../../components/pagination/Pagination.tsx";
// import {data} from "react-router-dom";

export const AdminIngredients: React.FC = () => {
    const [ingredients, setIngredients] = useState<IngredientDto[]>([]);

    // Стейты для пагинации
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    // Стейт для поиска
    // const [search, setSearch] = useState('');
    // Стейт для поиска (то, что ввел пользователь)
    const [searchInput, setSearchInput] = useState('');
    // Стейт для поиска (то, что реально отправляем на сервер, чтобы не спамить при каждом нажатии клавиши)
    const [searchQuery, setSearchQuery] = useState('');

    // Модальное окно
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIngredient, setCurrentIngredient] = useState<IngredientDto | null>(null);
    const [formData, setFormData] = useState( { name: '', nameEng: '', energyKcal100g: 0 } );

    // --- СТЕЙТЫ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ ---
    const [isFiltersOpen, setIsFiltersOpen] = useState(window.innerWidth > 1024);

    // Управление колонками
    const [showCols, setShowCols] = useState({
        id: window.innerWidth > 1024,
        name: true,       // Название всегда открыто
        nameEng: window.innerWidth > 1024,
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
            // const data = await adminApi.getAllIngredients();
            // Передаем search и page на бэкенд
            // Если search пустой, передаем undefined, чтобы не искать по пустой строке
            // const data = await adminApi.getPagedIngredients(search || undefined, page, 10);
            const data = await adminApi.getPagedIngredients(searchQuery || undefined, page, 10);

            // Spring Boot возвращает объект Page. Массив элементов лежит в data.content
            const items = data.content || [];
            const pages = data.totalPages || 0;

            setIngredients(items);
            setTotalPages(pages);

            // // Spring Boot возвращает объект Page, где внутри есть content и totalPages
            // const sortedData = data.sort((a: { name: string; }, b: { name: string; }) => {
            //     return  a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            // });
            // setIngredients(sortedData);
        } catch (e) {
            toast.error('Ошибка загрузки всех ингредиентов');
            console.error('Ошибка загрузки всех ингредиентов', e);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    // useEffect(() => {
    //     setPage(0);
    // }, [search]);

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

    // const filtered = ingredients.filter(i =>
    //     i.name.toLowerCase().includes(search.toLowerCase())
    // );

    // Открыть модальное окно для добавления
    const handleAddClick = () => {
        setCurrentIngredient(null);
        setFormData({ name: '', nameEng: '', energyKcal100g: 0 });
        setIsModalOpen(true);
    };

    // Открыть модальное окно для редактирования
    const handleEditClick = (ingredient: IngredientDto) => {
        setCurrentIngredient(ingredient);
        setFormData({ name: ingredient.name, nameEng: ingredient.nameEnglish ?? '', energyKcal100g: ingredient.energyKcal100g ?? 0 });
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

    // if (loading) {
    //     (
    //         <div style={{ marginTop: '50px', alignItems: 'center', fontSize: '1.3rem'}}>Загружаются...</div>
    //     )
    // }

    return (
        <div className={style.container}>
            <div className={style.topBar}>
                {/* Теперь ingredients.length - это количество только на этой странице.
                    Если хотите общее, нужно вытащить totalElements из data в loadIngredients */}
                {/*<h2 style={{color: '#123C69'}}>Ингредиенты ({ingredients.length})</h2>*/}
                <h2 style={{color: '#123C69'}}>Ингредиенты ({ingredients.length})</h2>
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
                    <Filter size={20} color="#123C69" />
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
                    <button className={`${style.chip} ${showCols.calories ? style.chipActive : ''}`} onClick={() => toggleCol('calories')}>
                        {showCols.calories ? <Eye size={16}/> : <EyeOff size={16}/>} Калории
                    </button>
                    <button className={`${style.chip} ${showCols.actions ? style.chipActive : ''}`} onClick={() => toggleCol('actions')}>
                        {showCols.actions ? <Eye size={16}/> : <EyeOff size={16}/>} Действия
                    </button>
                </div>
            </div>

            {/*<div className={style.searchContainer}>*/}
            {/*    <Search size={20} color='#666' className={style.searchIcon} />*/}
            {/*    <input*/}
            {/*        className={style.searchBar}*/}
            {/*        placeholder='Поиск по названию...'*/}
            {/*        // value={search}*/}
            {/*        value={searchInput}*/}
            {/*        // onChange={(e) => setSearch(e.target.value)}*/}
            {/*        onChange={(e) => setSearchInput(e.target.value)}*/}

            {/*        onKeyDown={handleKeyDown}*/}
            {/*    />*/}
            {/*    <button onClick={handleSearch} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: '#BAB2B5', color: '#123C69' }}>*/}
            {/*        Найти*/}
            {/*    </button>*/}
            {/*</div>*/}

            {loading ? (
                <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '1.3rem'}}>Загружаются...</div>
            ) : (
            <>
                <div className={style.tableWrapper}>
                    <table className={style.table}>
                        <thead>
                            <tr>
                                {showCols.id && <th>ID</th>}
                                {showCols.name && <th>Название</th>}
                                {showCols.nameEng && <th>Название - английский вариант</th>}
                                {showCols.calories && <th>Калории (на 100г)</th>}
                                {showCols.actions && <th>Действия</th>}
                            </tr>
                        </thead>
                        <tbody>
                        {/* ИСПОЛЬЗУЕМ ingredients, а не локальный filtered! Сервер уже всё отфильтровал. */}
                        {ingredients.map(item => (
                        // {filtered.map(item => (
                            <tr key={item.id}>
                                {showCols.id && <td data-label='ID'>{item.id}</td>}
                                {showCols.name && <td data-label='Название'><strong>{item.name}</strong></td>}
                                {showCols.nameEng && <td data-label='Название (англ.)'><strong>{item.nameEnglish}</strong></td>}
                                {showCols.calories && <td data-label='Калории'>{item.energyKcal100g} ккал</td>}
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
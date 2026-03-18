import React, { useState, useEffect } from "react";
import { adminApi} from "../../../api/admin.ts";
import { Pencil, Trash2 } from "lucide-react";
import style from './AdminConversions.module.css';
import type {IngredientDto} from "../../../types";
import Select from 'react-select';

interface Conversion {
    id: number;
    ingredient: { id: number; name: string };
    unit: { id: number; label: string };
    grams: number;
}

const AdminConversions: React.FC = () => {
    const [conversions, setConversions] = useState<Conversion[]>([]);
    const [ingredients, setIngredients] = useState<IngredientDto[]>([]);

    // Поля формы
    const [ingredientId, setIngredientId] = useState<number | ''>('');
    const [unitId, setUnitId] = useState<number | ''>('');
    const [grams, setGrams] = useState<number | ''>('');

    // Стейт для режима редактирования
    const [editingId, setEditingId] = useState<number | null>(null);

    // НОВОЕ: Стейт для текста фильтра в колонке "Ингредиент"
    const [filterText, setFilterText] = useState('');

    // Управление колонками (по умолчанию ID на мобилках можно скрыть)
    const [visibleColumns, setVisibleColumns] = useState({
        id: window.innerWidth > 768,
        ingredient: true,
        unit: true,
        grams: true,
        actions: true
    });

    const units = [
        { id: 9, label: 'Стакан' },
        { id: 8, label: 'Столовая ложка' },
        { id: 7, label: 'Чайная ложка' },
        { id: 5, label: 'Штука' },
        { id: 10, label: 'Пучок' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const convData = await adminApi.getAllConversions();
            setConversions(convData);

            const ingData = await adminApi.getAllIngredients();
            // Сортируем ингредиенты по алфавиту с учетом русского языка!
            const  sortedIngredients = ingData.sort((a: IngredientDto, b: IngredientDto) => a.name.localeCompare(b.name, 'ru'));
            setIngredients(sortedIngredients);
        } catch (e) {
            console.error("Ошибка загрузки данных", e);
        }
    };

    // Преобразуем отсортированный массив для умного селекта
    const ingredientOptions = ingredients.map(ing => ({
        value: ing.id,
        label: ing.name
    }));

    // Единая функция для Создания и Обновления
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredientId || !unitId || !grams) return;

        console.log('Конвертация -editingId = ', editingId, ' unitId = ', unitId)

        try {
            if (editingId) {
                // Если мы в режиме редактирования
                await adminApi.updateConversion(editingId, {
                    ingredientId: Number(ingredientId),
                    unitId: Number(unitId),
                    grams: Number(grams)
                });
                alert('Правило обновлено!');
            } else {
                // Если создаем новое
                await adminApi.createConversion({
                    ingredientId: Number(ingredientId),
                    unitId: Number(unitId),
                    grams: Number(grams)
                });
                alert('Правило добавлено!');
            }

            // Сброс формы
            resetForm();
            loadData();
        } catch (e) {
            alert('Ошибка при сохранении. Возможно, правило для этой меры уже существует.');
        }
    };

    const handleEditClick = (c: Conversion) => {
        setEditingId(c.id);
        setIngredientId(c.ingredient.id);
        setUnitId(c.unit.id);
        setGrams(c.grams);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Прокручиваем наверх к форме
    };

    const resetForm = () => {
        setEditingId(null);
        setIngredientId('');
        setUnitId('');
        setGrams('');
    };

    const handleDelete = async  (id: number) => {
        if (!window.confirm('Удалить это правило?')) return;

        try {
            await adminApi.deleteConversion(id);

            console.log('Удалили правило')

            loadData();
        } catch (e) {
            console.error('Ошибка при удалении правила ', e);
        }
    };

    const toggleColumn = (column: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    // НОВОЕ: Фильтруем массив перед отрисовкой
    const filteredConversions = conversions.filter(c =>
        c.ingredient.name.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
        <div className={style.container}>
            <h2 className={style.title}>Правила перевода (Меры и Веса)</h2>

            {/* Форма добавления /редактирования */}
            <form onSubmit={handleSubmit} className={style.form}>
                <div>
                    <Select
                        options={ingredientOptions}
                        placeholder="Поиск продукта..."
                        isSearchable={true}
                        // Ищем выбранный элемент в массиве options
                        value={ingredientOptions.find(opt => opt.value === Number(ingredientId))}
                        // При выборе сохраняем ID
                        onChange={(selectedOption) => setIngredientId(selectedOption ? selectedOption.value : '')}
                        noOptionsMessage={() => 'не найдено'}
                        styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    borderColor: state.isFocused ? '#123C69' : '#ccc',
                                    minHeight: '39px', // Подгоняем высоту под соседние инпуты
                                    borderRadius: '6px',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        borderColor: '#123C69'
                                    }
                                }),
                            menu: (baseStyles) => ({
                                ...baseStyles,
                                zIndex: 9999 // Чтобы список не прятался под таблицу
                            })
                        }}
                    />
                </div>

                <select
                    className={style.input}
                    value={unitId}
                    onChange={e => setUnitId(Number(e.target.value))}
                    required
                >
                    <option value="">Выберите меру</option>
                    {units.map(u => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                </select>

                <input
                    className={style.input}
                    type="number"
                    step="0.1"
                    placeholder="Вес в граммах (напр. 130)"
                    value={grams}
                    onChange={e => setGrams(Number(e.target.value))}
                    required
                />

                <button type='submit' className={style.btnSubmit}>
                    {editingId ? 'Сохранить изменения' : 'Добавить'}
                </button>

                {editingId && (
                    <button type='button' onClick={resetForm} className={style.btnCancel}>
                        Отмена
                    </button>
                )}
            </form>

            {/* Чипы для управления колонками */}
            <div className={style.chipsContainer}>
                <span className={style.chipsLabel}>Показать колонки:</span>
                <button
                    className={`${style.chip} ${visibleColumns.id ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('id')}
                >ID</button>
                <button
                    className={`${style.chip} ${visibleColumns.ingredient ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('ingredient')}
                >Продукт</button>
                <button
                    className={`${style.chip} ${visibleColumns.unit ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('unit')}
                >Мера</button>
                <button
                    className={`${style.chip} ${visibleColumns.grams ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('grams')}
                >Вес</button>
                <button
                    className={`${style.chip} ${visibleColumns.actions ? style.chipActive : ''}`}
                    onClick={() => toggleColumn('actions')}
                >Действия</button>
            </div>

            {/* Таблица */}
            <div className={style.tableWrapper}>
                <table className={style.table}>
                    <thead>
                    <tr>
                        {visibleColumns.id && <th>ID</th>}

                        {/* ИЗМЕНЕНИЕ ЗДЕСЬ: Добавили инпут прямо в заголовок */}
                        {visibleColumns.ingredient && (
                            <th>
                                Ингредиент
                                <input
                                    type="text"
                                    placeholder="Поиск по названию..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    style={{
                                        display: 'block',
                                        marginTop: '6px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        fontWeight: 'normal',
                                        outline: 'none'
                                    }}
                                />
                            </th>
                        )}
                        {/*{visibleColumns.ingredient && <th>Ингредиент</th>}*/}

                        {visibleColumns.unit && <th>Мера</th>}
                        {visibleColumns.grams && <th>Вес (г)</th>}
                        {visibleColumns.actions && <th>Действия</th>}
                    </tr>
                    </thead>

                    <tbody>
                    {/* ИЗМЕНЕНИЕ ЗДЕСЬ: Используем filteredConversions вместо conversions */}
                    {filteredConversions.map(c => (
                        <tr key={c.id}>
                            {visibleColumns.id && <td>{c.id}</td>}
                            {visibleColumns.ingredient && <td>{c.ingredient.name}</td>}
                            {visibleColumns.unit && <td>{c.unit.label}</td>}
                            {visibleColumns.grams && <td><b>{c.grams}</b> г</td>}
                            {visibleColumns.actions && (
                                <td style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        title="Редактировать"
                                        className={style.btnEdit}
                                        onClick={() => handleEditClick(c)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#123C69' }}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Удалить"
                                        className={style.btnDelete}
                                        onClick={() => handleDelete(c.id)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                    {/* ИЗМЕНЕНИЕ ЗДЕСЬ: тоже filteredConversions */}
                    {filteredConversions.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                {conversions.length === 0 ? 'Правила еще не добавлены' : 'Ничего не найдено'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                    {/*<tbody>*/}
                    {/*{conversions.map(c => (*/}
                    {/*    <tr key={c.id}>*/}
                    {/*        {visibleColumns.id && <td>{c.id}</td>}*/}
                    {/*        {visibleColumns.ingredient && <td>{c.ingredient.name}</td>}*/}
                    {/*        {visibleColumns.unit && <td>{c.unit.label}</td>}*/}
                    {/*        {visibleColumns.grams && <td><b>{c.grams}</b> г</td>}*/}
                    {/*        {visibleColumns.actions && (*/}
                    {/*            <td style={{ display: 'flex', gap: '8px' }}>*/}
                    {/*                <button*/}
                    {/*                    type="button"*/}
                    {/*                    title="Редактировать"*/}
                    {/*                    className={style.btnEdit}*/}
                    {/*                    onClick={() => handleEditClick(c)}*/}
                    {/*                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#123C69' }}*/}
                    {/*                >*/}
                    {/*                    <Pencil size={18} />*/}
                    {/*                </button>*/}
                    {/*                <button*/}
                    {/*                    type="button"*/}
                    {/*                    title="Удалить"*/}
                    {/*                    className={style.btnDelete}*/}
                    {/*                    onClick={() => handleDelete(c.id)}*/}
                    {/*                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc3545' }}*/}
                    {/*                >*/}
                    {/*                    <Trash2 size={18} />*/}
                    {/*                </button>*/}
                    {/*            </td>*/}
                    {/*        )}*/}
                    {/*    </tr>*/}
                    {/*))}*/}
                    {/*{conversions.length === 0 && (*/}
                    {/*    <tr>*/}
                    {/*        <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>*/}
                    {/*            Правила еще не добавлены*/}
                    {/*        </td>*/}
                    {/*    </tr>*/}
                    {/*)}*/}
                    {/*</tbody>*/}
                </table>
            </div>

        </div>
    )
}

export default AdminConversions;